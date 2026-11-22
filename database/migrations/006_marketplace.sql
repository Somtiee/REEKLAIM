CREATE TABLE reeklaim.market_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL REFERENCES reeklaim.accounts(id),
 item_id uuid REFERENCES reeklaim.items(id),
 kind text NOT NULL CHECK(kind IN ('lost','found')),
 title text NOT NULL, description text NOT NULL, category text NOT NULL,
 country text NOT NULL CHECK(country ~ '^[A-Z]{2}$'), city text NOT NULL,
 occurred_on date NOT NULL, reward integer NOT NULL CHECK(reward BETWEEN 0 AND 100000000 AND (kind='lost' OR reward=0)),
 verified boolean NOT NULL DEFAULT false, photo bytea CHECK(octet_length(photo)<=4194304),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','open','closed','archived','held')),
 revision integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(item_id IS NULL OR kind='lost')
);
CREATE UNIQUE INDEX market_active_item ON reeklaim.market_reports(item_id) WHERE status IN ('draft','open','held');
CREATE INDEX market_order ON reeklaim.market_reports(kind,occurred_on DESC,id) WHERE status='open';
CREATE INDEX market_place ON reeklaim.market_reports(country,lower(city),category) WHERE status='open';
CREATE INDEX market_owner ON reeklaim.market_reports(owner_id,created_at DESC);
CREATE INDEX market_search ON reeklaim.market_reports USING gin(to_tsvector('simple',title||' '||description||' '||city||' '||category)) WHERE status='open';
CREATE TABLE reeklaim.market_flags (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 listing_id uuid NOT NULL REFERENCES reeklaim.market_reports(id),
 reason text NOT NULL CHECK(reason IN ('privacy','spam','unsafe','other')),
 created_at timestamptz NOT NULL DEFAULT now(),
 resolved_at timestamptz
);
CREATE INDEX market_unresolved ON reeklaim.market_flags(created_at) WHERE resolved_at IS NULL;
ALTER TABLE reeklaim.market_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE reeklaim.market_reports FORCE ROW LEVEL SECURITY;
ALTER TABLE reeklaim.market_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE reeklaim.market_flags FORCE ROW LEVEL SECURITY;
CREATE POLICY market_owner ON reeklaim.market_reports TO reeklaim_runtime
 USING(owner_id=nullif(current_setting('rk.actor',true),'')::uuid)
 WITH CHECK(owner_id=nullif(current_setting('rk.actor',true),'')::uuid);
CREATE POLICY market_public ON reeklaim.market_reports FOR SELECT TO reeklaim_auth USING(status='open');
CREATE POLICY market_flag_intake ON reeklaim.market_flags FOR INSERT TO reeklaim_auth
 WITH CHECK(EXISTS(SELECT 1 FROM reeklaim.market_reports WHERE id=listing_id AND status='open'));
GRANT SELECT,INSERT ON reeklaim.market_reports TO reeklaim_runtime;
GRANT UPDATE(title,description,category,country,city,occurred_on,reward,photo,status,revision) ON reeklaim.market_reports TO reeklaim_runtime;
GRANT SELECT(id,kind,title,description,category,country,city,occurred_on,reward,verified,photo,status) ON reeklaim.market_reports TO reeklaim_auth;
GRANT INSERT(listing_id,reason) ON reeklaim.market_flags TO reeklaim_auth;
CREATE FUNCTION reeklaim.archive_market_report() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 UPDATE reeklaim.market_reports SET status='archived',revision=revision+1
 WHERE item_id=NEW.id AND status<>'archived';
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION reeklaim.archive_market_report() FROM PUBLIC;
CREATE TRIGGER market_item_archive AFTER UPDATE OF status ON reeklaim.items FOR EACH ROW
 WHEN (NEW.status='archived' AND OLD.status IS DISTINCT FROM NEW.status)
 EXECUTE FUNCTION reeklaim.archive_market_report();
