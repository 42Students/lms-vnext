-- V213: college placements page
-- Idempotent where practical; rehearse against a copy of the target database first.

-- Phase 3 (non-global), D2 default: a college's placements web page on its own address. The college switches it on, writes a
-- few lines about placements and picks which live numbers show (any number built on fewer than 5 is hidden). "Recruit from us"
-- takes a proven company email and lands as a recruiter lead in Engage.
CREATE TABLE IF NOT EXISTS college_placements_page (
  college_id INT NOT NULL PRIMARY KEY,
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  about TEXT NULL,
  numbers_json TEXT NULL,
  updated_at DATETIME NULL,
  updated_by_faculty_id INT NULL
);
