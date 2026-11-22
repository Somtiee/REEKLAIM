# Authentication design

## Phase 3 implementation — 18 November 2026

Status: implemented locally, **live QoreX verification pending**. `server/auth/{service,receipt,http,security}.ts`, `src/auth` and `/sign-in` implement the reviewed native challenge fallback. The original adapter and developer proof remain separate; a developer proof never grants an authenticated account.

Official current QoreX types 0.1.0 and integration docs still expose native `signAndBroadcast`, not a released third-party hybrid SIWQ signing method. QoreSign's SIWQ library does not establish installed-wallet support. No `signArbitrary`, EVM signing, origin-restricted dashboard API, server wallet key or alternate login was substituted. The real installed extension could not be safely inspected through the available browser context; actual capabilities/approval remain unobserved. Capability checks are performed before every request. The server proves control of the signer, not the wallet software brand; only QoreX is offered in the UI.

Implemented envelope: fixed-order canonical JSON array containing domain/purpose/version, UUID, SHA-256 digest of a cryptographically random 32-byte nonce, pre-session digest, intended wallet, Diana chain, exact configured origin, issued/expiry times, minimum observed height, MsgSend type, denomination and amount. Its SHA-256 base64url digest becomes `rk:auth:v1:<43-character digest>`. No raw nonce/session secret, profile or document enters the memo. Challenge TTL is five minutes, pre-session TTL 30 minutes. The DB stores only opaque-token digests.

Canonical verification pins both official native RPC/REST identities, compares raw TxRaw SHA-256/height/result, checks independent block chain/height/time, accepts exactly one 1 uqor self-send and one direct standard native coin-118 signer, rejects unexpected messages/extensions/fee delegation, and checks the exact hybrid extension and `pqc_hybrid_verify` signer/algorithm/verdict. In addition, the installed official SDK resolves the active sign-bytes version and verifies ML-DSA-87 locally against the registered possession-proven key. SDK reads are wrapped by the same bounded/redirect-refusing allowlisted reader. Unsupported/ambiguous/late evidence fails closed. Real receipt format and first-use behavior still require observation; no synthetic fixture is a real classical signature or chain receipt.

After independent verification, PostgreSQL locks the browser and challenge, repeats origin/session/expiry/state checks, enforces unique chain/hash, consumes the challenge, revokes its pre-session, creates/upserts the wallet account and inserts a rotated 12-hour opaque session atomically. Idle expiry is 30 minutes; passive status checks do not refresh it. Logout revokes server state. HTTPS uses `__Host-rk_session` (HttpOnly/Secure/SameSite=Lax/Path=/), local HTTP a separate `rk_dev_session` name. CSRF is an HMAC-derived session-bound token held in memory, plus exact Origin/Host checks on mutations. No privileged token is in localStorage.

Wallet/account mismatch or wrong-network refresh hides private UI and attempts server revocation; a restored cookie does not reveal private UI until the same wallet reconnects on Diana. The server always authorizes the account in its verified session, never a browser-supplied user ID. Rejection, pending approval, receipt checking, expiration, onboarding modal and logout are implemented. Verification retries use the existing hash; after an interrupted page, an explicit recovery form accepts that hash without another wallet send. A public hash cannot bypass the browser-bound challenge.

See `PHASE_3_REPORT.md` and `evidence/phase3` for actual PostgreSQL, unit/browser and production-build evidence. Production/TLS deployment and real-wallet approval are manual release gates. The original proposal below is historical; the implementation section above controls where its field encoding differs.


Recommendation: **native hybrid-signed transaction challenge**, with explicit approval of a 1 uqor self-transfer on `qorechain-diana`, zero application sign-in fee and separate network costs. The original proposal follows; the implemented local flow and live-verification limits are recorded above.

## Why SIWQ is gated

[QoreSign SIWQ](https://docs.qorechain.io/qoresign/guides/sign-in/) defines hybrid message verification. Published `@qorechain/qoresign@0.2.0` contains `createSiwqMessage`, `signSiwq`, and `verifySiwqWithChain`; signing requires signing keys inside a wallet, not in ReeKlaim. [QoreX provider source](https://github.com/qorechain/qorex-integrations/blob/bcb863fe457e3fe6eb825af6458d2430c7ac6c69/packages/types/src/providers.ts) declares `signArbitrary` as present but refused, and no general third-party SIWQ wallet method. `connectProof` is restricted to the official dashboard origin. A public library cannot unlock an origin-restricted wallet API.

Do not implement a pretend message-signing login or use Solana/mainnet signing. Revisit SIWQ only after both runtime capability and a real released-wallet hybrid message proof have been observed. Verify the registered PQ key, exact address, domain, chain, URI, nonce, issued time and expiration; atomically consume the nonce even if a library verifies signatures. Library availability alone does not pass that gate.

## Threat and trust boundaries

An attacker may submit another wallet's address, intercept a public hash, replay a transaction, race requests, alter browser state or spoof provider metadata. Only a fresh wallet-approved transaction satisfying a server-issued challenge and independently verified on the pinned testnet grants a session. The server trusts the configured TLS RPC/REST providers to report committed state; this is not a consensus light client. Fail closed if network identity, events, signer or decoding cannot be established.

## Challenge construction

1. Serve the app at a configured canonical origin. Require HTTPS except local development. Do not derive the trusted domain from arbitrary `Host`/forwarded headers. Preview origins need explicit configuration; no wildcard approval.
2. Create a cryptographically random 32-byte pre-session cookie, storing only its digest. Use an Origin/CSRF protected challenge request. Validate a canonical native wallet address and verify the server RPC network is diana; re-read wallet account before signing.
3. Generate a 32-byte nonce and random challenge ID. Store address, chain, canonical origin, pre-session digest, issue/expiry (5 minutes), minimum observed height and exact intended action. Bind a dedicated return URI if used. Client cannot set expiry or an external redirect.
4. Canonically encode `{version,purpose:"login",nonce,challengeId,wallet,chain,origin,preSessionDigest,issuedAt,expiresAt,amountUqor:"1"}` with unambiguous length-prefixed or canonical JSON encoding. Compute SHA-256. Store a digest of the nonce, not the full challenge in logs. Store necessary verification fields privately.
5. Memo is `rk:auth:v1:<base64url digest>`, comfortably below QoreX's documented 256-byte limit. It binds all fields without publishing a raw session token, personal data or secret. Use one ordinary `/cosmos.bank.v1beta1.MsgSend` from the expected account to itself, exactly `1 uqor`.

One uqor is 0.000001 QOR. The principal returns to the sender; gas does not. Test self-send minimum and exact memo preservation against the real wallet/chain before shipping. If the chain rejects this minimal action, stop and revise with an explicitly disclosed supported challenge; do not silently send to a third party or increase spend.

## Consent screen and broadcast

Show: canonical ReeKlaim domain, intended wallet, TESTNET badge, purpose "prove control for sign-in", 1 uqor self-transfer, application fee 0, network fee estimate and possible first-use PQ key registration. The workshop documents first-use registration around 0.09 QOR; treat that as historical guidance, not a live quote. QoreX chooses final transaction fees. Its final approval is authoritative; if the app cannot determine a reliable fee, state that clearly and require review in the wallet. Never represent sign-in as having no network cost.

Require an explicit user click before calling `qorexSignAndBroadcast`. Reject missing `signAndBroadcast` capability, absent wallet, unsupported chain, changed account, canceled prompt or expired challenge. No transaction is sent merely on page load/connection. A wallet response/hash/shield badge is only a hint to start verification.

## Independent verification

Submit only the challenge ID and candidate hash to the server, with the matching pre-session cookie and CSRF proof. Server bounds/normalizes the 64-hex hash and queries only its pinned testnet services. It verifies:

- Native RPC/REST identity is `qorechain-diana`; no user-selected endpoint. Tx bytes themselves do not independently prove their chain, so do not infer chain identity from hash format.
- The committed receipt exists with positive height, `tx_response.code == 0`, matching normalized hash, and block timestamp within the challenge's issued/expiry window (small documented clock skew, e.g. 15 seconds). Server receipt/consumption must also occur before expiry. Indexing delays can expire a challenge; a late payment does not create a session.
- The exact intended message list is one self-send, expected `from_address` and `to_address`, one coin `uqor:1`, exact memo bytes, and no extra sends, authz execution, delegation, unknown message or unexpected extension. If QoreX's first-use registration uses a separate transaction, it is not the challenge. Do not broadly permit extra messages to accommodate it.
- Decode signer public key, derive/compare its address using the official correct key type, inspect signer info and signatures, reject unexpected signers/authz/fee delegation. The transaction's signer must control the address, not merely mention it in a memo.
- Required `/qorechain.pqc.v1.PQCHybridSignature` is present exactly as expected, algorithm is ML-DSA-87, signature decoding has the expected 4,627 bytes, and the committed event `pqc_hybrid_verify` includes `status=verified` for the expected signer. Confirm exact event field names from a real receipt before implementing parser assumptions. Presence/length alone is not verification.
- Check registered public-key state and, where supported by installed QoreSign verification helpers, independently validate the PQ layer over raw signed bytes with the active sign-bytes version. Current-key checks need careful historical handling after rotation; login only accepts recent challenges. Unsupported/ambiguous receipts fail closed.
- Hash has not already served another challenge/operation. Hash raw `TxRaw` bytes to the expected transaction hash when raw bytes are retrieved. Keep a sanitized verifier result and schema version.

The exact event parser and local cryptographic verification path are Phase 1 tests, not invented successful APIs. Public example code that checks code/event/length is useful research, but production authentication also needs exact intent, signer, origin/session binding, timing and replay defenses.

## Atomic consumption and sessions

After network verification, begin a DB transaction, lock the challenge row and recheck session binding, unused status, current server expiry and expected intent. Insert a uniquely indexed receipt; conditionally mark the challenge consumed, upsert account and insert the authenticated session. Roll back all if any check fails. Concurrent verification requests must yield one session issuance. Do not consume the nonce before verification or outside this atomic commit.

Rotate the pre-session secret into a new 32-byte opaque session token. Cookie: `__Host-rk_session`, HttpOnly, Secure, SameSite=Lax, Path=/, no Domain; never localStorage. Store its digest only. Proposed lifetime: 12-hour absolute expiry, 30-minute inactivity window; server checks both on every private request and supports immediate revocation. Local HTTP development uses a clearly separate dev-only cookie name; production never relaxes Secure.

Use SameSite plus exact Origin + CSRF tokens on state changes, safe redirects, CSP, no-store auth/private responses and session rotation on sensitive changes. Logout revokes server state and expires cookie. Reauthentication is required for future ownership transfer and reward operations. Since wallet account/chain events are reported absent, re-read account/network on focus and before each signature, invalidate the UI's verification state on mismatch and require fresh sign-in; the server session still maps to the previously verified account until revoked.

## Required negative tests

Address-only login; stolen public hash; copied memo from another wallet; wrong pre-session/origin/chain; nonce reuse and concurrent races; expired/late receipt; successful tx with wrong amount/recipient; extra message or authz wrapper; failed tx; no verified event; forged shield; malformed/duplicate extension; signer mismatch; 403/timeouts; first-use registration ambiguity; session fixation, CSRF and account-switch behavior. Mock tests exercise failure handling; a real official extension approval and independently saved receipt are necessary acceptance evidence.
