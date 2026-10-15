CREATE TABLE "placement_batch_lifecycles" (
	"cohort_id" uuid PRIMARY KEY NOT NULL,
	"college_id" uuid NOT NULL,
	"registration_deadline" timestamp with time zone,
	"invited_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"rules_override" jsonb,
	"created_by_user_id" uuid NOT NULL,
	"updated_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_batch_lifecycles_timeline_ck" CHECK ("placement_batch_lifecycles"."finished_at" is null or ("placement_batch_lifecycles"."invited_at" is not null and "placement_batch_lifecycles"."finished_at" >= "placement_batch_lifecycles"."invited_at")),
	CONSTRAINT "placement_batch_lifecycles_rules_object_ck" CHECK ("placement_batch_lifecycles"."rules_override" is null or jsonb_typeof("placement_batch_lifecycles"."rules_override") = 'object')
);
--> statement-breakpoint
CREATE TABLE "placement_eligibility_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sequence" bigserial NOT NULL,
	"college_id" uuid NOT NULL,
	"action_id" uuid NOT NULL,
	"reverses_action_id" uuid,
	"event_kind" varchar(12) NOT NULL,
	"scope_type" varchar(24) NOT NULL,
	"scope_id" uuid NOT NULL,
	"before_status" varchar(24),
	"before_reason" varchar(200),
	"before_note" varchar(300),
	"after_status" varchar(24),
	"after_reason" varchar(200),
	"after_note" varchar(300),
	"actor_user_id" uuid NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_eligibility_events_scope_ck" CHECK ("placement_eligibility_events"."scope_type" in ('MEMBERSHIP', 'SECTION', 'COHORT')),
	CONSTRAINT "placement_eligibility_events_kind_ck" CHECK (("placement_eligibility_events"."event_kind" = 'DECIDE' and "placement_eligibility_events"."reverses_action_id" is null)
        or ("placement_eligibility_events"."event_kind" = 'UNDO' and "placement_eligibility_events"."reverses_action_id" is not null)),
	CONSTRAINT "placement_eligibility_events_status_ck" CHECK (("placement_eligibility_events"."before_status" is null or "placement_eligibility_events"."before_status" in ('ELIGIBLE', 'INELIGIBLE'))
        and ("placement_eligibility_events"."after_status" is null or "placement_eligibility_events"."after_status" in ('ELIGIBLE', 'INELIGIBLE'))),
	CONSTRAINT "placement_eligibility_events_reason_ck" CHECK (("placement_eligibility_events"."before_status" is distinct from 'INELIGIBLE' or length(trim(coalesce("placement_eligibility_events"."before_reason", ''))) > 0)
        and ("placement_eligibility_events"."after_status" is distinct from 'INELIGIBLE' or length(trim(coalesce("placement_eligibility_events"."after_reason", ''))) > 0)),
	CONSTRAINT "placement_eligibility_events_changed_ck" CHECK (("placement_eligibility_events"."before_status", "placement_eligibility_events"."before_reason", "placement_eligibility_events"."before_note") is distinct from
        ("placement_eligibility_events"."after_status", "placement_eligibility_events"."after_reason", "placement_eligibility_events"."after_note"))
);
--> statement-breakpoint
ALTER TABLE "placement_batch_lifecycles" ADD CONSTRAINT "placement_batch_lifecycles_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_batch_lifecycles" ADD CONSTRAINT "placement_batch_lifecycles_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_batch_lifecycles" ADD CONSTRAINT "placement_batch_lifecycles_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_batch_lifecycles" ADD CONSTRAINT "placement_batch_lifecycles_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_eligibility_events" ADD CONSTRAINT "placement_eligibility_events_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_eligibility_events" ADD CONSTRAINT "placement_eligibility_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "placement_batch_lifecycles_college_idx" ON "placement_batch_lifecycles" USING btree ("college_id","finished_at");--> statement-breakpoint
CREATE UNIQUE INDEX "placement_eligibility_events_sequence_uq" ON "placement_eligibility_events" USING btree ("sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "placement_eligibility_events_action_scope_uq" ON "placement_eligibility_events" USING btree ("action_id","scope_type","scope_id");--> statement-breakpoint
CREATE INDEX "placement_eligibility_events_action_idx" ON "placement_eligibility_events" USING btree ("college_id","action_id");--> statement-breakpoint
CREATE INDEX "placement_eligibility_events_scope_idx" ON "placement_eligibility_events" USING btree ("college_id","scope_type","scope_id","sequence");--> statement-breakpoint
CREATE INDEX "placement_eligibility_events_reversal_idx" ON "placement_eligibility_events" USING btree ("reverses_action_id");
--> statement-breakpoint
-- Hand-written (not representable in Drizzle schema): checks, tenant guards, append-only triggers.
-- Harden the preexisting 0035 global decision table, not a second parallel decision store.
ALTER TABLE "placement_eligibility_decisions"
  ADD CONSTRAINT "placement_eligibility_decisions_reason_length_ck" CHECK (reason IS NULL OR length(reason) <= 200) NOT VALID,
  ADD CONSTRAINT "placement_eligibility_decisions_note_length_ck" CHECK (note IS NULL OR length(note) <= 300) NOT VALID;
--> statement-breakpoint
-- Validate poly-scoped ID by joining to actual parent college.
-- No accidental self-referencing fake FK; reject invalid/mismatched parents.
CREATE FUNCTION db08_assert_scope_college() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE actual_college uuid;
BEGIN
  IF NEW.scope_type = 'MEMBERSHIP' THEN
    SELECT m.college_id INTO actual_college
      FROM college_memberships m
      WHERE m.id = NEW.scope_id
        AND EXISTS (
          SELECT 1 FROM membership_roles mr
          WHERE mr.membership_id = m.id AND mr.role = 'LEARNER'
        );
  ELSIF NEW.scope_type = 'SECTION' THEN
    SELECT d.college_id INTO actual_college
      FROM sections s
      JOIN cohorts c ON c.id = s.cohort_id
      JOIN programs p ON p.id = c.program_id
      JOIN departments d ON d.id = p.department_id
      WHERE s.id = NEW.scope_id;
  ELSIF NEW.scope_type = 'COHORT' THEN
    SELECT d.college_id INTO actual_college
      FROM cohorts c
      JOIN programs p ON p.id = c.program_id
      JOIN departments d ON d.id = p.department_id
      WHERE c.id = NEW.scope_id;
  ELSE
    RAISE EXCEPTION 'Invalid placement eligibility scope type' USING ERRCODE = '23514';
  END IF;
  IF actual_college IS DISTINCT FROM NEW.college_id THEN
    RAISE EXCEPTION 'Placement eligibility scope belongs to a different college or is missing'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER db08_placement_decisions_college_guard
BEFORE INSERT OR UPDATE ON placement_eligibility_decisions
FOR EACH ROW EXECUTE FUNCTION db08_assert_scope_college();
--> statement-breakpoint
CREATE TRIGGER db08_placement_events_college_guard
BEFORE INSERT ON placement_eligibility_events
FOR EACH ROW EXECUTE FUNCTION db08_assert_scope_college();
--> statement-breakpoint
CREATE FUNCTION db08_assert_batch_college() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE actual_college uuid;
BEGIN
  SELECT d.college_id INTO actual_college
    FROM cohorts c
    JOIN programs p ON p.id = c.program_id
    JOIN departments d ON d.id = p.department_id
    WHERE c.id = NEW.cohort_id;
  IF actual_college IS DISTINCT FROM NEW.college_id THEN
    RAISE EXCEPTION 'Placement batch belongs to a different college or is missing'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER db08_placement_batch_college_guard
BEFORE INSERT OR UPDATE ON placement_batch_lifecycles
FOR EACH ROW EXECUTE FUNCTION db08_assert_batch_college();
--> statement-breakpoint
CREATE FUNCTION db08_immutable_eligibility_event() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Placement eligibility events are append-only' USING ERRCODE = '23514';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER db08_placement_events_no_mutation
BEFORE UPDATE OR DELETE ON placement_eligibility_events
FOR EACH ROW EXECUTE FUNCTION db08_immutable_eligibility_event();
