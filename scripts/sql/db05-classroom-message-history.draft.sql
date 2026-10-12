-- DB-008 SOURCE-BACKED DRAFT -- NOT REGISTERED, NOT SAFE TO ACTIVATE.
-- Legacy: ClassroomMessage.java, ClassroomServiceImpl.java, ClassroomMessageRepository.java
-- @ 21bad59d4dfaf2fa11fdeaf9353327ce105697d5.
-- Legacy message delete SETS is_deleted=true and repo only reads undeleted,
-- preserving moderated message record and author's original sender_name.
-- vNext discussions.ts course_discussion_messages has no deleted flag/name
-- snapshot; discussion-service.ts joins current users.display_name on read
-- and does a hard DELETE. This is a material data/history semantic gap.
-- This table is CLASSROOM chat, not per-lesson-content discussion!
--
-- W01 owns schema barrel / migration; W06 does not touch it. Caller service
-- MUST change to soft delete and verified author display snapshot before
-- registering this proposal; merely adding columns has no effect.
BEGIN;

ALTER TABLE course_discussion_messages
  ADD COLUMN IF NOT EXISTS sender_name_snapshot text,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS db05_classroom_messages_active_timeline_idx
  ON course_discussion_messages (delivery_id, created_at, id)
  WHERE deleted_at IS NULL;

-- Retain the audit record even when an application or maintenance SQL path
-- attempts a hard DELETE. Legacy ClassroomServiceImpl sets is_deleted=true,
-- never deletes the message row. Soft deletion must update deleted_at.
-- Must NOT be registered until discussion-service.ts switches off hard DELETE;
-- otherwise the current DELETE endpoint would fail with SQLSTATE 23514.
CREATE OR REPLACE FUNCTION db05_classroom_message_hard_delete_fence()
RETURNS trigger LANGUAGE plpgsql
AS $db05_classroom_delete_fence$
BEGIN
  RAISE EXCEPTION 'classroom history must use soft deletion'
    USING ERRCODE = '23514';
END;
$db05_classroom_delete_fence$;

CREATE TRIGGER db05_classroom_message_prevent_hard_delete
BEFORE DELETE ON course_discussion_messages
FOR EACH ROW EXECUTE FUNCTION db05_classroom_message_hard_delete_fence();

COMMIT;

-- Required before acceptance:
--  1. Existing safe visible messages backfill original snapshot where known
--     (never trust a client-supplied sender name).
--  2. New messages stamp trusted server-derived display name; later user
--     rename does not silently rewrite message history.
--  3. Deletion changes deleted_at and filters all listings/pin banners;
--     moderator/own-author permission checks still apply.
--  4. Delivery FK currently ON DELETE CASCADE. A delivery DELETE now fails
--     if the history fence is active and any classroom messages remain;
--     validate FK cascade trigger ordering under disposable PostgreSQL.
--     A privileged retention/purge workflow is NOT designed here; no data
--     can be silently purged merely because the delivery was deleted.
--  5. Wrong tenant/unauthorized moderation must be denied; verify
--     class/teaching scope and retention across enrollment changes.
--  6. Execute negative PostgreSQL, app and UI tests + migration replay.
