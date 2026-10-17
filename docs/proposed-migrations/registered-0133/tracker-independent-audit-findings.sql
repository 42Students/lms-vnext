-- SA-placements-projects-119..122: independent finding model (proposed only).
-- Orchestrator must assign numbered migration, serialize with the schema writer,
-- replay on disposable PostgreSQL and verify rollback constraints before enabling.
CREATE TABLE audit_findings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 external_id varchar(120) NOT NULL UNIQUE,
 title text NOT NULL, summary text NOT NULL,
 area varchar(80) NOT NULL, kind varchar(32) NOT NULL,
 severity varchar(16) NOT NULL, status varchar(24) NOT NULL DEFAULT 'NEW',
 assignee varchar(150), found_by varchar(150), found_at timestamptz,
 source_repo varchar(180) NOT NULL, source_path varchar(500),
 paths jsonb NOT NULL DEFAULT '[]'::jsonb, pages jsonb NOT NULL DEFAULT '[]'::jsonb,
 endpoints jsonb NOT NULL DEFAULT '[]'::jsonb,
 steps text, expected text, actual text, evidence text, suggested_fix text,
 duplicate_of uuid, fix_commits jsonb NOT NULL DEFAULT '[]'::jsonb,
 version integer NOT NULL DEFAULT 0,
 imported_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT db10_audit_findings_status_ck CHECK (status IN (
   'NEW','CONFIRMED','IN_PROGRESS','FIXED_DEV','RELEASED_PROD',
   'VERIFIED','DUPLICATE','WONT_FIX','NEEDS_INFO','CANT_REPRODUCE')),
 CONSTRAINT db10_audit_findings_severity_ck CHECK (severity IN ('CRITICAL','HIGH','MEDIUM','LOW')),
 CONSTRAINT db10_audit_findings_kind_ck CHECK (kind IN (
   'BUG','SECURITY','DATA','UX','COPY','PERFORMANCE','ACCESSIBILITY')),
 CONSTRAINT db10_audit_findings_version_ck CHECK (version >= 0)
);
ALTER TABLE audit_findings ADD CONSTRAINT db10_audit_findings_duplicate_fk
 FOREIGN KEY(duplicate_of) REFERENCES audit_findings(id) ON DELETE RESTRICT;
CREATE INDEX db10_audit_findings_status_severity_idx
 ON audit_findings(status,severity,found_at);
CREATE INDEX db10_audit_findings_area_kind_idx ON audit_findings(area,kind);

CREATE TABLE audit_finding_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 finding_id uuid NOT NULL REFERENCES audit_findings(id) ON DELETE RESTRICT,
 actor_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 action varchar(32) NOT NULL, note text,
 from_status varchar(24), to_status varchar(24),
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT db10_audit_finding_events_action_ck CHECK (action IN (
 'STATUS','ASSIGNEE','SEVERITY','DUPLICATE','FIX_COMMIT','COMMENT'))
);
CREATE INDEX db10_audit_finding_events_finding_idx
 ON audit_finding_events(finding_id,created_at);
CREATE TABLE audit_finding_syncs (
 source varchar(120) PRIMARY KEY, last_synced_at timestamptz,
 last_result varchar(24) NOT NULL DEFAULT 'NOT_CONFIGURED',
 imported_count integer NOT NULL DEFAULT 0,
 refused_files jsonb NOT NULL DEFAULT '[]'::jsonb
);

-- Imported finding IDs and source files are untrusted. Import service must
-- validate strictly and never overwrite reviewer status/comments without CAS.
-- Findings from lms-findings stay separate from bug_reports, log-alerts and
-- college-owned user data. This migration must never auto-enable sync.
