-- Imported legacy IDs never replace canonical role-scoped UUID IDs.
ALTER TABLE placement_applications
 ADD COLUMN IF NOT EXISTS legacy_application_id integer,
 ADD COLUMN IF NOT EXISTS legacy_was_deleted boolean,
 ADD COLUMN IF NOT EXISTS first_applied_at timestamptz;
UPDATE placement_applications a SET first_applied_at=coalesce(
 (select min(h.created_at) from placement_application_status_history h
  where h.application_id=a.id and h.to_status='SUBMITTED'),a.submitted_at)
 WHERE a.first_applied_at IS NULL;
ALTER TABLE placement_applications ALTER COLUMN first_applied_at SET DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS placement_applications_legacy_id_uq
 ON placement_applications(legacy_application_id) WHERE legacy_application_id IS NOT NULL;
ALTER TABLE placement_applications ADD CONSTRAINT placement_applications_external_ref_len_ck
 CHECK (external_ref IS NULL OR length(external_ref)<=500);
ALTER TABLE placement_applications ADD CONSTRAINT placement_applications_legacy_deleted_ck
 CHECK (legacy_was_deleted IS DISTINCT FROM TRUE OR status='WITHDRAWN');
ALTER TABLE placement_application_status_history ADD CONSTRAINT placement_application_history_reason_len_ck
 CHECK (reason IS NULL OR length(reason)<=500);
ALTER TABLE placement_application_screenings ADD CONSTRAINT placement_screenings_candidate_message_len_ck
 CHECK (candidate_message IS NULL OR length(candidate_message)<=500);
