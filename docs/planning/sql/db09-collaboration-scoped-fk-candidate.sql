-- DB-012 Chat 3 / 2026-10-11. CANDIDATE SQL ONLY; NOT REGISTERED OR EXECUTED.
-- Chat 1 remains sole migration/journal/CI writer. Coordinate with DB-014
-- FK audit, and deduplicate parent unique keys from db09-crm-scoped-fk-candidate.sql.
-- Do NOT promote DB09 runtime parity merely because this SQL exists.

-- Main omission in staged DB09 tables: unrelated UUID FKs do not assert
-- the source job, department, learner, or applicant belongs to the child
-- college/job. Parent composite UNIQUE keys are centralized in:
--   docs/planning/sql/db09-parent-composite-keys-candidate.sql
-- Child FKs below use the canonical ID-first parent order.

ALTER TABLE placement_tpo_message_threads
  ADD CONSTRAINT db09_thread_job_scope_fk
  FOREIGN KEY(job_id, college_id) REFERENCES placement_jobs(id, college_id)
  ON UPDATE RESTRICT ON DELETE RESTRICT;
-- This permits NULL job_id General threads, as intended by V165.

ALTER TABLE placement_tpo_share_links
  ADD CONSTRAINT db09_share_job_scope_fk
  FOREIGN KEY(job_id, college_id) REFERENCES placement_jobs(id, college_id)
  ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE placement_tpo_student_notes
  ADD CONSTRAINT db09_note_member_scope_fk
  FOREIGN KEY(learner_membership_id, college_id)
  REFERENCES college_memberships(id, college_id)
  ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE placement_tpo_team_members
  ADD CONSTRAINT db09_team_member_scope_fk
    FOREIGN KEY(membership_id, college_id)
    REFERENCES college_memberships(id, college_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT db09_team_department_scope_fk
    FOREIGN KEY(department_id, college_id)
    REFERENCES departments(id, college_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT;
-- Nullable department only for TPO_ADMIN; existing check covers role shape.

ALTER TABLE placement_recruiter_applicant_notes
  ADD CONSTRAINT db09_recruiter_note_job_scope_fk
    FOREIGN KEY(job_id, college_id) REFERENCES placement_jobs(id, college_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT db09_recruiter_note_application_job_fk
    FOREIGN KEY(application_id, job_id)
    REFERENCES placement_applications(id, job_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT;

-- Drive coordinator tenant/job/member FKs are owned by the canonical
-- db09-round-scheduling-candidate.sql table definition; do not add a second
-- ALTER path here.

-- Required PostgreSQL negative witnesses:
--  1. Tenant A message thread with tenant B job => rejected.
--  2. Tenant A share token with tenant B job => rejected.
--  3. Tenant A student note with tenant B membership => rejected.
--  4. Tenant A team member with tenant B membership/department => rejected.
--  5. Tenant A recruiter applicant note with wrong job/college or
--     application from another job => rejected.
--  6. Same-tenant valid cases, including null General thread job, succeed.
--  7. Deletes/owner changes and concurrent writes cannot break relationships.
--  8. Actor status, recruiter grants, share disclosure scopes, membership
--     roles, read visibility, and token TTL remain APP-level/witness concerns
--     not solved by these structural foreign keys.
--  9. Verify exact generated SQL/replay on disposable PostgreSQL, with
--     existing data checked for inconsistencies before any ALTER.
-- 10. Coordinator tenant negatives execute through the canonical scheduling
--     candidate, not this collaboration ALTER file.
