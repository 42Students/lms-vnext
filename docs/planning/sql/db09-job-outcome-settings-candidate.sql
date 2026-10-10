-- DB-012 / Chat 3. STAGED ONLY; NOT EXECUTED, REGISTERED, OR DB-VERIFIED.
-- Source: legacy V190__job_types_and_placement_outcomes.sql.
-- Current vNext placement_tpo_college_settings has neither V190 config.
-- Chat 1 controls schema barrel and numbered Drizzle migrations.

ALTER TABLE placement_tpo_college_settings
  ADD COLUMN job_types jsonb NULL,
  ADD COLUMN outcome_labels jsonb NULL,
  ADD CONSTRAINT db09_job_types_object_ck
    CHECK (job_types IS NULL OR jsonb_typeof(job_types) = 'object'),
  ADD CONSTRAINT db09_outcome_labels_array_ck
    CHECK (outcome_labels IS NULL OR jsonb_typeof(outcome_labels) = 'array');

-- Source wire contract job_types_json:
-- {"hidden":["Contract"],"custom":[{"id":"x1","name":"Part-time",
--      "countsAsPlaced":false,"hidden":false}]}
-- Source wire contract outcome_labels_json:
-- [{"id":"x2","label":"Family business","outcome":"ENTREPRENEURSHIP"}]
-- NULL means legacy built-in defaults, not that the field is retired.
-- Consumer domain must validate fixed allowed outcomes, unique ids/names,
-- no arbitrary SQL/HTML, and controlled editing by same-college TPO admins.

-- Related essential DB08 cross-domain finding (not edited in this draft):
-- legacy V190 added job.counts_as_placed NOT NULL DEFAULT 1;
-- archived source marks Internship offers as not placed. Current
-- placement_jobs Drizzle source lacks a corresponding explicit property.
-- This must be reconciled with placed counts, held-offer gates, reports
-- and any per-college custom job type without overwriting DB08 owner's files.

-- Witness requirements before marking a mapping verified:
-- 1. A college with NULL config uses the locked standard job types/outcomes.
-- 2. College A custom type/label never appears for college B.
-- 3. Concurrent writes preserve versions and domain-level validation.
-- 4. Drive countsAsPlaced snapshots are stable after custom type updates.
-- 5. Job offer cascade, placement reports, choices and shared employer
--    projections observe countsAsPlaced and fixed outcome enums.
-- 6. Every direct SQL payload and role permission check is negative-tested
--    on migrated disposable PostgreSQL with actual test result attached.
