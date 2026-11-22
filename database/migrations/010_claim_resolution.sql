CREATE UNIQUE INDEX claim_item_winner ON reeklaim.claims(item_id)
 WHERE found_listing_id IS NOT NULL AND state IN ('approved','recovery_in_progress','disputed','resolved');
CREATE FUNCTION reeklaim.sync_claim_found() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF NEW.state='resolved' AND OLD.state IS DISTINCT FROM NEW.state THEN
  UPDATE reeklaim.market_reports SET status='recovered',revision=revision+1
    WHERE id=NEW.found_listing_id AND status='recovery_in_progress';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION reeklaim.sync_claim_found() FROM PUBLIC;
CREATE TRIGGER claim_found_status AFTER UPDATE OF state ON reeklaim.claims FOR EACH ROW EXECUTE FUNCTION reeklaim.sync_claim_found();
