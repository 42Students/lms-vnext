-- DB-008 / CHAT 6. SOURCE-BACKED UNREGISTERED DRAFT.
-- DO NOT execute against current schema: course_display_contents is itself a
-- separate W02 staged/unregistered table. W01 owns migration registration/order.
--
-- Legacy oracle: 42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5
-- Source: dto/request/MetaData.java (14 fields), Course.java contents,
-- CourseServiceImpl.setCourseFields + mergeMissingMetaDataFields.
-- vNext: src/db/schema/course-display-staged.ts (only introductionText,
-- bodyHtml, takeaways, thumbnailUrl). This draft covers the other source fields.
--
-- CRITICAL service semantics:
-- * legacy updates merge incoming non-null fields with old metadata; absent
--   fields MUST NOT be erased. Preserve on partial updates.
-- * legacy introduction_content/htmlContent are HTML sanitized by Jsoup;
--   vNext introduction_text is plain bounded text and may NOT be equivalent.
-- * image_url/image_url_lp/thumbnail must be safe http(s) URLs or blank;
--   course_color must be vetted for safe CSS tokens by server-side validation.
-- * legacy date fields and updatedOn are strings, not canonical timestamps;
--   don't silently cast/infer date policy without inspecting consumers.
-- * legacy takeaways are a list; vNext staged array handles them.
-- * these are PUBLIC-SAFE display fields. Never use metadata as ACL/permission.
--
-- Only execute AFTER the course_display_contents migration exists and after
-- confirming exact Drizzle definitions, data, defaults and consumers.
BEGIN;

ALTER TABLE course_display_contents
  ADD COLUMN IF NOT EXISTS amount integer,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS image_url_lp text,
  ADD COLUMN IF NOT EXISTS course_code varchar(255),
  ADD COLUMN IF NOT EXISTS course_type text,
  ADD COLUMN IF NOT EXISTS course_color text,
  ADD COLUMN IF NOT EXISTS course_category text,
  ADD COLUMN IF NOT EXISTS course_start_date_raw text,
  ADD COLUMN IF NOT EXISTS course_end_date_raw text,
  ADD COLUMN IF NOT EXISTS legacy_updated_on_raw text;

-- Legacy DTO contained introduction_content, htmlContent, takeaways, thumbnail.
-- Existing staged introduction_text, body_html, takeaways and thumbnail_url
-- require read/write equivalence + sanitizer proof, not names.

COMMIT;

-- Mandatory acceptance:
-- 1. All 14 MetaData.java fields accounted; absent partial updates preserve.
-- 2. course-code metadata != courses.code without clear source equivalence.
-- 3. Stored URLs reject javascript:/data:; color value injection rejected;
--    HTML sanitation cannot re-activate unsafe tags/attributes.
-- 4. Null and empty-date-string roundtrip semantics preserved; no timezone
--    conversion without explicit approved change.
-- 5. Existing staged course_display_contents version CAS remains correct.
-- 6. Unit/API/PostgreSQL concurrent edits + tenant/access negative tests run.
-- 7. Actual fresh-DB migrations replay under W01, with exact SHA/logs.
