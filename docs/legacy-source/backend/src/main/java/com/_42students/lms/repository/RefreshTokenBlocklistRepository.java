package com._42students.lms.repository;

import com._42students.lms.model.RefreshTokenBlocklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for managing refresh token blocklist.
 * Used for token revocation on logout and token rotation.
 */
@Repository
public interface RefreshTokenBlocklistRepository extends JpaRepository<RefreshTokenBlocklist, String> {
    
    /**
     * Check if a token JTI is blocklisted
     */
    boolean existsByJti(String jti);
    
    /**
     * Find all blocklisted tokens for a user
     */
    List<RefreshTokenBlocklist> findByUserIdAndUserType(Integer userId, String userType);
    
    /**
     * Delete expired entries (cleanup job)
     * Tokens that have passed their natural expiry can be removed from blocklist
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM RefreshTokenBlocklist r WHERE r.expiresAt < :now")
    int deleteExpiredTokens(@Param("now") LocalDateTime now);
    
    /**
     * Count blocklisted tokens for a user (useful for monitoring)
     */
    long countByUserIdAndUserType(Integer userId, String userType);
}

