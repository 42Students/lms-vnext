-- Closes a TOCTOU race in ElectiveService#createOffering: the app-level
-- existsBySlotIdAndCourseIdAndIsDeletedFalse check-then-insert is not atomic, so two concurrent
-- "add this course to this slot" requests could both pass the check and create two live
-- offerings for the same (slot, course). A plain UNIQUE(slot_id, course_id) would also make an
-- archived offering's row permanently block re-adding the same course to the same slot (ARCHIVED
-- is terminal, nothing un-archives it) -- so this generates a key that is NULL for any row that is
-- not a live (ACTIVE, non-deleted) offering, and MySQL's unique index treats NULL as distinct,
-- letting an archived slot/course pairing be re-offered.
ALTER TABLE elective_offering
    ADD COLUMN active_course_key BIGINT
        GENERATED ALWAYS AS (CASE WHEN status = 'ACTIVE' AND (is_deleted = false OR is_deleted IS NULL) THEN course_id ELSE NULL END) VIRTUAL,
    ADD UNIQUE KEY uk_elective_offering_slot_active_course (slot_id, active_course_key);
