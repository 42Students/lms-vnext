-- PROPOSED / NOT REGISTERED. Orchestrator must assign a numbered migration
-- under drizzle/ and replay its registered journal on disposable PostgreSQL
-- before accepting PROJ-HARNESS-PLACEMENTS-19.
-- Source model: src/db/schema/placements.ts
-- No backfill: greenfield vNext. Audit existing rows in any occupied dev DB
-- before promotion; do not drop/repair customer applications implicitly.

SELECT a.id, a.job_id, a.role_option_id
FROM placement_applications a
JOIN placement_job_role_options role ON role.id = a.role_option_id
WHERE role.job_id IS DISTINCT FROM a.job_id;

ALTER TABLE placement_job_role_options
  ADD CONSTRAINT placement_job_role_options_id_job_uq
  UNIQUE (id, job_id);

ALTER TABLE placement_applications
  ADD CONSTRAINT placement_applications_role_option_job_fk
  FOREIGN KEY (role_option_id, job_id)
  REFERENCES placement_job_role_options(id, job_id)
  ON DELETE RESTRICT;
