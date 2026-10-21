-- getProjectTemplateVersionsPage() orders by (template_version DESC, changed_at DESC, id DESC).
-- The existing idx_project_template_version_version (template_id, template_version) only covers
-- the first sort key, so any template with multiple version-history rows sharing the same
-- template_version (this table logs one row per action, not one per version) falls back to a
-- filesort. Since each row also carries a JSON snapshot column, MySQL's filesort has to copy full
-- rows into the sort buffer, which is what triggered "Out of sort memory" for template 8 in prod.
-- A composite index matching the ORDER BY exactly lets MySQL satisfy it from the index without
-- a filesort at all.
CREATE INDEX idx_project_template_version_sort
    ON project_template_version (template_id, template_version DESC, changed_at DESC, id DESC);
