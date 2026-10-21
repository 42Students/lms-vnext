-- Lane 15: ensure private saved jobs cannot link a member from one college to a job at another.
-- Before applying in an occupied database, inspect mismatched saved jobs and quarantine them; never reassign a student's saved job automatically.
DO $saved_job_scope$
BEGIN
 IF EXISTS (
   SELECT 1 FROM placement_saved_jobs sj
   LEFT JOIN college_memberships m ON m.id = sj.membership_id
   LEFT JOIN placement_jobs j ON j.id = sj.job_id
   WHERE m.id IS NULL OR j.id IS NULL OR m.college_id IS DISTINCT FROM sj.college_id OR j.college_id IS DISTINCT FROM sj.college_id
 ) THEN RAISE EXCEPTION 'Saved-job college mismatch: manual reconciliation required' USING ERRCODE='23514';
 END IF;
END;
$saved_job_scope$;
--> statement-breakpoint
ALTER TABLE placement_saved_jobs ADD CONSTRAINT placement_saved_jobs_member_college_fk
 FOREIGN KEY (membership_id,college_id) REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE placement_saved_jobs ADD CONSTRAINT placement_saved_jobs_job_college_fk
 FOREIGN KEY (job_id,college_id) REFERENCES placement_jobs(id,college_id) ON DELETE RESTRICT;
