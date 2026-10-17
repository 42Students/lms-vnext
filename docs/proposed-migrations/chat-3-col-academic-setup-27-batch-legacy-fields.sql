-- PROPOSAL ONLY — do not apply directly. Orchestrator must register migration after review.
-- Gap COL-academic-setup-27: explicit batch academic year and custom dates
-- Deliberately additive so current cohort/period and enrollment lifecycle is unchanged.
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS academic_year varchar(16);
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS inactive_at timestamptz;
ALTER TABLE cohorts ADD CONSTRAINT cohorts_legacy_date_order_ck
 CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date);
-- Reconcile cohort.status PLANNED / ACTIVE / COMPLETED / ARCHIVED with legacy
-- Inactive terminology at the presentation/service layer only until owner
-- confirms adding an INACTIVE enum value. Avoid mutating the existing enum.
-- Existing academic periods remain the authoritative FK for sections.
-- Follow-up when registered: Drizzle schema, create/edit routes, date/year
-- form fields and annual batch grid columns.
