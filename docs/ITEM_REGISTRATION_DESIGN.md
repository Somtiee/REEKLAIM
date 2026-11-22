# Item registration and recovery tags

Implemented 18 November 2026. See `PHASE_4_REPORT.md` for actual validation and outstanding live gates.

## Boundary and records

The existing QoreX challenge/session service remains the authentication boundary. Item routes derive the actor from the verified cookie, use exact Origin/CSRF, strict Zod bodies and parameterized SQL. No request accepts an owner, commitment, fee, chain, recipient, receipt or arbitrary upstream URL chosen by the client. Runtime transactions use `SET LOCAL rk.actor`; forced RLS restricts item, version, intent, tag, receipt and finder-message access. Owner identity has no runtime UPDATE grant. The auth role cannot read item/evidence rows; its additional access is to the narrow recovery projection and insert-only encrypted finder requests.

Internal items use random UUIDs. Metadata is AES-256-GCM encrypted using random 96-bit nonces, a versioned domain and item ID as authenticated associated data. Existing item name/category columns support private inventory queries under RLS; they are not on-chain. Private evidence references must resolve to the current actor's undeleted uploads, and private photo references must be image types. Private uploads retain their existing encrypted storage/session-bound download protection.

Public photos are a separate owner-selected upload. PNG/JPEG/WebP are decoded, bounded, re-encoded as PNG and stripped of metadata; SVG/PDF/invalid/animated/oversized files are refused. Upload work has two processing slots, rate limits and a 4 MiB bound. A maximum 100 items/account bounds photo rows. Images stored on private item rows are never served publicly until confirmed registration and explicit photo visibility. Moderation is the owner's visible-content review; no automated content-classification service is claimed.

## Canonical commitment v1

Each metadata version stores an append-only encrypted snapshot and 256-bit independently random salt. Canonical serialization is the UTF-8 JSON encoding of this fixed-order array:

```text
["ReeKlaim item registration", 1, itemUUID, metadataVersion, saltHex,
 name, category, description, brand, model, privateSerial, country, city,
 showName, showDescription, showPhoto,
 privateEvidenceSHA256OrNull, privatePhotoSHA256OrNull, publicPhotoDigestOrNull]
```

SHA-256 produces the 64-hex commitment. The public-photo digest is SHA-256 over its canonical Base64 bytes; private evidence hashes describe the validated/re-encoded stored object. Empty optional text is `""`; absent evidence is `null`; booleans remain booleans. Client property ordering cannot change the canonical order. Different salts, item IDs, versions or fields change the digest. Salt and complete snapshot remain encrypted off-chain. Hashes are commitments, not encryption, anonymization, legal title or physical-possession proof.

Intent memo: `rk:reg:v1:` followed by the Base64url SHA-256 of a second fixed-order envelope containing purpose/version, random intent/item IDs, exact metadata version/commitment, fresh random binding nonce, authenticated actor/wallet, Diana, canonical origin, human treasury, `uqor`, `100000`, issue/expiry timestamps and minimum observed height. Its 53 bytes fit QoreX's documented 256-byte bound. The exact envelope is encrypted in the intent and available only to the owner, allowing reconstruction of the memo. Neither envelope nor raw metadata is put on-chain.

## Verification and consistency

Auth and registration share a private native canonical verifier with separate public wrappers. The auth wrapper remains exactly a 1 uqor self-send with `rk:auth:v1:`. The registration wrapper accepts exactly one native MsgSend from the authenticated intent wallet to its snapshotted treasury for `uqor:100000` and `rk:reg:v1:`. It never accepts the caller's arbitrary payment expectation.

Pinned RPC/REST identity, raw TxRaw SHA-256/height/result, independent block chain/time/window, raw/REST message and memo parity, single direct classical signer and derived address, signature parity, fee-delegation refusal, exact PQ extension and signer-attributed verified event, registered possession-proven ML-DSA-87 key, active sign-bytes version and local PQ verification remain required for success. An exact committed failed transaction can be classified failed after canonical context/raw/message/signer checks; it never grants registration. Missing hybrid evidence or transient indexing/network errors cannot grant success and retain pending state. These reads trust official TLS validators/services, not a consensus light client. Historical PQ-key rotation may require manual review if current-key verification cannot verify an older pending transaction.

The ledger's unique `(chain_id, tx_hash)` covers both authentication and registration. Its purpose constraint requires exactly one challenge or registration association. Append-only receipt/version grants, one registration intent per item, single bound candidate hash and row locks prevent reuse/races. Finalization rechecks intent/item/version/memo/hash, then inserts receipt, confirms intent, registers item, generates tag, publishes projection and audits in one DB transaction. Chain commitment and SQL are not a distributed transaction: durable same-hash reconciliation bridges DB/HTTP failures.

An approval reservation persists before the wallet call, so refresh cannot request another send. Known failed and expired operations do not silently get replacements. See setup for the intentional manual-review boundary when there is no recoverable hash.

## Tag and public response

`/recover/{token}` uses 32 cryptographic random bytes, Base64url encoded to 43 characters. Token digest supports lookup; AES-GCM ciphertext allows an authorized owner to print an existing tag. A partial unique index allows one live token per item. Rotation locks the item, revokes the old tag and updates its public projection atomically. Archive removes projection/revokes the tag. The public token is a locator only, never authority to edit, change owner or create a session.

Public JSON is an explicit allowlist: approved name or null, approved description or null, registered/missing status, and photo-presence boolean. A separate binary route serves only the approved sanitized derivative. It excludes UUIDs, owner/account/wallet IDs, treasury, receipt links, serials, private evidence/references, salts and country/city. Recovery links are intentionally shareable; copied physical tags remain a residual risk. The owner receipt view links to the documented explorer `/tx/{hash}` and explicitly requires its Testnet header toggle; there is no invented network query parameter.

Anonymous requests use the existing pre-session CSRF mechanism, no wallet. Durable limits are 5/IP/hour and 20/tag/day. Messages are encrypted and insert-only to the auth role; owners read their own latest 30 through RLS. Responses contain only an acknowledgement. This is one-way contact intake, not a claim, inbox conversation, legal decision or handover. Retention/deletion operations remain manual release requirements; no public directory entry is created.

## Edits and print

Before an intent, edits create additional salted versions. An outstanding or failed intent locks edits to preserve the approved snapshot. After confirmation, allowed metadata/visibility/photo edits append versions and refresh the public projection; the original commitment and receipt stay immutable, enforced additionally by a DB trigger. Later versions are clearly labelled off-chain; no additional fee/anchor is silently requested. Mark-missing/archive/tag-rotation are operational states, not claims of new chain commitments.

SVG download encodes only the canonical recovery URL. Copy/share controls expose that same public URL. Printing renders a separate tag portal directly under `body`; print CSS hides the entire app root, private metadata, controls and other body children. The printable tag has a QR, generic text and recovery URL, with no item/private name. A real QR decoder tested the rendered fixture, and print isolation is browser-tested. Real phone/physical-printer/HTTPS deployment checks remain manual.
