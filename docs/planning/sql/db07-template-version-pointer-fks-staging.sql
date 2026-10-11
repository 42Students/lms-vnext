-- DB-071 / Chat 2 — STAGED ONLY. No registered Drizzle migration.
-- Only Chat 1 may promote constraints, schema barrel and numbered journal.
-- Source: src/modules/projects/template-service.ts create/revise/duplicate
-- first INSERT/UPDATE project_templates.current_version, then INSERT
-- project_template_versions(template_id, version) inside the SAME transaction.
-- Immediate FK on current_version would break normal vNext authoring.
--
-- Current registered project_templates constraints only check the numeric
-- range (current_version >=1; published_version NULL or <= current_version).
-- They do NOT prove that the numbered version snapshot actually exists.
-- Already registered project_template_versions_template_version_uq provides
-- the required composite unique target on (template_id, version).
--
-- No legacy production database or migration/backfill is involved.

-- Preflight mismatch probes MUST return zero rows before migration. A DO
-- guard follows to fail closed even if a reviewer skips the SELECT results.
SELECT p.id AS bad_template_id, p.current_version
  FROM project_templates p
  LEFT JOIN project_template_versions v
    ON v.template_id = p.id AND v.version = p.current_version
 WHERE v.id IS NULL;

SELECT p.id AS bad_published_template_id, p.published_version
  FROM project_templates p
  LEFT JOIN project_template_versions v
    ON v.template_id = p.id AND v.version = p.published_version
 WHERE p.published_version IS NOT NULL AND v.id IS NULL;

DO $db07_template_version_pointer_guard$
BEGIN
  IF EXISTS (
    SELECT 1 FROM project_templates p
    LEFT JOIN project_template_versions v
      ON v.template_id = p.id AND v.version = p.current_version
    WHERE v.id IS NULL
  ) OR EXISTS (
    SELECT 1 FROM project_templates p
    LEFT JOIN project_template_versions v
      ON v.template_id = p.id AND v.version = p.published_version
    WHERE p.published_version IS NOT NULL AND v.id IS NULL
  ) THEN
    RAISE EXCEPTION 'DB07 template current/published version pointer is missing'
      USING ERRCODE = '23514';
  END IF;
END;
$db07_template_version_pointer_guard$;

-- Circular FK is deliberate: a version refers to template_id and the header
-- must refer to a version of itself. Defer until transaction commit so the
-- legitimate parent-first create/revise transaction succeeds.
ALTER TABLE project_templates
  ADD CONSTRAINT project_templates_current_version_snapshot_fk
  FOREIGN KEY (id, current_version)
  REFERENCES project_template_versions (template_id, version)
  ON DELETE NO ACTION
  DEFERRABLE INITIALLY DEFERRED;

-- Nullable published_version: MATCH SIMPLE (the PostgreSQL default) means
-- unpublish/draft templates need not have a published version. If non-null,
-- the version must belong to the SAME template_id and exist at commit.
ALTER TABLE project_templates
  ADD CONSTRAINT project_templates_published_version_snapshot_fk
  FOREIGN KEY (id, published_version)
  REFERENCES project_template_versions (template_id, version)
  ON DELETE NO ACTION
  DEFERRABLE INITIALLY DEFERRED;

-- Required acceptance (NOT RUN):
-- 1. registered migration replay from empty disposable PostgreSQL;
-- 2. pg_constraint contype=f, condeferrable=t, condeferred=t, convalidated=t;
-- 3. insert template (default current=1), then version 1 in same transaction,
--    COMMIT succeeds; missing version 1 fails SQLSTATE 23503 on COMMIT;
-- 4. revise current_version=2, then insert owned version 2 in same transaction,
--    COMMIT succeeds; missing version fails;
-- 5. publishing non-existent or another template's version fails 23503;
-- 6. setting published_version=NULL remains valid;
-- 7. existing create/revise/duplicate/publish/unpublish/project materialize
--    regression cases pass, plus DB068 owner FK and DB070 append-only guard.
