-- The last old names of the HR -> recruiter rename (V193, docs/naming/RECRUITER-NAMING-PLAN-2026-10-05.md): the foreign keys. MySQL
-- cannot rename a constraint, so each is dropped and added again under its new name in one ALTER, with the same columns and rules.
-- The tables hold a handful of rows, so the re-check is instant.

ALTER TABLE recruiter
    DROP FOREIGN KEY fk_hr_user_industry_company,
    ADD CONSTRAINT fk_recruiter_industry_company FOREIGN KEY (industry_company_id) REFERENCES industry_company (id);

ALTER TABLE recruiter_college_access
    DROP FOREIGN KEY fk_hr_college_access_college,
    DROP FOREIGN KEY fk_hr_college_access_hr_user,
    ADD CONSTRAINT fk_recruiter_college_access_college FOREIGN KEY (college_id) REFERENCES college (id),
    ADD CONSTRAINT fk_recruiter_college_access_recruiter FOREIGN KEY (recruiter_id) REFERENCES recruiter (id);

ALTER TABLE recruiter_college_access_capability
    DROP FOREIGN KEY fk_hr_college_access_capability_access,
    ADD CONSTRAINT fk_recruiter_college_access_capability_access FOREIGN KEY (access_id) REFERENCES recruiter_college_access (id) ON DELETE CASCADE;
