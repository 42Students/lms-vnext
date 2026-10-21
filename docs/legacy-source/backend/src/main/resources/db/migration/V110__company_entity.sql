-- Reusable Company records — an admin can now create a company once (name, logo, contact
-- details) and reuse it across job postings instead of retyping the same information for every
-- new drive from the same recruiter. companyName/companyLogo on `job` stay as denormalized
-- display fields kept in sync at save time; every existing job/report/export that reads those
-- two columns keeps working unchanged.
CREATE TABLE IF NOT EXISTS company (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    logo_url VARCHAR(500) NULL,
    website VARCHAR(500) NULL,
    industry VARCHAR(100) NULL,
    description TEXT NULL,
    contact_person_name VARCHAR(150) NULL,
    contact_email VARCHAR(150) NULL,
    contact_phone VARCHAR(30) NULL,
    internal_notes TEXT NULL,
    college_id INT NULL,
    organization_id INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    is_deleted BOOLEAN DEFAULT 0,
    KEY idx_company_college (college_id),
    KEY idx_company_org (organization_id),
    KEY idx_company_name (name)
);

ALTER TABLE job ADD COLUMN company_id INT NULL AFTER company_logo;
CREATE INDEX idx_job_company_id ON job (company_id);

-- Backfill: one Company row per distinct (company_name, college_id, organization_id) combination
-- already in use, so existing jobs immediately have real company history to look back on instead
-- of starting from zero. Exact-string grouping only (no fuzzy "Infosys" vs "Infosys Ltd."
-- merging) — an admin can rename/merge duplicates later via the new Companies page.
INSERT INTO company (name, college_id, organization_id, created_at)
SELECT company_name, college_id, organization_id, NOW()
FROM job
WHERE company_name IS NOT NULL AND company_name != '' AND (is_deleted = 0 OR is_deleted IS NULL)
GROUP BY company_name, college_id, organization_id;

-- Link existing jobs to their newly-created Company row.
UPDATE job j
JOIN company c
  ON c.name = j.company_name
  AND (c.college_id <=> j.college_id)
  AND (c.organization_id <=> j.organization_id)
SET j.company_id = c.id
WHERE j.company_name IS NOT NULL AND j.company_name != '';
