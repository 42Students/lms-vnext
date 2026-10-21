package com._42students.lms.repository;

import com._42students.lms.model.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, String> {

    List<UserSession> findByUserIdAndUserTypeOrderByLastUsedAtDesc(Integer userId, String userType);

    /** Replace old JTI with new JTI on token rotation */
    @Modifying
    @Transactional
    @Query("UPDATE UserSession s SET s.jti = :newJti, s.lastUsedAt = :now WHERE s.jti = :oldJti")
    int rotateJti(@Param("oldJti") String oldJti, @Param("newJti") String newJti,
                  @Param("now") LocalDateTime now);

    /** Delete expired sessions (scheduled cleanup) */
    @Modifying
    @Transactional
    @Query("DELETE FROM UserSession s WHERE s.expiresAt < :now")
    int deleteExpired(@Param("now") LocalDateTime now);

    /** Delete by jti without throwing when the row is already gone (e.g. double logout) */
    @Modifying
    @Transactional
    @Query("DELETE FROM UserSession s WHERE s.jti = :jti")
    int deleteByJti(@Param("jti") String jti);
}

