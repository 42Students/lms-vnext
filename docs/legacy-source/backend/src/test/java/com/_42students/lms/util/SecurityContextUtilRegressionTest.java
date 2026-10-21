package com._42students.lms.util;

import com._42students.lms.security.UserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.junit.jupiter.api.Assertions.*;

/** Ten focused regressions for the server-side authentication trust boundary. */
class SecurityContextUtilRegressionTest {
    private final SecurityContextUtil subject = new SecurityContextUtil();

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    private void authenticate(Object principal, boolean authenticated, String... authorities) {
        var authentication = new TestingAuthenticationToken(principal, null, authorities);
        authentication.setAuthenticated(authenticated);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private UserPrincipal learner() {
        return new UserPrincipal(42, "LEARNER", null, 11, 22, 0);
    }

    @Test void missingAuthenticationIsNotAuthenticated() {
        assertFalse(subject.isAuthenticated());
    }

    @Test void missingAuthenticationRequiresAuthentication() {
        assertThrows(SecurityException.class, subject::requireAuthentication);
    }

    @Test void unauthenticatedPrincipalIsNeverReturned() {
        authenticate(learner(), false, "ROLE_LEARNER");
        assertNull(subject.getAuthenticatedUserPrincipal());
    }

    @Test void authenticatedPrincipalIsReturned() {
        UserPrincipal principal = learner();
        authenticate(principal, true, "ROLE_LEARNER");
        assertSame(principal, subject.getAuthenticatedUserPrincipal());
    }

    @Test void arbitraryAuthenticatedPrincipalIsNotTreatedAsUserPrincipal() {
        authenticate("untrusted-user", true, "ROLE_LEARNER");
        assertNull(subject.getAuthenticatedUserPrincipal());
    }

    @Test void authenticatedUserIdComesFromPrincipal() {
        authenticate(learner(), true, "ROLE_LEARNER");
        assertEquals(42, subject.getAuthenticatedUserId(null));
    }

    @Test void unauthenticatedUserIdFailsClosed() {
        authenticate(learner(), false, "ROLE_LEARNER");
        assertNull(subject.getAuthenticatedUserId(null));
    }

    @Test void authenticatedCollegeIdComesFromPrincipal() {
        authenticate(learner(), true, "ROLE_LEARNER");
        assertEquals(22, subject.getAuthenticatedCollegeId(null));
    }

    @Test void authenticatedOrganizationIdComesFromPrincipal() {
        authenticate(learner(), true, "ROLE_LEARNER");
        assertEquals(11, subject.getAuthenticatedOrganizationId(null));
    }

    @Test void wrongRoleIsDeniedEvenWhenAuthenticated() {
        authenticate(learner(), true, "ROLE_LEARNER");
        assertThrows(SecurityException.class, () -> subject.requireRole("ADMIN"));
    }
}
