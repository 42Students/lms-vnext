-- [chat-14] Scoped legacy identity preservation for public enquiries,
-- interview appointments and placement debarments.
-- Source integer IDs are import provenance, never authorization identities.
ALTER TABLE placement_public_enquiry_challenges
  ADD COLUMN IF NOT EXISTS legacy_challenge_id integer;
CREATE UNIQUE INDEX IF NOT EXISTS public_enquiry_challenges_legacy_college_idx
  ON placement_public_enquiry_challenges (college_id, legacy_challenge_id)
  WHERE legacy_challenge_id IS NOT NULL;

ALTER TABLE placement_public_recruit_enquiries
  ADD COLUMN IF NOT EXISTS legacy_enquiry_id integer;
CREATE UNIQUE INDEX IF NOT EXISTS public_enquiry_legacy_college_idx
  ON placement_public_recruit_enquiries (college_id, legacy_enquiry_id)
  WHERE legacy_enquiry_id IS NOT NULL;

ALTER TABLE placement_college_interviews
  ADD COLUMN IF NOT EXISTS legacy_interview_id integer,
  ADD COLUMN IF NOT EXISTS legacy_job_id integer,
  ADD COLUMN IF NOT EXISTS legacy_venue text;

ALTER TABLE placement_debarments
  ADD COLUMN IF NOT EXISTS legacy_debarment_id integer,
  ADD COLUMN IF NOT EXISTS legacy_student_id integer,
  ADD COLUMN IF NOT EXISTS legacy_creator_id integer,
  ADD COLUMN IF NOT EXISTS legacy_creator_role varchar(32);
CREATE UNIQUE INDEX IF NOT EXISTS placement_debarments_college_legacy_id_uq
  ON placement_debarments (college_id, legacy_debarment_id)
  WHERE legacy_debarment_id IS NOT NULL;
