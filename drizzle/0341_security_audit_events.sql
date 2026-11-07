CREATE TABLE "security_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"request_id" text,
	"event" text NOT NULL,
	"outcome" text NOT NULL,
	"actor_user_id" uuid,
	"membership_id" uuid,
	"college_id" uuid,
	"role" text,
	"method" text,
	"path" text,
	"status" integer,
	"target" text,
	"ip_tag" text,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX "security_audit_events_time_idx" ON "security_audit_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "security_audit_events_actor_idx" ON "security_audit_events" USING btree ("actor_user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "security_audit_events_college_idx" ON "security_audit_events" USING btree ("college_id","occurred_at");--> statement-breakpoint
CREATE INDEX "security_audit_events_event_idx" ON "security_audit_events" USING btree ("event","occurred_at");
--> statement-breakpoint
-- Append-only for EVERY role (SEC-19): no update, delete or truncate, whatever the grants.
CREATE OR REPLACE FUNCTION security_audit_events_append_only() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'security_audit_events is append-only' USING ERRCODE = '42501';
END
$$;
--> statement-breakpoint
CREATE TRIGGER security_audit_events_no_change BEFORE UPDATE OR DELETE ON "security_audit_events" FOR EACH ROW EXECUTE FUNCTION security_audit_events_append_only();
--> statement-breakpoint
CREATE TRIGGER security_audit_events_no_truncate BEFORE TRUNCATE ON "security_audit_events" FOR EACH STATEMENT EXECUTE FUNCTION security_audit_events_append_only();
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lms_vnext_app') THEN
    REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON "security_audit_events" FROM lms_vnext_app;
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "security_audit_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "security_audit_events" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "security_audit_events";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "security_audit_events" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));
