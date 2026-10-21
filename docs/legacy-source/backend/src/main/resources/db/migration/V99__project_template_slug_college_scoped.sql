-- project_template.slug was uniquely constrained table-wide even though templates are a
-- per-college tenant entity, so two unrelated colleges both choosing an obvious slug (e.g.
-- "capstone-project") collided with each other's data. Rescope to (college_id, slug).
ALTER TABLE project_template DROP INDEX uk_project_template_slug;
ALTER TABLE project_template ADD UNIQUE KEY uk_project_template_college_slug (college_id, slug);
