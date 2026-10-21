-- Recruiter phase 1, step 2 (docs/recruiter-global): one company for the whole platform, its email domains in their own table,
-- and each college's private side with a company.
--
-- company        : the one company (shared by every college and by recruiters). Shared fields only: name, logo, website,
--                  industry, description. added_by_* says who created it; verified_by_42 marks 42's curated list.
-- company_domain : a company's email/web domains, each domain belonging to exactly one company (UNIQUE). added_by_*, verified_by_42.
-- college_company: a college's private side with a company: its notes and contact details, never seen by other colleges.
--
-- Data: until now every college had its own company rows (often the same name), and recruiters pointed at a separate
-- industry_company table by name. All of it is seeded data; this folds it into one company per name, keeps each college's
-- notes and contacts on its private side, and repoints jobs and recruiters. Old rows are kept, soft-deleted, with
-- merged_into_company_id, so nothing is lost.

-- The per-college name guard (V111/V113: unique name per college, kept by triggers) no longer fits: a company is now one row
-- for everyone, and its identity is its domain (company_domain.domain is UNIQUE). Two different companies may share a name.
DROP TRIGGER IF EXISTS trg_company_dedup_key_active_insert;
DROP TRIGGER IF EXISTS trg_company_dedup_key_active_update;
DROP INDEX idx_company_dedup_key_active ON company;
ALTER TABLE company DROP COLUMN dedup_key_active, DROP COLUMN dedup_key;

ALTER TABLE company
    ADD COLUMN added_by_user_id INT NULL,
    ADD COLUMN added_by_user_type VARCHAR(20) NULL,
    ADD COLUMN added_by_college_id INT NULL,
    ADD COLUMN verified_by_42 TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN verified_by_42_at DATETIME NULL,
    ADD COLUMN verified_by_42_user_id INT NULL,
    ADD COLUMN merged_into_company_id INT NULL;

CREATE TABLE company_domain (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    domain VARCHAR(253) NOT NULL COMMENT 'Registrable domain, lower case (CompanyDomainService)',
    verified_by_42 TINYINT(1) NOT NULL DEFAULT 0,
    added_by_user_id INT NULL,
    added_by_user_type VARCHAR(20) NULL,
    added_by_college_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_company_domain_domain (domain),
    KEY idx_company_domain_company (company_id),
    CONSTRAINT fk_company_domain_company FOREIGN KEY (company_id) REFERENCES company (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE college_company (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    company_id INT NOT NULL,
    internal_notes TEXT NULL,
    contact_person_name VARCHAR(150) NULL,
    contact_email VARCHAR(150) NULL,
    contact_phone VARCHAR(30) NULL,
    owner_faculty_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    UNIQUE KEY uk_college_company (college_id, company_id),
    KEY idx_college_company_company (company_id),
    CONSTRAINT fk_college_company_company FOREIGN KEY (company_id) REFERENCES company (id),
    CONSTRAINT fk_college_company_college FOREIGN KEY (college_id) REFERENCES college (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE recruiter ADD COLUMN company_id INT NULL AFTER industry_company_id,
    ADD KEY idx_recruiter_company_id (company_id);

-- 1. One company per name: the live row with the lowest id wins (a deleted row only when every row of that name is deleted).
CREATE TEMPORARY TABLE v202_keep AS
SELECT LOWER(TRIM(name)) AS nm,
       COALESCE(MIN(CASE WHEN is_deleted = 0 OR is_deleted IS NULL THEN id END), MIN(id)) AS keep_id
FROM company GROUP BY LOWER(TRIM(name));

-- 2. Each college's private side, from every row it had (notes and contacts of the first row per college and name).
INSERT IGNORE INTO college_company (college_id, company_id, internal_notes, contact_person_name, contact_email, contact_phone, created_at, is_deleted)
SELECT c.college_id, k.keep_id, c.internal_notes, c.contact_person_name, c.contact_email, c.contact_phone, COALESCE(c.created_at, NOW()),
       CASE WHEN c.is_deleted = 1 THEN 1 ELSE 0 END
FROM company c JOIN v202_keep k ON k.nm = LOWER(TRIM(c.name))
WHERE c.college_id IS NOT NULL
ORDER BY c.id;

-- 3. Jobs point at the surviving company.
UPDATE job j JOIN company c ON c.id = j.company_id JOIN v202_keep k ON k.nm = LOWER(TRIM(c.name))
SET j.company_id = k.keep_id WHERE j.company_id <> k.keep_id;

-- 4. The other rows of the same name are kept for history, soft-deleted and marked.
UPDATE company c JOIN v202_keep k ON k.nm = LOWER(TRIM(c.name))
SET c.is_deleted = 1, c.merged_into_company_id = k.keep_id WHERE c.id <> k.keep_id;

-- 5. Who added the survivors: the college that had them first.
UPDATE company c SET c.added_by_college_id = c.college_id, c.added_by_user_type = 'COLLEGE' WHERE c.added_by_college_id IS NULL AND c.college_id IS NOT NULL;

-- 6. Recruiters' employer (industry_company, by name) becomes the same company.
INSERT INTO company (name, logo_url, website, industry, created_at, is_deleted, added_by_user_type)
SELECT ic.name, ic.logo_url, ic.website, ic.industry, NOW(), 0, 'RECRUITER_IMPORT'
FROM industry_company ic
WHERE (ic.is_deleted = 0 OR ic.is_deleted IS NULL)
  AND NOT EXISTS (SELECT 1 FROM company c WHERE LOWER(TRIM(c.name)) = LOWER(TRIM(ic.name))
                  AND (c.is_deleted = 0 OR c.is_deleted IS NULL) AND c.merged_into_company_id IS NULL);

UPDATE recruiter r
JOIN industry_company ic ON ic.id = r.industry_company_id
JOIN company c ON LOWER(TRIM(c.name)) = LOWER(TRIM(ic.name)) AND (c.is_deleted = 0 OR c.is_deleted IS NULL) AND c.merged_into_company_id IS NULL
SET r.company_id = c.id
WHERE r.company_id IS NULL;

DROP TEMPORARY TABLE v202_keep;
