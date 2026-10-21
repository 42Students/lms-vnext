package com._42students.lms.access;

import com._42students.lms.enums.FacultyType;
import com._42students.lms.model.Faculty;
import com._42students.lms.security.UserPrincipal;
import org.springframework.security.access.AccessDeniedException;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Objects;
import java.util.Set;

/**
 * Faculty roles that only a super admin may create or manage. A college admin can neither grant
 * these roles nor edit, delete, suspend or reactivate another holder of one (editing your own row
 * is still allowed; deleting or suspending yourself is not). See docs/recruiter-tpo/DESIGN.md.
 *
 * Adding a role here protects it on every guarded path at once: faculty register / update / delete,
 * admin suspend / reactivate and faculty profile writes.
 */
public final class ProtectedFacultyRoles {

    public static final Set<FacultyType> PROTECTED =
            Collections.unmodifiableSet(EnumSet.of(FacultyType.ADMIN, FacultyType.TPO));

    private ProtectedFacultyRoles() {
    }

    public static boolean isProtected(FacultyType type) {
        return type != null && PROTECTED.contains(type);
    }

    /** Granting a protected role (creating a faculty with it) requires a super admin. */
    public static void requireCanGrant(boolean superAdmin, FacultyType requested) {
        if (isProtected(requested) && !superAdmin) {
            throw new AccessDeniedException("Only a super admin can create " + requested.name() + " accounts");
        }
    }

    /** Editing a protected faculty requires a super admin, unless it is the caller's own row. */
    public static void requireCanEdit(boolean superAdmin, UserPrincipal principal, Faculty target) {
        if (target == null || !isProtected(target.getFacultyType()) || superAdmin) return;
        boolean self = principal != null && principal.isFaculty()
                && Objects.equals(principal.getId(), target.getId());
        if (!self) {
            throw new AccessDeniedException("Only a super admin can edit " + target.getFacultyType().name() + " accounts");
        }
    }

    /** Deleting, suspending or reactivating a protected faculty always requires a super admin. */
    public static void requireCanManage(boolean superAdmin, Faculty target) {
        if (target != null && isProtected(target.getFacultyType()) && !superAdmin) {
            throw new AccessDeniedException("Only a super admin can manage " + target.getFacultyType().name() + " accounts");
        }
    }
}
