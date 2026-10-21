-- [chat-15] Pending recruiter consent, external jobs and protected files.
ALTER TABLE placement_recruiter_college_grants ADD COLUMN pending_recruiter_lead_id uuid;
--> statement-breakpoint
ALTER TABLE placement_recruiter_college_grants ADD CONSTRAINT pending_recruiter_lead_fk
 FOREIGN KEY (pending_recruiter_lead_id) REFERENCES placement_tpo_leads(id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE placement_recruiter_college_grants DROP CONSTRAINT placement_recruiter_college_grants_status_ck;
--> statement-breakpoint
ALTER TABLE placement_recruiter_college_grants ADD CONSTRAINT placement_recruiter_college_grants_status_ck CHECK(status IN ('ACTIVE','REVOKED','PENDING_RECRUITER'));
--> statement-breakpoint
ALTER TABLE placement_recruiter_college_grants DROP CONSTRAINT placement_recruiter_college_grants_lifecycle_ck;
--> statement-breakpoint
ALTER TABLE placement_recruiter_college_grants ADD CONSTRAINT placement_recruiter_college_grants_lifecycle_ck CHECK(
 (status IN ('ACTIVE','PENDING_RECRUITER') AND revoked_by_user_id IS NULL AND revoked_at IS NULL)
 OR (status='REVOKED' AND revoked_by_user_id IS NOT NULL AND revoked_at IS NOT NULL));
--> statement-breakpoint
DROP INDEX placement_recruiter_college_grants_active_uq;
--> statement-breakpoint
CREATE UNIQUE INDEX placement_recruiter_college_grants_active_uq
 ON placement_recruiter_college_grants(recruiter_user_id,company_relationship_id)
 WHERE status IN ('ACTIVE','PENDING_RECRUITER');
--> statement-breakpoint
CREATE INDEX placement_recruiter_grants_pending_recruiter_idx
 ON placement_recruiter_college_grants(recruiter_user_id,status)
 WHERE status='PENDING_RECRUITER';
--> statement-breakpoint
ALTER TABLE placement_jobs ADD COLUMN public_external_slug varchar(20);
--> statement-breakpoint
CREATE UNIQUE INDEX placement_jobs_public_external_slug_uq
 ON placement_jobs(public_external_slug) WHERE public_external_slug IS NOT NULL;
--> statement-breakpoint
ALTER TABLE placement_jobs ADD CONSTRAINT placement_jobs_public_external_slug_ck CHECK(
 public_external_slug IS NULL OR
 (public_external_slug ~ '^smr-[0-9a-f]{16}$' AND application_mode IN ('HYBRID','EXTERNAL_ONLY')));
--> statement-breakpoint
ALTER TABLE placement_application_private_artifacts ADD COLUMN assessment_object_path text;
--> statement-breakpoint
ALTER TABLE placement_application_private_artifacts ADD CONSTRAINT placement_application_private_assessment_key_ck CHECK(
 assessment_object_path IS NULL OR
 (length(assessment_object_path) BETWEEN 5 AND 700 AND assessment_object_path !~ '(^/|[.][.]|[[:cntrl:]])'));
--> statement-breakpoint
ALTER TABLE placement_application_private_artifacts ADD CONSTRAINT placement_application_private_resume_key_ck CHECK(
 resume_object_path IS NULL OR
 (length(resume_object_path) BETWEEN 5 AND 700 AND resume_object_path !~ '(^/|[.][.]|[[:cntrl:]])'));
--> statement-breakpoint
ALTER TABLE placement_offers ADD COLUMN offer_letter_object_path text;
--> statement-breakpoint
ALTER TABLE placement_offers ADD CONSTRAINT placement_offer_letter_key_ck CHECK(
 offer_letter_object_path IS NULL OR
 (length(offer_letter_object_path) BETWEEN 5 AND 700 AND offer_letter_object_path !~ '(^/|[.][.]|[[:cntrl:]])'));
--> statement-breakpoint
CREATE TABLE placement_public_external_job_links(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 job_id uuid NOT NULL,
 college_id uuid NOT NULL,
 slug varchar(20) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 revoked_at timestamptz,
 views_count integer NOT NULL DEFAULT 0,
 CONSTRAINT public_external_job_scoped_fk FOREIGN KEY(job_id,college_id)
 REFERENCES placement_jobs(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT public_external_job_slug_ck CHECK(slug ~ '^smr-[0-9a-f]{16}$'),
 CONSTRAINT public_external_job_views_ck CHECK(views_count >= 0));
--> statement-breakpoint
CREATE UNIQUE INDEX public_external_job_slug_uq ON placement_public_external_job_links(slug);
--> statement-breakpoint
CREATE INDEX public_external_job_college_idx ON placement_public_external_job_links(college_id,job_id);
