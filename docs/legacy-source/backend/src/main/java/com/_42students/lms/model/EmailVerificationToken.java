package com._42students.lms.model;

import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * Email Verification Token Entity
 * VOLATILE VERIFICATION STORAGE FIX: Stores email verification tokens in database
 * instead of memory, supporting restarts and scaling.
 * 
 * Token Lifecycle:
 * - Created when verification email is sent
 * - Expires after TTL (default: 24 hours)
 * - Marked as verified when token is used
 * - Cleaned up by scheduled task when expired
 */
@Entity
@Table(name = "email_verification_token", indexes = {
    @Index(name = "idx_token", columnList = "token"),
    @Index(name = "idx_email", columnList = "email"),
    @Index(name = "idx_application_id", columnList = "application_id"),
    @Index(name = "idx_expires_at", columnList = "expires_at")
})
@Getter
@Setter
public class EmailVerificationToken {

    /**
     * Verification token (UUID string)
     * Primary key - unique identifier for verification
     */
    @Id
    @Column(name = "token", length = 36, nullable = false, unique = true)
    private String token;

    /**
     * Email address to verify
     */
    @Column(name = "email", nullable = false)
    private String email;

    /**
     * Application ID (UUID) - links token to an application record
     * Optional - allows tracking which application requested verification
     */
    @Column(name = "application_id", length = 36)
    private String applicationId;

    /**
     * Token expiration timestamp
     * TTL enforced: tokens expire after configured time (default: 24 hours)
     */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /**
     * Verification status
     * false = not yet verified
     * true = verified (token used)
     */
    @Column(name = "verified", nullable = false)
    private Boolean verified = false;

    /**
     * Timestamp when token was verified
     * null if not yet verified
     */
    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    /**
     * Token creation timestamp
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;
}


