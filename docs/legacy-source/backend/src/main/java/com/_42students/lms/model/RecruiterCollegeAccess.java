package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.CollectionTable;
import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.Table;
import javax.persistence.Version;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * One college a recruiter may enter, with the capabilities they hold there. A revoked grant is kept for
 * history; granting the same college again re-activates it. See docs/recruiter-tpo/DESIGN.md.
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity(name = "recruiter_college_access")
@Table(name = "recruiter_college_access")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class RecruiterCollegeAccess extends BaseModel {

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_REVOKED = "REVOKED";

    @Column(name = "recruiter_id", nullable = false)
    private Integer recruiterId;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @Column(name = "organization_id")
    private Integer organizationId;

    @Column(name = "status", nullable = false, length = 20)
    private String status = STATUS_ACTIVE;

    /** Optional end of access. Past this instant the grant is inactive. */
    @Column(name = "valid_until")
    private LocalDateTime validUntil;

    @Column(name = "granted_by_user_id")
    private Integer grantedByUserId;

    @Column(name = "granted_by_user_type", length = 20)
    private String grantedByUserType;

    @Column(name = "granted_at", nullable = false)
    private LocalDateTime grantedAt;

    @Column(name = "revoked_by_user_id")
    private Integer revokedByUserId;

    @Column(name = "revoked_by_user_type", length = 20)
    private String revokedByUserType;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @Column(name = "revoke_reason", length = 500)
    private String revokeReason;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "recruiter_college_access_capability", joinColumns = @JoinColumn(name = "access_id"))
    @Column(name = "capability", length = 64)
    private Set<String> capabilities = new HashSet<>();

    // Must stay null for new entities (Spring Data isNew() check), same as Faculty.version.
    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    /** Active right now: not deleted, status ACTIVE and not past valid_until. */
    public boolean isActiveAt(LocalDateTime now) {
        if (Boolean.TRUE.equals(getIsDeleted())) return false;
        if (!STATUS_ACTIVE.equals(status)) return false;
        return validUntil == null || now.isBefore(validUntil);
    }
}
