package com._42students.lms.integration;

import com._42students.lms.access.ScopeContext;
import com._42students.lms.access.ScopeContextFilter;
import com._42students.lms.access.ScopeContextHolder;
import com._42students.lms.configuration.AssignmentRateLimitFilter;
import com._42students.lms.configuration.AuthRateLimitFilter;
import com._42students.lms.configuration.CORSFilter;
import com._42students.lms.configuration.CourseMutationRateLimitFilter;
import com._42students.lms.configuration.UnauthorizedEntryPoint;
import com._42students.lms.security.UserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import javax.servlet.FilterChain;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Direct regression evidence for servlet/security infrastructure that executes in front of the
 * controller layer. These filters can make every controller test green while production requests
 * still fail, so they are deliberately part of the hardening gate.
 */
class SecurityInfrastructureMySqlIT extends AbstractMySqlHttpIT {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
        ScopeContextHolder.clear();
    }

    @Test
    void assignmentRateLimitAllowsOneHundredTwentyThenReturns429() throws Exception {
        AssignmentRateLimitFilter filter = new AssignmentRateLimitFilter();
        authenticate("learner-a");

        for (int i = 0; i < 120; i++) {
            MockHttpServletResponse response = run(filter,
                    request("POST", "/api/v1/assignment/submit", "203.0.113.10"));
            assertEquals(200, response.getStatus(), "request " + (i + 1) + " should be allowed");
        }

        MockHttpServletResponse blocked = run(filter,
                request("POST", "/api/v1/assignment/submit", "203.0.113.10"));
        assertEquals(429, blocked.getStatus());
        assertTrue(blocked.getContentAsString().contains("Rate limit exceeded"));
    }

    @Test
    void assignmentRateLimitSeparatesAuthenticatedUsersAndIgnoresUnrelatedRoutes() throws Exception {
        AssignmentRateLimitFilter filter = new AssignmentRateLimitFilter();

        authenticate("learner-a");
        for (int i = 0; i < 120; i++) {
            assertEquals(200, run(filter, request("POST", "/api/v1/assignment/x", "203.0.113.11")).getStatus());
        }
        assertEquals(429, run(filter, request("POST", "/api/v1/assignment/x", "203.0.113.11")).getStatus());

        authenticate("learner-b");
        assertEquals(200, run(filter, request("POST", "/api/v1/assignment/x", "203.0.113.11")).getStatus());

        assertEquals(200, run(filter, request("POST", "/api/v1/courses", "203.0.113.11")).getStatus());
    }

    @Test
    void courseMutationRateLimitCoversMutationsButNeverCourseReads() throws Exception {
        CourseMutationRateLimitFilter filter = new CourseMutationRateLimitFilter();
        authenticate("faculty-a");

        for (int i = 0; i < 60; i++) {
            assertEquals(200, run(filter, request("PATCH", "/api/v1/courses/1", "203.0.113.20")).getStatus());
        }
        assertEquals(429, run(filter, request("DELETE", "/api/v1/courses/1", "203.0.113.20")).getStatus());

        for (int i = 0; i < 80; i++) {
            assertEquals(200, run(filter, request("GET", "/api/v1/courses/1", "203.0.113.20")).getStatus());
        }
    }

    @Test
    void authRateLimitAllowsTenLoginAttemptsThenReturns429() throws Exception {
        AuthRateLimitFilter filter = new AuthRateLimitFilter();

        for (int i = 0; i < 10; i++) {
            assertEquals(200, run(filter, request("POST", "/users/login", "203.0.113.30")).getStatus());
        }
        MockHttpServletResponse blocked = run(filter, request("POST", "/users/login", "203.0.113.30"));
        assertEquals(429, blocked.getStatus());
        assertTrue(blocked.getContentAsString().contains("Too many requests"));
    }

    @Test
    void authRateLimitIgnoresSpoofedForwardedForFromPublicClient() throws Exception {
        AuthRateLimitFilter filter = new AuthRateLimitFilter();

        for (int i = 0; i < 10; i++) {
            MockHttpServletRequest request = request("POST", "/users/login", "198.51.100.44");
            request.addHeader("X-Forwarded-For", "10.0.0." + i);
            assertEquals(200, run(filter, request).getStatus());
        }

        MockHttpServletRequest eleventh = request("POST", "/users/login", "198.51.100.44");
        eleventh.addHeader("X-Forwarded-For", "10.9.9.9");
        assertEquals(429, run(filter, eleventh).getStatus(),
                "public callers must not evade the bucket by spoofing X-Forwarded-For");
    }

    @Test
    void corsAllowsHttps42LmsAndCredentialedOriginWithoutWildcard() throws Exception {
        CORSFilter filter = new CORSFilter();
        MockHttpServletRequest request = request("GET", "/api/v1/courses", "203.0.113.40");
        request.addHeader("Origin", "https://college.42lms.com");

        MockHttpServletResponse response = run(filter, request);

        assertEquals("https://college.42lms.com", response.getHeader("Access-Control-Allow-Origin"));
        assertEquals("true", response.getHeader("Access-Control-Allow-Credentials"));
        assertFalse("*".equals(response.getHeader("Access-Control-Allow-Origin")));
    }

    @Test
    void corsRejectsSuffixTrickAndPlainHttpProductionOrigin() throws Exception {
        CORSFilter filter = new CORSFilter();

        MockHttpServletRequest suffix = request("GET", "/api/v1/courses", "203.0.113.41");
        suffix.addHeader("Origin", "https://evil42lms.com");
        assertNull(run(filter, suffix).getHeader("Access-Control-Allow-Origin"));

        MockHttpServletRequest http = request("GET", "/api/v1/courses", "203.0.113.41");
        http.addHeader("Origin", "http://college.42lms.com");
        assertNull(run(filter, http).getHeader("Access-Control-Allow-Origin"));
    }

    @Test
    void corsPreflightTerminatesEarlyWithExpectedHeaders() throws Exception {
        CORSFilter filter = new CORSFilter();
        MockHttpServletRequest request = request("OPTIONS", "/api/v1/courses", "203.0.113.42");
        request.addHeader("Origin", "https://42lms.com");
        AtomicBoolean downstreamCalled = new AtomicBoolean(false);

        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, (req, res) -> downstreamCalled.set(true));

        assertEquals(200, response.getStatus());
        assertEquals("https://42lms.com", response.getHeader("Access-Control-Allow-Origin"));
        assertTrue(response.getHeader("Access-Control-Allow-Methods").contains("PATCH"));
        assertFalse(downstreamCalled.get(), "OPTIONS must terminate in the CORS filter");
    }

    @Test
    void scopeContextIsDerivedOnlyFromPrincipalAndClearedAfterSuccess() throws Exception {
        ScopeContextFilter filter = new ScopeContextFilter();
        UserPrincipal principal = new UserPrincipal(77, "LEARNER", null, 11, 22, 0);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority("ROLE_LEARNER"))));

        MockHttpServletRequest request = request("GET", "/api/v1/profile", "203.0.113.50");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean sawExpected = new AtomicBoolean(false);

        filter.doFilter(request, response, (req, res) -> {
            ScopeContext scope = ScopeContextHolder.get();
            sawExpected.set(scope != null
                    && Integer.valueOf(77).equals(scope.getUserId())
                    && Integer.valueOf(11).equals(scope.getOrganizationId())
                    && Integer.valueOf(22).equals(scope.getCollegeId())
                    && !scope.isSuperAdmin());
        });

        assertTrue(sawExpected.get());
        assertNull(ScopeContextHolder.get(), "thread-local scope must be cleared after request completion");
    }

    @Test
    void scopeContextIsClearedEvenWhenDownstreamThrows() {
        ScopeContextFilter filter = new ScopeContextFilter();
        UserPrincipal principal = new UserPrincipal(88, "FACULTY", "ADMIN", 1, 33, 0);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));

        MockHttpServletRequest request = request("GET", "/api/v1/admin/test", "203.0.113.51");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain exploding = (req, res) -> {
            assertEquals(88, ScopeContextHolder.get().getUserId());
            throw new IllegalStateException("boom");
        };

        assertThrows(IllegalStateException.class, () -> filter.doFilter(request, response, exploding));
        assertNull(ScopeContextHolder.get(), "thread-local scope leaked after exceptional request");
    }

    @Test
    void unauthorizedEntryPointReturns401() throws Exception {
        UnauthorizedEntryPoint entryPoint = new UnauthorizedEntryPoint();
        MockHttpServletRequest request = request("GET", "/api/v1/courses", "203.0.113.60");
        MockHttpServletResponse response = new MockHttpServletResponse();

        entryPoint.commence(request, response,
                new org.springframework.security.authentication.BadCredentialsException("bad token"));

        assertEquals(401, response.getStatus());
    }

    private static MockHttpServletRequest request(String method, String path, String remoteAddr) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        request.setRemoteAddr(remoteAddr);
        return request;
    }

    private static MockHttpServletResponse run(javax.servlet.Filter filter, MockHttpServletRequest request)
            throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }

    private static void authenticate(String username) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                username, "n/a", List.of(new SimpleGrantedAuthority("ROLE_LEARNER"))));
    }
}
