CREATE TABLE "security_audit_chain_head" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"last_seq" bigint DEFAULT 0 NOT NULL,
	"last_hash" text DEFAULT 'genesis' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "security_audit_events" ADD COLUMN "chain_seq" bigint;--> statement-breakpoint
ALTER TABLE "security_audit_events" ADD COLUMN "prev_hash" text;--> statement-breakpoint
ALTER TABLE "security_audit_events" ADD COLUMN "row_hash" text;
--> statement-breakpoint
-- Hash chain for the audit trail (SEC-26-007). One function defines the row hash, so the insert trigger and the
-- verifier use exactly the same text. Timestamps are rendered in UTC so the session TimeZone cannot change a hash.
CREATE OR REPLACE FUNCTION security_audit_hash(p_prev text, p_seq bigint, r security_audit_events) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT encode(sha256(convert_to(concat_ws('|',
    p_prev, p_seq::text, r.id::text,
    to_char(r.occurred_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'),
    coalesce(r.request_id, ''), r.event, r.outcome,
    coalesce(r.actor_user_id::text, ''), coalesce(r.membership_id::text, ''), coalesce(r.college_id::text, ''),
    coalesce(r.role, ''), coalesce(r.method, ''), coalesce(r.path, ''), coalesce(r.status::text, ''),
    coalesce(r.target, ''), coalesce(r.ip_tag, ''), r.detail::text
  ), 'UTF8')), 'hex')
$$;
--> statement-breakpoint
INSERT INTO "security_audit_chain_head" ("id", "last_seq", "last_hash") VALUES (1, 0, 'genesis') ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION security_audit_chain() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  h security_audit_chain_head%ROWTYPE;
BEGIN
  -- The row lock on the single head row serialises writers, which is what makes the chain linear.
  SELECT * INTO h FROM security_audit_chain_head WHERE id = 1 FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'audit chain head is missing' USING ERRCODE = '55000';
  END IF;
  NEW.chain_seq := h.last_seq + 1;
  NEW.prev_hash := h.last_hash;
  NEW.row_hash := security_audit_hash(h.last_hash, NEW.chain_seq, NEW);
  UPDATE security_audit_chain_head SET last_seq = NEW.chain_seq, last_hash = NEW.row_hash WHERE id = 1;
  RETURN NEW;
END
$$;
--> statement-breakpoint
CREATE TRIGGER security_audit_events_chain BEFORE INSERT ON "security_audit_events" FOR EACH ROW EXECUTE FUNCTION security_audit_chain();
--> statement-breakpoint
-- The head may only move from inside the chain trigger (trigger depth 2), never by a direct statement, and never be removed.
CREATE OR REPLACE FUNCTION security_audit_chain_head_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND pg_trigger_depth() >= 2 THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'security_audit_chain_head changes only through the audit insert trigger' USING ERRCODE = '42501';
END
$$;
--> statement-breakpoint
CREATE TRIGGER security_audit_chain_head_update BEFORE UPDATE OR DELETE ON "security_audit_chain_head" FOR EACH ROW EXECUTE FUNCTION security_audit_chain_head_guard();
--> statement-breakpoint
CREATE TRIGGER security_audit_chain_head_truncate BEFORE TRUNCATE ON "security_audit_chain_head" FOR EACH STATEMENT EXECUTE FUNCTION security_audit_chain_head_guard();
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lms_vnext_app') THEN
    REVOKE ALL ON "security_audit_chain_head" FROM lms_vnext_app;
    GRANT SELECT, UPDATE ON "security_audit_chain_head" TO lms_vnext_app;
  END IF;
END $$;
