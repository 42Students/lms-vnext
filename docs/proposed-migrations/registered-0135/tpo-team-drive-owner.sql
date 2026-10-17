-- TPO-inbox-team-33: explicit, college-scoped placement drive owner.
-- Proposed only. Orchestrator must register a numbered migration and deploy it.
ALTER TABLE placement_jobs
 ADD COLUMN IF NOT EXISTS owner_membership_id uuid
 REFERENCES college_memberships(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS placement_jobs_owner_college_idx
 ON placement_jobs (college_id, owner_membership_id, status);

-- A membership from another college must never become this drive's owner.
ALTER TABLE placement_jobs
 ADD CONSTRAINT placement_jobs_owner_college_fk
 FOREIGN KEY (owner_membership_id,college_id)
 REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT;
