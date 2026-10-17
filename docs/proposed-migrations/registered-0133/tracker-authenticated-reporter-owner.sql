-- SA-placements-projects-101 / OD-27: proposed, single-writer registration required.
-- Existing 0076 reports have no authenticated owner provenance; they remain
-- Super-Admin-only until an independent verified owner attribution is possible.
ALTER TABLE bug_reports
  ADD COLUMN reporter_user_id uuid NULL REFERENCES users(id) ON DELETE RESTRICT;
CREATE INDEX db10_bug_reports_reporter_user_idx
  ON bug_reports(reporter_user_id, created_at);
-- New authenticated submissions write reporter_user_id atomically with the report.
-- Never infer it from reporter_name, email, access token, or selected account role.
-- Orchestrator must replay this migration on disposable PostgreSQL and verify
-- reporter A cannot read/edit/report for reporter B; old NULL rows stay private.
