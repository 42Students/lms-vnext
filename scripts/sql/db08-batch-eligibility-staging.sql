-- DB08-A SQL STAGING DRAFT (NOT JOURNALED / NOT DEPLOYABLE YET).
-- Generate/reconcile official Drizzle migration and snapshot after DB03/DB04 merge.
-- Base: db-parity-2026@c489b2569dd2d2742da2ee17ed313a26853dc4da.
-- Only disposable PostgreSQL; do not apply to production or older dev data unreviewed.

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
  CONSTRAINT "placement_batch_lifecycles_timeline_ck" CHECK (
    finished_at IS NULL OR (invited_at IS NOT NULL AND finished_at >= invited_at)
  ),
  CONSTRAINT "placement_batch_lifecycles_rules_object_ck" CHECK (
    rules_override IS NULL OR jsonb_typeof(rules_override) = 'object'
  ),
  CONSTRAINT "placement_batch_lifecycles_cohort_fk" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE RESTRICT,
  CONSTRAINT "placement_batch_lifecycles_college_fk" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE RESTRICT,
  CONSTRAINT "placement_batch_lifecycles_created_by_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
  CONSTRAINT "placement_batch_lifecycles_updated_by_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT
);
CREATE INDEX "placement_batch_lifecycles_college_idx" ON "placement_batch_lifecycles" ("college_id","finished_at");

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
  CONSTRAINT "placement_eligibility_events_college_fk" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE RESTRICT,
  CONSTRAINT "placement_eligibility_events_actor_fk" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
  CONSTRAINT "placement_eligibility_events_scope_ck" CHECK (scope_type IN ('MEMBERSHIP','SECTION','COHORT')),
  CONSTRAINT "placement_eligibility_events_kind_ck" CHECK (
    (event_kind = 'DECIDE' AND reverses_action_id IS NULL)
    OR (event_kind = 'UNDO' AND reverses_action_id IS NOT NULL)
  ),
  CONSTRAINT "placement_eligibility_events_status_ck" CHECK (
    (before_status IS NULL OR before_status IN ('ELIGIBLE','INELIGIBLE'))
    AND (after_status IS NULL OR after_status IN ('ELIGIBLE','INELIGIBLE'))
  ),
  CONSTRAINT "placement_eligibility_events_reason_ck" CHECK (
    (before_status IS DISTINCT FROM 'INELIGIBLE' OR length(trim(coalesce(before_reason,''))) > 0)
    AND (after_status IS DISTINCT FROM 'INELIGIBLE' OR length(trim(coalesce(after_reason,''))) > 0)
  ),
  CONSTRAINT "placement_eligibility_events_changed_ck" CHECK (
    (before_status,before_reason,before_note) IS DISTINCT FROM
      (after_status,after_reason,after_note)
  )
);
CREATE UNIQUE INDEX "placement_eligibility_events_sequence_uq" ON "placement_eligibility_events" ("sequence");
CREATE UNIQUE INDEX "placement_eligibility_events_action_scope_uq" ON "placement_eligibility_events" ("action_id","scope_type","scope_id");
CREATE INDEX "placement_eligibility_events_action_idx" ON "placement_eligibility_events" ("college_id","action_id");
CREATE INDEX "placement_eligibility_events_scope_idx" ON "placement_eligibility_events" ("college_id","scope_type","scope_id","sequence");
CREATE INDEX "placement_eligibility_events_reversal_idx" ON "placement_eligibility_events" ("reverses_action_id");

-- Harden the preexisting 0035 global decision table, not a second parallel decision store.
ALTER TABLE "placement_eligibility_decisions"
  ADD CONSTRAINT "placement_eligibility_decisions_reason_length_ck" CHECK (reason IS NULL OR length(reason) <= 200),
  ADD CONSTRAINT "placement_eligibility_decisions_note_length_ck" CHECK (note IS NULL OR length(note) <= 300);

-- Validate poly-scoped ID by joining to actual parent college.
-- No accidental self-referencing fake FK; reject invalid/mismatched parents.
CREATE FUNCTION db08_assert_scope_college() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE actual_college uuid;
BEGIN
  IF NEW.scope_type = 'MEMBERSHIP' THEN
    SELECT college_id INTO actual_college
      FROM college_memberships WHERE id = NEW.scope_id;
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
CREATE TRIGGER db08_placement_decisions_college_guard
BEFORE INSERT OR UPDATE ON placement_eligibility_decisions
FOR EACH ROW EXECUTE FUNCTION db08_assert_scope_college();

CREATE TRIGGER db08_placement_events_college_guard
BEFORE INSERT ON placement_eligibility_events
FOR EACH ROW EXECUTE FUNCTION db08_assert_scope_college();

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
CREATE TRIGGER db08_placement_batch_college_guard
BEFORE INSERT OR UPDATE ON placement_batch_lifecycles
FOR EACH ROW EXECUTE FUNCTION db08_assert_batch_college();

CREATE FUNCTION db08_immutable_eligibility_event() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Placement eligibility events are append-only' USING ERRCODE = '23514';
END;
$$;
CREATE TRIGGER db08_placement_events_no_mutation
BEFORE UPDATE OR DELETE ON placement_eligibility_events
FOR EACH ROW EXECUTE FUNCTION db08_immutable_eligibility_event();

-- Migration/replay gate not satisfied until:
-- * official Drizzle snapshot/journal generated after integration;
-- * all existing 0035 decision rows audited for scoped references and lengths;
-- * direct-SQL cross-tenant inserts tested for all three scopes;
-- * every writer appends corresponding action events transactionally.
