-- Separate ORG override inventory: no implicit GLOBAL/COLLEGE inheritance.
CREATE TABLE IF NOT EXISTS organization_setting_overrides (
 organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
 key varchar(120) NOT NULL,
 value varchar(4096) NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK (version>=1),
 updated_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (organization_id,key)
);
