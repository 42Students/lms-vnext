-- DB09 shared parent composite keys.
-- STAGED ONLY. NOT REGISTERED. NOT EXECUTED.
--
-- Every key below is redundant for entity uniqueness because the first column
-- is already a PK, but PostgreSQL requires a non-partial UNIQUE/PK over the
-- exact referenced column set before a composite FK can enforce tenant/job
-- consistency. Centralizing these keys prevents DB09 staging files from
-- declaring the same parent constraint with different names/orders.
--
-- W01: deduplicate against DB01/DB08/DB10 registered migrations before use.
-- Prefer these ID-first shapes consistently in DB09 child FKs.

ALTER TABLE colleges
  ADD CONSTRAINT db09_colleges_id_organization_uq
  UNIQUE (id, organization_id);

ALTER TABLE college_memberships
  ADD CONSTRAINT db09_college_memberships_id_college_uq
  UNIQUE (id, college_id);

ALTER TABLE departments
  ADD CONSTRAINT db09_departments_id_college_uq
  UNIQUE (id, college_id);

ALTER TABLE placement_company_relationships
  ADD CONSTRAINT db09_company_relationships_id_college_uq
  UNIQUE (id, college_id);

ALTER TABLE placement_jobs
  ADD CONSTRAINT db09_placement_jobs_id_college_uq
  UNIQUE (id, college_id);

ALTER TABLE placement_applications
  ADD CONSTRAINT db09_placement_applications_id_job_uq
  UNIQUE (id, job_id);

ALTER TABLE placement_job_rounds
  ADD CONSTRAINT db09_placement_job_rounds_id_job_uq
  UNIQUE (id, job_id);

ALTER TABLE activity_events
  ADD CONSTRAINT db09_activity_events_id_scope_uq
  UNIQUE (id, organization_id, college_id);

-- Parent-key acceptance before registration:
-- 1) inspect pg_constraint/pg_index and skip any equivalent existing UNIQUE;
-- 2) generated Drizzle migration declares each surviving key once;
-- 3) no alternate college-first duplicate exists solely for DB09;
-- 4) child FKs use the ID-first order above;
-- 5) empty-db replay succeeds before DB09 child tables are registered;
-- 6) indexes are reviewed for unnecessary duplicate storage if a broader
--    cross-domain canonical tenant-key strategy supersedes this staging file.
