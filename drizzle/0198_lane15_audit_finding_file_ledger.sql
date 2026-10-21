-- [chat-15] Audit importer file attempts with immutable source provenance.
CREATE TABLE audit_finding_file(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 source varchar(120) NOT NULL,
 source_path varchar(500) NOT NULL,
 blob_sha varchar(64) NOT NULL,
 action varchar(16) NOT NULL,
 result varchar(24) NOT NULL,
 error_code varchar(80),
 finding_id uuid REFERENCES audit_findings(id) ON DELETE RESTRICT,
 run_id varchar(120),
 source_commit_sha varchar(64),
 checked_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT audit_finding_file_sha_ck CHECK(blob_sha ~ '^[a-f0-9]{40}([a-f0-9]{24})?$'),
 CONSTRAINT audit_finding_file_action_ck CHECK(action IN ('IMPORT','UPDATE','DELETE')),
 CONSTRAINT audit_finding_file_result_ck CHECK(result IN ('ACCEPTED','UNCHANGED','TAMPERED','DELETED','REFUSED')),
 CONSTRAINT audit_finding_file_error_len_ck CHECK(error_code IS NULL OR length(error_code) BETWEEN 1 AND 80));
--> statement-breakpoint
CREATE UNIQUE INDEX audit_finding_file_unique_attempt_uq
 ON audit_finding_file(source,source_path,blob_sha,action);
--> statement-breakpoint
CREATE INDEX audit_finding_file_source_path_time_idx
 ON audit_finding_file(source,source_path,checked_at);
--> statement-breakpoint
CREATE INDEX audit_finding_file_finding_time_idx
 ON audit_finding_file(finding_id,checked_at);
