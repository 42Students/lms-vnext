-- DB08-B/C/D/E DDL REVIEW ONLY. This is NOT an active Drizzle migration.
-- Regenerate numbered migration and snapshot against fresh DB03/DB04 head.
-- Same-college cross-table referential constraints still require DB11 proof.

CREATE TABLE "placement_batches" (
 "cohort_id" uuid PRIMARY KEY REFERENCES "cohorts"("id") ON DELETE RESTRICT,
 "college_id" uuid NOT NULL REFERENCES "colleges"("id") ON DELETE RESTRICT,
 "registration_deadline" timestamptz,
 "invited_at" timestamptz,
 "finished_at" timestamptz,
 "rules_override" jsonb,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT "placement_batches_lifecycle_ck" CHECK (
   "finished_at" IS NULL OR
   ("invited_at" IS NOT NULL AND "finished_at" >= "invited_at"))
);
CREATE INDEX "placement_batches_college_idx" ON "placement_batches" ("college_id");

CREATE TABLE "placement_registrations" (
 "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
 "membership_id" uuid NOT NULL REFERENCES "college_memberships"("id") ON DELETE RESTRICT,
 "college_id" uuid NOT NULL REFERENCES "colleges"("id") ON DELETE RESTRICT,
 "season_id" uuid NOT NULL REFERENCES "placement_seasons"("id") ON DELETE RESTRICT,
 "choice" varchar(20) NOT NULL,
 "consent_version" varchar(10),
 "consent_at" timestamptz,
 "source" varchar(15) NOT NULL DEFAULT 'SELF',
 "outcome_label" varchar(60),
 "outcome_detail" varchar(200),
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT "placement_registrations_choice_ck" CHECK (
   "choice" IN ('PLACEMENTS','HIGHER_STUDIES','NOT_INTERESTED')),
 CONSTRAINT "placement_registrations_source_ck" CHECK (
   "source" IN ('SELF','TPO','BACKFILL')),
 CONSTRAINT "placement_registrations_consent_pair_ck" CHECK (
   ("consent_version" IS NULL AND "consent_at" IS NULL)
   OR ("consent_version" IS NOT NULL AND "consent_at" IS NOT NULL))
);
CREATE UNIQUE INDEX "placement_registrations_membership_season_uq"
  ON "placement_registrations" ("membership_id","season_id");
CREATE INDEX "placement_registrations_college_season_idx"
  ON "placement_registrations" ("college_id","season_id","choice");

CREATE TABLE "placement_debarments" (
 "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
 "college_id" uuid NOT NULL REFERENCES "colleges"("id") ON DELETE RESTRICT,
 "membership_id" uuid NOT NULL REFERENCES "college_memberships"("id") ON DELETE RESTRICT,
 "reason" varchar(500) NOT NULL,
 "until_date" date,
 "until_drives" integer,
 "drives_counted" integer NOT NULL DEFAULT 0,
 "created_by_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "lifted_by_user_id" uuid REFERENCES "users"("id") ON DELETE RESTRICT,
 "lifted_at" timestamptz,
 "lifted_reason" varchar(500),
 CONSTRAINT "placement_debarments_reason_ck" CHECK (length(trim("reason")) > 0),
 CONSTRAINT "placement_debarments_count_ck" CHECK (
   "drives_counted" >= 0 AND ("until_drives" IS NULL OR "until_drives" > 0)),
 CONSTRAINT "placement_debarments_lift_ck" CHECK (
   ("lifted_at" IS NULL AND "lifted_by_user_id" IS NULL AND "lifted_reason" IS NULL)
   OR ("lifted_at" IS NOT NULL AND "lifted_by_user_id" IS NOT NULL
   AND length(trim(coalesce("lifted_reason",''))) > 0))
);
CREATE UNIQUE INDEX "placement_debarments_one_unlifted_uq"
  ON "placement_debarments"("college_id","membership_id") WHERE "lifted_at" IS NULL;
CREATE INDEX "placement_debarments_history_idx"
  ON "placement_debarments" ("college_id","membership_id","created_at");

CREATE TABLE "placement_debarment_drive_events" (
 "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
 "debarment_id" uuid NOT NULL REFERENCES "placement_debarments"("id") ON DELETE RESTRICT,
 "job_id" uuid NOT NULL REFERENCES "placement_jobs"("id") ON DELETE RESTRICT,
 "counted_by_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
 "counted_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "placement_debarment_drive_once_uq"
  ON "placement_debarment_drive_events" ("debarment_id","job_id");

CREATE TABLE "placement_external_outcomes" (
 "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
 "college_id" uuid NOT NULL REFERENCES "colleges"("id") ON DELETE RESTRICT,
 "membership_id" uuid NOT NULL REFERENCES "college_memberships"("id") ON DELETE RESTRICT,
 "request_id" uuid REFERENCES "placement_learner_requests"("id") ON DELETE RESTRICT,
 "company_name" varchar(200) NOT NULL,
 "annual_ctc_inr" bigint,
 "letter_object_path" text,
 "verified_by_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
 "verified_at" timestamptz NOT NULL DEFAULT now(),
 "revoked_at" timestamptz,
 "revoked_by_user_id" uuid REFERENCES "users"("id") ON DELETE RESTRICT,
 "revocation_reason" text,
 CONSTRAINT "placement_external_outcomes_company_ck"
   CHECK (length(trim("company_name")) > 0),
 CONSTRAINT "placement_external_outcomes_ctc_ck"
   CHECK ("annual_ctc_inr" IS NULL OR "annual_ctc_inr" >= 0),
 CONSTRAINT "placement_external_outcomes_revoke_ck" CHECK (
   ("revoked_at" IS NULL AND "revoked_by_user_id" IS NULL AND "revocation_reason" IS NULL)
   OR ("revoked_at" IS NOT NULL AND "revoked_by_user_id" IS NOT NULL
      AND length(trim(coalesce("revocation_reason",''))) > 0))
);
CREATE UNIQUE INDEX "placement_external_outcomes_request_uq"
  ON "placement_external_outcomes"("request_id") WHERE "request_id" IS NOT NULL;
CREATE INDEX "placement_external_outcomes_college_membership_idx"
  ON "placement_external_outcomes" ("college_id","membership_id","revoked_at");

CREATE TABLE "placement_saved_jobs" (
 "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
 "college_id" uuid NOT NULL REFERENCES "colleges"("id") ON DELETE RESTRICT,
 "membership_id" uuid NOT NULL REFERENCES "college_memberships"("id") ON DELETE RESTRICT,
 "job_id" uuid NOT NULL REFERENCES "placement_jobs"("id") ON DELETE RESTRICT,
 "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "placement_saved_jobs_membership_job_uq"
  ON "placement_saved_jobs" ("membership_id","job_id");
CREATE INDEX "placement_saved_jobs_college_member_idx"
  ON "placement_saved_jobs" ("college_id","membership_id");

-- SQL remains REVIEW_ONLY:
-- 1. Fresh numbered Drizzle migration + snapshot/replay not done.
-- 2. Raw-SQL tenant integrity for polymorphic joins needs DB11 constraints.
-- 3. Old season/current/multi-active semantics diverge from vNext.
-- 4. Off-campus request pipeline/DB04 private object receipt not integrated.
-- 5. Company placement policy and held-CTC cascade not yet verified.
