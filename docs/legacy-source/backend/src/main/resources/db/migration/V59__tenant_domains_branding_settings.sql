-- Tenant domains (custom domains + subdomain aliases), college branding, and global/org/college app settings.

CREATE TABLE IF NOT EXISTS tenant_domain (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted BOOLEAN DEFAULT 0,

  college_id INT NOT NULL,
  host VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT 0,

  UNIQUE KEY uq_tenant_domain_host (host),
  INDEX idx_tenant_domain_college_id (college_id),
  CONSTRAINT fk_tenant_domain_college_id FOREIGN KEY (college_id) REFERENCES college(id)
);

CREATE TABLE IF NOT EXISTS college_branding (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted BOOLEAN DEFAULT 0,

  college_id INT NOT NULL,

  -- URLs are stored as plain strings (can be Cloudflare R2 public URLs or CDN URLs)
  logo_url VARCHAR(1024) NULL,
  favicon_url VARCHAR(1024) NULL,
  login_background_url VARCHAR(1024) NULL,

  -- Theme tokens (hex or css color string)
  primary_color VARCHAR(64) NULL,
  secondary_color VARCHAR(64) NULL,

  -- Support links for tenant footer/login
  support_email VARCHAR(255) NULL,
  support_phone VARCHAR(64) NULL,
  terms_url VARCHAR(1024) NULL,
  privacy_url VARCHAR(1024) NULL,

  UNIQUE KEY uq_college_branding_college_id (college_id),
  CONSTRAINT fk_college_branding_college_id FOREIGN KEY (college_id) REFERENCES college(id)
);

CREATE TABLE IF NOT EXISTS app_setting (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted BOOLEAN DEFAULT 0,

  scope_type VARCHAR(32) NOT NULL, -- GLOBAL | ORGANIZATION | COLLEGE
  scope_id INT NULL,
  setting_key VARCHAR(255) NOT NULL,
  setting_value TEXT NULL,

  UNIQUE KEY uq_app_setting_scope_key (scope_type, scope_id, setting_key),
  INDEX idx_app_setting_scope (scope_type, scope_id)
);

