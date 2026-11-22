-- Owner identity has no runtime UPDATE grant; application updates have a narrow column list.
REVOKE UPDATE ON reeklaim.items FROM reeklaim_runtime;
GRANT UPDATE(name,category,status,version,commitment,metadata_cipher,public_photo,updated_at) ON reeklaim.items TO reeklaim_runtime;
CREATE FUNCTION reeklaim.preserve_original_anchor() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF OLD.commitment IS NOT NULL AND NEW.commitment IS DISTINCT FROM OLD.commitment THEN
  RAISE EXCEPTION 'Original registration commitment is immutable';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION reeklaim.preserve_original_anchor() FROM PUBLIC;
CREATE TRIGGER preserve_original_anchor BEFORE UPDATE ON reeklaim.items FOR EACH ROW EXECUTE FUNCTION reeklaim.preserve_original_anchor();
