-- AC-05: Per-device session tracking.
-- Each row represents one active login session (keyed by refresh token JTI).
-- On login  → INSERT. On token rotation → UPDATE jti. On logout/revoke → DELETE.
CREATE TABLE user_session (
    jti         VARCHAR(36)  NOT NULL,
    user_id     INT          NOT NULL,
    user_type   VARCHAR(20)  NOT NULL,
    device_name VARCHAR(255) NULL,      -- optional label sent by client
    user_agent  VARCHAR(512) NULL,      -- HTTP User-Agent at login time
    ip_address  VARCHAR(64)  NULL,      -- client IP at login time
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at  DATETIME     NOT NULL,
    PRIMARY KEY (jti),
    INDEX idx_user_session_user (user_id, user_type)
);
