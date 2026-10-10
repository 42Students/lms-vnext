-- DB-007 source-backed candidate, to be reviewed and integrated by Chat 1.
-- NOT MIGRATED / NOT EXECUTED. Depends on staged
-- profile_private_document_receipts from db04-proposed-migration.sql.
-- Mirrors the defensive checks in src/modules/profile-verification/
-- gcs-private-receipts.ts.  No production storage configuration implied.

-- Existing candidate SQL accepts malicious URL-shaped or traversal-shaped
-- object keys (unless '://' appears), non-hex 64-char digests, and arbitrary
-- object generations. The trusted GCS verifier is stricter.
ALTER TABLE profile_private_document_receipts
  ADD CONSTRAINT profile_private_doc_key_format_ck
    CHECK (
      private_object_key ~ '^private/[A-Za-z0-9_/-]+$'
      AND position('..' IN private_object_key) = 0
    ),
  ADD CONSTRAINT profile_private_doc_sha256_hex_ck
    CHECK (sha256_hex ~ '^[0-9A-Fa-f]{64}$'),
  ADD CONSTRAINT profile_private_doc_generation_digits_ck
    CHECK (object_generation ~ '^[0-9]+$'),
  ADD CONSTRAINT profile_private_doc_mimetype_nonempty_ck
    CHECK (char_length(trim(mime_type)) > 0);

-- MUST ALSO PROVE:
-- - owning_membership_id matches the owned education/image record;
-- - upload scanner can mutate CLEAN status, untrusted uploader cannot;
-- - receipt purpose is MARKSHEET or PROFILE_IMAGE for corresponding child;
-- - current status is CLEAN, revoked_at null and unexpired on use;
-- - signed object generation, hash and MIME match actual GCS metadata;
-- - stale copy/update/revocation races fail closed in transaction;
-- - all canonical app DB roles restrict direct write/read of private receipts.
-- These are currently planned witnesses, NOT tests that have passed.
