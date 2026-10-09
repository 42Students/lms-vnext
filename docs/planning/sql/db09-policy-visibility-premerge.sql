-- DB09-A PRE-MERGE / UNREGISTERED migration draft.
-- Intentionally outside drizzle/ and _journal.json to avoid the active
-- DB03/DB04/DB08 migration sequence. Apply ONLY to disposable PostgreSQL
-- where the base LMS vNext migrations have already been replayed.
-- Do not run on any shared or production database.
--
-- Generated from the DB09 isolated Drizzle schema contract; rerun
-- drizzle-kit generate after rebasing the owning branches and inspect
-- its diff before registering the final numbered migration.

CREATE TABLE placement_college_rules (
  college_id uuid PRIMARY KEY NOT NULL
    REFERENCES colleges(id) ON DELETE RESTRICT,
  counts_as_placed_at varchar(20) NOT NULL DEFAULT 'OFFER_RELEASED',
  max_held_offers integer NOT NULL DEFAULT 1,
  uplift_pct integer NOT NULL DEFAULT 40,
  min_response_hours integer NOT NULL DEFAULT 48,
  version bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_college_rules_counts_at_ck
    CHECK (counts_as_placed_at IN ('SELECTED', 'OFFER_RELEASED', 'OFFER_ACCEPTED')),
  CONSTRAINT placement_college_rules_bounds_ck
    CHECK (max_held_offers >= 1 AND uplift_pct >= 0
      AND min_response_hours >= 1 AND version >= 0)
);

CREATE TABLE placement_company_visibility_settings (
  college_id uuid PRIMARY KEY NOT NULL
    REFERENCES colleges(id) ON DELETE RESTRICT,
  show_cgpa_exact boolean NOT NULL DEFAULT false,
  show_tenth_twelfth boolean NOT NULL DEFAULT true,
  show_project_links boolean NOT NULL DEFAULT true,
  show_assessment_scores boolean NOT NULL DEFAULT false,
  show_attendance boolean NOT NULL DEFAULT false,
  version bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_company_visibility_version_ck
    CHECK (version >= 0)
);
