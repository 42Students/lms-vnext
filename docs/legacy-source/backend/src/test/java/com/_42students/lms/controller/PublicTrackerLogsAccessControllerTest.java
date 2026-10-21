package com._42students.lms.controller;

import com._42students.lms.dto.request.TrackerLogsAccessRequest;
import com._42students.lms.dto.response.AuthResponse;
import com._42students.lms.dto.response.Response;
import com._42students.lms.dto.response.TokenPair;
import com._42students.lms.security.JwtService;
import com._42students.lms.security.RateLimitingService;
import com._42students.lms.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PublicTrackerLogsAccessControllerTest {
    private JwtService jwtService;
    private RateLimitingService rateLimitingService;
    private BCryptPasswordEncoder passwordEncoder;
    private PublicTrackerLogsAccessController controller;
    private HttpServletRequest servletRequest;

    private static final String CONFIGURED_HASH = "$2a$10$fakehashvalueforverification";

    @BeforeEach
    void setUp() {
        jwtService = mock(JwtService.class);
        rateLimitingService = mock(RateLimitingService.class);
        passwordEncoder = mock(BCryptPasswordEncoder.class);
        controller = new PublicTrackerLogsAccessController(jwtService, rateLimitingService, passwordEncoder);
        ReflectionTestUtils.setField(controller, "passwordHash", CONFIGURED_HASH);
        servletRequest = new MockHttpServletRequest();
    }

    private TrackerLogsAccessRequest requestWith(String password) {
        TrackerLogsAccessRequest req = new TrackerLogsAccessRequest();
        req.setPassword(password);
        return req;
    }

    @Test
    void correctPasswordIssuesSuperAdminTokens() {
        when(rateLimitingService.isRateLimited(any(), anyInt(), anyLong())).thenReturn(false);
        when(passwordEncoder.matches("correct-horse-battery-staple", CONFIGURED_HASH)).thenReturn(true);
        TokenPair tokens = new TokenPair();
        tokens.setAccessToken("access-123");
        tokens.setRefreshToken("refresh-123");
        when(jwtService.generateTokens(any(UserPrincipal.class), any())).thenReturn(tokens);

        Response<AuthResponse> response = controller.verify(requestWith("correct-horse-battery-staple"), servletRequest);

        assertEquals("access-123", response.getData().getAccessToken());
        assertEquals("refresh-123", response.getData().getRefreshToken());
        verify(rateLimitingService).recordAttempt(any(), anyInt(), anyLong());
    }

    // Regression guard: AuthController#refreshInternal only takes its no-DB-lookup super-admin
    // path (see UserController's real "Vasan" login, which stamps the caller's real phone here)
    // when the refresh token's "contactMobile" claim is present and non-empty. Without it, the
    // very first silent token refresh after login -- which every session eventually needs --
    // falls through to a real Faculty-by-id lookup for id 0, finds nothing (it's a synthetic
    // principal, not a database row), 401s, and the frontend treats that as a dead session: every
    // token gets wiped and the user is bounced to the homepage. This exact bug shipped once
    // already because nothing asserted on the claims map passed to generateTokens.
    @SuppressWarnings("unchecked")
    @Test
    void issuedRefreshTokenCarriesANonEmptyContactMobileClaimSoRefreshDoesNotFallBackToADbLookup() {
        when(rateLimitingService.isRateLimited(any(), anyInt(), anyLong())).thenReturn(false);
        when(passwordEncoder.matches("correct-horse-battery-staple", CONFIGURED_HASH)).thenReturn(true);
        TokenPair tokens = new TokenPair();
        tokens.setAccessToken("access-123");
        tokens.setRefreshToken("refresh-123");
        when(jwtService.generateTokens(any(UserPrincipal.class), any())).thenReturn(tokens);

        controller.verify(requestWith("correct-horse-battery-staple"), servletRequest);

        ArgumentCaptor<Map<String, Object>> claimsCaptor = ArgumentCaptor.forClass(Map.class);
        verify(jwtService).generateTokens(any(UserPrincipal.class), claimsCaptor.capture());
        Object contactMobile = claimsCaptor.getValue().get("contactMobile");
        assertNotNull(contactMobile, "contactMobile claim must be present or refresh falls back to a DB lookup for id 0");
        assertFalse(contactMobile.toString().isEmpty(), "contactMobile claim must be non-empty");
    }

    @Test
    void incorrectPasswordIsRejected() {
        when(rateLimitingService.isRateLimited(any(), anyInt(), anyLong())).thenReturn(false);
        when(passwordEncoder.matches("wrong", CONFIGURED_HASH)).thenReturn(false);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> controller.verify(requestWith("wrong"), servletRequest));

        assertEquals(401, error.getStatus().value());
        verifyNoInteractions(jwtService);
    }

    @Test
    void rateLimitedIpIsRejectedBeforeCheckingPassword() {
        when(rateLimitingService.isRateLimited(any(), anyInt(), anyLong())).thenReturn(true);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> controller.verify(requestWith("anything"), servletRequest));

        assertEquals(429, error.getStatus().value());
        verifyNoInteractions(passwordEncoder);
        verifyNoInteractions(jwtService);
    }

    @Test
    void unconfiguredPasswordHashFailsClosed() {
        ReflectionTestUtils.setField(controller, "passwordHash", "");
        when(rateLimitingService.isRateLimited(any(), anyInt(), anyLong())).thenReturn(false);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> controller.verify(requestWith("anything"), servletRequest));

        assertEquals(503, error.getStatus().value());
        verifyNoInteractions(passwordEncoder);
        verifyNoInteractions(jwtService);
    }

    @Test
    void nullPasswordIsRejectedWithoutCallingEncoder() {
        when(rateLimitingService.isRateLimited(any(), anyInt(), anyLong())).thenReturn(false);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> controller.verify(requestWith(null), servletRequest));

        assertEquals(401, error.getStatus().value());
        verifyNoInteractions(passwordEncoder);
    }
}
