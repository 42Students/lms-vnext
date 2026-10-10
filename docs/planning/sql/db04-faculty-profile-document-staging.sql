-- DB04 Faculty self-profile persistence candidate.
-- STAGED ONLY. W01 must generate the canonical Drizzle migration/snapshot and
-- replay it on empty/latest PostgreSQL before wiring runtime routes.

ALTER TABLE faculty_profiles
  ADD COLUMN profile_document jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN profile_document_version integer NOT NULL DEFAULT 1;

ALTER TABLE faculty_profiles
  ADD CONSTRAINT faculty_profiles_profile_document_object_ck
    CHECK (jsonb_typeof(profile_document) = 'object'),
  ADD CONSTRAINT faculty_profiles_profile_document_version_ck
    CHECK (profile_document_version >= 1);

-- profile_private_document_receipts is declared in the broader DB04 candidate.
-- Faculty document fields may reference receipt UUIDs only after server-side
-- ownership/purpose/object-attestation checks. No public URL or raw Aadhaar/PAN
-- number is permitted in profile_document.

-- Required replay/concurrency checks before promotion:
-- 1. existing faculty_profiles rows receive {} and version 1;
-- 2. first self write on a missing profile row is serialized and version=1;
-- 3. two writes with the same expected version result in one success/one 409;
-- 4. suspended membership, disabled user or removed FACULTY role fails inside
--    the same transaction as the attempted write;
-- 5. cross-college membership context cannot mutate the row;
-- 6. receipt IDs for PROFILE_IMAGE/AADHAAR/PAN/EDUCATION_CERTIFICATE/
--    CERTIFICATION/EXPERIENCE_CERTIFICATE/OFFER_LETTER are membership-owned,
--    CLEAN, non-revoked and exact-purpose before a document can reference them.
