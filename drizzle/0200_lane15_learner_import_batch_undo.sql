-- Non-authoritative source batch mapping and per-row reversal ledger.
ALTER TABLE learner_profiles
 ADD COLUMN IF NOT EXISTS legacy_batch_id integer,
 ADD COLUMN IF NOT EXISTS imported_cohort_id uuid
  REFERENCES cohorts(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS learner_profiles_import_batch_idx
 ON learner_profiles(legacy_batch_id,imported_cohort_id)
 WHERE legacy_batch_id IS NOT NULL;
ALTER TABLE learner_profiles ADD CONSTRAINT learner_profiles_import_batch_pair_ck
 CHECK ((legacy_batch_id IS NULL)=(imported_cohort_id IS NULL));
CREATE TABLE IF NOT EXISTS learner_profile_import_undo_journal(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 membership_id uuid NOT NULL REFERENCES college_memberships(id) ON DELETE RESTRICT,
 legacy_batch_id integer NOT NULL,
 imported_cohort_id uuid NOT NULL REFERENCES cohorts(id) ON DELETE RESTRICT,
 previous_cohort_id uuid REFERENCES cohorts(id) ON DELETE RESTRICT,
 applied_at timestamptz NOT NULL DEFAULT now(),
 reversed_at timestamptz,
 reference_count_at_apply integer NOT NULL DEFAULT 0,
 CONSTRAINT learner_profile_import_undo_reference_ck CHECK(reference_count_at_apply>=0),
 CONSTRAINT learner_profile_import_undo_reversal_ck CHECK(reversed_at IS NULL OR reversed_at>=applied_at)
);
CREATE INDEX IF NOT EXISTS learner_profile_import_undo_membership_idx
 ON learner_profile_import_undo_journal(membership_id,applied_at);
CREATE INDEX IF NOT EXISTS learner_profile_import_undo_batch_idx
 ON learner_profile_import_undo_journal(legacy_batch_id,imported_cohort_id);
