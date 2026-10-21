package com._42students.lms.repository;

import com._42students.lms.model.LearnerVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface LearnerAccountVerificationRepository extends JpaRepository<LearnerVerification, Long> {
    @Query(value = "select otp from learner_acct_verification where phone_number=:phoneNumber " +
            "and (is_deleted=0 or is_deleted is null) and (is_expired=0 or is_expired is null) order by updated_at DESC limit 1", nativeQuery = true)
    String getOTPByPhoneNumber(@Param("phoneNumber") String phoneNumber);

    @Query(value = "select otp from learner_acct_verification where learner_id=:learnerId " +
            "and (is_deleted=0 or is_deleted is null) and (is_expired=0 or is_expired is null) order by updated_at DESC limit 1", nativeQuery = true)
    String getOTPByStudentId(@Param("learnerId") int learnerId);

    @Query(value = "select otp from learner_acct_verification where phone_number=:email " +
            "and learner_id=0 and (is_deleted=0 or is_deleted is null) and (is_expired=0 or is_expired is null) order by updated_at DESC limit 1", nativeQuery = true)
    String getOTPByEmail(@Param("email") String email);

    /** SM-16: Get the timestamp of the most recent OTP sent to this phone/email (for DB-backed rate limiting) */
    @Query(value = "select updated_at from learner_acct_verification where phone_number=:phoneOrEmail " +
            "and (is_deleted=0 or is_deleted is null) order by updated_at DESC limit 1", nativeQuery = true)
    java.time.LocalDateTime getLastOtpSentAt(@Param("phoneOrEmail") String phoneOrEmail);

    @Query(value = "select phone_number from learner_acct_verification where learner_id=:learnerId " +
            "and (is_deleted=0 or is_deleted is null) and (is_expired=0 or is_expired is null) order by updated_at DESC limit 1", nativeQuery = true)
    String getPhoneByStudentId(@Param("learnerId") int learnerId);

}

