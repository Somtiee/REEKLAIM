ALTER TABLE reeklaim.organizations ADD COLUMN kind text NOT NULL DEFAULT 'business'
 CHECK(kind IN ('university','hotel','airport','transport','business','venue')),
 ADD COLUMN description text NOT NULL DEFAULT '';
CREATE TABLE reeklaim.organization_invites (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL REFERENCES reeklaim.organizations(id),
 invitee uuid NOT NULL REFERENCES reeklaim.accounts(id), role text NOT NULL CHECK(role IN ('admin','staff')),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '7 days', accepted_at timestamptz, revoked_at timestamptz
);
CREATE UNIQUE INDEX org_one_invite ON reeklaim.organization_invites(org_id,invitee) WHERE accepted_at IS NULL AND revoked_at IS NULL;
CREATE TABLE reeklaim.organization_inventory (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL REFERENCES reeklaim.organizations(id),
 title text NOT NULL, notes text NOT NULL, kind text NOT NULL CHECK(kind IN ('found','asset')),
 registered_item uuid REFERENCES reeklaim.items(id), status text NOT NULL DEFAULT 'held'
 CHECK(status IN ('held','review','approved','recovered','closed')), version integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((kind='asset')=(registered_item IS NOT NULL))
);
CREATE UNIQUE INDEX org_asset_once ON reeklaim.organization_inventory(org_id,registered_item) WHERE registered_item IS NOT NULL;
CREATE TABLE reeklaim.organization_activity (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL REFERENCES reeklaim.organizations(id),
 actor_id uuid NOT NULL REFERENCES reeklaim.accounts(id), action text NOT NULL, at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX org_activity_time ON reeklaim.organization_activity(org_id,at DESC);
CREATE INDEX org_inventory_scope ON reeklaim.organization_inventory(org_id,created_at DESC);
CREATE FUNCTION reeklaim.org_role(tenant uuid) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT role FROM reeklaim.memberships WHERE organization_id=tenant AND account_id=nullif(current_setting('rk.actor',true),'')::uuid;
$$;
CREATE FUNCTION reeklaim.create_workspace_org(org_name text, org_kind text, profile text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=nullif(current_setting('rk.actor',true),'')::uuid; new_id uuid;
BEGIN
 IF actor IS NULL OR char_length(org_name) NOT BETWEEN 2 AND 100 OR char_length(profile)>500 THEN RAISE EXCEPTION 'Invalid profile'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(actor::text,831));
 IF (SELECT count(*) FROM reeklaim.organizations WHERE owner_id=actor)>=10 THEN RAISE EXCEPTION 'Organization limit'; END IF;
 INSERT INTO reeklaim.organizations(name,kind,description,owner_id) VALUES(org_name,org_kind,profile,actor) RETURNING id INTO new_id;
 INSERT INTO reeklaim.memberships(organization_id,account_id,role) VALUES(new_id,actor,'owner');
 INSERT INTO reeklaim.organization_activity(org_id,actor_id,action) VALUES(new_id,actor,'organization.created');
 RETURN new_id;
END $$;
CREATE FUNCTION reeklaim.accept_workspace_invite(invitation uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=nullif(current_setting('rk.actor',true),'')::uuid; offer reeklaim.organization_invites%ROWTYPE;
BEGIN
 UPDATE reeklaim.organization_invites SET accepted_at=clock_timestamp()
 WHERE id=invitation AND invitee=actor AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at>clock_timestamp()
 RETURNING * INTO offer;
 IF NOT FOUND THEN RETURN NULL; END IF;
 INSERT INTO reeklaim.memberships(organization_id,account_id,role) VALUES(offer.org_id,actor,offer.role) ON CONFLICT DO NOTHING;
 INSERT INTO reeklaim.organization_activity(org_id,actor_id,action) VALUES(offer.org_id,actor,'invitation.accepted');
 RETURN offer.org_id;
END $$;
REVOKE ALL ON FUNCTION reeklaim.org_role(uuid),reeklaim.create_workspace_org(text,text,text),reeklaim.accept_workspace_invite(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reeklaim.org_role(uuid),reeklaim.create_workspace_org(text,text,text),reeklaim.accept_workspace_invite(uuid) TO reeklaim_runtime;
ALTER TABLE reeklaim.organization_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reeklaim.organization_invites FORCE ROW LEVEL SECURITY;
ALTER TABLE reeklaim.organization_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE reeklaim.organization_inventory FORCE ROW LEVEL SECURITY;
ALTER TABLE reeklaim.organization_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE reeklaim.organization_activity FORCE ROW LEVEL SECURITY;
GRANT SELECT ON reeklaim.organizations,reeklaim.memberships TO reeklaim_runtime;
GRANT UPDATE(name,kind,description) ON reeklaim.organizations TO reeklaim_runtime;
GRANT UPDATE(role),DELETE ON reeklaim.memberships TO reeklaim_runtime;
CREATE POLICY org_read ON reeklaim.organizations FOR SELECT TO reeklaim_runtime USING(reeklaim.org_role(id) IS NOT NULL);
CREATE POLICY org_manage ON reeklaim.organizations FOR UPDATE TO reeklaim_runtime USING(reeklaim.org_role(id) IN ('owner','admin'));
CREATE POLICY members_read ON reeklaim.memberships FOR SELECT TO reeklaim_runtime USING(reeklaim.org_role(organization_id) IS NOT NULL);
CREATE POLICY members_change ON reeklaim.memberships FOR UPDATE TO reeklaim_runtime
 USING(reeklaim.org_role(organization_id)='owner' AND role<>'owner') WITH CHECK(reeklaim.org_role(organization_id)='owner' AND role IN ('admin','staff'));
CREATE POLICY members_remove ON reeklaim.memberships FOR DELETE TO reeklaim_runtime USING(reeklaim.org_role(organization_id)='owner' AND role<>'owner');
GRANT SELECT,INSERT ON reeklaim.organization_invites TO reeklaim_runtime;
GRANT UPDATE(revoked_at) ON reeklaim.organization_invites TO reeklaim_runtime;
CREATE POLICY invites_read ON reeklaim.organization_invites FOR SELECT TO reeklaim_runtime
 USING(invitee=nullif(current_setting('rk.actor',true),'')::uuid OR reeklaim.org_role(org_id) IN ('owner','admin'));
CREATE POLICY invites_send ON reeklaim.organization_invites FOR INSERT TO reeklaim_runtime
 WITH CHECK(reeklaim.org_role(org_id)='owner' OR (reeklaim.org_role(org_id)='admin' AND role='staff'));
CREATE POLICY invites_revoke ON reeklaim.organization_invites FOR UPDATE TO reeklaim_runtime
 USING(reeklaim.org_role(org_id)='owner' OR (reeklaim.org_role(org_id)='admin' AND role='staff'));
GRANT SELECT,INSERT ON reeklaim.organization_inventory,reeklaim.organization_activity TO reeklaim_runtime;
GRANT UPDATE(status,version,notes) ON reeklaim.organization_inventory TO reeklaim_runtime;
CREATE POLICY inventory_read ON reeklaim.organization_inventory FOR SELECT TO reeklaim_runtime USING(reeklaim.org_role(org_id) IS NOT NULL);
CREATE POLICY inventory_create ON reeklaim.organization_inventory FOR INSERT TO reeklaim_runtime
 WITH CHECK((kind='found' AND reeklaim.org_role(org_id) IS NOT NULL) OR
 (kind='asset' AND reeklaim.org_role(org_id) IN ('owner','admin') AND EXISTS(
 SELECT 1 FROM reeklaim.items i WHERE i.id=registered_item AND i.owner_id=nullif(current_setting('rk.actor',true),'')::uuid AND i.commitment IS NOT NULL AND i.status IN ('registered','returned'))));
CREATE POLICY inventory_change ON reeklaim.organization_inventory FOR UPDATE TO reeklaim_runtime
 USING(reeklaim.org_role(org_id) IN ('owner','admin'));
CREATE POLICY org_activity_read ON reeklaim.organization_activity FOR SELECT TO reeklaim_runtime USING(reeklaim.org_role(org_id) IS NOT NULL);
CREATE POLICY org_activity_write ON reeklaim.organization_activity FOR INSERT TO reeklaim_runtime
 WITH CHECK(reeklaim.org_role(org_id) IS NOT NULL AND actor_id=nullif(current_setting('rk.actor',true),'')::uuid);
ALTER TABLE reeklaim.organization_invites ADD COLUMN org_name text NOT NULL DEFAULT '';
CREATE FUNCTION reeklaim.close_stale_org_asset() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF NEW.owner_id IS DISTINCT FROM OLD.owner_id OR NEW.status='archived' THEN
  UPDATE reeklaim.organization_inventory SET status='closed',version=version+1
   WHERE registered_item=NEW.id AND status<>'closed';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION reeklaim.close_stale_org_asset() FROM PUBLIC;
CREATE TRIGGER org_asset_stale AFTER UPDATE OF owner_id,status ON reeklaim.items FOR EACH ROW EXECUTE FUNCTION reeklaim.close_stale_org_asset();
