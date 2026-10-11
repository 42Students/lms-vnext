-- DB-068 / Chat 2 — source-backed DRAFT ONLY. DO NOT APPLY TO PRODUCTION.
-- NOT registered in the Drizzle migration journal or src/db/schema/index.ts.
-- Sole registered-migration/schema integrator: Chat 1.
--
-- Current src/db/schema/projects.ts has project_template_versions.template_id,
-- project_template_college_assignments.(template_id, template_version_id)
-- and project_instances.(template_id, template_version_id).
-- Both child tables have separate single-column foreign keys, which allow
-- a valid Template A UUID to be paired with Template B's valid version UUID.
-- Services usually guard this on lookup, but direct SQL can violate it.
-- No legacy data needs to be copied into the greenfield vNext DB.
--
-- Run ONLY through Chat 1's approved numbered migration workflow after
-- reviewing schema and an empty-to-head disposable PostgreSQL replay.

-- These probes must return zero BEFORE adding constraints. Keeping them
-- explicit prevents accidental promotion over corrupt seeded/project data.
-- The integrator must run/read these SQL queries and abort on any nonzero
-- rows; the DO guard is fail-closed even if preflight was skipped.
SELECT a.id AS bad_assignment_id, a.template_id AS declared_template_id,
       v.template_id AS version_owner_template_id
  FROM project_template_college_assignments a
  JOIN project_template_versions v ON v.id = a.template_version_id
 WHERE a.template_id <> v.template_id;

SELECT p.id AS bad_project_id, p.template_id AS declared_template_id,
       v.template_id AS version_owner_template_id
  FROM project_instances p
  JOIN project_template_versions v ON v.id = p.template_version_id
 WHERE p.template_id <> v.template_id;

DO $db07_template_integrity$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM project_template_college_assignments a
      JOIN project_template_versions v ON v.id = a.template_version_id
     WHERE a.template_id <> v.template_id
  ) OR EXISTS (
    SELECT 1
      FROM project_instances p
      JOIN project_template_versions v ON v.id = p.template_version_id
     WHERE p.template_id <> v.template_id
  ) THEN
    RAISE EXCEPTION 'DB07 template-version owner mismatch; reject migration'
      USING ERRCODE = '23514';
  END IF;
END;
$db07_template_integrity$;

-- A composite foreign key requires an explicitly unique target. UUID id
-- is still the PK; this additional target is necessary for PostgreSQL.
CREATE UNIQUE INDEX IF NOT EXISTS
  project_template_versions_template_id_id_uq
  ON project_template_versions (template_id, id);

-- Template assignment version must belong to the assigned template. An
-- existing assignment may deliberately be updated to a NEW version of the
-- SAME template (source: assignProjectTemplateToCollege); do not freeze its
-- version ID or change its revoked_at semantics.
ALTER TABLE project_template_college_assignments
  ADD CONSTRAINT project_template_assignments_template_version_owner_fk
  FOREIGN KEY (template_id, template_version_id)
  REFERENCES project_template_versions (template_id, id)
  ON DELETE RESTRICT;

-- A materialized instance's recorded immutable source version must belong
-- to its recorded template. This does NOT require the assignment to remain
-- active after creation; previously created projects survive revocation.
ALTER TABLE project_instances
  ADD CONSTRAINT project_instances_template_version_owner_fk
  FOREIGN KEY (template_id, template_version_id)
  REFERENCES project_template_versions (template_id, id)
  ON DELETE RESTRICT;

-- No DROP, TRUNCATE, unsafe ALTER of historical rows, or relaxation of
-- existing single-column UUID FKs is needed.
-- Acceptance requires:
-- 1. migration replay from empty PG plus catalog assertions for both FKs;
-- 2. direct INSERT/UPDATE mismatch SQLSTATE 23503 for both child tables;
-- 3. valid same-owner assignment/instance INSERT and same-template version
--    re-assignment work, including after an assignment is revoked;
-- 4. project service/materialization integration regression is green;
-- 5. no active schema registration claimed from this staged reference.
