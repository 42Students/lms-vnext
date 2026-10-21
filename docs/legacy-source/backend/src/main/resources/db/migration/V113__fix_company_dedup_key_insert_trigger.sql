-- V111's trg_company_dedup_key_active_insert (BEFORE INSERT) special-cased is_deleted = TRUE by
-- computing dedup_key_active = CONCAT('deleted:', NEW.id). That is broken: for an AUTO_INCREMENT
-- primary key, NEW.id inside a BEFORE INSERT trigger is NOT the row's future id -- MySQL assigns
-- the auto-increment value AFTER BEFORE INSERT fires, so NEW.id reads as 0 (or whatever value was
-- explicitly supplied). Verified live: inserting a company row with is_deleted = TRUE corrupted
-- its dedup key to 'deleted:0' and then hard-failed every subsequent such insert with a duplicate
-- key error against idx_company_dedup_key_active.
--
-- The corresponding BEFORE UPDATE trigger (trg_company_dedup_key_active_update, untouched by this
-- migration) does NOT have this problem: on UPDATE the row already exists, so NEW.id is already
-- populated correctly.
--
-- Fix: the application never inserts a company row that is already soft-deleted -- soft-delete
-- only happens via UPDATE (confirmed by full audit of CompanyServiceImpl and all other write
-- paths). So the is_deleted branch in the INSERT trigger is unreachable through any live code
-- path, and a BEFORE INSERT trigger fundamentally cannot compute a correct 'deleted:<id>' value
-- anyway (it can't see the future id). We simplify the INSERT trigger to always compute the
-- normal (non-deleted) dedup key, matching the fact that a freshly-inserted row is never created
-- as already-deleted. The UPDATE trigger keeps handling the is_deleted case, since it's the only
-- one that can ever legitimately transition a row to deleted and can see NEW.id correctly.

DROP TRIGGER IF EXISTS trg_company_dedup_key_active_insert;

DELIMITER $$

CREATE TRIGGER trg_company_dedup_key_active_insert
BEFORE INSERT ON company
FOR EACH ROW
BEGIN
  SET NEW.dedup_key_active = IF(NEW.college_id IS NULL,
         CONCAT('org:', COALESCE(NEW.organization_id, 0), ':', LOWER(NEW.name)),
         CONCAT('college:', NEW.college_id, ':', LOWER(NEW.name)));
END$$

DELIMITER ;
