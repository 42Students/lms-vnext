package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

@Data
@Entity(name = "faculty_acct_verification")
@Table(name = "faculty_acct_verification")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class FacultyVerification extends BaseModel {
    @Column(name = "faculty_id")
    private int facultyId;
    @Column(name = "phone_number")
    private String phoneNumber;
    @Column(name = "otp")
    private String otp;
    @Column(name = "incorrect_attempts")
    private int incorrectAttempts;
    @Column(name = "blocked_till_ts")
    private String blockedTillTs;
    @Column(name = "verify_status")
    private boolean verifyStatus;
    //@Column(name = "is_deleted")
    //private int isDeleted;
    @Column(name = "is_expired")
    private int isExpired;
    @Column(name = "max_resend_attempts")
    private int maxResendAttempts;
}

