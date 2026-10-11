-- Chat 6 / DB-008 / 2026-10-12. UNREGISTERED SOURCE-ONLY COMPANION.
-- W01 ONLY may merge/register into a numbered Drizzle migration and the
-- shared schema barrel. Never run this against a live database as-is.
--
-- Needs the base lesson_content_discussions table (incl same-content composite
-- parent FK), the stronger tenant guard and the DB05 lesson content delivery
-- scope guard. This protects two distinct database invariants:
--
-- 1) A historical parent_discussion_id cannot make a 2+ hop cycle on UPDATE.
--    The existing parent_not_self CHECK only rejects the one-node cycle.
-- 2) Reparenting lesson_contents.lesson_id/delivery_id cannot silently move
--    discussion history to a different course, offering, audience or section.
--    Deleted discussion rows are retained as history and block the move too.
--
-- Source note: parent/reply fields exist in historical DDL but the current
-- legacy DiscussionController does not prove that nested replies are active.
-- These are defensive persistence constraints only, NOT an API feature.
--
-- Both guards share the established DB05 advisory key 605008003 with child
-- lesson-content scope/ancestry guards. Lock BEFORE read to prevent phantoms.
-- READ COMMITTED only pending two-connection PostgreSQL race acceptance.
-- Integration must verify same-lock trigger ordering, deadlocks, rollback,
-- clean replay and naming conflicts with other DB02/DB05 companions.
BEGIN;

CREATE OR REPLACE FUNCTION db05_lesson_discussion_acyclic_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $db05_discussion_acyclic$
DECLARE
  would_cycle boolean := false;
BEGIN
  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'DB05 discussion ancestry mutation requires READ COMMITTED'
      USING ERRCODE = '25001';
  END IF;
  PERFORM pg_advisory_xact_lock(605008003::bigint);

  IF NEW.parent_discussion_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.parent_discussion_id = NEW.id THEN
    RAISE EXCEPTION 'discussion may not be its own ancestor'
      USING ERRCODE = '23514';
  END IF;

  -- UNION (deduplicating rows) visits each (id,parent) once, so even an existing
  -- corrupt cyclic chain terminates rather than looping indefinitely.
  -- Never follow an ancestor belonging to another lesson content.
  WITH RECURSIVE ancestors(id, parent_discussion_id) AS (
    SELECT parent.id, parent.parent_discussion_id
      FROM lesson_content_discussions parent
     WHERE parent.id = NEW.parent_discussion_id
       AND parent.lesson_content_id = NEW.lesson_content_id
    UNION
    SELECT parent.id, parent.parent_discussion_id
      FROM lesson_content_discussions parent
      JOIN ancestors ancestor ON ancestor.parent_discussion_id = parent.id
     WHERE parent.lesson_content_id = NEW.lesson_content_id
  )
  SELECT EXISTS (
    SELECT 1 FROM ancestors WHERE id = NEW.id
  ) INTO would_cycle;

  IF would_cycle THEN
    RAISE EXCEPTION 'lesson discussion parent graph must be acyclic'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$db05_discussion_acyclic$;

-- Deliberately only parent/content-ID changes, not unrelated edits or status.
-- The base composite FK still requires the parent to be the same content.
CREATE TRIGGER db05_lesson_discussion_acyclic_before_parent_write
BEFORE INSERT OR UPDATE OF parent_discussion_id, lesson_content_id
ON lesson_content_discussions
FOR EACH ROW EXECUTE FUNCTION db05_lesson_discussion_acyclic_guard();

CREATE OR REPLACE FUNCTION db05_lesson_content_discussion_reparent_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $db05_discussion_reparent$
BEGIN
  IF NEW.lesson_id IS NOT DISTINCT FROM OLD.lesson_id
     AND NEW.delivery_id IS NOT DISTINCT FROM OLD.delivery_id THEN
    RETURN NEW;
  END IF;

  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'DB05 discussion content reparent requires READ COMMITTED'
      USING ERRCODE = '25001';
  END IF;
  PERFORM pg_advisory_xact_lock(605008003::bigint);

  IF EXISTS (
    SELECT 1 FROM lesson_content_discussions discussion
     WHERE discussion.lesson_content_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'cannot relocate lesson content carrying discussion history'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$db05_discussion_reparent$;

CREATE TRIGGER db05_lesson_content_discussion_reparent_before_update
BEFORE UPDATE OF lesson_id, delivery_id ON lesson_contents
FOR EACH ROW EXECUTE FUNCTION db05_lesson_content_discussion_reparent_guard();

COMMIT;

-- MANDATORY DISPOSABLE POSTGRES NEGATIVES (UNEXECUTED):
-- DG-01 Parent NULL standalone discussion accepted.
-- DG-02 Direct self-reply rejected by existing CHECK and guard.
-- DG-03 2-node parent cycle by UPDATE rejected 23514.
-- DG-04 3-node/long chain cycle by UPDATE rejected 23514.
-- DG-05 Existing acyclic reply tree remains valid after unrelated update.
-- DG-06 Parent in different lesson_content_id rejected by composite FK.
-- DG-07 Missing parent discussion rejected by composite FK.
-- DG-08 Two transactions changing opposite parent pointers: no cycle commits.
-- DG-09 Repeatable Read / Serializable cycle mutation fails 25001.
-- DG-10 Moving content.lesson_id with any discussion blocks 23514.
-- DG-11 Moving content.delivery_id with any discussion blocks 23514.
-- DG-12 Previously soft-deleted discussions still block content reparent.
-- DG-13 Moving content with NO discussion remains allowed if other scopes pass.
-- DG-14 Concurrent discussion INSERT versus content move cannot leave
--       discussion on a reparented content; prove both transaction orderings.
-- DG-15 Attempted move to another college never exposes old discussion data.
-- DG-16 Multi-row parent update fails atomically if any row would cycle.
-- DG-17 Existing seeded discussion graph is acyclic (read-only preflight).
-- DG-18 Observe lock order with content delivery/order guards; no deadlock.
-- DG-19 W01 clean migration replay / rollback / duplicate-name check.
-- DG-20 No nested reply API exposed until active legacy consumer/source proof.
