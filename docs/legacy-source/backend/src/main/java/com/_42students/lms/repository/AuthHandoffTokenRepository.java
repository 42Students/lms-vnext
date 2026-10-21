package com._42students.lms.repository;

import com._42students.lms.model.AuthHandoffToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

public interface AuthHandoffTokenRepository extends JpaRepository<AuthHandoffToken, Integer> {

    @Query("SELECT t FROM AuthHandoffToken t WHERE t.isDeleted = false AND LOWER(t.token) = LOWER(:token)")
    Optional<AuthHandoffToken> findByToken(@Param("token") String token);

    /**
     * Marks the token used only if nobody has yet (BE-0190). Returns 1 for the one request that wins; a concurrent second request
     * gets 0. The read-check-then-save it replaces let two racing requests both receive the same session.
     */
    @Modifying
    @Transactional
    @Query("UPDATE AuthHandoffToken t SET t.used = true WHERE t.id = :id AND t.isDeleted = false AND (t.used = false OR t.used IS NULL)")
    int claimUnused(@Param("id") Integer id);

    /**
     * Soft-delete expired or already-used handoff tokens to prevent unbounded table growth.
     */
    @Modifying
    @Transactional
    @Query("UPDATE AuthHandoffToken t SET t.isDeleted = true WHERE t.isDeleted = false AND (t.used = true OR t.expiresAt < :now)")
    int softDeleteExpiredOrUsed(@Param("now") LocalDateTime now);
}

