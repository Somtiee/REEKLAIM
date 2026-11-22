CREATE SCHEMA IF NOT EXISTS reeklaim;
REVOKE ALL ON SCHEMA reeklaim FROM PUBLIC;
SET LOCAL search_path = pg_catalog, reeklaim;
CREATE TABLE reeklaim.accounts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), chain_id text NOT NULL DEFAULT 'qorechain-diana' CHECK(chain_id='qorechain-diana'),
 wallet_address text NOT NULL CHECK(wallet_address ~ '^qor1[a-z0-9]{38}$'), display_name text CHECK(length(display_name) BETWEEN 1 AND 60),
 onboarded_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(chain_id,wallet_address));
CREATE TABLE reeklaim.pre_sessions (digest text PRIMARY KEY CHECK(length(digest)=64), created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL, revoked_at timestamptz);
CREATE TABLE reeklaim.auth_challenges (
 id uuid PRIMARY KEY, pre_digest text NOT NULL REFERENCES reeklaim.pre_sessions(digest), wallet_address text NOT NULL,
 chain_id text NOT NULL CHECK(chain_id='qorechain-diana'), origin text NOT NULL, nonce_digest text NOT NULL UNIQUE,
 memo text NOT NULL UNIQUE CHECK(memo ~ '^rk:auth:v1:[A-Za-z0-9_-]{43}$'), min_height numeric(78,0) NOT NULL CHECK(min_height>0),
 issued_at timestamptz NOT NULL, expires_at timestamptz NOT NULL, state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','consumed','cancelled')),
 candidate_hash text CHECK(candidate_hash ~ '^[A-F0-9]{64}$'), consumed_at timestamptz, CHECK(expires_at>issued_at), CHECK((state='consumed')=(consumed_at IS NOT NULL)));
CREATE UNIQUE INDEX one_pending_challenge ON reeklaim.auth_challenges(pre_digest) WHERE state='pending';
CREATE TABLE reeklaim.chain_receipts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), chain_id text NOT NULL CHECK(chain_id='qorechain-diana'), tx_hash text NOT NULL CHECK(tx_hash ~ '^[A-F0-9]{64}$'),
 signer text NOT NULL, height numeric(78,0) NOT NULL CHECK(height>0), block_time timestamptz NOT NULL, memo text NOT NULL,
 challenge_id uuid NOT NULL UNIQUE REFERENCES reeklaim.auth_challenges(id), verifier_version text NOT NULL,
 checked_at timestamptz NOT NULL DEFAULT now(), UNIQUE(chain_id,tx_hash));
CREATE TABLE reeklaim.sessions (
 digest text PRIMARY KEY CHECK(length(digest)=64), account_id uuid NOT NULL REFERENCES reeklaim.accounts(id), receipt_id uuid NOT NULL UNIQUE REFERENCES reeklaim.chain_receipts(id),
 created_at timestamptz NOT NULL DEFAULT now(), last_active_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL, revoked_at timestamptz);
CREATE INDEX sessions_account ON reeklaim.sessions(account_id,expires_at);
CREATE TABLE reeklaim.items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES reeklaim.accounts(id), category text NOT NULL,
 name text NOT NULL CHECK(length(name) BETWEEN 1 AND 120), description text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','registered','missing','recovery_pending','returned','archived')),
 version integer NOT NULL DEFAULT 1 CHECK(version>0), commitment text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX items_owner ON reeklaim.items(owner_id,status,created_at DESC);
CREATE TABLE reeklaim.recovery_tags (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), item_id uuid NOT NULL REFERENCES reeklaim.items(id), token_digest text NOT NULL UNIQUE CHECK(length(token_digest)=64), created_at timestamptz NOT NULL DEFAULT now(), revoked_at timestamptz);
CREATE TABLE reeklaim.listings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), item_id uuid REFERENCES reeklaim.items(id), custodian_id uuid NOT NULL REFERENCES reeklaim.accounts(id), kind text NOT NULL CHECK(kind IN ('lost','found')),
 title text NOT NULL CHECK(length(title) BETWEEN 1 AND 120), country text NOT NULL, city text NOT NULL, status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','pending','approved','hidden','closed')),
 reward_uqor numeric(78,0) NOT NULL DEFAULT 0 CHECK(reward_uqor>=0), occurred_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX listings_directory ON reeklaim.listings(status,country,city,kind,created_at DESC);
CREATE TABLE reeklaim.found_reports (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), item_id uuid REFERENCES reeklaim.items(id), reporter_id uuid REFERENCES reeklaim.accounts(id), description text NOT NULL, city text NOT NULL, status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','matched','closed','hidden')), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE reeklaim.claims (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), item_id uuid NOT NULL REFERENCES reeklaim.items(id), claimant_id uuid NOT NULL REFERENCES reeklaim.accounts(id), reviewer_id uuid NOT NULL REFERENCES reeklaim.accounts(id), found_report_id uuid REFERENCES reeklaim.found_reports(id), state text NOT NULL DEFAULT 'submitted' CHECK(state IN ('submitted','under_review','approved','rejected','withdrawn','disputed','returned')), version integer NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(), CHECK(claimant_id<>reviewer_id));
CREATE UNIQUE INDEX one_active_case ON reeklaim.claims(item_id) WHERE state IN ('approved','disputed');
CREATE TABLE reeklaim.evidence (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES reeklaim.accounts(id), claim_id uuid REFERENCES reeklaim.claims(id), object_key text NOT NULL UNIQUE CHECK(object_key ~ '^[a-f0-9]{64}$'), mime text NOT NULL CHECK(mime IN ('image/png','image/jpeg','image/webp','text/plain')), bytes integer NOT NULL CHECK(bytes BETWEEN 1 AND 4194304), sha256 text NOT NULL CHECK(length(sha256)=64), key_version integer NOT NULL DEFAULT 1 CHECK(key_version=1), created_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz);
CREATE INDEX evidence_owner ON reeklaim.evidence(owner_id,created_at DESC);
CREATE TABLE reeklaim.recovery_cases (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), claim_id uuid NOT NULL UNIQUE REFERENCES reeklaim.claims(id), state text NOT NULL DEFAULT 'open' CHECK(state IN ('open','disputed','returned','cancelled')), version integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE reeklaim.payment_intents (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid NOT NULL REFERENCES reeklaim.accounts(id), kind text NOT NULL CHECK(kind IN ('registration','transfer','reward')), chain_id text NOT NULL DEFAULT 'qorechain-diana' CHECK(chain_id='qorechain-diana'), amount_uqor numeric(78,0) NOT NULL CHECK(amount_uqor>=0), recipient text NOT NULL, memo text NOT NULL UNIQUE, state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','confirmed','expired','failed')), idempotency_key uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(actor_id,idempotency_key));
CREATE TABLE reeklaim.transactions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid NOT NULL REFERENCES reeklaim.accounts(id), payment_intent_id uuid UNIQUE REFERENCES reeklaim.payment_intents(id), chain_id text NOT NULL CHECK(chain_id='qorechain-diana'), tx_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(chain_id,tx_hash));
CREATE TABLE reeklaim.notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), account_id uuid NOT NULL REFERENCES reeklaim.accounts(id), kind text NOT NULL, safe_message text NOT NULL, read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX notifications_owner ON reeklaim.notifications(account_id,created_at DESC);
CREATE TABLE reeklaim.organizations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, owner_id uuid NOT NULL REFERENCES reeklaim.accounts(id), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE reeklaim.memberships (organization_id uuid NOT NULL REFERENCES reeklaim.organizations(id), account_id uuid NOT NULL REFERENCES reeklaim.accounts(id), role text NOT NULL CHECK(role IN ('owner','admin','staff')), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(organization_id,account_id));
CREATE TABLE reeklaim.audit_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid REFERENCES reeklaim.accounts(id), action text NOT NULL, resource_id uuid, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE reeklaim.rate_limit_buckets (key text NOT NULL, window_at timestamptz NOT NULL, count integer NOT NULL CHECK(count>0), PRIMARY KEY(key,window_at));
