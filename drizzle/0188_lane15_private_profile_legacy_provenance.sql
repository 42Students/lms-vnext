-- Private avatar/resume keys require scoped read/signer; never upload a signed
-- URL into database or import an unscanned resume as trusted evidence.
ALTER TABLE learner_profiles
 ADD COLUMN IF NOT EXISTS legacy_learner_id integer,
 ADD COLUMN IF NOT EXISTS avatar_object_path varchar(1024),
 ADD COLUMN IF NOT EXISTS resume_scan_status varchar(16),
 ADD COLUMN IF NOT EXISTS resume_verified_at timestamptz;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS learner_profiles_legacy_student_idx
 ON learner_profiles(legacy_learner_id) WHERE legacy_learner_id IS NOT NULL;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE learner_profiles ADD CONSTRAINT learner_profiles_resume_scan_ck
 CHECK (resume_scan_status IS NULL OR resume_scan_status IN ('PENDING','CLEAN','REJECTED'))$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE learner_profiles ADD CONSTRAINT learner_profiles_resume_verified_ck
 CHECK (resume_verified_at IS NULL OR resume_scan_status='CLEAN')$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
ALTER TABLE faculty_profiles ADD COLUMN IF NOT EXISTS legacy_faculty_id integer;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS faculty_profiles_legacy_faculty_idx
 ON faculty_profiles(legacy_faculty_id) WHERE legacy_faculty_id IS NOT NULL;
