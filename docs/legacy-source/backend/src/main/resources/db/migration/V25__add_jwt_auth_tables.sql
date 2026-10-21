-- ===========================================
-- V25: JWT Authentication Tables
-- ===========================================
-- MySQL does not support ADD COLUMN IF NOT EXISTS before 8.0.29; use procedure for compatibility.

DELIMITER //
DROP PROCEDURE IF EXISTS add_jwt_auth_columns//
CREATE PROCEDURE add_jwt_auth_columns()
BEGIN
  -- Add token_version to faculty if table exists and column not present
  IF EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'faculty') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'faculty' AND COLUMN_NAME = 'token_version'
    ) THEN
      ALTER TABLE faculty ADD COLUMN token_version INT NOT NULL DEFAULT 0;
    END IF;
  END IF;

  -- Add token_version to learner if table exists and column not present
  IF EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'learner') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'learner' AND COLUMN_NAME = 'token_version'
    ) THEN
      ALTER TABLE learner ADD COLUMN token_version INT NOT NULL DEFAULT 0;
    END IF;
  END IF;
END//
DELIMITER ;

CALL add_jwt_auth_columns();
DROP PROCEDURE IF EXISTS add_jwt_auth_columns;

-- Create refresh_token_blocklist table for token revocation
CREATE TABLE IF NOT EXISTS refresh_token_blocklist (
    jti VARCHAR(36) PRIMARY KEY COMMENT 'JWT ID (unique identifier for the token)',
    user_id INT NOT NULL COMMENT 'ID of the user who owned this token',
    user_type VARCHAR(20) NOT NULL COMMENT 'LEARNER or FACULTY',
    blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When the token was blocklisted',
    expires_at TIMESTAMP NOT NULL COMMENT 'Original token expiry (for cleanup)',
    INDEX idx_blocklist_expires (expires_at),
    INDEX idx_blocklist_user (user_id, user_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores revoked refresh tokens for logout and token rotation';
