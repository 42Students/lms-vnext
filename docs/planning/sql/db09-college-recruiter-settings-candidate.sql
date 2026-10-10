-- DB-012 / Chat 3: TPO college setting continuity, staged candidate only.
-- NOT in the canonical Drizzle journal, NOT executed.
-- Frozen source: V185__tpo_recruiter_settings.sql,
-- V190__job_types_and_placement_outcomes.sql,
-- V193__recruiter_naming.sql. Final legacy column names after V193:
-- recruiter_access_months, recruiter_drive_needs_approval.
--
-- VNext staged src/db/schema/tpo-collaboration.ts does not yet declare
-- these four settings. Only use these names after deliberate service/consumer
-- mapping and private cross-college authorization proof.
ALTER TABLE placement_tpo_college_settings
  ADD COLUMN job_types jsonb,
  ADD COLUMN outcome_labels jsonb,
  ADD COLUMN recruiter_access_months integer NOT NULL DEFAULT 6,
  ADD COLUMN recruiter_drive_needs_approval boolean NOT NULL DEFAULT true,
  ADD CONSTRAINT placement_tpo_college_job_types_json_ck
    CHECK (job_types IS NULL OR jsonb_typeof(job_types)='object'),
  ADD CONSTRAINT placement_tpo_college_outcome_labels_json_ck
    CHECK (outcome_labels IS NULL OR jsonb_typeof(outcome_labels)='array'),
  ADD CONSTRAINT placement_tpo_college_recruiter_access_months_ck
    CHECK (recruiter_access_months >= 0);

-- Current product contracts to verify with executing tests:
-- 1. A recruiter drive that needs approval must NOT auto-publish or bypass
--    college admin/TPO decision; when disabled it is still subject to
--    date/scope publication rules.
-- 2. recruiter_access_months 0 means no automatic expiry; positive months
--    derive grant expiration in the college-local calendar under DST rules.
-- 3. Custom job types preserve stable IDs, names, hidden states and whether
--    each type counts toward placement. Legacy V190 also added job-level
--    counts_as_placed; DB08 must retain it or prove a versioned replacement.
-- 4. outcome_labels map display labels to a closed placement outcome enum;
--    labels alone cannot expand roles or authorize recruiters.
-- 5. settings are per-college; wrong-college writes, missing defaults, stale
--    policy-version saves, and concurrent updates need negative witnesses.
-- 6. Old source JSON shapes and migration 193 names must be checked against
--    all current producer/consumer services before Drizzle generation.
