-- Preserve the legacy CourseDTO short_title maximum without truncation.
ALTER TABLE courses ALTER COLUMN short_title TYPE varchar(255);
