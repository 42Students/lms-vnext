-- Proposal only. Serialized migration registration required.
-- TPO-companies-15: durable company communication status per college and normalized key.
CREATE TABLE placement_tpo_company_communication (
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 company_key varchar(180) NOT NULL,
 status varchar(24) NOT NULL,
 updated_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(college_id,company_key),
 CONSTRAINT tpo_company_communication_status_ck CHECK (
  status IN ('NOT_CONTACTED','EMAILED','REPLIED','MEETING_SET','NOT_INTERESTED')
 ),
 CONSTRAINT tpo_company_communication_key_ck CHECK(length(trim(company_key))>0)
);
CREATE INDEX tpo_company_communication_status_idx
 ON placement_tpo_company_communication(college_id,status);
