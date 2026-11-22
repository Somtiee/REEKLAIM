ALTER TABLE reeklaim.market_reports DROP CONSTRAINT market_reports_status_check;
ALTER TABLE reeklaim.market_reports ADD CONSTRAINT market_reports_status_check CHECK(status IN ('draft','open','closed','archived','held','claim_pending','recovery_in_progress','recovered'));
DROP INDEX reeklaim.market_active_item;
CREATE UNIQUE INDEX market_active_item ON reeklaim.market_reports(item_id) WHERE status IN ('draft','open','held','claim_pending','recovery_in_progress');
CREATE FUNCTION reeklaim.sync_market_claim() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF NEW.state IN ('submitted','under_review') THEN
  UPDATE reeklaim.market_reports SET status='claim_pending',revision=revision+1
   WHERE item_id=NEW.item_id AND status='open';
 ELSIF NEW.state IN ('withdrawn','rejected') THEN
  UPDATE reeklaim.market_reports SET status='closed',revision=revision+1
   WHERE item_id=NEW.item_id AND status='claim_pending'
   AND NOT EXISTS(SELECT 1 FROM reeklaim.claims c WHERE c.item_id=NEW.item_id AND c.state IN ('submitted','under_review','approved','disputed'));
 END IF;
 RETURN NEW;
END $$;
CREATE FUNCTION reeklaim.sync_market_case() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 UPDATE reeklaim.market_reports r
 SET status=CASE WHEN NEW.state='returned' THEN 'recovered' WHEN NEW.state='cancelled' THEN 'closed' ELSE 'recovery_in_progress' END,revision=revision+1
 FROM reeklaim.claims c
 WHERE c.id=NEW.claim_id AND r.item_id=c.item_id AND r.status IN ('open','claim_pending','recovery_in_progress');
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION reeklaim.sync_market_claim(),reeklaim.sync_market_case() FROM PUBLIC;
CREATE TRIGGER market_claim_state AFTER INSERT OR UPDATE OF state ON reeklaim.claims FOR EACH ROW EXECUTE FUNCTION reeklaim.sync_market_claim();
CREATE TRIGGER market_case_state AFTER INSERT OR UPDATE OF state ON reeklaim.recovery_cases FOR EACH ROW EXECUTE FUNCTION reeklaim.sync_market_case();
