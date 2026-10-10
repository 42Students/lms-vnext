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

COMMIT;

-- Required before acceptance:
--  1. Existing safe visible messages backfill original snapshot where known
--     (never trust a client-supplied sender name).
--  2. New messages stamp trusted server-derived display name; later user
--     rename does not silently rewrite message history.
--  3. Deletion changes deleted_at and filters all listings/pin banners;
--     moderator/own-author permission checks still apply.
--  4. Delivery FK currently ON DELETE CASCADE, potentially destroying
--     classroom history; reconcile with retention policy/soft delete.
--  5. Wrong tenant/unauthorized moderation must be denied; verify
--     class/teaching scope and retention across enrollment changes.
--  6. Execute negative PostgreSQL, app and UI tests + migration replay.
