-- Chat 3 / DB-012: final-legacy V193 actor and scope codes.
-- CANDIDATE ONLY: DO NOT REGISTER/APPLY THIS IN ISOLATION.
-- Source legacy V193__recruiter_naming.sql replaced HR with RECRUITER and
-- LEADS with RECRUITER_LEADS, including existing row rewrites.
-- Current vNext tpo-collaboration.ts still declares sender='TPO'|'HR' and
-- view scope='STUDENTS'|'LEADS'|'DRIVES'. The vNext messaging service also
-- currently emits 'HR' and must change atomically with schema activation.
-- No production source values should be silently dropped or coerced.

-- Before applying, update/drain any source rows with the vNext old labels,
-- confirm API producer and consumer uses, then change constraints:
ALTER TABLE placement_tpo_messages
  DROP CONSTRAINT placement_tpo_messages_sender_ck;
ALTER TABLE placement_tpo_messages
  ADD CONSTRAINT placement_tpo_messages_sender_ck
  CHECK (sender_type IN ('TPO','RECRUITER'));

ALTER TABLE placement_tpo_saved_views
  DROP CONSTRAINT placement_tpo_saved_views_scope_ck;
ALTER TABLE placement_tpo_saved_views
  ADD CONSTRAINT placement_tpo_saved_views_scope_ck
  CHECK (scope IN ('STUDENTS','RECRUITER_LEADS','DRIVES'));

-- Required DBA/API acceptance evidence:
-- 1. Existing rows in disposable vNext PG written as HR/LEADS must be
--    migrated transactionally to RECRUITER/RECRUITER_LEADS before CHECK.
-- 2. Recruiter messages are attributed to the actual authenticated
--    platform user, scoped to active recruiter grants for same college.
-- 3. UI/API producers AND readers switch to canonical codes together.
-- 4. V193 also renames TPO bell reader kind and outbox recipient to
--    RECRUITER: DB10/read-state dependencies must be coordinated.
-- 5. Reject invalid source codes; verify reply visibility and saved-view
--    filters survive back-and-forth and cannot leak another college.
-- 6. This draft assumes named constraints from staged Drizzle; compare
--    to generated SQL names on final main before integration.
