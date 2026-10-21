package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityListeners;
import javax.persistence.Table;
import java.time.LocalDateTime;

@Data
@Entity(name = "mobile_login_attempt")
@Table(name = "mobile_login_attempt")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class MobileLoginAttempt extends BaseModel {

    @Column(name = "attempt_id", unique = true, nullable = false, length = 64)
    private String attemptId;

    @Column(name = "phone", nullable = false, length = 32)
    private String phone;

    @Column(name = "otp", nullable = false, length = 12)
    private String otp;

    @Column(name = "email_otp", length = 12)
    private String emailOtp;

    @Column(name = "email_otp_expires_at")
    private LocalDateTime emailOtpExpiresAt;

    @Column(name = "email_otp_sent_at")
    private LocalDateTime emailOtpSentAt;

    @Column(name = "user_type", nullable = false, length = 16)
    private String userType; // LEARNER / FACULTY

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "college_id")
    private Integer collegeId;

    @Column(name = "organization_id")
    private Integer organizationId;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "used", nullable = false)
    private boolean used = false;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;
}


