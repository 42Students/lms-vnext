CREATE TABLE IF NOT EXISTS project_task_comment (
    id INT NOT NULL AUTO_INCREMENT,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    project_id INT NOT NULL,
    project_task_id INT NOT NULL,
    commenter_id INT NULL,
    commenter_type VARCHAR(20) NULL,
    commenter_name VARCHAR(160) NULL,
    message TEXT NULL,
    progress_value INT NULL,
    PRIMARY KEY (id),
    KEY idx_project_task_comment_lookup (project_id, project_task_id, is_deleted),
    CONSTRAINT fk_project_task_comment_task FOREIGN KEY (project_task_id) REFERENCES project_task(id),
    CONSTRAINT fk_project_task_comment_project FOREIGN KEY (project_id) REFERENCES project_workspace(id)
);
