-- One-time cross-domain auth handoff token for org switching.
-- Needed because cookies cannot be shared across different parent domains (custom domains).

CREATE TABLE IF NOT EXISTS auth_handoff_token (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted BOOLEAN DEFAULT 0,

  token VARCHAR(128) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT 0,

  UNIQUE KEY uq_auth_handoff_token_token (token),
  INDEX idx_auth_handoff_token_expires_used (expires_at, used)
);

