CREATE TABLE IF NOT EXISTS admin_audit_log (
    id BIGINT NOT NULL AUTO_INCREMENT,
    actor_user_id INT NULL,
    actor_user_type VARCHAR(20) NULL,
    actor_contact_mobile VARCHAR(32) NULL,
    action_key VARCHAR(100) NOT NULL,
    entity_type VARCHAR(60) NULL,
    entity_id VARCHAR(60) NULL,
    organization_id INT NULL,
    college_id INT NULL,
    ip_address VARCHAR(64) NULL,
    user_agent VARCHAR(512) NULL,
    payload_json JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_audit_created_at (created_at),
    INDEX idx_audit_actor (actor_user_id, actor_user_type),
    INDEX idx_audit_scope (organization_id, college_id),
    INDEX idx_audit_action (action_key)
);

