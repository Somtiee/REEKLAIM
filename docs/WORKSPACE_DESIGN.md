# Personal workspace and organization operations

Personal overview figures come from account-scoped PostgreSQL rows. Registered count covers anchored, non-archived items. Missing is separate. Found reports exclude drafts and archived records. Active claims include currently disputed cases. Successful recoveries are resolved claims in which the authenticated account participated. The balance uses the existing Diana wallet reader and can be hidden on the overview. Transaction history shows confirmed receipts and payment states. The product holds no reward balances.

## Notifications

Migrations 013 and 015 use schema-qualified database triggers to record sanitized in-app notifications from QR reports, case submissions and review transitions, case messages, two-party return confirmation, verified rewards and accepted transfers. The account and event key make each event unique. The match engine records a possible-match alert on the first authorized results request that includes that pair. Notifications are generated on demand for matches. There is no background match scan or email or push delivery. Turning off a preference suppresses future inserts. Existing notifications remain available. The header checks unread count while visible without extending the idle session.

GET /api/workspace/overview and GET /api/workspace/notifications return the private projections. POST /api/workspace/notifications/read accepts one owned notification ID or the literal all. The browser verifies link shapes before rendering internal deep links. No report narrative, message text, attachment or address enters notification content.

## Organization MVP

Migration 014 extends the existing organization and membership tables. Owners create workspaces and manage non-owner membership. Managers edit the organization, invite staff and review inventory. Staff record found property and browse authorized tenant inventory. Managers and owners can link a registered item that they individually own. A transferred or archived asset link closes automatically. Linking exposes only the inventory entry created for the tenant. Original item details, wallet records and evidence stay in the personal workspace.

An invitation targets a previously verified account, expires after seven days and grants nothing before explicit acceptance by that account. Invites are visible to the recipient and managers of the issuing tenant. Owners can change staff and manager roles, and managers can revoke their own permitted class of invitations. Staff cannot change roles, approve a return, or link a private asset. Claims in the organization portal are internal custody review. A manager records the evidence assessment and handover as notes and moves inventory through held, review, approved, recovered or closed. This does not delegate personal claim access or process payments on behalf of the organization. Organizations are self-managed profiles, and illustrative public data remains explicitly synthetic.

The organization API uses GET and POST /api/workspace/organizations, GET /api/workspace/organizations/:id and the POST actions profile, invite, revoke, member, inventory and review. An invitee accepts via POST /api/workspace/organizations/:invitationId/accept. Forced RLS scopes every tenant table. Writes take tenant or record locks as appropriate, and versioned review rejects stale edits. Security-definer bootstrap helpers must be owned by the migration operator, have a fixed search path, and remain callable only through the restricted application role.

## Settings, export and deletion

Profile display name uses the existing QoreX-authenticated profile route. Theme is stored on the device. Notification settings and the optional dashboard balance privacy setting are stored per account. Session management shows expiration and revokes other owned sessions using opaque receipt IDs. Session digests and credentials never appear in the response.

POST /api/workspace/export returns an account-scoped JSON snapshot of profile, preferences, item metadata, own listings, participant case metadata, and a bounded set of payments and notifications. It does not include third-party evidence, raw files, recovery tokens, session digests, or message bodies from either party. Private documents remain downloadable individually through the existing evidence vault.

POST /api/workspace/deletion accepts only the exact confirmation REQUEST DELETION and creates an idempotent, account-bound request. It does not delete data. The operator must review the request, confirm it with the account holder, determine which account-owned records can be removed or anonymized, and preserve other participants' legitimate recovery records and necessary receipt references. The request queue is inspectable by the authorized database operator. No automatic purge or erasure guarantee is implemented. Immutable on-chain commitments and receipts remain permanently on-chain.
