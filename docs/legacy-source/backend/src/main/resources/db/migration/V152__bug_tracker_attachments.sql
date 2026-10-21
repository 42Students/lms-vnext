CREATE TABLE bug_report_attachment (
    id BIGINT NOT NULL AUTO_INCREMENT,
    bug_report_id BIGINT NOT NULL,
    storage_key VARCHAR(700) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_bug_report_attachment_storage_key (storage_key),
    KEY idx_bug_report_attachment_issue_created (bug_report_id, created_at),
    CONSTRAINT fk_bug_report_attachment_issue
        FOREIGN KEY (bug_report_id) REFERENCES bug_report(id) ON DELETE CASCADE
);
