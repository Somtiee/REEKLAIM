ALTER TABLE reeklaim.items ADD COLUMN metadata_cipher bytea, ADD COLUMN public_photo bytea;
CREATE TABLE reeklaim.item_versions (
 item_id uuid NOT NULL REFERENCES reeklaim.items(id), owner_id uuid NOT NULL REFERENCES reeklaim.accounts(id), version integer NOT NULL CHECK(version>0),
 commitment text NOT NULL CHECK(commitment ~ '^[a-f0-9]{64}$'), snapshot_cipher bytea NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(item_id,version));
CREATE TABLE reeklaim.registration_intents (
 id uuid PRIMARY KEY, item_id uuid NOT NULL UNIQUE REFERENCES reeklaim.items(id), actor_id uuid NOT NULL REFERENCES reeklaim.accounts(id),
 envelope_cipher bytea NOT NULL, version integer NOT NULL, commitment text NOT NULL CHECK(commitment ~ '^[a-f0-9]{64}$'), wallet_address text NOT NULL, recipient text NOT NULL,
 chain_id text NOT NULL CHECK(chain_id='qorechain-diana'), amount_uqor text NOT NULL CHECK(amount_uqor='100000'), origin text NOT NULL,
 memo text NOT NULL UNIQUE CHECK(memo ~ '^rk:reg:v1:[A-Za-z0-9_-]{43}$'), min_height numeric(78,0) NOT NULL CHECK(min_height>0),
 issued_at timestamptz NOT NULL, expires_at timestamptz NOT NULL CHECK(expires_at>issued_at), state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','confirmed','failed')),
 approval_started boolean NOT NULL DEFAULT false, candidate_hash text CHECK(candidate_hash ~ '^[A-F0-9]{64}$'), FOREIGN KEY(item_id,version) REFERENCES reeklaim.item_versions(item_id,version));
-- One ledger across authentication and registration. Existing receipts remain append-only.
ALTER TABLE reeklaim.chain_receipts ALTER COLUMN challenge_id DROP NOT NULL;
ALTER TABLE reeklaim.chain_receipts ADD COLUMN registration_id uuid UNIQUE REFERENCES reeklaim.registration_intents(id);
ALTER TABLE reeklaim.chain_receipts ADD CONSTRAINT one_receipt_purpose CHECK((challenge_id IS NULL)<>(registration_id IS NULL));
ALTER TABLE reeklaim.recovery_tags ADD COLUMN token_cipher bytea;
CREATE UNIQUE INDEX one_live_tag ON reeklaim.recovery_tags(item_id) WHERE revoked_at IS NULL;
CREATE TABLE reeklaim.recovery_public (
 item_id uuid PRIMARY KEY REFERENCES reeklaim.items(id), owner_id uuid NOT NULL REFERENCES reeklaim.accounts(id), token_digest text NOT NULL UNIQUE CHECK(length(token_digest)=64),
 name text, description text, photo bytea, status text NOT NULL CHECK(status IN ('registered','missing')));
CREATE TABLE reeklaim.recovery_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), item_id uuid NOT NULL REFERENCES reeklaim.items(id), owner_id uuid NOT NULL REFERENCES reeklaim.accounts(id), message_cipher bytea NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
DO $$ DECLARE t text; BEGIN
 FOR t IN SELECT unnest(ARRAY['item_versions','registration_intents','recovery_public','recovery_messages']) LOOP
  EXECUTE format('ALTER TABLE reeklaim.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE reeklaim.%I FORCE ROW LEVEL SECURITY',t);
 END LOOP;
END $$;
GRANT INSERT,UPDATE ON reeklaim.items TO reeklaim_runtime;
CREATE POLICY own_item_write ON reeklaim.items FOR ALL TO reeklaim_runtime USING(owner_id=nullif(current_setting('rk.actor',true),'')::uuid) WITH CHECK(owner_id=nullif(current_setting('rk.actor',true),'')::uuid);
GRANT SELECT,INSERT ON reeklaim.item_versions TO reeklaim_runtime;
CREATE POLICY own_versions ON reeklaim.item_versions TO reeklaim_runtime USING(owner_id=nullif(current_setting('rk.actor',true),'')::uuid) WITH CHECK(owner_id=nullif(current_setting('rk.actor',true),'')::uuid);
GRANT SELECT,INSERT,UPDATE ON reeklaim.registration_intents TO reeklaim_runtime;
CREATE POLICY own_registration ON reeklaim.registration_intents TO reeklaim_runtime USING(actor_id=nullif(current_setting('rk.actor',true),'')::uuid) WITH CHECK(actor_id=nullif(current_setting('rk.actor',true),'')::uuid);
GRANT SELECT,INSERT ON reeklaim.chain_receipts TO reeklaim_runtime;
CREATE POLICY registration_receipt ON reeklaim.chain_receipts TO reeklaim_runtime USING(EXISTS(SELECT 1 FROM reeklaim.registration_intents i WHERE i.id=registration_id AND i.actor_id=nullif(current_setting('rk.actor',true),'')::uuid)) WITH CHECK(challenge_id IS NULL AND EXISTS(SELECT 1 FROM reeklaim.registration_intents i WHERE i.id=registration_id AND i.actor_id=nullif(current_setting('rk.actor',true),'')::uuid AND i.wallet_address=signer AND i.memo=chain_receipts.memo));
GRANT SELECT,INSERT,UPDATE ON reeklaim.recovery_tags TO reeklaim_runtime;
CREATE POLICY own_tags ON reeklaim.recovery_tags TO reeklaim_runtime USING(EXISTS(SELECT 1 FROM reeklaim.items i WHERE i.id=item_id)) WITH CHECK(EXISTS(SELECT 1 FROM reeklaim.items i WHERE i.id=item_id));
GRANT SELECT,INSERT,UPDATE,DELETE ON reeklaim.recovery_public TO reeklaim_runtime;
CREATE POLICY own_projection ON reeklaim.recovery_public TO reeklaim_runtime USING(owner_id=nullif(current_setting('rk.actor',true),'')::uuid) WITH CHECK(owner_id=nullif(current_setting('rk.actor',true),'')::uuid);
-- The public-reader role receives only this deliberately sanitized projection.
GRANT SELECT ON reeklaim.recovery_public TO reeklaim_auth;
CREATE POLICY public_projection ON reeklaim.recovery_public FOR SELECT TO reeklaim_auth USING(true);
GRANT INSERT ON reeklaim.recovery_messages TO reeklaim_auth;
CREATE POLICY public_request ON reeklaim.recovery_messages FOR INSERT TO reeklaim_auth WITH CHECK(true);
GRANT SELECT ON reeklaim.recovery_messages TO reeklaim_runtime;
CREATE POLICY own_requests ON reeklaim.recovery_messages FOR SELECT TO reeklaim_runtime USING(owner_id=nullif(current_setting('rk.actor',true),'')::uuid);
