-- Proposal only (do not apply directly). Ownership: chat-9, TPO-settings-audit-20/21/22/23.
-- Orchestrator should register the next Flyway migration after coordinating with
-- the drive write model and reports owner (chat-5). Existing employment_type must
-- remain readable until the migration/backfill and consumer switches are complete.
BEGIN;
ALTER TABLE placement_tpo_job_types
  ADD COLUMN IF NOT EXISTS counts_as_placed boolean,
  ADD COLUMN IF NOT EXISTS is_builtin boolean NOT NULL DEFAULT false;
-- Built-in choices need per-college rows for hide state and fixed values.
-- Do not blindly INSERT builtin rows without the existing active-college scope;
-- seed the five names using an explicit, reviewed idempotent backfill.
-- Ensure custom choices set counts_as_placed explicitly at creation time.
-- Register a college-scoped FK from placement_jobs to placement_tpo_job_types
-- only after job writer/readers support both legacy employment_type and new id.
-- Historic reports must NOT reinterpret outcomes until offer-policy integration
-- is approved. No usage counters are assumed until join/backfill is complete.
COMMIT;
