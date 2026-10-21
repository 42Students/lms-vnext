-- Company creation's duplicate-name check was a non-atomic read-then-write (SELECT then INSERT
-- with no lock), so two concurrent creates of the same name for the same college could both
-- pass the check and both commit. A generated dedup key backstops the check at the database
-- level: college-scoped companies dedupe on (college_id, name), org-wide companies (college_id
-- IS NULL) dedupe on (organization_id, name) — a single computed column lets one UNIQUE index
-- cover both cases, since a plain UNIQUE(college_id, name) would never fire for NULL college_id.
ALTER TABLE company
  ADD COLUMN dedup_key VARCHAR(200) AS (
    IF(college_id IS NULL,
       CONCAT('org:', COALESCE(organization_id, 0), ':', LOWER(name)),
       CONCAT('college:', college_id, ':', LOWER(name)))
  ) STORED;

-- Soft-deleted rows must not block a new company (or a restore) from taking the same name, so
-- the unique index only covers active rows via a second key column that collapses every deleted
-- row to a distinct, non-colliding value.
--
-- This can't be a generated column like dedup_key above: MySQL forbids a generated column from
-- referencing an AUTO_INCREMENT column (error 3109), and the "distinct per deleted row" value
-- needs id. Instead, dedup_key_active is a plain column kept in sync by BEFORE INSERT/UPDATE
-- triggers, which (unlike generated columns) run after id has already been assigned for the row.
ALTER TABLE company
  ADD COLUMN dedup_key_active VARCHAR(210) NULL;

UPDATE company
  SET dedup_key_active = IF(is_deleted = TRUE, CONCAT('deleted:', id), dedup_key);

CREATE UNIQUE INDEX idx_company_dedup_key_active ON company (dedup_key_active);

DELIMITER $$

CREATE TRIGGER trg_company_dedup_key_active_insert
BEFORE INSERT ON company
FOR EACH ROW
BEGIN
  SET NEW.dedup_key_active = IF(NEW.is_deleted = TRUE,
      CONCAT('deleted:', NEW.id),
      IF(NEW.college_id IS NULL,
         CONCAT('org:', COALESCE(NEW.organization_id, 0), ':', LOWER(NEW.name)),
         CONCAT('college:', NEW.college_id, ':', LOWER(NEW.name))));
END$$

CREATE TRIGGER trg_company_dedup_key_active_update
BEFORE UPDATE ON company
FOR EACH ROW
BEGIN
  SET NEW.dedup_key_active = IF(NEW.is_deleted = TRUE,
      CONCAT('deleted:', NEW.id),
      IF(NEW.college_id IS NULL,
         CONCAT('org:', COALESCE(NEW.organization_id, 0), ':', LOWER(NEW.name)),
         CONCAT('college:', NEW.college_id, ':', LOWER(NEW.name))));
END$$

DELIMITER ;
