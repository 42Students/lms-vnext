-- Phase 4 - Gap 8.2: Application status history for timeline/audit
-- Tracks each status change: application_id, old_status, new_status, changed_at, changed_by, rejection_reason (optional)

CREATE TABLE IF NOT EXISTS job_application_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  old_status VARCHAR(50) NULL COMMENT 'Null for initial APPLIED',
  new_status VARCHAR(50) NOT NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  changed_by INT NULL COMMENT 'User ID who made the change',
  rejection_reason VARCHAR(500) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  INDEX idx_jash_application_id (application_id),
  INDEX idx_jash_changed_at (changed_at),
  CONSTRAINT fk_jash_application FOREIGN KEY (application_id) REFERENCES job_application(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
