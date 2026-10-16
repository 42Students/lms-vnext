-- Staged proposal ONLY. The orchestrator registers a numbered migration.
CREATE TABLE IF NOT EXISTS platform_setting_overrides(
 scope_type varchar(8) NOT NULL,
 scope_id varchar(40) NOT NULL,
 key varchar(120) NOT NULL,
 value varchar(4096) NOT NULL,
 version integer NOT NULL DEFAULT 1,
 updated_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(scope_type,scope_id,key),
 CONSTRAINT platform_override_scope_ck CHECK (
  (scope_type='GLOBAL' AND scope_id='GLOBAL') OR
  (scope_type='COLLEGE' AND scope_id ~ '^[0-9a-f-]{36}$')),
 CONSTRAINT platform_override_version_ck CHECK(version>=1)
);
-- Security-sensitive host, cookie and IP allowlist changes require rollout gating
-- and must never be treated as applied by merely storing an override.
