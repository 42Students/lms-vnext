-- DB-012 Chat 3 / 2026-10-11. CANDIDATE SQL ONLY; NOT REGISTERED OR EXECUTED.
-- Chat 1 remains sole migration/journal/CI writer. Coordinate with DB-014
-- FK audit, and deduplicate parent unique keys from db09-crm-scoped-fk-candidate.sql.
-- Do NOT promote DB09 runtime parity merely because this SQL exists.

-- Main omission in staged DB09 tables: unrelated UUID FKs do not assert
-- the source job, department, learner, or applicant belongs to child college.
-- Composite parent keys below permit SQL same-college FKs.
ALTER TABLE placement_jobs
  ADD CONSTRAINT db09_jobs_college_id_uq UNIQUE(college_id, id);

ALTER TABLE departments
  ADD CONSTRAINT db09_departments_college_id_uq UNIQUE(college_id, id);

ALTER TABLE placement_applications
  ADD CONSTRAINT db09_applications_job_id_uq UNIQUE(job_id, id);

-- From the CRM candidate (apply once, not twice):
-- ALTER TABLE college_memberships ADD CONSTRAINT
--   db09_college_memberships_scope_uq UNIQUE(college_id, id);

ALTER TABLE placement_tpo_message_threads
  ADD CONSTRAINT db09_thread_job_scope_fk
  FOREIGN KEY(college_id, job_id) REFERENCES placement_jobs(college_id, id)
  ON UPDATE RESTRICT ON DELETE RESTRICT;
-- This permits NULL job_id General threads, as intended by V165.

ALTER TABLE placement_tpo_share_links
  ADD CONSTRAINT db09_share_job_scope_fk
  FOREIGN KEY(college_id, job_id) REFERENCES placement_jobs(college_id, id)
  ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE placement_tpo_student_notes
  ADD CONSTRAINT db09_note_member_scope_fk
  FOREIGN KEY(college_id, learner_membership_id)
  REFERENCES college_memberships(college_id, id)
  ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE placement_tpo_team_members
  ADD CONSTRAINT db09_team_member_scope_fk
    FOREIGN KEY(college_id, membership_id)
    REFERENCES college_memberships(college_id, id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT db09_team_department_scope_fk
    FOREIGN KEY(college_id, department_id)
    REFERENCES departments(college_id, id)
    ON UPDATE RESTRICT ON DELETE RESTRICT;
-- Nullable department only for TPO_ADMIN; existing check covers role shape.

ALTER TABLE placement_recruiter_applicant_notes
  ADD CONSTRAINT db09_recruiter_note_job_scope_fk
    FOREIGN KEY(college_id, job_id) REFERENCES placement_jobs(college_id, id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT db09_recruiter_note_application_job_fk
    FOREIGN KEY(job_id, application_id)
    REFERENCES placement_applications(job_id, id)
    ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE placement_drive_day_coordinator_assignments
  ADD CONSTRAINT db09_coordinator_job_scope_fk
    FOREIGN KEY(college_id, job_id) REFERENCES placement_jobs(college_id, id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT db09_coordinator_learner_scope_fk
    FOREIGN KEY(college_id, learner_membership_id)
    REFERENCES college_memberships(college_id, id)
    ON UPDATE RESTRICT ON DELETE RESTRICT;

-- Required PostgreSQL negative witnesses:
--  1. Tenant A message thread with tenant B job => rejected.
--  2. Tenant A share token with tenant B job => rejected.
--  3. Tenant A student note with tenant B membership => rejected.
--  4. Tenant A team member with tenant B membership/department => rejected.
--  5. Tenant A recruiter applicant note with wrong job/college or
--     application from another job => rejected.
--  6. Tenant A drive-day assignment with foreign job/student => rejected.
--  7. Same-tenant valid cases, including null General thread job, succeed.
--  8. Deletes/owner changes and concurrent writes cannot break relationships.
--  9. Actor status, recruiter grants, share disclosure scopes, membership
--     roles, read visibility, and token TTL remain APP-level/witness concerns
--     not solved by these structural foreign keys.
-- 10. Verify exact generated SQL/replay on disposable PostgreSQL, with
--     existing data checked for inconsistencies before any ALTER.
