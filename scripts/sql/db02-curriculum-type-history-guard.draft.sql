-- DB02 / Chat 4 / DB-005, UNREGISTERED additive SQL.
-- Apply AFTER scripts/sql/db02-academic-progression-and-rooms-staging.sql in a
-- disposable PostgreSQL environment only. Chat 1 owns registered migrations.
--
-- Historic materialization invariant:
-- A CORE offering references program_term_courses.id and the canonical offering
-- guard checks its curriculum row has type='CORE' only on the offering's write.
-- The curriculum row itself can subsequently be UPDATEd to ELECTIVE, silently
-- breaking the historic CORE relationship. A FK alone cannot protect non-key
-- edits to program_term_courses.type. Prevent this inversion while allowing
-- legacy-supported credits / display_order edits and edits to unused rows.
--
-- Concurrency: the canonical offering guard already SELECTs the referenced
-- program_term_courses row FOR SHARE. This conflicts with UPDATE OF type's
-- non-key update row lock; if a concurrent insert wins, the type UPDATE
-- must see the committed offering; if the type UPDATE wins, the offering's
-- canonical guard must reject the now non-CORE curriculum row.

CREATE FUNCTION db02_guard_program_term_course_type_history()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.type IS DISTINCT FROM OLD.type
     AND EXISTS (
       SELECT 1
         FROM course_offerings co
        WHERE co.program_term_course_id = OLD.id
          AND co.type = 'CORE'
     ) THEN
    RAISE EXCEPTION 'Mapped curriculum cannot change type after CORE offering materialization'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_program_term_course_type_history_guard
BEFORE UPDATE OF type ON program_term_courses
FOR EACH ROW EXECUTE FUNCTION db02_guard_program_term_course_type_history();

-- Acceptance / invariants:
-- (1) Changing type on an UNUSED curriculum row succeeds.
-- (2) A mapped CORE offering may still use 0 credits, and curriculum credits
--     / display_order remain editable (legacy CRUD contract).
-- (3) Changing CORE -> ELECTIVE after materialization fails.
-- (4) Both transaction orders in offering-create vs curriculum-type-update
--     races must result in one valid winner, no CORE offering linked to
--     an ELECTIVE typed curriculum row. Verify with disposable PostgreSQL.
-- (5) A cancelled/deactivated but historical CORE offering still protects
--     curriculum type (history is never silently rewritten).
-- Authored source alone does not prove executable safety; DB-005 IN_PROGRESS.
