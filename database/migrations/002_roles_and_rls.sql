DO $$ BEGIN
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='reeklaim_auth') THEN CREATE ROLE reeklaim_auth NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT; END IF;
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='reeklaim_runtime') THEN CREATE ROLE reeklaim_runtime NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT; END IF;
END $$;
GRANT USAGE ON SCHEMA reeklaim TO reeklaim_auth,reeklaim_runtime;
REVOKE ALL ON ALL TABLES IN SCHEMA reeklaim FROM PUBLIC;
DO $$ DECLARE t text; BEGIN
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='reeklaim' LOOP
  EXECUTE format('ALTER TABLE reeklaim.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE reeklaim.%I FORCE ROW LEVEL SECURITY',t);
 END LOOP;
 FOR t IN SELECT unnest(ARRAY['accounts','pre_sessions','auth_challenges','chain_receipts','sessions','rate_limit_buckets']) LOOP
  EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON reeklaim.%I TO reeklaim_auth',t);
  EXECUTE format('CREATE POLICY auth_service ON reeklaim.%I TO reeklaim_auth USING(true) WITH CHECK(true)',t);
 END LOOP;
END $$;
-- The trusted auth role can read auth records only, not product/evidence rows. No browser grants.
GRANT INSERT ON reeklaim.audit_events TO reeklaim_auth,reeklaim_runtime;
CREATE POLICY auth_audit_insert ON reeklaim.audit_events FOR INSERT TO reeklaim_auth WITH CHECK(true);
CREATE POLICY actor_audit_insert ON reeklaim.audit_events FOR INSERT TO reeklaim_runtime WITH CHECK(actor_id=nullif(current_setting('rk.actor',true),'')::uuid);
GRANT SELECT ON reeklaim.accounts TO reeklaim_runtime;
CREATE POLICY own_account ON reeklaim.accounts FOR SELECT TO reeklaim_runtime USING(id=nullif(current_setting('rk.actor',true),'')::uuid);
GRANT SELECT ON reeklaim.items TO reeklaim_runtime;
CREATE POLICY own_items ON reeklaim.items FOR SELECT TO reeklaim_runtime USING(owner_id=nullif(current_setting('rk.actor',true),'')::uuid);
GRANT SELECT,INSERT ON reeklaim.evidence TO reeklaim_runtime;
CREATE POLICY own_evidence_read ON reeklaim.evidence FOR SELECT TO reeklaim_runtime USING(owner_id=nullif(current_setting('rk.actor',true),'')::uuid AND deleted_at IS NULL);
-- Claim attachments/grants are deliberately unavailable until a reviewed case service exists.
CREATE POLICY own_evidence_insert ON reeklaim.evidence FOR INSERT TO reeklaim_runtime WITH CHECK(owner_id=nullif(current_setting('rk.actor',true),'')::uuid AND claim_id IS NULL AND deleted_at IS NULL);
GRANT SELECT ON reeklaim.notifications,reeklaim.transactions TO reeklaim_runtime;
CREATE POLICY own_notifications ON reeklaim.notifications FOR SELECT TO reeklaim_runtime USING(account_id=nullif(current_setting('rk.actor',true),'')::uuid);
CREATE POLICY own_transactions ON reeklaim.transactions FOR SELECT TO reeklaim_runtime USING(actor_id=nullif(current_setting('rk.actor',true),'')::uuid);
-- Future-phase tables have FORCE RLS, no policies/grants: deny by default.
ALTER DEFAULT PRIVILEGES IN SCHEMA reeklaim REVOKE ALL ON TABLES FROM PUBLIC;
