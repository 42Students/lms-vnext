-- [chat-15] Legacy ORG setting scope is intentionally not a runtime
-- platform-setting grant. Archive only provenance digests; no plaintext value.
CREATE TABLE platform_legacy_org_override_archives(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 source_row_id varchar(40) NOT NULL,
 legacy_organization_id varchar(40) NOT NULL,
 key varchar(120) NOT NULL,
 value_sha256 varchar(64) NOT NULL,
 source_updated_at timestamptz NOT NULL,
 decision varchar(24) NOT NULL,
 reason varchar(500) NOT NULL,
 archived_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 archived_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT platform_legacy_org_source_id_ck CHECK(source_row_id ~ '^[1-9][0-9]{0,18}$'),
 CONSTRAINT platform_legacy_org_value_sha_ck CHECK(value_sha256 ~ '^[a-f0-9]{64}$'),
 CONSTRAINT platform_legacy_org_decision_ck CHECK(decision IN ('ARCHIVED','REVIEW_REQUIRED')),
 CONSTRAINT platform_legacy_org_reason_ck CHECK(length(trim(reason)) BETWEEN 8 AND 500));
--> statement-breakpoint
CREATE UNIQUE INDEX platform_legacy_org_source_id_uq
 ON platform_legacy_org_override_archives(source_row_id);
--> statement-breakpoint
CREATE INDEX platform_legacy_org_scope_key_idx
 ON platform_legacy_org_override_archives(legacy_organization_id,key);
