-- Per-college template visibility: a template is invisible to a college's admin (and can't be
-- used to create a workspace) until a super-admin explicitly assigns it here. Opt-in by design —
-- no row means "not assigned," not "assigned by default."
CREATE TABLE IF NOT EXISTS project_template_college (
    id INT NOT NULL AUTO_INCREMENT,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    template_id INT NOT NULL,
    college_id INT NOT NULL,
    assigned_by INT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_project_template_college (template_id, college_id),
    KEY idx_project_template_college_college_id (college_id),
    CONSTRAINT fk_project_template_college_template
        FOREIGN KEY (template_id) REFERENCES project_template(id)
);
