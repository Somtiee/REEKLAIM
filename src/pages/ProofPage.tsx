import { useEffect, useState } from 'react';
import { Button } from '../components/Button.tsx';
import { WalletCard } from '../components/WalletCard.tsx';
import { useWallet } from '../wallet/WalletProvider.tsx';
import { browserAdapter, walletError } from '../wallet/adapter.ts';
import { createProofIntent, type ProofIntent } from '../lib/proof.ts';
import { getHealth, getPqc, getProof, type NetworkHealth } from '../lib/api.ts';
import { DIANA } from '../lib/network.ts';

export default function ProofPage() {
  const wallet = useWallet();
  const [health, setHealth] = useState<NetworkHealth | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [pqc, setPqc] = useState<string>('Connect a native account to check.');
  const [intent, setIntent] = useState<ProofIntent | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<string | null>(null);
  const [proof, setProof] = useState<Awaited<ReturnType<typeof getProof>> | null>(null);
  async function refreshHealth() {
    setHealth(null); setNetworkError(null);
    try { setHealth(await getHealth()); } catch (e) { setNetworkError(walletError(e)); }
  }
  useEffect(() => { void refreshHealth(); }, []);
  useEffect(() => {
    let active = true;
    setIntent(null); setConsent(false); setCandidate(null); setProof(null); setMessage(null);
    setPqc('Connect a native account to check.');
    if (wallet.account) {
      setPqc('Checking registration…');
      void getPqc(wallet.account.address).then((data) => { if (active) setPqc(data.registered ? `Registered${data.possessionProven ? ' · possession proven' : ''}` : 'Not registered. First use may require a separate registration transaction/fee.'); }).catch((e: unknown) => { if (active) setPqc(`Unavailable: ${walletError(e)}`); });
    }
    return () => { active = false; };
  }, [wallet.account?.address]);

  async function verify(hash: string, approvedIntent: ProofIntent) {
    setBusy(true); setMessage('Reading independent testnet REST and RPC evidence…'); setProof(null);
    try {
      for (let attempt = 0; attempt < 12; attempt++) {
        try {
          const result = await getProof(hash, approvedIntent);
          setProof(result); setMessage('Native hybrid transaction independently read and matched. This is developer proof, not an authenticated session.');
          return;
        } catch (e) {
          if (!(e instanceof Error) || !/404/.test(e.message) || attempt === 11) throw e;
          setMessage('Transaction not indexed yet. Waiting for inclusion; no second transaction is being sent…');
          await new Promise((resolve) => setTimeout(resolve, 2500));
        }
      }
    } catch (e) { setMessage(`Not verified: ${walletError(e)} Keep the hash and retry verification; do not resend automatically.`); }
    finally { setBusy(false); }
  }
  async function submit() {
    if (!intent || !consent || busy) return;
    setBusy(true); setMessage('Checking the network before requesting wallet approval…');
    try {
      const status = await getHealth(); setHealth(status);
      if (!status.native.ok) throw new Error(status.native.error);
      if (wallet.balance === null || BigInt(wallet.balance) <= 1n) throw new Error('Insufficient balance or balance unavailable. Refresh and fund a test-only account.');
      const adapter = browserAdapter();
      if (!adapter) throw new Error('QoreX is not installed.');
      setMessage('Waiting for your explicit approval in QoreX. Review the final network fee there.');
      const result = await adapter.sendProof(intent, consent);
      setCandidate(result.txHash); setConsent(false);
      await verify(result.txHash, intent);
    } catch (e) { setMessage(walletError(e)); setConsent(false); }
    finally { setBusy(false); }
  }
  const canPrepare = !!wallet.account && !wallet.busy && health?.native.ok && wallet.balance !== null && BigInt(wallet.balance) > 1n;
  return <>
    <div className="page-heading"><span className="eyebrow">DEVELOPER WORKSPACE / PHASE 1</span><h1>Proof, before promises.</h1><p>Read the real network. Connect your test wallet. Verify a native hybrid transaction.</p></div>
    <div className="two-column">
      <section className="panel"><div className="section-head"><span className="eyebrow">01 / NETWORK</span><span className="status">TESTNET ONLY</span></div><h2>Diana connection</h2>
        <dl><dt>Native chain</dt><dd className="mono">{DIANA.chainId}</dd><dt>Native RPC + REST</dt><dd>{health ? health.native.ok ? `Verified · block ${health.native.height}` : health.native.error : networkError ?? 'Checking official endpoints…'}</dd><dt>EVM read (not used for signing)</dt><dd>{health ? health.evm.ok ? '9800 · verified' : health.evm.error : 'Checking…'}</dd><dt>PQC key registration</dt><dd>{pqc}</dd></dl>
        <Button variant="secondary" onClick={() => void refreshHealth()}>Refresh network</Button>
      </section><WalletCard />
    </div>
    <section className="panel proof-panel"><span className="eyebrow">02 / EXPLICIT WALLET APPROVAL</span><h2>A tiny transfer. A real proof.</h2>
      <p>The proof sends <strong>0.000001 testnet QOR (1 uqor) to your own address</strong>. The principal returns to the same account. Network fees do not. No application fee or treasury payment.</p>
      <p className="notice">QoreX sets the final fee. A reliable live quote is not available from this integration. Review the amount and network fee in QoreX before approving. First use may also register your PQC key in a separate transaction; official workshop guidance mentions approximately 0.09 QOR, which is not a current quote.</p>
      <p><a href={DIANA.faucet} target="_blank" rel="noreferrer">Get free testnet QOR ↗</a> · Use a fresh standard native (coin-118) test account.</p>
      <Button variant="secondary" disabled={!canPrepare || busy} onClick={() => { if (wallet.account) { setIntent(createProofIntent(wallet.account.address)); setConsent(false); setCandidate(null); setProof(null); setMessage(null); } }}>Prepare self-transfer</Button>
      {intent && <div className="intent"><dl><dt>Recipient (your own address)</dt><dd className="mono break">{intent.recipient}</dd><dt>Public memo (no personal data)</dt><dd className="mono break">{intent.memo}</dd></dl>
        <label className="consent"><input type="checkbox" checked={consent} disabled={busy} onChange={(e) => setConsent(e.target.checked)} /><span>I approve requesting this 1 uqor testnet self-transfer and will review network fees in QoreX. This does not sign me in.</span></label>
        <Button disabled={!consent || busy || !canPrepare || !!candidate} onClick={() => void submit()}>{busy ? 'Waiting for approval / verification…' : 'Request approval in QoreX'}</Button>
      </div>}
      {message && <p className="notice" role="status">{message}</p>}
      {candidate && <div className="receipt"><h3>{proof ? 'Chain-verified native hybrid proof' : 'Submitted hash — not yet verified'}</h3><p className="mono break">{candidate}</p>
        {proof && <dl><dt>Block height</dt><dd>{proof.height}</dd><dt>ML-DSA-87 extension</dt><dd>{proof.pqcSignatureBytes} bytes · algorithm {proof.algorithmId}</dd><dt>Chain event</dt><dd>pqc_hybrid_verify · {proof.event.status}</dd><dt>Independent RPC hash</dt><dd>Matched signed bytes</dd></dl>}
        <p><a href={DIANA.explorer} target="_blank" rel="noreferrer">Open official explorer ↗</a>, select <strong>Testnet</strong>, then paste this hash. The explorer root may default to mainnet.</p>
        <Button variant="secondary" disabled={busy} onClick={() => intent && void verify(candidate, intent)}>Recheck existing hash</Button>
        {proof && <Button variant="secondary" onClick={() => { const url = URL.createObjectURL(new Blob([JSON.stringify({ ...proof, intent }, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = `reeklaim-diana-${proof.hash}.json`; a.click(); URL.revokeObjectURL(url); }}>Download actual proof</Button>}
      </div>}
    </section>
    <p className="footnote">Developer tools are omitted from production. Wallet connection and this proof do not create an authenticated session. SIWQ is unavailable in the reviewed released interface; real-wallet capability confirmation remains pending.</p>
  </>;
}
