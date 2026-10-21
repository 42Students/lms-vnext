-- Retire the legacy lesson-content types (PDF, PPT, LECTURE, "BYO content", GOOGLE_MEET).
--
-- New content of these types has been rejected since LegacyLessonContentCreationGuard; this migration
-- converts the rows that still exist so the types (and their readers/renderers) can be deleted:
--   * PDF / PPT / LECTURE with a stored, tenant-scoped file  -> RESOURCE with one FILE material
--   * PDF / PPT / LECTURE whose "file" is a plain https URL   -> RESOURCE with one LINK material
--   * BYO content / LECTURE holding only text or HTML         -> RESOURCE with notes (no materials)
--   * GOOGLE_MEET                                             -> LIVE_CLASS (identical content shape)
-- Rows are converted in place: id, sequence, lesson, points, active/enabled flags and any learner
-- progress keyed by lesson_content_id are untouched. `version` is bumped so an editor that had the old
-- row open gets a clean optimistic-lock conflict instead of overwriting the converted shape.
--
-- Every touched row is copied to lesson_contents_legacy_type_backup_v163 first (id, original
-- content_type, original content_data) so the conversion is reversible with a plain UPDATE.
-- Idempotent: re-running finds no rows of the retired types.

CREATE TABLE IF NOT EXISTS lesson_contents_legacy_type_backup_v163 (
    id           INT          NOT NULL PRIMARY KEY,
    content_type VARCHAR(255) NULL,
    content_data JSON         NULL,
    backed_up_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);

INSERT IGNORE INTO lesson_contents_legacy_type_backup_v163 (id, content_type, content_data)
SELECT id, content_type, content_data
FROM lesson_contents
WHERE LOWER(TRIM(content_type)) IN ('pdf', 'ppt', 'lecture', 'byo content', 'google meet');

-- 1) Google Meet is the same shape as a live class (link, start_time, end_time, calendar_event_id).
UPDATE lesson_contents
SET content_type = 'live class', version = version + 1
WHERE LOWER(TRIM(content_type)) = 'google meet';

-- 2) Stored file: the key must be a tenant-scoped lesson-content key and the file metadata complete,
--    exactly what ResourceFileController and the Resource validator require of a FILE material.
UPDATE lesson_contents
SET content_data = JSON_SET(
        content_data,
        '$.resource_materials',
        JSON_ARRAY(JSON_OBJECT(
            'kind', 'FILE',
            'title', LEFT(JSON_UNQUOTE(JSON_EXTRACT(content_data, '$.file_dto.original_name')), 255),
            'file_dto', JSON_EXTRACT(content_data, '$.file_dto')))),
    content_type = 'resource',
    version = version + 1
WHERE LOWER(TRIM(content_type)) IN ('pdf', 'ppt', 'lecture')
  AND JSON_UNQUOTE(JSON_EXTRACT(content_data, '$.file_dto.cloud_storage_object'))
        REGEXP '^org-[0-9]+/college-[0-9]+/lesson-content/[^ ?#]+$'
  AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(content_data, '$.file_dto.original_name')), '') <> ''
  AND COALESCE(JSON_EXTRACT(content_data, '$.file_dto.size'), 0) > 0;

-- 3) "File" that is really an external https URL (very old rows on the previous storage bucket).
UPDATE lesson_contents
SET content_data = JSON_SET(
        content_data,
        '$.resource_materials',
        JSON_ARRAY(JSON_OBJECT(
            'kind', 'LINK',
            'title', LEFT(COALESCE(NULLIF(TRIM(content_title), ''), 'Resource'), 255),
            'url', JSON_UNQUOTE(JSON_EXTRACT(content_data, '$.file_dto.cloud_storage_object')))),
        '$.link', JSON_UNQUOTE(JSON_EXTRACT(content_data, '$.file_dto.cloud_storage_object')),
        '$.file_dto', CAST('null' AS JSON)),
    content_type = 'resource',
    version = version + 1
WHERE LOWER(TRIM(content_type)) IN ('pdf', 'ppt', 'lecture')
  AND JSON_UNQUOTE(JSON_EXTRACT(content_data, '$.file_dto.cloud_storage_object'))
        REGEXP '^https://[^/@ ]+/[^ ]*$';

-- 4) Text / HTML only (BYO content, and LECTURE rows that never had a file).
UPDATE lesson_contents
SET content_data = JSON_SET(
        content_data,
        '$.resource_materials', JSON_ARRAY(),
        '$.file_dto', CAST('null' AS JSON)),
    content_type = 'resource',
    version = version + 1
WHERE LOWER(TRIM(content_type)) IN ('byo content', 'lecture')
  AND (COALESCE(JSON_UNQUOTE(JSON_EXTRACT(content_data, '$.html_content')), '') <> ''
       OR COALESCE(JSON_UNQUOTE(JSON_EXTRACT(content_data, '$.text')), '') <> '');

-- 5) Anything still carrying a retired type has neither a usable file, a link, nor any text -- there is
--    nothing to show a learner. Soft-delete it (the original row is preserved in the backup table)
--    and give it the canonical type so no reader ever sees a retired value again.
UPDATE lesson_contents
SET is_deleted = 1, active = 0, content_type = 'resource', version = version + 1
WHERE LOWER(TRIM(content_type)) IN ('pdf', 'ppt', 'lecture', 'byo content');
