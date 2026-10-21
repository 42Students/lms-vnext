package com._42students.lms.util;

import com._42students.lms.security.UserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.junit.jupiter.api.Assertions.*;

/** Additional focused checks for the existing SecurityContextUtil trust boundary. */
class SecurityContextSessionRegressionTest {
    private final SecurityContextUtil subject = new SecurityContextUtil();

    @AfterEach
    void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    private void authenticate(Object principal, boolean authenticated, String... roles) {
        var token = new TestingAuthenticationToken(principal, null, roles);
        token.setAuthenticated(authenticated);
        SecurityContextHolder.getContext().setAuthentication(token);
    }

    private UserPrincipal learner() {
        return new UserPrincipal(42, "LEARNER", null, 11, 22, 0);
    }

    private MockHttpServletRequest request(String key, Object value) {
        var request = new MockHttpServletRequest();
        request.getSession(true).setAttribute(key, value);
        return request;
    }

    @Test void authenticatedTokenPassesAuthenticationRequirement() {
        authenticate(learner(), true, "ROLE_LEARNER");
        assertDoesNotThrow(subject::requireAuthentication);
    }

    @Test void unauthenticatedTokenFailsAuthenticationRequirement() {
        authenticate(learner(), false, "ROLE_LEARNER");
        assertThrows(SecurityException.class, subject::requireAuthentication);
    }

    @Test void unauthenticatedTokenIsNotAuthenticated() {
        authenticate(learner(), false, "ROLE_LEARNER");
        assertFalse(subject.isAuthenticated());
    }

    @Test void authenticatedTokenIsAuthenticated() {
        authenticate(learner(), true, "ROLE_LEARNER");
        assertTrue(subject.isAuthenticated());
    }

    @Test void missingAuthenticationHasNoRole() {
        assertNull(subject.getAuthenticatedUserRole());
    }

    @Test void rolePrefixIsRemoved() {
        authenticate(learner(), true, "ROLE_LEARNER");
        assertEquals("LEARNER", subject.getAuthenticatedUserRole());
    }

    @Test void nonRoleAuthorityIsIgnored() {
        authenticate(learner(), true, "READ_ONLY");
        assertNull(subject.getAuthenticatedUserRole());
    }

    @Test void nonRoleAuthorityBeforeRoleIsSkipped() {
        authenticate(learner(), true, "READ_ONLY", "ROLE_LEARNER");
        assertEquals("LEARNER", subject.getAuthenticatedUserRole());
    }

    @Test void firstRoleAuthorityIsSelected() {
        authenticate(learner(), true, "ROLE_LEARNER", "ROLE_ADMIN");
        assertEquals("LEARNER", subject.getAuthenticatedUserRole());
    }

    @Test void matchingRoleIsAccepted() {
        authenticate(learner(), true, "ROLE_LEARNER");
        assertDoesNotThrow(() -> subject.requireRole("LEARNER"));
    }

    @Test void matchingRoleIsCaseInsensitive() {
        authenticate(learner(), true, "ROLE_LEARNER");
        assertDoesNotThrow(() -> subject.requireRole("learner"));
    }

    @Test void authenticatedTokenWithoutRoleIsDenied() {
        authenticate(learner(), true, "READ_ONLY");
        assertThrows(SecurityException.class, () -> subject.requireRole("LEARNER"));
    }

    @Test void missingAuthenticationCannotRequireRole() {
        assertThrows(SecurityException.class, () -> subject.requireRole("LEARNER"));
    }

    @Test void sessionIntegerUserIdIsReadForAuthenticatedLegacyPrincipal() {
        authenticate("legacy", true, "ROLE_LEARNER");
        assertEquals(71, subject.getAuthenticatedUserId(request("userId", 71)));
    }

    @Test void sessionNumericStringUserIdIsReadForAuthenticatedLegacyPrincipal() {
        authenticate("legacy", true, "ROLE_LEARNER");
        assertEquals(71, subject.getAuthenticatedUserId(request("userId", "71")));
    }

    @Test void malformedSessionUserIdIsRejected() {
        authenticate("legacy", true, "ROLE_LEARNER");
        assertNull(subject.getAuthenticatedUserId(request("userId", "not-a-number")));
    }

    @Test void principalUserIdTakesPrecedenceOverSession() {
        authenticate(learner(), true, "ROLE_LEARNER");
        assertEquals(42, subject.getAuthenticatedUserId(request("userId", 71)));
    }

    @Test void principalOrganizationTakesPrecedenceOverSession() {
        authenticate(learner(), true, "ROLE_LEARNER");
        assertEquals(11, subject.getAuthenticatedOrganizationId(request("organizationId", 71)));
    }

    @Test void principalCollegeTakesPrecedenceOverSession() {
        authenticate(learner(), true, "ROLE_LEARNER");
        assertEquals(22, subject.getAuthenticatedCollegeId(request("collegeId", 71)));
    }

    @Test void sessionCollegeIdDoesNotRequireCreatingANewSession() {
        authenticate("legacy", true, "ROLE_LEARNER");
        assertNull(subject.getAuthenticatedCollegeId(new MockHttpServletRequest()));
    }
}
