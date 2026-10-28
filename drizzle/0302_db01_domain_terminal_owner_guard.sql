-- DB-004 registered direct-SQL domain state guard. This protects
-- tenant ownership, DNS proof on a host rename, and tombstone terminality.
-- Hard DELETE is deliberately not blocked here: disposable PG fixtures
-- clean up their synthetic rows with DELETE. A production purge/retention
-- policy and separately scoped hard-delete guard remain an OPEN approval.
CREATE OR REPLACE FUNCTION "db01_tenant_domain_update_guard"()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Tombstoned domain is terminal'
      USING ERRCODE='23514',CONSTRAINT='db01_domain_tombstone_terminal_ck';
  END IF;
  IF NEW.college_id IS DISTINCT FROM OLD.college_id THEN
    RAISE EXCEPTION 'Domain owner cannot change'
      USING ERRCODE='23514',CONSTRAINT='db01_domain_owner_immutable_ck';
  END IF;
  IF NEW.host IS DISTINCT FROM OLD.host AND (
       NEW.is_verified IS DISTINCT FROM false
       OR NEW.is_primary IS DISTINCT FROM false
       OR NEW.verified_at IS NOT NULL
       OR NEW.last_checked_at IS NOT NULL
       OR NEW.last_check_result IS NOT NULL
       OR NEW.verification_token IS NULL
       OR NEW.verification_token IS NOT DISTINCT FROM OLD.verification_token
     ) THEN
    RAISE EXCEPTION 'Hostname change requires new unverified DNS challenge'
      USING ERRCODE='23514',CONSTRAINT='db01_domain_host_proof_reset_ck';
  END IF;
  IF NEW.deleted_at IS NOT NULL AND (
       NEW.is_primary IS DISTINCT FROM false
       OR NEW.is_verified IS DISTINCT FROM false
       OR NEW.verification_token IS NOT NULL
     ) THEN
    RAISE EXCEPTION 'Deleted host cannot retain routing or DNS secret'
      USING ERRCODE='23514',CONSTRAINT='db01_domain_deleted_inert_ck';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "db01_tenant_domain_update_guard_trg"
  BEFORE UPDATE ON "tenant_domains"
  FOR EACH ROW EXECUTE FUNCTION "db01_tenant_domain_update_guard"();
