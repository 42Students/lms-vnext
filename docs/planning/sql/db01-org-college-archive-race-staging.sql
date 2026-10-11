-- DB-004 / Chat 2: cross-row organization/college archive race guard.
-- STAGED ONLY: NOT A REGISTERED MIGRATION; DO NOT APPLY DIRECTLY.
-- Chat 1 exclusively authors numbered migrations and generated Drizzle
-- snapshots. PostgreSQL execution is pending; this is a design candidate.
--
-- Current vNext source:
--   src/modules/organizations/service.ts:archiveOrganization:
--     checks ACTIVE colleges, then independently updates organizations.status.
--   src/modules/colleges/service.ts:createCollege:
--     checks organization ACTIVE, then independently inserts colleges.
-- Concurrent execution under READ COMMITTED can end with an ACTIVE college
-- beneath an ARCHIVED organization unless parent/child state is serialized.

CREATE OR REPLACE FUNCTION db01_college_parent_active_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  parent_status organization_status;
BEGIN
  IF NEW.status <> 'ACTIVE' THEN
    RETURN NEW;
  END IF;

  -- FOR UPDATE serializes this child activation/creation with the parent
  -- organization's status UPDATE. A normal FK alone only checks existence,
  -- not that the parent is ACTIVE.
  SELECT o.status INTO parent_status
    FROM organizations AS o
   WHERE o.id = NEW.organization_id
     FOR UPDATE;

  IF parent_status IS DISTINCT FROM 'ACTIVE' THEN
    RAISE EXCEPTION 'Active college requires an active organization'
      USING ERRCODE = '23514',
            CONSTRAINT = 'db01_colleges_active_parent_ck';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db01_college_parent_active_trg
BEFORE INSERT OR UPDATE OF organization_id, status ON colleges
FOR EACH ROW
EXECUTE FUNCTION db01_college_parent_active_guard();

CREATE OR REPLACE FUNCTION db01_organization_archive_children_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'ARCHIVED'
     AND OLD.status IS DISTINCT FROM NEW.status
     AND EXISTS (
       SELECT 1 FROM colleges AS c
       WHERE c.organization_id = OLD.id AND c.status = 'ACTIVE'
     ) THEN
    RAISE EXCEPTION 'Organization with active colleges cannot be archived'
      USING ERRCODE = '23514',
            CONSTRAINT = 'db01_organizations_active_children_ck';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db01_organization_archive_children_trg
BEFORE UPDATE OF status ON organizations
FOR EACH ROW
EXECUTE FUNCTION db01_organization_archive_children_guard();

-- DDL-order and race proof required before registration:
--   1. Reject if SELECT joins already show ACTIVE children under ARCHIVED org.
--   2. Child insert/activation and parent archive must use these guards
--      within the SAME PostgreSQL transaction as their own DML.
--   3. Two-session READ COMMITTED schedule:
--        Session A: SELECT org active -> pause before INSERT college.
--        Session B: check active children -> archive org -> COMMIT.
--        Session A: INSERT must now fail with SQLSTATE 23514.
--      Reverse lock acquisition schedule: child commits first, then parent
--      archive fails with 23514. Both outcomes preserve parent-child state.
--   4. No ACTIVE college may switch to an archived org through UPDATE.
--   5. Archived colleges may remain as historical child rows.
--   6. Verify downstream college archive usage checks cannot be bypassed by
--      another simultaneous writer (memberships/departments/projects/etc).
--      This narrowly covers organization/college, not all tenant descendants.
--   7. Confirm PostgreSQL lock order / deadlock retry behavior with concurrent
--      parent status updates, child org moves and child status updates.
--   8. Never use an unbounded business "fixup" UPDATE during migration.
--   9. Real two-connection disposable PostgreSQL tests and current snapshot
--      replay are MANDATORY before declaring this guard accepted.
