-- guarded: runs only after staged table learner_profile_education_entries is promoted
DO $guard$ BEGIN
  IF to_regclass('public.learner_profile_education_entries') IS NOT NULL THEN
    EXECUTE $stmt$ALTER TABLE learner_profile_education_entries ADD COLUMN legacy_qualification_id integer$stmt$;
  END IF;
END $guard$;
--> statement-breakpoint
-- guarded: runs only after staged table learner_profile_education_entries is promoted
DO $guard$ BEGIN
  IF to_regclass('public.learner_profile_education_entries') IS NOT NULL THEN
    EXECUTE $stmt$ALTER TABLE learner_profile_education_entries ADD COLUMN legacy_certificate_upload text$stmt$;
  END IF;
END $guard$;
--> statement-breakpoint
-- guarded: runs only after staged table learner_profile_education_entries is promoted
DO $guard$ BEGIN
  IF to_regclass('public.learner_profile_education_entries') IS NOT NULL THEN
    EXECUTE $stmt$ALTER TABLE learner_profile_education_entries ADD COLUMN legacy_start_year_raw varchar(32)$stmt$;
  END IF;
END $guard$;
--> statement-breakpoint
-- guarded: runs only after staged table learner_profile_education_entries is promoted
DO $guard$ BEGIN
  IF to_regclass('public.learner_profile_education_entries') IS NOT NULL THEN
    EXECUTE $stmt$ALTER TABLE learner_profile_education_entries ADD COLUMN legacy_end_year_raw varchar(32)$stmt$;
  END IF;
END $guard$;
--> statement-breakpoint
-- guarded: runs only after staged table learner_profile_education_entries is promoted
DO $guard$ BEGIN
  IF to_regclass('public.learner_profile_education_entries') IS NOT NULL THEN
    EXECUTE $stmt$ALTER TABLE learner_profile_education_entries ADD COLUMN legacy_was_deleted boolean$stmt$;
  END IF;
END $guard$;
--> statement-breakpoint
-- guarded: runs only after staged table learner_profile_education_entries is promoted
DO $guard$ BEGIN
  IF to_regclass('public.learner_profile_education_entries') IS NOT NULL THEN
    EXECUTE $stmt$CREATE INDEX learner_profile_education_legacy_source_idx ON learner_profile_education_entries(learner_membership_id,legacy_qualification_id) WHERE legacy_qualification_id IS NOT NULL$stmt$;
  END IF;
END $guard$;
--> statement-breakpoint
-- guarded: runs only after staged table learner_profile_images is promoted
DO $guard$ BEGIN
  IF to_regclass('public.learner_profile_images') IS NOT NULL THEN
    EXECUTE $stmt$ALTER TABLE learner_profile_images ADD COLUMN legacy_image_id integer$stmt$;
  END IF;
END $guard$;
--> statement-breakpoint
-- guarded: runs only after staged table learner_profile_images is promoted
DO $guard$ BEGIN
  IF to_regclass('public.learner_profile_images') IS NOT NULL THEN
    EXECUTE $stmt$ALTER TABLE learner_profile_images ADD COLUMN legacy_image_url text$stmt$;
  END IF;
END $guard$;
--> statement-breakpoint
-- guarded: runs only after staged table learner_profile_images is promoted
DO $guard$ BEGIN
  IF to_regclass('public.learner_profile_images') IS NOT NULL THEN
    EXECUTE $stmt$ALTER TABLE learner_profile_images ADD COLUMN legacy_was_deleted boolean$stmt$;
  END IF;
END $guard$;
--> statement-breakpoint
-- guarded: runs only after staged table learner_profile_images is promoted
DO $guard$ BEGIN
  IF to_regclass('public.learner_profile_images') IS NOT NULL THEN
    EXECUTE $stmt$CREATE INDEX learner_profile_images_legacy_source_idx ON learner_profile_images(learner_membership_id,legacy_image_id) WHERE legacy_image_id IS NOT NULL$stmt$;
  END IF;
END $guard$;
