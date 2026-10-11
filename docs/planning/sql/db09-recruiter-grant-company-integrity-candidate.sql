-- DB-012 / Chat 3, 2026-10-11: standalone candidate; NOT REGISTERED / NOT EXECUTED.
-- This is a database contract for the shared placement_recruiter_college_grants
-- parent, not the already-staged DB09 child-table grants helper.
-- W01 owns numbered migrations / barrel / replay. Keep source vNext production
-- API gated until both this and the rest of the DB09 migration pass.
--
-- Defect: two independent FKs permit (recruiter_user_id=company A profile,
-- company_relationship_id=company B relationship) even with both references
-- present. A general-purpose grant lookup must never equate an ACTIVE grant
-- with same-company authorization without checking the company join.
-- The service query was corrected in tpo-messaging-service.ts, but every
-- grant writer, including future direct SQL and importers, needs DB defense.

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

CREATE TRIGGER db09_recruiter_grant_company_guard
  BEFORE INSERT OR UPDATE OF
    recruiter_user_id,company_relationship_id,status
  ON placement_recruiter_college_grants
  FOR EACH ROW EXECUTE FUNCTION db09_assert_grant_same_company();

-- Parent company changes would invalidate a previously accepted grant.
-- Keep the company association immutable while any grants reference it,
-- including revoked rows whose audit provenance must remain accurate.
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
CREATE TRIGGER db09_recruiter_profile_company_guard
  BEFORE UPDATE OF company_id ON placement_recruiter_profiles
  FOR EACH ROW EXECUTE FUNCTION db09_reject_recruiter_profile_company_reassign();

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
CREATE TRIGGER db09_granted_relationship_company_guard
  BEFORE UPDATE OF company_id ON placement_company_relationships
  FOR EACH ROW EXECUTE FUNCTION db09_reject_granted_relationship_company_reassign();

-- Integrator acceptance:
-- 1) A company-A recruiter + company-B relationship must fail with 23514
--    even if all individual FKs resolve and both statuses are ACTIVE.
-- 2) Valid same-company grants succeed. UPDATE grant to another company
--    fails. Neither parent can be reassigned after grant insertion.
-- 3) A relationship or recruiter with no grants may still be updated.
-- 4) Concurrent parent reassignment/grant insert cannot commit a mismatch.
-- 5) Revoke/regrant and existing historical audit semantics are preserved.
-- 6) Check role, status, college and relationship scoping independently;
--    this guard handles company identity only.
-- 7) Integrator must avoid repeating this guard if a stronger declarative
--    composite company-key FK is introduced instead. Duplicate triggers
--    increase lock/deadlock complexity and are not a performance-free choice.
-- This candidate does NOT claim PostgreSQL execution or deployment.
