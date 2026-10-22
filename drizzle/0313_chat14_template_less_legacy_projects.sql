-- Legacy ProjectWorkspace.templateId and templateSnapshot are nullable.
-- Preserve a manually authored workspace without inventing a template/version.
-- UI creation still requires a published assigned template; only import/provenance
-- paths can store the null pair.
ALTER TABLE project_instances ALTER COLUMN template_id DROP NOT NULL;
ALTER TABLE project_instances ALTER COLUMN template_version_id DROP NOT NULL;
ALTER TABLE project_instances ADD CONSTRAINT project_instances_template_pair_ck
  CHECK ((template_id IS NULL) = (template_version_id IS NULL));
