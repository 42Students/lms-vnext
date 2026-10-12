-- W01 DB017: same-company recruiter-grant physical safety, forward-only after 0045.
-- Source: docs/planning/sql/db09-recruiter-grant-company-integrity-candidate.sql
-- This is NOT runtime/PostgreSQL verified.
CREATE FUNCTION db09_assert_grant_same_company()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_profile_company uuid;
  v_relationship_company uuid;
BEGIN
  -- Lock both parents while checking. A company reassignment must not race
  -- through an in-flight grant insert; parent update guards below reject
  -- moving either side after any grant (even revoked audit rows) exists.
  SELECT p.company_id INTO v_profile_company
    FROM placement_recruiter_profiles p
   WHERE p.user_id = NEW.recruiter_user_id
     FOR SHARE;

  SELECT r.company_id INTO v_relationship_company
    FROM placement_company_relationships r
   WHERE r.id = NEW.company_relationship_id
     FOR SHARE;

  IF v_profile_company IS NULL
      OR v_relationship_company IS NULL
      OR v_profile_company <> v_relationship_company THEN
    RAISE EXCEPTION 'recruiter grant company mismatch'
      USING ERRCODE='23514',
            CONSTRAINT='db09_grant_company_consistent';
  END IF;
  RETURN NEW;
END
$$;

--> statement-breakpoint
CREATE TRIGGER db09_recruiter_grant_company_guard
  BEFORE INSERT OR UPDATE OF
    recruiter_user_id,company_relationship_id,status
  ON placement_recruiter_college_grants
  FOR EACH ROW EXECUTE FUNCTION db09_assert_grant_same_company();

-- Parent company changes would invalidate a previously accepted grant.
-- Keep the company association immutable while any grants reference it,
-- including revoked rows whose audit provenance must remain accurate.
--> statement-breakpoint
CREATE FUNCTION db09_reject_recruiter_profile_company_reassign()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.company_id IS DISTINCT FROM OLD.company_id
     AND EXISTS (
       SELECT 1 FROM placement_recruiter_college_grants g
        WHERE g.recruiter_user_id = OLD.user_id
     ) THEN
    RAISE EXCEPTION 'recruiter profile company with grants is immutable'
      USING ERRCODE='23514',
            CONSTRAINT='db09_recruiter_profile_grant_company_immutable';
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
CREATE TRIGGER db09_recruiter_profile_company_guard
  BEFORE UPDATE OF company_id ON placement_recruiter_profiles
  FOR EACH ROW EXECUTE FUNCTION db09_reject_recruiter_profile_company_reassign();

--> statement-breakpoint
CREATE FUNCTION db09_reject_granted_relationship_company_reassign()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.company_id IS DISTINCT FROM OLD.company_id
     AND EXISTS (
       SELECT 1 FROM placement_recruiter_college_grants g
        WHERE g.company_relationship_id = OLD.id
     ) THEN
    RAISE EXCEPTION 'company relationship with recruiter grants is immutable'
      USING ERRCODE='23514',
            CONSTRAINT='db09_relationship_grant_company_immutable';
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
CREATE TRIGGER db09_granted_relationship_company_guard
  BEFORE UPDATE OF company_id ON placement_company_relationships
  FOR EACH ROW EXECUTE FUNCTION db09_reject_granted_relationship_company_reassign();
