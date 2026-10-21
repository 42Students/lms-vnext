package com._42students.lms.access;

import com._42students.lms.security.UserPrincipal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request-scoped effective scope for the current user.
 * Populated from JWT principal only; no request param overrides.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScopeContext {
    private Integer userId;
    private String userType;
    private String facultyType;
    private Integer collegeId;
    private Integer organizationId;
    private boolean superAdmin;

    public static ScopeContext fromPrincipal(UserPrincipal principal) {
        if (principal == null) return null;
        return ScopeContext.builder()
                .userId(principal.getId())
                .userType(principal.getUserType())
                .facultyType(principal.getFacultyType())
                .collegeId(principal.getCollegeId())
                .organizationId(principal.getOrganizationId())
                .superAdmin(principal.getId() != null && principal.getId() == 0)
                .build();
    }
}

