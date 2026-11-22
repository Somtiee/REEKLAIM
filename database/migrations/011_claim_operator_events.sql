ALTER TABLE reeklaim.claim_events ALTER COLUMN actor_id DROP NOT NULL;
CREATE INDEX market_match_window ON reeklaim.market_reports(category,country,occurred_on,id)
 WHERE status='open' AND kind='found';
