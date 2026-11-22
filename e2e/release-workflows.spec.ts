import { expect, test, type Page } from '@playwright/test';
import { bytesToBech32 } from '@qorechain/sdk';
import { address } from '../tests/fixtures.ts';

const evidence = process.env.REEKLAIM_RELEASE_EVIDENCE ?? 'docs/evidence/phase9';
const account = '3fb37fe0-d8b4-41d3-b9c3-a0740571c483';
const id = 'd2a37e60-3ee0-43f8-969c-29dc59f60b61';
const now = new Date().toISOString();

test.beforeEach(({ baseURL }) => {
  test.skip(baseURL !== 'http://127.0.0.1:4399', 'Requires the production-build server.');
});

async function mockAccount(page: Page, simulatedApproval = false) {
  await page.addInitScript(({ walletAddress, simulatedApproval }) => {
    Object.assign(window, { qorex: { native: {
      isQoreX: true,
      capabilities: simulatedApproval ? ['signAndBroadcast'] : [],
      enable: async () => {},
      getKey: async () => ({ bech32Address: walletAddress, algo: 'secp256k1' }),
      signDirect: async () => { throw new Error('Synthetic UI-only account.'); },
      signAndBroadcast: async () => {
        if (!simulatedApproval) throw new Error('This fixture cannot approve payments.');
        return { txHash: 'B'.repeat(64), code: 0 };
      },
    } } });
  }, { walletAddress: address, simulatedApproval });
  await page.route('**/api/auth/session', route => route.fulfill({ json: {
    available: true,
    authenticated: true,
    csrf: 'fixture-only',
    user: { id: account, walletAddress: address, displayName: 'Synthetic account', createdAt: now, onboardedAt: now,
      expiresAt: new Date(Date.now() + 3_600_000).toISOString() },
  } }));
  await page.route('**/api/qorechain/balance?*', route => route.fulfill({ json: {
    address, chainId: 'qorechain-diana', amountUqor: '12500000',
  } }));
}

async function connect(page: Page) {
  await page.getByRole('button', { name: 'Connect QoreX', exact: true }).last().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Connect QoreX', exact: true }).click();
  await expect(page.getByText('Connected · authenticated session', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Close dialog' }).click();
}

test('organization staff record found property with review controls withheld (mock account and API)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await mockAccount(page);
  const path = '/api/workspace/organizations/' + id;
  const records: { id: string; title: string; notes: string; kind: string; status: string; version: number }[] = [];
  await page.route('**' + path, route => route.fulfill({ json: {
    organization: { id, role: 'staff', name: 'Synthetic campus desk', kind: 'university', description: 'QA fixture' },
    actor: account,
    inventory: records,
    members: [{ account_id: account, role: 'staff' }],
    invitations: [],
    activity: [],
    counts: [],
  } }));
  await page.route('**' + path + '/inventory', async route => {
    const record = route.request().postDataJSON();
    expect(record).toEqual({ title: 'Synthetic umbrella', notes: 'Held by the staffed desk.', kind: 'found', registeredItem: null });
    records.push({ ...record, id, status: 'held', version: 1 });
    await route.fulfill({ status: 201, json: { id } });
  });
  await page.goto('/app/organizations/' + id);
  await connect(page);
  await page.getByLabel('Inventory title').fill('Synthetic umbrella');
  await page.getByLabel('Internal notes').fill('Held by the staffed desk.');
  await page.getByRole('button', { name: 'Add inventory record' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'Synthetic umbrella' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Invite a member' })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: evidence + '/organization-390-MOCK.png', fullPage: true });
});

test('intended recipient accepts an offer without seeing payer controls (mock account and API)', async ({ page }) => {
  await mockAccount(page);
  let accepted = false;
  await page.route('**/api/payments', route => route.fulfill({ json: {
    collectionEnabled: true,
    atomicRewardsEnabled: false,
    authentication: [],
    registrations: [],
    operations: [{ id, purpose: 'transfer', payer: 'Synthetic payer', recipient: address, treasury: '',
      sends: [], state: accepted ? 'accepted' : 'offered', canPay: false, canAccept: !accepted,
      created_at: now, approval_started: false, candidate_hash: null }],
  } }));
  await page.route('**/api/payments/' + id + '/accept', async route => {
    expect(route.request().method()).toBe('POST');
    accepted = true;
    await route.fulfill({ json: { saved: true } });
  });
  await page.goto('/app/transactions');
  await connect(page);
  await page.getByRole('button', { name: 'Accept transfer as recipient' }).click();
  await expect(page.getByText('accepted', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Prepare Diana payment' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Review and approve in QoreX' })).toHaveCount(0);
});

test('owner coordinates and confirms return before explicitly approving a reward (mock wallet and API)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 950 });
  await mockAccount(page, true);
  const item = { id, title: 'Synthetic travel camera', category: 'electronics', description: 'Travel case',
    city: 'Lagos', country: 'NG', occurred_on: '2026-11-19', brand: '', model: '', colour: '' };
  const privateNote = 'Meet at the staffed campus desk.';
  const claimPath = '**/api/claims/' + id;
  const events = [{ id: 'finder', kind: 'return_confirmed', author: 'Finder', at: now, text: null as string | null }];
  let version = 1;
  let resolved = false;
  await page.route(claimPath, route => route.fulfill({ json: {
    id, version, state: resolved ? 'resolved' : 'recovery_in_progress', role: 'claimant', verification: 'none',
    serialAgrees: null, files: [], events,
    narrative: { relationship: 'owner', explanation: 'Synthetic evidence', distinguishing: 'Fabric lining',
      serial: '', additional: '', lost: item, found: item },
  } }));
  await page.route(claimPath + '/actions', async route => {
    const input = route.request().postDataJSON();
    expect(input.version).toBe(version++);
    if (input.action === 'message') {
      expect(input.text).toBe(privateNote);
      events.push({ id: 'note', kind: 'message', author: 'You', at: now, text: input.text });
    } else {
      expect(input.action).toBe('resolve');
      resolved = true;
      events.push({ id: 'owner', kind: 'return_confirmed', author: 'You', at: now, text: null });
    }
    await route.fulfill({ json: { saved: true } });
  });
  let intent = false;
  let reserved = false;
  let verified = false;
  const recipient = bytesToBech32(new Uint8Array(20).fill(6), 'qor');
  const treasury = bytesToBech32(new Uint8Array(20).fill(7), 'qor');
  await page.route('**/api/payments', async route => {
    if (route.request().method() === 'POST') {
      expect(resolved).toBe(true);
      expect(route.request().postDataJSON()).toEqual({ purpose: 'reward', claim: id, amount: '49' });
      intent = true;
      return route.fulfill({ status: 201, json: { id } });
    }
    return route.fulfill({ json: {
      collectionEnabled: true, atomicRewardsEnabled: false, authentication: [], registrations: [],
      operations: intent ? [{ id, purpose: 'reward', payer: address, recipient, treasury,
        sends: [{ recipient, amount: '49' }], state: verified ? 'confirmed' : 'pending', canPay: true,
        chainId: 'qorechain-diana', origin: new URL(route.request().url()).origin,
        memo: 'rk:pay:v1:' + 'a'.repeat(43), expires_at: new Date(Date.now() + 300_000).toISOString(),
        candidate_hash: null, approval_started: reserved, created_at: now,
        receipt_hash: verified ? 'B'.repeat(64) : null, height: verified ? '102' : null }] : [],
    } });
  });
  await page.route('**/api/payments/' + id + '/approval', async route => {
    expect(reserved).toBe(false);
    reserved = true;
    await route.fulfill({ json: { saved: true } });
  });
  await page.route('**/api/payments/' + id + '/verify', async route => {
    expect(reserved).toBe(true);
    expect(route.request().postDataJSON()).toEqual({ hash: 'B'.repeat(64) });
    verified = true;
    await route.fulfill({ json: { confirmed: true } });
  });
  await page.goto('/app/claims/' + id);
  await connect(page);
  await page.getByLabel('Private message or reason').fill(privateNote);
  await page.getByRole('button', { name: 'Send private message' }).click();
  await expect(page.getByText(privateNote, { exact: true })).toBeVisible();
  await page.screenshot({ path: evidence + '/recovery-390-MOCK.png', fullPage: true });
  await page.getByRole('button', { name: 'Confirm item returned' }).click();
  await page.getByRole('link', { name: 'Prepare voluntary finder reward' }).click();
  const create = page.getByRole('button', { name: 'Create reward intent' });
  const amount = page.getByLabel('Finder reward in uqor');
  await expect(create).toBeDisabled();
  await amount.fill('49');
  await create.click();
  const approval = page.getByRole('button', { name: 'Review and approve in QoreX' });
  await expect(approval).toBeDisabled();
  expect(reserved).toBe(false);
  await page.getByRole('checkbox').check();
  await approval.click();
  await expect(page.getByText('Verified Diana receipt · Block 102', { exact: false })).toBeVisible();
});
