package com._42students.lms.model;

import lombok.Data;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "tenant_domain")
@Data
public class TenantDomain extends BaseModel {

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @Column(name = "host", nullable = false, unique = true)
    private String host;

    @Column(name = "is_primary")
    private Boolean isPrimary = false;

    @Column(name = "verification_token")
    private String verificationToken;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "is_verified")
    private Boolean isVerified = false;

    @Column(name = "last_checked_at")
    private LocalDateTime lastCheckedAt;

    // One of: NO_RECORD, WRONG_VALUE, TIMEOUT_OR_ERROR, VERIFIED — see TenantDomainVerificationService.
    @Column(name = "last_check_result")
    private String lastCheckResult;

    // Raw TXT values actually found at the checked names, for diagnosing a mismatched/incomplete
    // DNS setup without needing shell access to `dig`.
    @Column(name = "last_found_values")
    private String lastFoundValues;
}

