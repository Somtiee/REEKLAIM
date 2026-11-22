CREATE TABLE reeklaim.finder_acknowledgements (
 token_digest text PRIMARY KEY CHECK(token_digest ~ '^[a-f0-9]{64}$'),
 received_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '7 days'
);
CREATE INDEX finder_ack_expiry ON reeklaim.finder_acknowledgements(expires_at);
ALTER TABLE reeklaim.finder_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reeklaim.finder_acknowledgements FORCE ROW LEVEL SECURITY;
CREATE POLICY finder_ack_insert ON reeklaim.finder_acknowledgements FOR INSERT TO reeklaim_auth WITH CHECK(true);
CREATE POLICY finder_ack_read ON reeklaim.finder_acknowledgements FOR SELECT TO reeklaim_auth USING(expires_at>now());
GRANT INSERT(token_digest),SELECT ON reeklaim.finder_acknowledgements TO reeklaim_auth;
CREATE INDEX market_english ON reeklaim.market_reports USING gin(to_tsvector('english',title||' '||description||' '||city||' '||category)) WHERE status='open';
