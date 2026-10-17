-- REC-home-drives-51 proposal ONLY. Do not register without TPO review.
-- New recruiter-proposed selection lists require TPO approval, not direct offers.
-- All identifiers and applicant rows must be verified against persisted employer
-- grant, candidate sharing, college, job, and current application state in TX.
-- Create composite parent identities for tenant-safe FKs in the real migration.
CREATE TABLE placement_recruiter_selection_lists (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 job_id uuid NOT NULL REFERENCES placement_jobs(id) ON DELETE RESTRICT,
 recruiter_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 submission_id uuid NOT NULL,
 kind varchar(24) NOT NULL CHECK (kind IN ('OFFER','LETTER_OF_INTENT')),
 ctc_lpa numeric(8,2) CHECK (ctc_lpa IS NULL OR ctc_lpa > 0),
 package_description varchar(500),
 status varchar(32) NOT NULL DEFAULT 'SENT_FOR_VERIFICATION'
   CHECK(status IN ('SENT_FOR_VERIFICATION','SENT_BACK','VERIFIED','DECLINED','WITHDRAWN')),
 decision_note varchar(500),
 decided_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
 decided_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (recruiter_user_id,college_id,submission_id),
 UNIQUE (id,job_id),
 CONSTRAINT selection_lists_job_tenant_fk
 FOREIGN KEY (job_id,college_id) REFERENCES placement_jobs(id,college_id)
);
CREATE INDEX placement_recruiter_selection_tpo_queue_idx
 ON placement_recruiter_selection_lists(college_id,status,created_at DESC);
CREATE TABLE placement_recruiter_selection_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 selection_list_id uuid NOT NULL,
 application_id uuid NOT NULL REFERENCES placement_applications(id) ON DELETE RESTRICT,
 job_id uuid NOT NULL,
 status varchar(24) NOT NULL DEFAULT 'PROPOSED'
   CHECK(status='PROPOSED'),
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 UNIQUE(selection_list_id,application_id),
 CONSTRAINT selection_items_parent_fk FOREIGN KEY(selection_list_id,job_id)
 REFERENCES placement_recruiter_selection_lists(id,job_id),
 CONSTRAINT selection_items_application_fk FOREIGN KEY(application_id,job_id)
 REFERENCES placement_applications(id,job_id)
);
-- Registration prerequisite: UNIQUE INDEX on placement_applications(id,job_id)
-- must exist before the composite selection_items_application_fk is created.
-- Runtime must additionally enforce employer shared-applicant disclosure and
-- require TPO verification before any placement_offer is issued.
