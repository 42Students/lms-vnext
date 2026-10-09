-- DB08-A STAGED SQL ONLY -- NOT AN ACTIVE DRIZZLE MIGRATION
--
-- This contract intentionally lives under docs/planning rather than drizzle/.
-- Regenerate as a numbered Drizzle migration only after DB03 and DB04 are
-- integrated, update drizzle/meta/_journal.json in a single-owner batch,
-- then replay on a clean disposable PostgreSQL database.
-- NEVER manually apply this to production as an alternative to migration review.

CREATE TABLE "placement_eligibility_actions" (
  "id" uuid PRIMARY KEY NOT NULL,
  "college_id" uuid NOT NULL REFERENCES "colleges"("id") ON DELETE RESTRICT,
  "requested_by_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "request_payload" jsonb NOT NULL,
  "status" varchar(12) NOT NULL DEFAULT 'APPLIED',
  "undone_by_user_id" uuid REFERENCES "users"("id") ON DELETE RESTRICT,
  "undone_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "placement_eligibility_actions_state_ck" CHECK (
    ("status" = 'APPLIED' AND "undone_at" IS NULL AND "undone_by_user_id" IS NULL)
    OR ("status" = 'UNDONE' AND "undone_at" IS NOT NULL AND "undone_by_user_id" IS NOT NULL)
  )
);
CREATE UNIQUE INDEX "placement_eligibility_actions_id_college_uq"
  ON "placement_eligibility_actions" ("id", "college_id");
CREATE INDEX "placement_eligibility_actions_college_created_idx"
  ON "placement_eligibility_actions" ("college_id", "created_at");

ALTER TABLE "placement_eligibility_decisions"
  ADD COLUMN "last_action_id" uuid
  REFERENCES "placement_eligibility_actions"("id") ON DELETE RESTRICT;
ALTER TABLE "placement_eligibility_decisions"
  ADD CONSTRAINT "placement_eligibility_decisions_action_college_fk"
  FOREIGN KEY ("last_action_id", "college_id")
  REFERENCES "placement_eligibility_actions"("id", "college_id") ON DELETE RESTRICT;
ALTER TABLE "placement_eligibility_decisions"
  ADD CONSTRAINT "placement_eligibility_decisions_reason_length_ck"
  CHECK ("reason" IS NULL OR length("reason") <= 200);
ALTER TABLE "placement_eligibility_decisions"
  ADD CONSTRAINT "placement_eligibility_decisions_note_length_ck"
  CHECK ("note" IS NULL OR length("note") <= 300);

CREATE TABLE "placement_eligibility_events" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "action_id" uuid NOT NULL
    REFERENCES "placement_eligibility_actions"("id") ON DELETE RESTRICT,
  "college_id" uuid NOT NULL
    REFERENCES "colleges"("id") ON DELETE RESTRICT,
  "scope_type" varchar(24) NOT NULL,
  "scope_id" uuid NOT NULL,
  "before_status" varchar(24),
  "before_reason" text,
  "before_note" text,
  "before_last_action_id" uuid
    REFERENCES "placement_eligibility_actions"("id") ON DELETE RESTRICT,
  "before_decided_by_user_id" uuid
    REFERENCES "users"("id") ON DELETE RESTRICT,
  "before_decided_at" timestamptz,
  "after_status" varchar(24) NOT NULL,
  "after_reason" text,
  "after_note" text,
  "actor_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "undone_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "placement_eligibility_events_action_college_fk"
    FOREIGN KEY ("action_id", "college_id")
    REFERENCES "placement_eligibility_actions"("id", "college_id") ON DELETE RESTRICT,
  CONSTRAINT "placement_eligibility_events_previous_action_college_fk"
    FOREIGN KEY ("before_last_action_id", "college_id")
    REFERENCES "placement_eligibility_actions"("id", "college_id") ON DELETE RESTRICT,
  CONSTRAINT "placement_eligibility_events_scope_ck"
    CHECK ("scope_type" IN ('MEMBERSHIP', 'SECTION', 'COHORT')),
  CONSTRAINT "placement_eligibility_events_before_status_ck"
    CHECK ("before_status" IS NULL OR "before_status" IN ('ELIGIBLE', 'INELIGIBLE')),
  CONSTRAINT "placement_eligibility_events_after_status_ck"
    CHECK ("after_status" IN ('ELIGIBLE', 'INELIGIBLE')),
  CONSTRAINT "placement_eligibility_events_before_reason_ck"
    CHECK ("before_status" IS DISTINCT FROM 'INELIGIBLE'
      OR length(trim(coalesce("before_reason", ''))) > 0),
  CONSTRAINT "placement_eligibility_events_after_reason_ck"
    CHECK ("after_status" <> 'INELIGIBLE'
      OR length(trim(coalesce("after_reason", ''))) > 0),
  CONSTRAINT "placement_eligibility_events_reason_length_ck"
    CHECK (("before_reason" IS NULL OR length("before_reason") <= 200)
      AND ("after_reason" IS NULL OR length("after_reason") <= 200)),
  CONSTRAINT "placement_eligibility_events_note_length_ck"
    CHECK (("before_note" IS NULL OR length("before_note") <= 300)
      AND ("after_note" IS NULL OR length("after_note") <= 300))
);
CREATE UNIQUE INDEX "placement_eligibility_events_action_scope_uq"
  ON "placement_eligibility_events" ("action_id", "scope_type", "scope_id");
CREATE INDEX "placement_eligibility_events_college_scope_idx"
  ON "placement_eligibility_events"
  ("college_id", "scope_type", "scope_id", "created_at");

-- TODO before promotion:
-- 1. Same-college polymorphic scope ownership enforced in the write service.
-- 2. Test duplicate bulk action key, stale undo, and concurrent updates.
-- 3. Verify cross-college references cannot be persisted through any endpoint.
-- 4. Check source semantics for actor type/name snapshots and undo compensation.
-- 5. Reconcile with updated base schema, regenerate Drizzle snapshot, run replay.
