-- Lane 15 DB10 audit provenance ADDITIVE correction to tables created by registered 0133_lanes_round_1.
-- Do not recreate audit_findings/audit_finding_events/audit_finding_syncs or their existing indexes.
-- No producer activation; owner-reviewed replay and sync-state verification required.
ALTER TABLE audit_findings
  ADD COLUMN reported_severity varchar(32),
  ADD COLUMN roles jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN environment varchar(80),
  ADD COLUMN source_commit_sha varchar(64);
--> statement-breakpoint
ALTER TABLE audit_finding_events
  ADD COLUMN actor_kind varchar(24) NOT NULL DEFAULT 'USER',
  ADD COLUMN actor_label varchar(150),
  ADD COLUMN source_file varchar(500),
  ADD COLUMN source_commit_sha varchar(64),
  ADD COLUMN related_commits jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN from_value jsonb,
  ADD COLUMN to_value jsonb;
--> statement-breakpoint
-- All existing rows had a user actor; future authorized sync-agent/system events
-- require a nonempty actor_label and cannot fake a user UUID.
ALTER TABLE audit_finding_events ALTER COLUMN actor_user_id DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE audit_finding_events ADD CONSTRAINT db10_audit_finding_events_actor_kind_ck
  CHECK (actor_kind IN ('USER','SYNC_AGENT','SYSTEM'));
--> statement-breakpoint
ALTER TABLE audit_finding_events ADD CONSTRAINT db10_audit_finding_events_actor_shape_ck
  CHECK ((actor_kind = 'USER' AND actor_user_id IS NOT NULL)
   OR (actor_kind <> 'USER' AND actor_user_id IS NULL AND length(btrim(coalesce(actor_label,''))) > 0));
--> statement-breakpoint
ALTER TABLE audit_finding_syncs
  ADD COLUMN repo varchar(180),
  ADD COLUMN last_commit varchar(64),
  ADD COLUMN last_error text,
  ADD COLUMN last_success_at timestamptz;
-- last_synced_at means most recent ATTEMPT, last_success_at is actual completed success.
