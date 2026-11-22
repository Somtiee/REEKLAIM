CREATE TABLE reeklaim.payment_operations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), purpose text NOT NULL CHECK(purpose IN ('transfer','reward')),
 payer_id uuid NOT NULL REFERENCES reeklaim.accounts(id), recipient_id uuid NOT NULL REFERENCES reeklaim.accounts(id),
 item_id uuid REFERENCES reeklaim.items(id), claim_id uuid REFERENCES reeklaim.claims(id),
 item_version integer, chain_id text NOT NULL DEFAULT 'qorechain-diana' CHECK(chain_id='qorechain-diana'),
 payer text NOT NULL, recipient text NOT NULL, treasury text NOT NULL,
 sends jsonb NOT NULL, state text NOT NULL CHECK(state IN ('offered','accepted','pending','confirmed','failed','cancelled')),
 accepted_at timestamptz, approval_started boolean NOT NULL DEFAULT false,
 memo text UNIQUE, origin text, min_height text, issued_at timestamptz, expires_at timestamptz,
 candidate_hash text CHECK(candidate_hash ~ '^[A-F0-9]{64}$'), created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(payer_id<>recipient_id),
 CHECK((purpose='transfer' AND item_id IS NOT NULL AND item_version IS NOT NULL AND claim_id IS NULL)
 OR (purpose='reward' AND claim_id IS NOT NULL AND item_id IS NULL))
);
CREATE UNIQUE INDEX one_reward_operation ON reeklaim.payment_operations(claim_id) WHERE purpose='reward';
CREATE UNIQUE INDEX one_open_transfer ON reeklaim.payment_operations(item_id)
 WHERE purpose='transfer' AND state IN ('offered','accepted','pending','failed');
CREATE INDEX payment_actor ON reeklaim.payment_operations(payer_id,created_at DESC);
CREATE INDEX payment_recipient ON reeklaim.payment_operations(recipient_id,created_at DESC);
ALTER TABLE reeklaim.payment_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reeklaim.payment_operations FORCE ROW LEVEL SECURITY;
CREATE POLICY payment_participant ON reeklaim.payment_operations TO reeklaim_runtime
 USING(nullif(current_setting('rk.actor',true),'')::uuid IN(payer_id,recipient_id))
 WITH CHECK(nullif(current_setting('rk.actor',true),'')::uuid IN(payer_id,recipient_id));
GRANT SELECT,INSERT ON reeklaim.payment_operations TO reeklaim_runtime;
GRANT UPDATE(state,accepted_at,approval_started,memo,origin,min_height,issued_at,expires_at,candidate_hash) ON reeklaim.payment_operations TO reeklaim_runtime;
ALTER TABLE reeklaim.chain_receipts DROP CONSTRAINT one_receipt_purpose;
ALTER TABLE reeklaim.chain_receipts ADD COLUMN payment_id uuid UNIQUE REFERENCES reeklaim.payment_operations(id);
ALTER TABLE reeklaim.chain_receipts ADD CONSTRAINT one_receipt_purpose CHECK(num_nonnulls(challenge_id,registration_id,payment_id)=1);
CREATE POLICY payment_receipt ON reeklaim.chain_receipts FOR SELECT TO reeklaim_runtime USING(EXISTS(
 SELECT 1 FROM reeklaim.payment_operations p WHERE p.id=payment_id));
CREATE POLICY payment_receipt_create ON reeklaim.chain_receipts FOR INSERT TO reeklaim_runtime WITH CHECK(EXISTS(
 SELECT 1 FROM reeklaim.payment_operations p WHERE p.id=payment_id AND p.payer_id=nullif(current_setting('rk.actor',true),'')::uuid
 AND p.candidate_hash=tx_hash AND p.payer=signer AND p.memo=chain_receipts.memo AND p.state='pending'));

CREATE FUNCTION reeklaim.apply_paid_transfer(operation uuid, new_metadata bytea)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE p reeklaim.payment_operations%ROWTYPE;
BEGIN
 SELECT * INTO STRICT p FROM reeklaim.payment_operations WHERE id=operation AND purpose='transfer' AND state='pending'
   AND payer_id=nullif(current_setting('rk.actor',true),'')::uuid AND accepted_at IS NOT NULL FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM reeklaim.chain_receipts WHERE payment_id=p.id AND tx_hash=p.candidate_hash) THEN
  RAISE EXCEPTION 'Verified transfer receipt required';
 END IF;
 PERFORM 1 FROM reeklaim.items WHERE id=p.item_id AND owner_id=p.payer_id AND status IN ('registered','returned')
  AND commitment IS NOT NULL AND version=p.item_version FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Transfer item state changed'; END IF;
 UPDATE reeklaim.market_reports SET status='archived',revision=revision+1 WHERE item_id=p.item_id AND status<>'archived';
 DELETE FROM reeklaim.recovery_public WHERE item_id=p.item_id;
 UPDATE reeklaim.recovery_tags SET revoked_at=now() WHERE item_id=p.item_id AND revoked_at IS NULL;
 UPDATE reeklaim.items SET owner_id=p.recipient_id,status='registered',version=version+1,metadata_cipher=new_metadata,public_photo=NULL
 WHERE id=p.item_id;
END $$;
REVOKE ALL ON FUNCTION reeklaim.apply_paid_transfer(uuid,bytea) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reeklaim.apply_paid_transfer(uuid,bytea) TO reeklaim_runtime;

CREATE FUNCTION reeklaim.complete_recovery_item() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF NEW.state='resolved' AND OLD.state IS DISTINCT FROM NEW.state AND NEW.item_id IS NOT NULL THEN
  UPDATE reeklaim.items SET status='returned' WHERE id=NEW.item_id AND owner_id=NEW.claimant_id AND status IN ('missing','recovery_pending');
  UPDATE reeklaim.recovery_public SET status='registered' WHERE item_id=NEW.item_id AND owner_id=NEW.claimant_id;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION reeklaim.complete_recovery_item() FROM PUBLIC;
CREATE TRIGGER recovery_item_status AFTER UPDATE OF state ON reeklaim.claims FOR EACH ROW EXECUTE FUNCTION reeklaim.complete_recovery_item();
CREATE FUNCTION reeklaim.lock_transfer_item() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF current_user='reeklaim_runtime' AND EXISTS(SELECT 1 FROM reeklaim.payment_operations p
   WHERE p.item_id=OLD.id AND p.state='pending') THEN
  RAISE EXCEPTION 'Reconcile the pending transfer before editing this item' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION reeklaim.lock_transfer_item() FROM PUBLIC;
CREATE TRIGGER lock_transfer_item BEFORE UPDATE ON reeklaim.items FOR EACH ROW EXECUTE FUNCTION reeklaim.lock_transfer_item();
