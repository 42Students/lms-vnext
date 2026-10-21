package com._42students.lms.access;

import com._42students.lms.enums.FacultyType;
import com._42students.lms.model.Faculty;
import com._42students.lms.security.UserPrincipal;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ProtectedFacultyRolesTest {

    private static Faculty faculty(int id, FacultyType type) {
        Faculty f = new Faculty();
        f.setId(id);
        f.setFacultyType(type);
        return f;
    }

    private static final UserPrincipal COLLEGE_ADMIN = new UserPrincipal(10, "FACULTY", "ADMIN", 1, 6, 0);

    @Test
    void onlySuperAdminCanGrantAdminOrTpo() {
        assertThrows(AccessDeniedException.class, () -> ProtectedFacultyRoles.requireCanGrant(false, FacultyType.ADMIN));
        assertThrows(AccessDeniedException.class, () -> ProtectedFacultyRoles.requireCanGrant(false, FacultyType.TPO));
        assertDoesNotThrow(() -> ProtectedFacultyRoles.requireCanGrant(true, FacultyType.TPO));
        assertDoesNotThrow(() -> ProtectedFacultyRoles.requireCanGrant(false, FacultyType.LECTURER));
        assertDoesNotThrow(() -> ProtectedFacultyRoles.requireCanGrant(false, FacultyType.MENTOR));
    }

    @Test
    void collegeAdminCannotEditAnotherAdminOrTpoButCanEditSelfAndOthers() {
        assertThrows(AccessDeniedException.class,
                () -> ProtectedFacultyRoles.requireCanEdit(false, COLLEGE_ADMIN, faculty(11, FacultyType.ADMIN)));
        assertThrows(AccessDeniedException.class,
                () -> ProtectedFacultyRoles.requireCanEdit(false, COLLEGE_ADMIN, faculty(12, FacultyType.TPO)));
        assertDoesNotThrow(() -> ProtectedFacultyRoles.requireCanEdit(false, COLLEGE_ADMIN, faculty(10, FacultyType.ADMIN)));
        assertDoesNotThrow(() -> ProtectedFacultyRoles.requireCanEdit(false, COLLEGE_ADMIN, faculty(13, FacultyType.LECTURER)));
        assertDoesNotThrow(() -> ProtectedFacultyRoles.requireCanEdit(true, COLLEGE_ADMIN, faculty(12, FacultyType.TPO)));
    }

    @Test
    void sameNumericIdOfAnotherAccountTypeIsNotSelf() {
        UserPrincipal learnerWithSameId = new UserPrincipal(12, "LEARNER", null, 1, 6, 0);
        assertThrows(AccessDeniedException.class,
                () -> ProtectedFacultyRoles.requireCanEdit(false, learnerWithSameId, faculty(12, FacultyType.TPO)));
    }

    @Test
    void deleteAndSuspendOfAdminOrTpoIsSuperAdminOnlyEvenForSelf() {
        assertThrows(AccessDeniedException.class,
                () -> ProtectedFacultyRoles.requireCanManage(false, faculty(10, FacultyType.ADMIN)));
        assertThrows(AccessDeniedException.class,
                () -> ProtectedFacultyRoles.requireCanManage(false, faculty(12, FacultyType.TPO)));
        assertDoesNotThrow(() -> ProtectedFacultyRoles.requireCanManage(true, faculty(12, FacultyType.TPO)));
        assertDoesNotThrow(() -> ProtectedFacultyRoles.requireCanManage(false, faculty(13, FacultyType.MENTOR)));
    }
}
