package com._42students.lms.model;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * AC-05: Tracks one active login session per device/login.
 * Keyed by refresh token JTI — one session = one refresh token family.
 */
@Data
@Entity
@Table(name = "user_session",
       indexes = @Index(name = "idx_user_session_user", columnList = "user_id, user_type"))
public class UserSession {

    /** Refresh token JTI — unique identifier for this session */
    @Id
    @Column(name = "jti", length = 36)
    private String jti;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "user_type", length = 20, nullable = false)
    private String userType;

    /** Optional human-readable label provided by the client (e.g. "iPhone 15", "Chrome on Mac") */
    @Column(name = "device_name", length = 255)
    private String deviceName;

    @Column(name = "user_agent", length = 512)
    private String userAgent;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "last_used_at", nullable = false)
    private LocalDateTime lastUsedAt = LocalDateTime.now();

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
}

