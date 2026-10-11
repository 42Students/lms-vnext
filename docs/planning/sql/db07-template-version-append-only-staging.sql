-- DB-070 / Chat 2 — STAGED ONLY, NOT a registered Drizzle migration.
-- Chat 1 alone decides registration, ordered migration, snapshot and replay.
--
-- src/modules/projects/template-service.ts has 3 insert call sites for
-- project_template_versions and NO update/delete paths. A versioned blueprint
-- is a historical published/draft snapshot: changes create a new version.
-- The registered DB schema currently does not prohibit privileged direct SQL
-- UPDATE/DELETE, including before any college has materialized the version.
--
-- This is GREENFIELD: no legacy production data migration or backfill.
-- Do not apply until the owner approves permanent append-only retention.

CREATE OR REPLACE FUNCTION db07_deny_template_version_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $db07_template_revision_guard$
BEGIN
  -- Fail closed for both referenced and as-yet unreferenced versions.
  -- Referenced versions may already be protected by child FKs, but unreferenced
  -- versions are not. Both must be equally immutable for audit parity.
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'project template version % is immutable (UPDATE)', OLD.id
      USING ERRCODE = '23514';
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'project template version % is immutable (DELETE)', OLD.id
      USING ERRCODE = '23514';
  END IF;
  RETURN OLD;
END;
$db07_template_revision_guard$;

CREATE TRIGGER db07_project_template_versions_append_only
BEFORE UPDATE OR DELETE ON project_template_versions
FOR EACH ROW
EXECUTE FUNCTION db07_deny_template_version_mutation();

-- Do NOT add an equivalent guard to project_templates: the header deliberately
-- updates status/current_version/published_version/archived_at.
-- Do NOT freeze project_template_college_assignments.template_version_id:
-- a live college assignment can be upgraded to a different immutable
-- version owned by the SAME template.
--
-- W01 promotion conditions:
-- 1. review all source writers including bootstrap/admin/seed and archive;
-- 2. run disposable zero-to-head journal migration and pg_trigger introspect;
-- 3. verify INSERT new revision works; UPDATE(title/blueprint/template_id)
--    and DELETE both referenced/unreferenced revisions fail SQLSTATE 23514;
-- 4. verify template header lifecycle, assignment republish and existing
--    project materialization still work;
-- 5. record accepted retention/erratum strategy: a bad version is superseded
--    by a new version and is never rewritten silently.
