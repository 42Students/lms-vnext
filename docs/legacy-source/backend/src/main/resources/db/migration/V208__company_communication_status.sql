-- V208: company communication status
-- Idempotent where practical; rehearse against a copy of the target database first.

-- Recruiter phase 1, N11: where the placement cell is with each company it reaches out to (Engage > Companies). Keyed the way
-- the Companies list groups companies (companyKey of the typed name), since many companies there have no shared company yet.
CREATE TABLE IF NOT EXISTS tpo_company_outreach (
  college_id INT NOT NULL,
  company_key VARCHAR(200) NOT NULL,
  status VARCHAR(20) NOT NULL,
  updated_by_faculty_id INT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (college_id, company_key)
);
