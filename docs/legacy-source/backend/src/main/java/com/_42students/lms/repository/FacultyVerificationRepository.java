package com._42students.lms.repository;

import com._42students.lms.model.FacultyVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


@Repository
public interface FacultyVerificationRepository extends JpaRepository<FacultyVerification, Long> {
    @Query(value = "select otp from faculty_acct_verification where phone_number=:phoneNumber " +
            "and (is_deleted=0 or is_deleted is null) and (is_expired=0 or is_expired is null) order by updated_at DESC limit 1", nativeQuery = true)
    String getOTPByPhoneNumber(@Param("phoneNumber") String phoneNumber);
}
