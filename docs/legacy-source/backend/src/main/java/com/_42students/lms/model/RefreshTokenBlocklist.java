package com._42students.lms.model;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity for tracking revoked/blocklisted refresh tokens.
 * Used for:
 * - Logout (invalidate refresh token immediately)
 * - Token rotation (old refresh tokens are blocklisted after rotation)
 * - Token theft detection (if an already-used token is presented)
 */
@Data
@Entity
@Table(name = "refresh_token_blocklist")
public class RefreshTokenBlocklist {
    
    /**
     * JWT ID (jti claim) - unique identifier for the token
     */
    @Id
    @Column(name = "jti", length = 36)
    private String jti;
    
    /**
     * User ID who owned this token
     */
    @Column(name = "user_id", nullable = false)
    private Integer userId;
    
    /**
     * User type: LEARNER or FACULTY
     */
    @Column(name = "user_type", length = 20, nullable = false)
    private String userType;
    
    /**
     * When the token was added to the blocklist
     */
    @Column(name = "blocked_at", nullable = false)
    private LocalDateTime blockedAt = LocalDateTime.now();
    
    /**
     * Original token expiry time - used for cleanup
     * Tokens can be removed from blocklist after they would have expired anyway
     */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
}

