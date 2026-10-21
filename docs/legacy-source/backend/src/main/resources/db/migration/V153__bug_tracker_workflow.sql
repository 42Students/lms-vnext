ALTER TABLE bug_report
    ADD COLUMN resolution VARCHAR(32) NULL AFTER status,
    ADD COLUMN affected_layer VARCHAR(24) NULL AFTER resolution,
    ADD COLUMN root_cause TEXT NULL AFTER affected_layer,
    ADD COLUMN fix_notes TEXT NULL AFTER root_cause,
    ADD COLUMN frontend_commit_sha VARCHAR(64) NULL AFTER fix_notes,
    ADD COLUMN backend_commit_sha VARCHAR(64) NULL AFTER frontend_commit_sha,
    ADD COLUMN regression_test_status VARCHAR(24) NOT NULL DEFAULT 'NOT_REVIEWED' AFTER backend_commit_sha,
    ADD COLUMN production_verified BOOLEAN NOT NULL DEFAULT FALSE AFTER regression_test_status,
    ADD COLUMN retest_status VARCHAR(24) NOT NULL DEFAULT 'NOT_RETESTED' AFTER production_verified,
    ADD COLUMN retested_at DATETIME(6) NULL AFTER retest_status;

CREATE TABLE bug_report_activity (
    id BIGINT NOT NULL AUTO_INCREMENT,
    bug_report_id BIGINT NOT NULL,
    activity_type VARCHAR(40) NOT NULL,
    actor_name VARCHAR(120) NULL,
    from_value VARCHAR(255) NULL,
    to_value VARCHAR(255) NULL,
    note VARCHAR(1000) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_bug_report_activity_issue_created (bug_report_id, created_at),
    CONSTRAINT fk_bug_report_activity_issue
        FOREIGN KEY (bug_report_id) REFERENCES bug_report(id) ON DELETE CASCADE
);
