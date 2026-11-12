CREATE TABLE "course_offering_coordinator_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coordinator_id" uuid NOT NULL,
	"college_id" uuid NOT NULL,
	"action" text NOT NULL,
	"actor_membership_id" uuid,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_offering_coordinator_events_action_ck" CHECK ("course_offering_coordinator_events"."action" in ('GRANTED', 'REGRANTED', 'REVOKED'))
);
--> statement-breakpoint
CREATE TABLE "course_offering_coordinators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offering_id" uuid NOT NULL,
	"college_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"granted_by_membership_id" uuid,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoked_by_membership_id" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_offering_coordinators_lifecycle_ck" CHECK (("course_offering_coordinators"."revoked_at" is null and "course_offering_coordinators"."revoked_by_membership_id" is null)
        or ("course_offering_coordinators"."revoked_at" is not null and "course_offering_coordinators"."revoked_at" >= "course_offering_coordinators"."granted_at"))
);
--> statement-breakpoint
ALTER TABLE "course_offering_coordinator_events" ADD CONSTRAINT "course_offering_coordinator_events_coordinator_id_course_offering_coordinators_id_fk" FOREIGN KEY ("coordinator_id") REFERENCES "public"."course_offering_coordinators"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_offering_coordinator_events" ADD CONSTRAINT "course_offering_coordinator_events_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_offering_coordinator_events" ADD CONSTRAINT "course_offering_coordinator_events_actor_membership_id_college_memberships_id_fk" FOREIGN KEY ("actor_membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_offering_coordinators" ADD CONSTRAINT "course_offering_coordinators_offering_id_course_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."course_offerings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_offering_coordinators" ADD CONSTRAINT "course_offering_coordinators_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_offering_coordinators" ADD CONSTRAINT "course_offering_coordinators_membership_college_fk" FOREIGN KEY ("membership_id","college_id") REFERENCES "public"."college_memberships"("id","college_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_offering_coordinators" ADD CONSTRAINT "course_offering_coordinators_granted_by_fk" FOREIGN KEY ("granted_by_membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_offering_coordinators" ADD CONSTRAINT "course_offering_coordinators_revoked_by_fk" FOREIGN KEY ("revoked_by_membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "course_offering_coordinator_events_history_idx" ON "course_offering_coordinator_events" USING btree ("coordinator_id","occurred_at");--> statement-breakpoint
CREATE INDEX "course_offering_coordinator_events_college_idx" ON "course_offering_coordinator_events" USING btree ("college_id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_offering_coordinators_active_uq" ON "course_offering_coordinators" USING btree ("offering_id") WHERE "course_offering_coordinators"."revoked_at" is null;--> statement-breakpoint
CREATE INDEX "course_offering_coordinators_membership_active_idx" ON "course_offering_coordinators" USING btree ("membership_id","offering_id") WHERE "course_offering_coordinators"."revoked_at" is null;--> statement-breakpoint
CREATE INDEX "course_offering_coordinators_college_idx" ON "course_offering_coordinators" USING btree ("college_id");
--> statement-breakpoint
-- The offering must belong to the same college as the row, through course -> department. The membership side is
-- already pinned by the (membership_id, college_id) foreign key above. Runs on insert and when the offering changes.
CREATE FUNCTION course_offering_coordinators_guard_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  offering_college uuid;
BEGIN
  SELECT d.college_id INTO offering_college
    FROM course_offerings o
    JOIN courses c ON c.id = o.course_id
    JOIN departments d ON d.id = c.department_id
   WHERE o.id = NEW.offering_id
   FOR SHARE OF o;
  IF offering_college IS NULL OR offering_college <> NEW.college_id THEN
    RAISE EXCEPTION 'Coordinator college does not match the offering college'
      USING ERRCODE = '23503';
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
CREATE TRIGGER course_offering_coordinators_scope_guard
BEFORE INSERT OR UPDATE OF offering_id, college_id ON course_offering_coordinators
FOR EACH ROW EXECUTE FUNCTION course_offering_coordinators_guard_scope();
--> statement-breakpoint
-- A grant row only ever moves from active to revoked. Who, where and when it was granted cannot be rewritten, and a
-- revoked row stays revoked: a re-grant is a new row, so the history of each nomination stays intact.
CREATE FUNCTION course_offering_coordinators_guard_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.offering_id <> OLD.offering_id OR NEW.college_id <> OLD.college_id
     OR NEW.membership_id <> OLD.membership_id OR NEW.granted_at <> OLD.granted_at
     OR NEW.granted_by_membership_id IS DISTINCT FROM OLD.granted_by_membership_id THEN
    RAISE EXCEPTION 'A coordinator grant cannot be rewritten' USING ERRCODE = '23514';
  END IF;
  IF OLD.revoked_at IS NOT NULL AND (NEW.revoked_at IS DISTINCT FROM OLD.revoked_at
     OR NEW.revoked_by_membership_id IS DISTINCT FROM OLD.revoked_by_membership_id) THEN
    RAISE EXCEPTION 'A revoked coordinator grant stays revoked' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
CREATE TRIGGER course_offering_coordinators_update_guard
BEFORE UPDATE ON course_offering_coordinators
FOR EACH ROW EXECUTE FUNCTION course_offering_coordinators_guard_update();
--> statement-breakpoint
CREATE FUNCTION course_offering_coordinators_no_delete()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Coordinator grants and their history are never deleted' USING ERRCODE = '23514';
END
$$;
--> statement-breakpoint
CREATE TRIGGER course_offering_coordinators_no_delete
BEFORE DELETE ON course_offering_coordinators
FOR EACH ROW EXECUTE FUNCTION course_offering_coordinators_no_delete();
--> statement-breakpoint
CREATE FUNCTION course_offering_coordinator_events_append_only()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Coordinator events are append-only' USING ERRCODE = '23514';
END
$$;
--> statement-breakpoint
CREATE TRIGGER course_offering_coordinator_events_append_only
BEFORE UPDATE OR DELETE ON course_offering_coordinator_events
FOR EACH ROW EXECUTE FUNCTION course_offering_coordinator_events_append_only();
--> statement-breakpoint
-- Tenant row-level security, same policy as 0333/0336/0337. INERT unless app.rls_mode = 'enforce'.
ALTER TABLE "course_offering_coordinators" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "course_offering_coordinators" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "course_offering_coordinators";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "course_offering_coordinators" USING (app_rls_allows(college_id)) WITH CHECK (app_rls_allows(college_id));
--> statement-breakpoint
ALTER TABLE "course_offering_coordinator_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "course_offering_coordinator_events" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "course_offering_coordinator_events";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "course_offering_coordinator_events" USING (app_rls_allows(college_id)) WITH CHECK (app_rls_allows(college_id));
