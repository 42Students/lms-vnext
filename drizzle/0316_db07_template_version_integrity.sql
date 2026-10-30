-- DB068/DB070/DB071: template owner integrity, immutable revisions,
-- and deferred current/published version ancestry. No data rewrite.
-- Lock all parent/child writers so preflight and new FK validation are atomic.
LOCK TABLE project_templates,project_template_versions,project_template_college_assignments,project_instances IN SHARE ROW EXCLUSIVE MODE;
--> statement-breakpoint
DO $db07_template_preflight$
BEGIN
 IF EXISTS (
   SELECT 1 FROM project_template_college_assignments a
   JOIN project_template_versions v ON v.id=a.template_version_id
   WHERE a.template_id<>v.template_id
 ) OR EXISTS (
   SELECT 1 FROM project_instances p
   JOIN project_template_versions v ON v.id=p.template_version_id
   WHERE p.template_id<>v.template_id
 ) OR EXISTS (
   SELECT 1 FROM project_templates t
   LEFT JOIN project_template_versions v ON v.template_id=t.id AND v.version=t.current_version
   WHERE v.id IS NULL
 ) OR EXISTS (
   SELECT 1 FROM project_templates t
   LEFT JOIN project_template_versions v ON v.template_id=t.id AND v.version=t.published_version
   WHERE t.published_version IS NOT NULL AND v.id IS NULL
 ) THEN
  RAISE EXCEPTION 'DB068/071 existing template-version mismatch; migration aborted'
   USING ERRCODE='23514';
 END IF;
END $db07_template_preflight$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS project_template_versions_template_id_id_uq
 ON project_template_versions(template_id,id);
--> statement-breakpoint
ALTER TABLE project_template_college_assignments
 ADD CONSTRAINT project_template_assignments_template_version_owner_fk
 FOREIGN KEY(template_id,template_version_id)
 REFERENCES project_template_versions(template_id,id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE project_instances
 ADD CONSTRAINT project_instances_template_version_owner_fk
 FOREIGN KEY(template_id,template_version_id)
 REFERENCES project_template_versions(template_id,id) ON DELETE RESTRICT;
--> statement-breakpoint
-- Header insert precedes version insert by DESIGN. These FKs must defer
-- until commit; an immediate FK would break template creation/revision.
ALTER TABLE project_templates
 ADD CONSTRAINT project_templates_current_version_snapshot_fk
 FOREIGN KEY(id,current_version)
 REFERENCES project_template_versions(template_id,version)
 ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
ALTER TABLE project_templates
 ADD CONSTRAINT project_templates_published_version_snapshot_fk
 FOREIGN KEY(id,published_version)
 REFERENCES project_template_versions(template_id,version)
 ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION db07_deny_template_version_mutation()
RETURNS trigger LANGUAGE plpgsql AS $db07_template_version_guard$
BEGIN
 IF TG_OP = 'TRUNCATE' THEN
  RAISE EXCEPTION 'project template versions are immutable (TRUNCATE)'
   USING ERRCODE='23514';
 ELSIF TG_OP = 'UPDATE' THEN
  RAISE EXCEPTION 'project template version % is immutable (UPDATE)',OLD.id
   USING ERRCODE='23514';
 ELSIF TG_OP = 'DELETE' THEN
  RAISE EXCEPTION 'project template version % is immutable (DELETE)',OLD.id
   USING ERRCODE='23514';
 END IF;
 RETURN OLD;
END $db07_template_version_guard$;
--> statement-breakpoint
CREATE TRIGGER db07_project_template_versions_append_only
 BEFORE UPDATE OR DELETE ON project_template_versions
 FOR EACH ROW EXECUTE FUNCTION db07_deny_template_version_mutation();
--> statement-breakpoint
-- DELETE triggers do NOT fire for TRUNCATE CASCADE. Guard it explicitly.
CREATE TRIGGER db07_project_template_versions_no_truncate
 BEFORE TRUNCATE ON project_template_versions
 FOR EACH STATEMENT EXECUTE FUNCTION db07_deny_template_version_mutation();
