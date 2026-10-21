package com._42students.lms.repository;

import com._42students.lms.model.MobileLoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface MobileLoginAttemptRepository extends JpaRepository<MobileLoginAttempt, Integer> {

    @Query(value = "SELECT * FROM mobile_login_attempt WHERE attempt_id = :attemptId AND (is_deleted = 0 OR is_deleted IS NULL) LIMIT 1", nativeQuery = true)
    Optional<MobileLoginAttempt> findByAttemptId(@Param("attemptId") String attemptId);

    @Query(value = "SELECT COUNT(*) FROM mobile_login_attempt WHERE phone = :phone AND used = 0 AND created_at >= :since AND (is_deleted = 0 OR is_deleted IS NULL)", nativeQuery = true)
    long countActiveAttemptsSince(@Param("phone") String phone, @Param("since") LocalDateTime since);

    /** Email-first attempts have no phone, so their rate limit counts by the account instead. */
    @Query(value = "SELECT COUNT(*) FROM mobile_login_attempt WHERE user_type = :userType AND user_id = :userId AND used = 0 AND created_at >= :since AND (is_deleted = 0 OR is_deleted IS NULL)", nativeQuery = true)
    long countActiveUserAttemptsSince(@Param("userType") String userType, @Param("userId") Integer userId, @Param("since") LocalDateTime since);

    /**
     * Atomic shared five-attempt budget; enforced across all application replicas and both OTP channels.
     *
     * <p>The {@code countQuery} is never executed for a modifying statement. It exists because Spring Data
     * JPA 2.7.8 derives a count query from every {@code @Query} while building the repository, and for a
     * native non-SELECT statement that derivation throws a NullPointerException, which stopped the whole
     * application from starting in production. Same workaround as {@code NotificationRepository.softDeleteOlderThan};
     * {@code NativeModifyingQueryCountQueryGuardTest} fails the build if a query like this omits it.
     */
    @Modifying
    @Transactional
    @Query(value = "UPDATE mobile_login_attempt SET verification_attempts = verification_attempts + 1 "
            + "WHERE attempt_id = :attemptId AND verification_attempts < 5 AND expires_at > :now "
            + "AND (is_deleted = 0 OR is_deleted IS NULL)",
            countQuery = "SELECT COUNT(*) FROM mobile_login_attempt "
            + "WHERE attempt_id = :attemptId AND verification_attempts < 5 AND expires_at > :now "
            + "AND (is_deleted = 0 OR is_deleted IS NULL)",
            nativeQuery = true)
    int reserveVerificationAttempt(@Param("attemptId") String attemptId, @Param("now") LocalDateTime now);
}

