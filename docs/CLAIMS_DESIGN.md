# Phase 6 claims and recovery design

The Claims workspace at /app/claims uses the existing verified QoreX session. Possible matches compare an account's own open lost reports with open public found reports. The candidate window is bounded by category, country and an ordered sixty-day date range. Normalized token overlap, brand, model, colour, city and date proximity contribute weighted reasons. An incompatible explicit model or brand is excluded. Scores express similarity only. Optional serial comparison happens privately after original registration reverification and is excluded from public matching.

A submitted claim binds an owned lost listing, an open found listing and its existing custodian as reviewer. The claimant provides a relationship, narrative and distinguishing detail and explicitly shares any chosen files. The original Phase 4 registration path remains in place. Phase 6 decrypts the immutable initial snapshot, recomputes its salted commitment and envelope memo, and asks the canonical Diana verifier to fetch and validate the original payment and hybrid evidence. The claim returns unavailable when either path fails. The serial comparison is a boolean and does not reveal the original registered value. Unregistered items are reviewed through human evidence.

Narratives and message contents are AES-GCM encrypted at rest using the existing server storage key. Runtime evidence access is scoped by participant RLS and a specific attachment row. A 60-second signature binds the session, actor, claim and file ID. Authorization is checked when signing and again when serving. Existing owner-only item evidence checks continue to require ownership explicitly. Receipt uploads support the existing raster and UTF-8 validation limits. A rejected attempt can leave an owner-only upload in the existing vault.

The finder can begin review, request more evidence, approve or reject. The claimant can withdraw or submit requested evidence. Both can message, dispute an active handover and confirm physical return. A dispute pauses coordination. Two return confirmations in the current recovery round resolve the claim. Every accepted action advances a version and appends a case event. Advisory locks, row locks and partial unique indexes prevent two winners for the same found report or registered item. Other claims retain their own state and evidence. Marketplace triggers synchronize linked report states with claims and recovery cases. No action transfers legal title or pays rewards. Recent counterpart events appear in the claims inbox.

Operator command, from the existing administrative shell: npx.cmd tsx scripts/moderate-claims.ts queue. The queue shows identifiers and case statuses. Authorized operators may use freeze <claim UUID> and resume <claim UUID>. Operator events are distinct from participant events. The standard participant API cannot mutate these controls directly. Moderation is local and operator driven, and there is no production moderation staffing or retention policy in this phase.

| Route | Purpose |
|---|---|
| GET /api/claims and /:id | Participant inbox and case detail |
| GET /api/claims/matches | Eligible lost/found pair scores and reasons |
| POST /api/claims/dismiss | Actor-scoped dismissal |
| POST /api/claims | Private claim with explicit evidence IDs |
| POST /api/claims/:id/actions | Versioned review, messaging, moderation intake and handover actions |
| POST /api/claims/:id/files/:fileId/link | Create a session- and claim-bound private file link |
| GET /api/claims/:id/files/:fileId/download | Reauthorize and open the encrypted attachment |

Migrations 009–011 extend the existing claims and cases, add actor-scoped events and attachments, add the matching fields and index, synchronize found-report resolution, and add an operator event identity. Existing migration files were not edited. The local migration operator owns the narrowly scoped security-definer lookup and trigger functions. They use a fixed search path and fully qualified relation names. Deployments must preserve equivalent privileges under forced RLS.
