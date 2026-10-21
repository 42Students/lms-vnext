ALTER TABLE placement_companies ADD CONSTRAINT placement_companies_legacy_about_ck
 CHECK (about IS NULL OR length(about)<=2000);
ALTER TABLE placement_job_role_options ADD CONSTRAINT placement_job_role_options_legacy_title_ck
 CHECK (length(trim(title)) BETWEEN 1 AND 100);
