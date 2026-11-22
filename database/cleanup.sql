-- Run only with the separate migration/operator role. Never expose through HTTP.
BEGIN;
DELETE FROM reeklaim.auth_challenges WHERE state<>'consumed' AND expires_at<now()-interval '24 hours';
DELETE FROM reeklaim.pre_sessions p WHERE expires_at<now()-interval '24 hours' AND NOT EXISTS(SELECT 1 FROM reeklaim.auth_challenges c WHERE c.pre_digest=p.digest);
DELETE FROM reeklaim.rate_limit_buckets WHERE window_at<now()-interval '24 hours';
UPDATE reeklaim.sessions SET revoked_at=coalesce(revoked_at,now()) WHERE expires_at<now() OR last_active_at<now()-interval '30 minutes';
-- Retain minimal auth receipt/session audit linkage; private-file retention needs an explicit reviewed policy.
COMMIT;
