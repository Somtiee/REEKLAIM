# Diana testnet evidence

Recorded 22 November 2026, Africa/Lagos. Native chain is qorechain-diana and EVM chain ID is 9800. The operator-supplied public testnet treasury is qor1ez7wqp5ala5ph5nx95n6tdedrccsacqndfjgx3.

| Flow | Evidence |
| --- | --- |
| Historical authentication diagnostic | D590150FD678F0AEBA36FFE75F9F680C6D99BDDBFE47D51D1760351B647319CF, block 10435720, result 0. The local verifier checked raw native transaction bytes and hybrid/ML-DSA evidence. The original challenge was cancelled before session issuance. |
| Genuine local QoreX sign-in | Local verified ledger contains three receipts. Latest recorded hash 828B76E614F8A6B95D787155B6D4D83082266650B3A961CE3D83E2548F46164B, block 10556576, verifier rk-auth-1. |
| Genuine local item registration | FA59D1B6F4EF7EA739E9B5581AD21AD66F98A6949543A4644BC5467B4C155B24, block 10556378 at 14:31:44 WAT. Phase 10 independently reverified the successful native 100000 uqor send to the treasury, the original commitment binding, the possession-proven registered ML-DSA-87 key, the verified pqc_hybrid_verify event and the signature. [Canonical receipt](https://api-testnet.qore.host/cosmos/tx/v1beta1/txs/FA59D1B6F4EF7EA739E9B5581AD21AD66F98A6949543A4644BC5467B4C155B24) |
| Hosted registration, hosted tag scan, claim, return, reward and transfer | Pending hosted trial. Local ledger has zero settlement receipts. |
| Contract and owner/finder deployment addresses | Pending eligibility confirmation and authorized live trial. |

For each new human-approved transaction record the hash, block/time, result, exact message and ordered sends, registered PQ key evidence, pqc_hybrid_verify result and verified explorer reference. The registration was independently checked using the Diana REST and RPC interfaces. Its transaction detail page in the explorer still needs visual confirmation. [Explorer](https://explore.qore.network) · [Hybrid Inspector](https://docs.qorechain.io/build-before-qday/workshop-1/apps/hybrid-inspector/) · [Historical verification](TESTNET_VERIFICATION_STATUS.md) · [Live walkthrough](VINCENT_MANUAL_ACTIONS.md)
