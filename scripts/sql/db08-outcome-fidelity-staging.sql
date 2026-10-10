-- DB-021 / DB08 outcome-fidelity contract — STAGING ONLY, NOT A DRIZZLE MIGRATION.
-- Oracle: 42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5
--   V190__job_types_and_placement_outcomes.sql (counts_as_placed; outcome_label/detail)
--   V161__tpo_v1_drives.sql (job_offer terms, acceptance, disputes).
--
-- Integration owner: Chat 1. DO NOT run in production, register in drizzle/meta,
-- export schema additions, or claim completed PostgreSQL verification from this file.
-- Order: after registered placement_jobs/placement_offers/job_role_options
--        AND after DB08-B placement_batch_registrations + events migration.
--
-- Greenfield: no legacy import/backfill. Data begins in vNext flows.
-- Do NOT apply legacy "internship always false" as a hard DB CHECK; V190
-- explicitly permits a drive to override whether its offers count as placed.
-- Application writer must persist its resolved job-type default/override.

ALTER TABLE placement_jobs
  ADD COLUMN counts_as_placed boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN placement_jobs.counts_as_placed IS
  'Per-drive placed-count policy; reporting/held-offer queries must read this persisted value instead of inferring from employment_type.';

-- Outcome details are optional; PLACEMENTS requires consent under the existing
-- check, non-placement choices may have a college-specific label and detail.
-- A row may switch outcome choice, so the history event needs before/after
-- detail snapshots as well as choice/consent snapshots.
ALTER TABLE placement_batch_registrations
  ADD COLUMN outcome_label varchar(60),
  ADD COLUMN outcome_detail varchar(200);

ALTER TABLE placement_batch_registration_events
  ADD COLUMN previous_outcome_label varchar(60),
  ADD COLUMN next_outcome_label varchar(60),
  ADD COLUMN previous_outcome_detail varchar(200),
  ADD COLUMN next_outcome_detail varchar(200);

ALTER TABLE placement_batch_registrations
  ADD CONSTRAINT db08_registration_outcome_text_ck CHECK (
    (outcome_label IS NULL OR length(btrim(outcome_label)) > 0)
    AND (outcome_detail IS NULL OR length(btrim(outcome_detail)) > 0)
  );

ALTER TABLE placement_batch_registration_events
  ADD CONSTRAINT db08_registration_event_outcome_text_ck CHECK (
    (previous_outcome_label IS NULL OR length(btrim(previous_outcome_label)) > 0)
    AND (next_outcome_label IS NULL OR length(btrim(next_outcome_label)) > 0)
    AND (previous_outcome_detail IS NULL OR length(btrim(previous_outcome_detail)) > 0)
    AND (next_outcome_detail IS NULL OR length(btrim(next_outcome_detail)) > 0)
  );

-- Legacy role_options_json also contains per-role package/bond figures.
-- Keep precision from DECIMAL(10,2) LPA in the proposal; do not silently
-- convert these amounts to INTEGER annual INR before conversion policy tests.
ALTER TABLE placement_job_role_options
  ADD COLUMN fixed_lpa numeric(10,2),
  ADD COLUMN variable_lpa numeric(10,2),
  ADD COLUMN joining_bonus_lpa numeric(10,2),
  ADD COLUMN bond_months integer,
  ADD COLUMN bond_amount numeric(10,2);

ALTER TABLE placement_job_role_options
  ADD CONSTRAINT db08_role_package_nonnegative_ck CHECK (
    (fixed_lpa IS NULL OR fixed_lpa >= 0)
    AND (variable_lpa IS NULL OR variable_lpa >= 0)
    AND (joining_bonus_lpa IS NULL OR joining_bonus_lpa >= 0)
    AND (bond_months IS NULL OR bond_months >= 0)
    AND (bond_amount IS NULL OR bond_amount >= 0)
  );

-- Do not reuse the old public letter_url: private object references belong
-- to DB-016's security/receipt review, and an immutable audit/event history
-- must capture the later release/revocation state-machine changes.
ALTER TABLE placement_offers
  ADD COLUMN kind varchar(10) NOT NULL DEFAULT 'OFFER',
  ADD COLUMN fixed_lpa numeric(10,2),
  ADD COLUMN variable_lpa numeric(10,2),
  ADD COLUMN joining_bonus_lpa numeric(10,2),
  ADD COLUMN bond_months integer,
  ADD COLUMN bond_amount numeric(10,2),
  ADD COLUMN acceptance_channel varchar(15),
  ADD COLUMN accepted_disputable_until timestamp with time zone,
  ADD COLUMN cascade_id uuid,
  ADD COLUMN revoke_reason varchar(500),
  ADD COLUMN released_at timestamp with time zone;

ALTER TABLE placement_offers
  ADD CONSTRAINT db08_offer_kind_ck CHECK (kind IN ('LOI', 'OFFER')),
  ADD CONSTRAINT db08_offer_package_nonnegative_ck CHECK (
    (fixed_lpa IS NULL OR fixed_lpa >= 0)
    AND (variable_lpa IS NULL OR variable_lpa >= 0)
    AND (joining_bonus_lpa IS NULL OR joining_bonus_lpa >= 0)
    AND (bond_months IS NULL OR bond_months >= 0)
    AND (bond_amount IS NULL OR bond_amount >= 0)
  ),
  ADD CONSTRAINT db08_offer_acceptance_channel_ck CHECK (
    acceptance_channel IS NULL OR acceptance_channel IN ('IN_APP', 'EXTERNAL_IMPORT')
  ),
  ADD CONSTRAINT db08_offer_dispute_channel_ck CHECK (
    accepted_disputable_until IS NULL OR (
      acceptance_channel = 'EXTERNAL_IMPORT'
      AND accepted_disputable_until >= issued_at
    )
  ),
  ADD CONSTRAINT db08_offer_revocation_reason_ck CHECK (
    revoke_reason IS NULL OR length(btrim(revoke_reason)) > 0
  );

CREATE INDEX db08_offers_cascade_id_idx
  ON placement_offers (cascade_id)
  WHERE cascade_id IS NOT NULL;

-- Explicit exclusions of this stage:
-- * status values SELECTED/PENDING_VERIFICATION/EXPIRED/REVOKED, undo cascade
--   writes, actor attribution, offer letter privacy and employer/TPO approvals:
--   require a later coupled service+DB state-machine decision.
-- * counts-as-placed aggregation and downstream "held offer" computation:
--   must read placement_jobs.counts_as_placed when the writer is enabled.
-- * DB08 batch registration event writers must fill outcome before/after
--   snapshots; the proposed columns alone do not implement history parity.
-- * Drizzle table exports/snapshot/journal are NOT updated here.
