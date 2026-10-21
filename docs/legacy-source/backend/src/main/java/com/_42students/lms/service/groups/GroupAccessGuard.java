package com._42students.lms.service.groups;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.model.groups.LmsGroup;
import com._42students.lms.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Tenant isolation for the groups API, in the TpoAccessGuard style: a group that is missing,
 * belongs to another college, or is platform-owned when the caller is not super-admin all fail
 * with the same "Group not found", so the API is not an enumeration oracle.
 */
@Component
@RequiredArgsConstructor
public class GroupAccessGuard {

    private final GroupService groupService;
    private final AccessControlService accessControlService;

    /** The college an admin creates and lists groups for; null means platform scope (super-admin only). */
    public Integer manageableCollege(UserPrincipal p) {
        if (p == null) throw new IllegalArgumentException("Group not found");
        if (p.getCollegeId() != null) return p.getCollegeId();
        if (accessControlService.isSuperAdmin(p)) return null;
        throw new IllegalArgumentException("Select a college first");
    }

    public LmsGroup requireManageable(UserPrincipal p, Long groupId) {
        LmsGroup group = groupService.get(groupId);
        if (group.isPlatformOwned()) {
            if (!accessControlService.isSuperAdmin(p)) throw new IllegalArgumentException("Group not found");
            return group;
        }
        if (!accessControlService.canPerformAdminActionForCollege(p, group.getCollegeId())) {
            throw new IllegalArgumentException("Group not found");
        }
        return group;
    }

    /** Learner side: own college, or platform-owned. */
    public LmsGroup requireVisibleToLearner(UserPrincipal p, Long groupId) {
        LmsGroup group = groupService.get(groupId);
        if (group.isPlatformOwned()) return group;
        if (p == null || p.getCollegeId() == null || !group.getCollegeId().equals(p.getCollegeId())) {
            throw new IllegalArgumentException("Group not found");
        }
        return group;
    }
}
