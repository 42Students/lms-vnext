-- Historical FacultyProfileServiceImpl (15 sections) -> faculty profile_document:
-- 01 about/biography -> about.description (plain text, bounded by schema);
-- 02 personal details -> personalDetails (birth/date/name require privacy review);
-- 03 primary/alternate mobile and work email -> contact (never auth identity);
-- 04 residence/permanent address -> address (no public exposure);
-- 05 social links -> socialProfiles (HTTPS URL sanitation);
-- 06 language names/proficiency -> languages[] (stable generated UUID rows);
-- 07 course/degrees/institutions -> education[] (verify graduation dates);
-- 08 certificates -> certifications[] (private scanned receipt links);
-- 09 prior posts -> experiences[] (employment history and offer evidence);
-- 10 professional skills -> skills[] (deduplicate within same faculty);
-- 11 papers/citations -> publications[] (sanitized DOI/URL metadata);
-- 12 honors -> awards[] (source date and optional evidence);
-- 13 prior organizations -> organizations[] (no automatic membership roles);
-- 14 source unknown/custom fields -> metadata (allowlisted scalar provenance);
-- 15 photo and identity -> profileImageDocumentId + identitySummary; DO NOT
--    import unmasked Aadhaar/PAN, raw signed URL or unscanned documents.
-- Outer legacy Faculty.id must first resolve to a verified active
-- college_membership by (legacy faculty user, college); duplicate orphan
-- profiles, missing faculty memberships and cross-college IDs are import
-- exceptions, NEVER implicitly assigned to the acting college. Preserve
-- source createdAt/updatedAt separately after Asia/Kolkata conversion; JSON
-- profile_document_version is independent from old JPA @Version. A profile
-- with multiple source rows in any collection cannot be truncated to legacy
-- or vNext limit; quarantine overlimit evidence for owner review.
-- Greenfield vNext explicitly performs no historical profile data migration.
ALTER TABLE "faculty_profiles" ADD COLUMN "profile_document" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "faculty_profiles" ADD COLUMN "profile_document_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "faculty_profiles" ADD CONSTRAINT "faculty_profiles_document_version_nonnegative" CHECK ("faculty_profiles"."profile_document_version" >= 0);