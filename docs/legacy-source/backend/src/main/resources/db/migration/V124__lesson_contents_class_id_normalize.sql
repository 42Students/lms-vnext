-- 49: class_id on lesson_contents had three states meaning "not class-scoped" (NULL, 0,
-- negative) with normalisation only enforced at the application layer (LessonContentsServiceImpl
-- create/update). Nothing at the DB level stopped a bad value getting in via a path that skips
-- that service -- a script, a manual fix, a future endpoint.
--
-- Normalise any stray 0/negative rows to NULL (the one canonical "not class-scoped" value) then
-- add a CHECK constraint so only NULL or a positive class id can ever be stored again.
UPDATE lesson_contents SET class_id = NULL WHERE class_id IS NOT NULL AND class_id <= 0;

ALTER TABLE lesson_contents
    ADD CONSTRAINT chk_lesson_contents_class_id_positive CHECK (class_id IS NULL OR class_id > 0);
