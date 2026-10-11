-- DB-004 / Chat 2. STAGING ONLY, not a Drizzle migration.
-- Targets two DB01 college usage families: memberships and tenant hostnames.
-- Does NOT replace cross-domain DB02/DB03/DB05/DB08/DB09 archive coordination.
-- Chat 1 exclusively registers migrations. Requires disposable PostgreSQL proof.
--
-- Source:
--   src/modules/colleges/service.ts:resolveCollegeUsage/archiveCollege
--   src/modules/people/repository.ts:persistPersonMembership
--   src/modules/tenant-domains/repository.ts:createDomain
--
-- A college archive uses a separate preflight COUNT and UPDATE. A concurrent
-- ACTIVE/SUSPENDED membership INSERT or tenant domain INSERT can otherwise
-- follow an earlier ACTIVE-college read and race the status UPDATE.
-- Locks must be acquired in the CHILD writer's own SQL transaction.
-- FK KEY SHARE lock on college ID is NOT sufficient: non-key status updates
-- generally acquire weaker row locks compatible with FK existence checks.

CREATE OR REPLACE FUNCTION db01_membership_active_college_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  parent_status college_status;
BEGIN
  -- ENDED memberships are retained as historical references; they cannot
  -- authenticate. New or moved ACTIVE/SUSPENDED memberships require an
  -- ACTIVE college in their write transaction, not a prior service read.
  IF NEW.status = 'ENDED' THEN
    RETURN NEW;
  END IF;

  SELECT c.status INTO parent_status
    FROM colleges AS c
   WHERE c.id = NEW.college_id
     FOR UPDATE;

  IF parent_status IS DISTINCT FROM 'ACTIVE' THEN
    RAISE EXCEPTION 'Non-ended college membership requires active college'
      USING ERRCODE = '23514',
            CONSTRAINT = 'db01_memberships_active_college_ck';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER db01_membership_active_college_trg
BEFORE INSERT OR UPDATE OF college_id, status ON college_memberships
FOR EACH ROW
EXECUTE FUNCTION db01_membership_active_college_guard();

CREATE OR REPLACE FUNCTION db01_domain_active_college_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  parent_status college_status;
BEGIN
  SELECT c.status INTO parent_status
    FROM colleges AS c
   WHERE c.id = NEW.college_id
     FOR UPDATE;

  IF parent_status IS DISTINCT FROM 'ACTIVE' THEN
    RAISE EXCEPTION 'Tenant domain requires active college'
      USING ERRCODE = '23514',
            CONSTRAINT = 'db01_tenant_domain_active_college_ck';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER db01_domain_active_college_trg
BEFORE INSERT OR UPDATE OF college_id ON tenant_domains
FOR EACH ROW
EXECUTE FUNCTION db01_domain_active_college_guard();

CREATE OR REPLACE FUNCTION db01_college_archive_db01_children_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'ARCHIVED'
     AND OLD.status IS DISTINCT FROM NEW.status
     AND (
       EXISTS (
         SELECT 1 FROM college_memberships AS m
          WHERE m.college_id = OLD.id
            AND m.status <> 'ENDED'
       )
       OR EXISTS (
         SELECT 1 FROM tenant_domains AS d
          WHERE d.college_id = OLD.id
       )
     ) THEN
    RAISE EXCEPTION 'College still has DB01 active membership or tenant domain'
      USING ERRCODE = '23514',
            CONSTRAINT = 'db01_college_archive_db01_children_ck';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER db01_college_archive_db01_children_trg
BEFORE UPDATE OF status ON colleges
FOR EACH ROW
EXECUTE FUNCTION db01_college_archive_db01_children_guard();

-- PROMOTION CHECKLIST:
-- 1. Check existing invalid rows with membership/domain to archived college.
-- 2. Confirm all other resolveCollegeUsage child families guard their own
--    create/activate/reparent mutations (DB02/DB03/DB05/DB08/DB09 owners).
-- 3. Tenant-domain tombstone proposal is not registered; current archive
--    policy counts EVERY persisted domain, including future tombstones.
--    Do not silently relax archive to ignore deleted_at.
-- 4. Under two real PostgreSQL sessions, child-wins and archive-wins races
--    must result in one rejected write with SQLSTATE 23514.
-- 5. Test ENDED history preserved, SUSPENDED still blocks archive, moved
--    membership/domain into archived college rejected.
-- 6. Review parent-first vs child-first lock ordering and SQLSTATE 40P01.
-- 7. Verify direct SQL mutations; service-level checks alone do not prove it.
-- 8. Perform clean/latest migration replay + snapshot drift inspection.
-- 9. STAGED FILE MUST NEVER be used against real/prod databases directly.
