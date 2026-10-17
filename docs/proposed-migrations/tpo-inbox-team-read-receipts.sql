-- TPO-inbox-team-R05: per-member conversation read position.
-- Register by orchestrator only; no numbered drizzle files in builder lane.
CREATE TABLE IF NOT EXISTS placement_tpo_internal_reads (
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 thread_id uuid NOT NULL,
 membership_id uuid NOT NULL,
 read_through timestamptz NOT NULL,
 following boolean NOT NULL DEFAULT true,
 muted_at timestamptz,
 CONSTRAINT tpo_internal_reads_pk PRIMARY KEY(thread_id,membership_id),
 CONSTRAINT tpo_internal_reads_thread_college_fk
  FOREIGN KEY(thread_id,college_id)
  REFERENCES placement_tpo_internal_threads(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT tpo_internal_reads_member_college_fk
  FOREIGN KEY(membership_id,college_id)
  REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS tpo_internal_reads_member_idx
 ON placement_tpo_internal_reads(college_id,membership_id);
