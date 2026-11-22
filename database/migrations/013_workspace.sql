CREATE TABLE reeklaim.account_settings (
 account_id uuid PRIMARY KEY REFERENCES reeklaim.accounts(id),
 notifications boolean NOT NULL DEFAULT true, match_alerts boolean NOT NULL DEFAULT true,
 hide_balance boolean NOT NULL DEFAULT false
);
CREATE TABLE reeklaim.account_deletion_requests (
 account_id uuid PRIMARY KEY REFERENCES reeklaim.accounts(id), requested_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE reeklaim.notifications ADD COLUMN event_key text, ADD COLUMN href text NOT NULL DEFAULT '/app';
CREATE UNIQUE INDEX notification_event ON reeklaim.notifications(account_id,event_key);
CREATE INDEX notification_unread ON reeklaim.notifications(account_id,created_at DESC) WHERE read_at IS NULL;
GRANT UPDATE(read_at) ON reeklaim.notifications TO reeklaim_runtime;
CREATE POLICY notify_update ON reeklaim.notifications FOR UPDATE TO reeklaim_runtime USING(account_id=nullif(current_setting('rk.actor',true),'')::uuid);
CREATE POLICY notify_match ON reeklaim.notifications FOR INSERT TO reeklaim_runtime WITH CHECK(account_id=nullif(current_setting('rk.actor',true),'')::uuid AND kind='match');
GRANT INSERT ON reeklaim.notifications TO reeklaim_runtime;
GRANT SELECT ON reeklaim.audit_events TO reeklaim_runtime;
CREATE POLICY audit_read_self ON reeklaim.audit_events FOR SELECT TO reeklaim_runtime USING(actor_id=nullif(current_setting('rk.actor',true),'')::uuid);
ALTER TABLE reeklaim.account_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reeklaim.account_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE reeklaim.account_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reeklaim.account_deletion_requests FORCE ROW LEVEL SECURITY;
CREATE POLICY settings_owner ON reeklaim.account_settings TO reeklaim_runtime USING(account_id=nullif(current_setting('rk.actor',true),'')::uuid);
CREATE POLICY deletion_owner ON reeklaim.account_deletion_requests TO reeklaim_runtime USING(account_id=nullif(current_setting('rk.actor',true),'')::uuid);
GRANT SELECT,INSERT,UPDATE ON reeklaim.account_settings TO reeklaim_runtime;
GRANT SELECT,INSERT ON reeklaim.account_deletion_requests TO reeklaim_runtime;

CREATE FUNCTION reeklaim.notify_workspace() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE targets uuid[]; target uuid; event text; message text; path text; key text;
BEGIN
 IF TG_TABLE_NAME='recovery_messages' THEN
  targets:=ARRAY[NEW.owner_id]; event:='finder_report'; message:='A finder sent a request through your recovery tag.';
  path:='/app/items/'||NEW.item_id; key:='qr:'||NEW.id;
 ELSIF TG_TABLE_NAME='claims' THEN
  path:='/app/claims/'||NEW.id;
  IF TG_OP='INSERT' THEN
   targets:=ARRAY[NEW.reviewer_id]; event:='claim_submitted'; message:='A new claim is ready for review.';
  ELSIF NEW.state IS DISTINCT FROM OLD.state AND NEW.state IN ('approved','rejected','more_information','resolved') THEN
   targets:=CASE WHEN NEW.state='resolved' THEN ARRAY[NEW.claimant_id,NEW.reviewer_id] ELSE ARRAY[NEW.claimant_id] END;
   event:='claim_'||NEW.state;
   message:=CASE NEW.state WHEN 'approved' THEN 'Your claim was approved for coordination.' WHEN 'rejected' THEN 'A claim was declined.' WHEN 'more_information' THEN 'A reviewer requested additional evidence.' ELSE 'Both participants confirmed a return.' END;
  END IF;
  key:=event||':'||NEW.id||':'||NEW.version;
 ELSIF TG_TABLE_NAME='claim_events' AND NEW.kind='message' THEN
  SELECT ARRAY[CASE WHEN claimant_id=NEW.actor_id THEN reviewer_id ELSE claimant_id END] INTO targets FROM reeklaim.claims WHERE id=NEW.claim_id;
  event:='case_message'; message:='A participant sent a private case message.'; path:='/app/claims/'||NEW.claim_id; key:='message:'||NEW.id;
 ELSIF TG_TABLE_NAME='payment_operations' AND NEW.state IS DISTINCT FROM OLD.state THEN
  IF NEW.purpose='reward' AND NEW.state='confirmed' THEN
   targets:=ARRAY[NEW.recipient_id]; event:='reward_verified'; message:='A finder reward receipt was verified.';
  ELSIF NEW.purpose='transfer' AND NEW.state='accepted' THEN
   targets:=ARRAY[NEW.payer_id]; event:='transfer_accepted'; message:='The recipient accepted your transfer offer.';
  END IF;
  path:='/app/transactions'; key:=event||':'||NEW.id;
 END IF;
 IF targets IS NOT NULL AND event IS NOT NULL THEN
  FOREACH target IN ARRAY targets LOOP
   IF COALESCE((SELECT notifications FROM reeklaim.account_settings WHERE account_id=target),true) THEN
    INSERT INTO reeklaim.notifications(account_id,kind,safe_message,event_key,href)
      VALUES(target,event,message,key,path) ON CONFLICT(account_id,event_key) DO NOTHING;
   END IF;
  END LOOP;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION reeklaim.notify_workspace() FROM PUBLIC;
CREATE TRIGGER notify_qr AFTER INSERT ON reeklaim.recovery_messages FOR EACH ROW EXECUTE FUNCTION reeklaim.notify_workspace();
CREATE TRIGGER notify_claim AFTER INSERT OR UPDATE OF state ON reeklaim.claims FOR EACH ROW EXECUTE FUNCTION reeklaim.notify_workspace();
CREATE TRIGGER notify_message AFTER INSERT ON reeklaim.claim_events FOR EACH ROW EXECUTE FUNCTION reeklaim.notify_workspace();
CREATE TRIGGER notify_payment AFTER UPDATE OF state ON reeklaim.payment_operations FOR EACH ROW EXECUTE FUNCTION reeklaim.notify_workspace();

