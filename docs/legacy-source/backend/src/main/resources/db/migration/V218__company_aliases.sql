-- V218: company aliases
-- Idempotent where practical; rehearse against a copy of the target database first.

-- Strong company search (docs/companies/COMPANY-SEARCH-2026-10-13.md): other names a company goes by ("TCS", "L&T", "Cognizant
-- Technology Solutions"), kept by 42 on its company list. The search matches them as well as the name, acronyms, typos and domains.
CREATE TABLE IF NOT EXISTS company_alias (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  alias VARCHAR(150) NOT NULL,
  alias_key VARCHAR(150) NOT NULL COMMENT 'The alias as the search reads it (lower case, no punctuation or legal suffix)',
  created_by_user_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_company_alias (company_id, alias_key),
  KEY idx_company_alias_key (alias_key)
);
