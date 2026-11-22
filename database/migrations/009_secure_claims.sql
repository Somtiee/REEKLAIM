ALTER TABLE reeklaim.claims ALTER COLUMN item_id DROP NOT NULL;
ALTER TABLE reeklaim.claims ADD COLUMN lost_listing_id uuid REFERENCES reeklaim.market_reports(id),
 ADD COLUMN found_listing_id uuid REFERENCES reeklaim.market_reports(id),
 ADD COLUMN narrative bytea, ADD COLUMN verification text NOT NULL DEFAULT 'none' CHECK(verification IN ('none','confirmed','unavailable')),
 ADD COLUMN serial_agrees boolean, ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now(),
 ADD CONSTRAINT claim_listing_pair CHECK((lost_listing_id IS NULL)=(found_listing_id IS NULL));
ALTER TABLE reeklaim.claims DROP CONSTRAINT claims_state_check;
ALTER TABLE reeklaim.claims ADD CONSTRAINT claims_state_check CHECK(state IN ('submitted','under_review','more_information','approved','rejected','withdrawn','disputed','returned','recovery_in_progress','resolved'));
CREATE UNIQUE INDEX claim_pair ON reeklaim.claims(claimant_id,found_listing_id,lost_listing_id);
CREATE UNIQUE INDEX claim_winner ON reeklaim.claims(found_listing_id)
 WHERE state IN ('approved','recovery_in_progress','disputed','resolved');
CREATE INDEX claim_inbox ON reeklaim.claims(reviewer_id,updated_at DESC);
CREATE INDEX claim_outbox ON reeklaim.claims(claimant_id,updated_at DESC);
ALTER TABLE reeklaim.market_reports ADD COLUMN brand text NOT NULL DEFAULT '', ADD COLUMN model text NOT NULL DEFAULT '', ADD COLUMN colour text NOT NULL DEFAULT '';
GRANT SELECT(brand,model,colour) ON reeklaim.market_reports TO reeklaim_auth;
GRANT UPDATE(brand,model,colour) ON reeklaim.market_reports TO reeklaim_runtime;

CREATE FUNCTION reeklaim.claim_target(target uuid) RETURNS uuid
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT owner_id FROM reeklaim.market_reports WHERE id=target AND kind='found' AND status='open';
$$;
REVOKE ALL ON FUNCTION reeklaim.claim_target(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reeklaim.claim_target(uuid) TO reeklaim_runtime;
CREATE POLICY claim_read ON reeklaim.claims FOR SELECT TO reeklaim_runtime
 USING(found_listing_id IS NOT NULL AND nullif(current_setting('rk.actor',true),'')::uuid IN (claimant_id,reviewer_id));
CREATE POLICY claim_insert ON reeklaim.claims FOR INSERT TO reeklaim_runtime
 WITH CHECK(claimant_id=nullif(current_setting('rk.actor',true),'')::uuid AND reviewer_id=reeklaim.claim_target(found_listing_id)
 AND EXISTS (SELECT 1 FROM reeklaim.market_reports l WHERE l.id=lost_listing_id AND l.kind='lost' AND l.status='open' AND l.item_id IS NOT DISTINCT FROM claims.item_id));
CREATE POLICY claim_update ON reeklaim.claims FOR UPDATE TO reeklaim_runtime
 USING(found_listing_id IS NOT NULL AND nullif(current_setting('rk.actor',true),'')::uuid IN (claimant_id,reviewer_id));
GRANT SELECT,INSERT ON reeklaim.claims TO reeklaim_runtime;
GRANT UPDATE(state,version,updated_at) ON reeklaim.claims TO reeklaim_runtime;

CREATE TABLE reeklaim.claim_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), claim_id uuid NOT NULL REFERENCES reeklaim.claims(id),
 actor_id uuid NOT NULL REFERENCES reeklaim.accounts(id), kind text NOT NULL, payload bytea, created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX claim_event_timeline ON reeklaim.claim_events(claim_id,created_at,id);
CREATE TABLE reeklaim.claim_attachments (
 claim_id uuid NOT NULL REFERENCES reeklaim.claims(id), evidence_id uuid NOT NULL REFERENCES reeklaim.evidence(id),
 owner_id uuid NOT NULL REFERENCES reeklaim.accounts(id), PRIMARY KEY(claim_id,evidence_id)
);
ALTER TABLE reeklaim.claim_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reeklaim.claim_events FORCE ROW LEVEL SECURITY;
ALTER TABLE reeklaim.claim_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reeklaim.claim_attachments FORCE ROW LEVEL SECURITY;
CREATE POLICY claim_events_read ON reeklaim.claim_events FOR SELECT TO reeklaim_runtime USING(EXISTS(SELECT 1 FROM reeklaim.claims c WHERE c.id=claim_id));
CREATE POLICY claim_events_write ON reeklaim.claim_events FOR INSERT TO reeklaim_runtime WITH CHECK(actor_id=nullif(current_setting('rk.actor',true),'')::uuid AND EXISTS(SELECT 1 FROM reeklaim.claims c WHERE c.id=claim_id));
CREATE POLICY claim_attachments_read ON reeklaim.claim_attachments FOR SELECT TO reeklaim_runtime USING(EXISTS(SELECT 1 FROM reeklaim.claims c WHERE c.id=claim_id));
CREATE POLICY claim_attachments_write ON reeklaim.claim_attachments FOR INSERT TO reeklaim_runtime WITH CHECK(owner_id=nullif(current_setting('rk.actor',true),'')::uuid AND EXISTS(SELECT 1 FROM reeklaim.claims c WHERE c.id=claim_id));
GRANT SELECT,INSERT ON reeklaim.claim_events,reeklaim.claim_attachments TO reeklaim_runtime;
CREATE POLICY claim_evidence_read ON reeklaim.evidence FOR SELECT TO reeklaim_runtime USING(deleted_at IS NULL AND EXISTS(SELECT 1 FROM reeklaim.claim_attachments a WHERE a.evidence_id=evidence.id AND a.owner_id=evidence.owner_id));

CREATE TABLE reeklaim.match_dismissals (
 actor_id uuid NOT NULL REFERENCES reeklaim.accounts(id), lost_id uuid NOT NULL REFERENCES reeklaim.market_reports(id), found_id uuid NOT NULL REFERENCES reeklaim.market_reports(id), PRIMARY KEY(actor_id,lost_id,found_id)
);
ALTER TABLE reeklaim.match_dismissals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reeklaim.match_dismissals FORCE ROW LEVEL SECURITY;
CREATE POLICY match_actor ON reeklaim.match_dismissals TO reeklaim_runtime USING(actor_id=nullif(current_setting('rk.actor',true),'')::uuid);
GRANT SELECT,INSERT ON reeklaim.match_dismissals TO reeklaim_runtime;

CREATE POLICY claim_case ON reeklaim.recovery_cases TO reeklaim_runtime USING(EXISTS(SELECT 1 FROM reeklaim.claims c WHERE c.id=claim_id));
GRANT SELECT,INSERT ON reeklaim.recovery_cases TO reeklaim_runtime;
GRANT UPDATE(state) ON reeklaim.recovery_cases TO reeklaim_runtime;
ALTER FUNCTION reeklaim.sync_market_claim() SECURITY DEFINER;
ALTER FUNCTION reeklaim.sync_market_case() SECURITY DEFINER;
