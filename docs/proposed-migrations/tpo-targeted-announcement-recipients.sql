-- TPO-inbox-team-43 STAGED ONLY; orchestrator registration required.
-- Do NOT infer membership from a mutable batch/drive when a notice is read:
-- recipients must be frozen at publishing and scoped to one college.
CREATE TABLE placement_tpo_notice_audiences (
 announcement_id uuid PRIMARY KEY REFERENCES announcements(id) ON DELETE RESTRICT,
 kind varchar(24) NOT NULL CHECK (kind IN
  ('COLLEGE','PLACEMENTS','BATCHES','BRANCHES','DRIVE'))
);
CREATE TABLE placement_tpo_notice_recipients (
 announcement_id uuid NOT NULL REFERENCES announcements(id) ON DELETE RESTRICT,
 membership_id uuid NOT NULL REFERENCES college_memberships(id) ON DELETE RESTRICT,
 PRIMARY KEY (announcement_id,membership_id)
);
-- Registration must add a trigger that rejects any recipient whose membership
-- college differs from the announcement college. Read path must JOIN this table
-- for targeted notices. No college-wide fallback is permitted.
-- The publisher must insert audience and recipients in one transaction.
