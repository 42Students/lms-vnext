ALTER TABLE bug_report
    ADD COLUMN source_url VARCHAR(2000) NULL AFTER evidence_link,
    ADD COLUMN source_path VARCHAR(500) NULL AFTER source_url,
    ADD COLUMN browser VARCHAR(500) NULL AFTER source_path,
    ADD COLUMN viewport VARCHAR(64) NULL AFTER browser;
