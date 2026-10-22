DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_companies ADD CONSTRAINT placement_companies_legacy_about_ck
 CHECK (about IS NULL OR length(about)<=2000)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_job_role_options ADD CONSTRAINT placement_job_role_options_legacy_title_ck
 CHECK (length(trim(title)) BETWEEN 1 AND 100)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
