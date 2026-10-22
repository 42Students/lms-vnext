-- [chat-14] Guard the DB05 lesson-comment parent chain against cycles.
-- Migration 0200 must be registered and replayed first. Runtime activation
-- remains fail-closed until lane 15 migration and negative/race verification.
-- Parent/content equality and membership scope are already enforced in 0200.
CREATE OR REPLACE FUNCTION db05_lesson_discussion_parent_acyclic()
RETURNS trigger LANGUAGE plpgsql AS $db05_parent_acyclic$
DECLARE
  circular boolean;
BEGIN
  IF NEW.parent_discussion_id IS NULL THEN
    RETURN NEW;
  END IF;
  -- Serialize any parent reparenting for this lesson content to avoid two
  -- concurrent valid-looking writes jointly constructing a cycle.
  PERFORM 1 FROM lesson_contents
   WHERE id = NEW.lesson_content_id FOR UPDATE;
  WITH RECURSIVE ancestry(id, parent_id, visited) AS (
    SELECT d.id, d.parent_discussion_id, ARRAY[d.id]::uuid[]
      FROM lesson_content_discussions d
     WHERE d.id = NEW.parent_discussion_id
       AND d.lesson_content_id = NEW.lesson_content_id
    UNION ALL
    SELECT parent.id, parent.parent_discussion_id,
           ancestry.visited || parent.id
      FROM lesson_content_discussions parent
      JOIN ancestry ON parent.id = ancestry.parent_id
     WHERE parent.lesson_content_id = NEW.lesson_content_id
       AND NOT parent.id = ANY(ancestry.visited)
  )
  SELECT EXISTS (
    SELECT 1 FROM ancestry
     WHERE id = NEW.id
        OR parent_id = NEW.id
        OR parent_id = ANY(visited)
  ) INTO circular;
  IF circular THEN
    RAISE EXCEPTION 'lesson discussion ancestry must be acyclic'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$db05_parent_acyclic$;
--> statement-breakpoint
CREATE TRIGGER db05_lesson_discussion_parent_acyclic_before_write
BEFORE INSERT OR UPDATE OF parent_discussion_id ON lesson_content_discussions
FOR EACH ROW EXECUTE FUNCTION db05_lesson_discussion_parent_acyclic();
