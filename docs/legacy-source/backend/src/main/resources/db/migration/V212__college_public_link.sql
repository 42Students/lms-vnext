-- V212: college public link
-- Idempotent where practical; rehearse against a copy of the target database first.

-- Phase 2, N5 (a) + N6: a college's public link for recruiters. Anyone who proves a business email (a code sent to a domain
-- that passes the company-domain check) joins the college; their company comes from the email's domain. post_direct: people who
-- joined through this link can post drives without the placement cell's review (default off: their requests are reviewed).
CREATE TABLE IF NOT EXISTS college_public_link (
  college_id INT NOT NULL PRIMARY KEY,
  token_hash CHAR(64) NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  post_direct TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NULL,
  opens INT NOT NULL DEFAULT 0,
  joins INT NOT NULL DEFAULT 0,
  KEY idx_college_public_link_token (token_hash)
);
