package com._42students.lms.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PrincipalTypeTest {

    @Test
    void parsesOnlyKnownTypes() {
        assertEquals(Optional.of(PrincipalType.LEARNER), PrincipalType.parse("learner"));
        assertEquals(Optional.of(PrincipalType.FACULTY), PrincipalType.parse(" FACULTY "));
        assertEquals(Optional.of(PrincipalType.RECRUITER), PrincipalType.parse("RECRUITER"));
        assertEquals(Optional.empty(), PrincipalType.parse("HR")); // the old name of the recruiter user type is no longer accepted
        assertEquals(Optional.empty(), PrincipalType.parse(null));
        assertEquals(Optional.empty(), PrincipalType.parse(""));
        assertEquals(Optional.empty(), PrincipalType.parse("ADMIN"));
        assertEquals(Optional.empty(), PrincipalType.parse("ROBOT"));
    }

    // Super-admin authority comes only from the signed superAdmin claim, never from an id.
    private static List<String> roles(PrincipalType type, String facultyType, boolean superAdmin) {
        return JwtAuthenticationFilter.authoritiesFor(type, facultyType, superAdmin).stream()
                .map(SimpleGrantedAuthority::getAuthority).sorted().collect(Collectors.toList());
    }

    @Test
    void recruiterGetsOnlyTheRecruiterRole() {
        assertEquals(List.of("ROLE_RECRUITER"), roles(PrincipalType.RECRUITER, null, false));
        // A facultyType claim on a recruiter token must not add faculty/admin roles.
        assertEquals(List.of("ROLE_RECRUITER"), roles(PrincipalType.RECRUITER, "ADMIN", false));
    }

    @Test
    void facultyAndLearnerRolesAreUnchanged() {
        assertEquals(List.of("ROLE_LEARNER"), roles(PrincipalType.LEARNER, null, false));
        assertEquals(List.of("ROLE_FACULTY"), roles(PrincipalType.FACULTY, "LECTURER", false));
        assertEquals(List.of("ROLE_FACULTY"), roles(PrincipalType.FACULTY, "MENTOR", false));
        assertEquals(List.of("ROLE_ADMIN", "ROLE_FACULTY"), roles(PrincipalType.FACULTY, "ADMIN", false));
        assertEquals(List.of("ROLE_ADMIN", "ROLE_FACULTY", "ROLE_SUPER_ADMIN"), roles(PrincipalType.FACULTY, "ADMIN", true));
    }

    @Test
    void tpoGetsFacultyPlusTpoRole() {
        assertEquals(List.of("ROLE_FACULTY", "ROLE_TPO"), roles(PrincipalType.FACULTY, "TPO", false));
    }
}
