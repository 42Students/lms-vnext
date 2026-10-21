-- Lane 15 DB10 audit findings storage: preserve source external IDs, provenance and agent audit history.
-- Owner must approve migration/replay before enabling DB10_AUDIT_FINDINGS_READY or any sync producer.
CREATE TABLE audit_findings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 external_id varchar(120) NOT NULL,
 title text NOT NULL,
 summary text NOT NULL,
 area varchar(80) NOT NULL,
 kind varchar(32) NOT NULL,
 severity varchar(16) NOT NULL,
 reported_severity varchar(32),
 roles jsonb NOT NULL DEFAULT '[]'::jsonb,
 environment varchar(80),
 status varchar(24) NOT NULL DEFAULT 'NEW',
 assignee varchar(150), found_by varchar(150), found_at timestamptz,
 source_repo varchar(180) NOT NULL, source_commit_sha varchar(64), source_path varchar(500),
 paths jsonb NOT NULL DEFAULT '[]'::jsonb,
 pages jsonb NOT NULL DEFAULT '[]'::jsonb,
 endpoints jsonb NOT NULL DEFAULT '[]'::jsonb,
 steps text, expected text, actual text, evidence text, suggested_fix text,
 duplicate_of uuid,
 fix_commits jsonb NOT NULL DEFAULT '[]'::jsonb,
 version integer NOT NULL DEFAULT 0,
 imported_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT db10_audit_findings_status_ck CHECK (status IN ('NEW','CONFIRMED','IN_PROGRESS','FIXED_DEV','RELEASED_PROD','VERIFIED','DUPLICATE','WONT_FIX','NEEDS_INFO','CANT_REPRODUCE')),
 CONSTRAINT db10_audit_findings_severity_ck CHECK (severity IN ('CRITICAL','HIGH','MEDIUM','LOW')),
 CONSTRAINT db10_audit_findings_kind_ck CHECK (kind IN ('BUG','SECURITY','DATA','UX','COPY','PERFORMANCE','ACCESSIBILITY')),
 CONSTRAINT db10_audit_findings_version_ck CHECK (version >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX db10_audit_findings_external_id_uq ON audit_findings (external_id);
--> statement-breakpoint
CREATE INDEX db10_audit_findings_status_severity_idx ON audit_findings (status,severity,found_at);
--> statement-breakpoint
CREATE INDEX db10_audit_findings_area_kind_idx ON audit_findings (area,kind);
--> statement-breakpoint
CREATE TABLE audit_finding_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 finding_id uuid NOT NULL REFERENCES audit_findings(id) ON DELETE RESTRICT,
 actor_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
 actor_kind varchar(24) NOT NULL DEFAULT 'USER',
 actor_label varchar(150), source_file varchar(500), source_commit_sha varchar(64),
 related_commits jsonb NOT NULL DEFAULT '[]'::jsonb,
 from_value jsonb, to_value jsonb,
 action varchar(32) NOT NULL, note text,
 from_status varchar(24), to_status varchar(24),
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT db10_audit_finding_events_actor_kind_ck CHECK (actor_kind IN ('USER','SYNC_AGENT','SYSTEM')),
 CONSTRAINT db10_audit_finding_events_actor_shape_ck CHECK ((actor_kind = 'USER' AND actor_user_id IS NOT NULL) OR (actor_kind <> 'USER' AND actor_user_id IS NULL AND length(btrim(coalesce(actor_label,''))) > 0)),
 CONSTRAINT db10_audit_finding_events_action_ck CHECK (action IN ('STATUS','ASSIGNEE','SEVERITY','DUPLICATE','FIX_COMMIT','COMMENT'))
);
--> statement-breakpoint
CREATE INDEX db10_audit_finding_events_finding_idx ON audit_finding_events (finding_id,created_at);
--> statement-breakpoint
CREATE TABLE audit_finding_syncs (
 source varchar(120) PRIMARY KEY,
 repo varchar(180), last_commit varchar(64), last_error text,
 last_success_at timestamptz, last_synced_at timestamptz,
 last_result varchar(24) NOT NULL DEFAULT 'NOT_CONFIGURED',
 imported_count integer NOT NULL DEFAULT 0,
 refused_files jsonb NOT NULL DEFAULT '[]'::jsonb
);
-- The sync status endpoint must distinguish attempted vs successful run and preserve last-error evidence.
