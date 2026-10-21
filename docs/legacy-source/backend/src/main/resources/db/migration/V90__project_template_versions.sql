CREATE TABLE IF NOT EXISTS project_template_version (
    id INT NOT NULL AUTO_INCREMENT,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    template_id INT NOT NULL,
    template_version INT NOT NULL,
    action_type VARCHAR(40) NOT NULL,
    lifecycle_status VARCHAR(20) NULL,
    changed_by INT NULL,
    changed_at DATETIME NULL,
    notes TEXT NULL,
    snapshot_json JSON NULL,
    PRIMARY KEY (id),
    KEY idx_project_template_version_template_id (template_id),
    KEY idx_project_template_version_version (template_id, template_version),
    CONSTRAINT fk_project_template_version_template
        FOREIGN KEY (template_id) REFERENCES project_template(id)
);
