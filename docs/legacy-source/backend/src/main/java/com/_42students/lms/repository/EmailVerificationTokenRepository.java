package com._42students.lms.repository;

import com._42students.lms.model.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository for Email Verification Tokens
 * VOLATILE VERIFICATION STORAGE FIX: Database-backed token storage
 */
@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, String> {

    /**
     * Find token by token string
     * 
     * @param token Token UUID string
     * @return EmailVerificationToken if found
     */
    Optional<EmailVerificationToken> findByToken(String token);

    /**
     * Find token by email
     * Useful for checking if email has active verification token
     * 
     * @param email Email address
     * @return EmailVerificationToken if found
     */
    Optional<EmailVerificationToken> findByEmail(String email);

    /**
     * Find token by application ID
     * Links token to a specific application
     * 
     * @param applicationId Application ID (UUID)
     * @return EmailVerificationToken if found
     */
    Optional<EmailVerificationToken> findByApplicationId(String applicationId);

    /**
     * Check if email has been verified
     * Looks for verified token for the email
     * 
     * @param email Email address
     * @return true if verified token exists, false otherwise
     */
    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END " +
           "FROM EmailVerificationToken e WHERE e.email = :email AND e.verified = true")
    boolean isEmailVerified(@Param("email") String email);

    /**
     * Delete expired tokens
     * VOLATILE VERIFICATION STORAGE FIX: Cleanup mechanism for expired tokens
     * Used by scheduled cleanup task
     * 
     * @param now Current timestamp
     * @return Number of tokens deleted
     */
    @Modifying
    @Query("DELETE FROM EmailVerificationToken e WHERE e.expiresAt < :now AND e.verified = false")
    int deleteExpiredTokens(@Param("now") LocalDateTime now);

    /**
     * Delete all tokens for an email (useful for cleanup/reissuing)
     * 
     * @param email Email address
     * @return Number of tokens deleted
     */
    @Modifying
    @Query("DELETE FROM EmailVerificationToken e WHERE e.email = :email")
    int deleteByEmail(@Param("email") String email);
}


