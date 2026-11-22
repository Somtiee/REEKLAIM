REVOKE UPDATE,DELETE ON reeklaim.chain_receipts FROM reeklaim_auth;
ALTER TABLE reeklaim.pre_sessions ADD CONSTRAINT pre_expiration CHECK(expires_at>created_at);
ALTER TABLE reeklaim.sessions ADD CONSTRAINT session_expiration CHECK(expires_at>created_at);
CREATE INDEX challenges_expiry ON reeklaim.auth_challenges(expires_at);
CREATE INDEX rate_bucket_expiry ON reeklaim.rate_limit_buckets(window_at);
CREATE INDEX evidence_claim ON reeklaim.evidence(claim_id) WHERE claim_id IS NOT NULL;
