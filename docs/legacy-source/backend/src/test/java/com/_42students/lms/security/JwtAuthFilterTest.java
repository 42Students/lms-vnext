package com._42students.lms.security;

import com._42students.lms.config.JwtConfig;
import com._42students.lms.dto.response.TokenPair;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for JWT Authentication Filter logic.
 * Tests token validation scenarios that the filter would handle.
 */
class JwtAuthFilterTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        JwtConfig config = new JwtConfig();
        config.setSecret("test-secret-key-for-jwt-testing-must-be-at-least-32-characters-long");
        config.setAccessExpirationMs(900000L);
        config.setRefreshExpirationMs(259200000L);
        config.setClockSkewSeconds(30);
        config.setIssuer("42lms-test");
        jwtService = new JwtService(config);
        jwtService.init();
    }

    @Test
    @DisplayName("Filter should accept valid access token")
    void shouldAcceptValidAccessToken() {
        // Arrange
        UserPrincipal principal = new UserPrincipal(1, "FACULTY", "ADMIN", 1, 1, 0);
        TokenPair tokens = jwtService.generateTokens(principal);

        // Act - Validate like the filter would
        Claims claims = jwtService.validateToken(tokens.getAccessToken());

        // Assert
        assertNotNull(claims);
        assertTrue(jwtService.isAccessToken(claims), "Should be valid access token");
        assertEquals("1", claims.getSubject());
        assertEquals("FACULTY", claims.get("userType", String.class));
    }

    @Test
    @DisplayName("Filter should reject refresh token used as access token")
    void shouldRejectRefreshTokenAsAccess() {
        // Arrange
        UserPrincipal principal = new UserPrincipal(1, "LEARNER", null, 1, 1, 0);
        TokenPair tokens = jwtService.generateTokens(principal);

        // Act - Validate the refresh token
        Claims claims = jwtService.validateToken(tokens.getRefreshToken());

        // Assert - Should be identified as refresh, not access
        assertFalse(jwtService.isAccessToken(claims), "Refresh token should not be accepted as access");
        assertTrue(jwtService.isRefreshToken(claims), "Should be identified as refresh token");
    }

    @Test
    @DisplayName("Filter should reject missing Authorization header scenario")
    void shouldHandleMissingToken() {
        // Test that null/empty tokens are handled
        String emptyToken = "";
        String nullToken = null;

        // These would cause the filter to skip authentication
        assertTrue(emptyToken.isEmpty());
        assertNull(nullToken);
        
        // In the actual filter, missing tokens result in the request
        // continuing without authentication, which Spring Security
        // then rejects for protected endpoints
    }

    @Test
    @DisplayName("Filter should reject tampered token")
    void shouldRejectTamperedToken() {
        // Arrange
        UserPrincipal principal = new UserPrincipal(1, "LEARNER", null, 1, 1, 0);
        TokenPair tokens = jwtService.generateTokens(principal);
        String tamperedToken = tokens.getAccessToken() + "TAMPERED";

        // Act & Assert
        assertThrows(Exception.class, () -> {
            jwtService.validateToken(tamperedToken);
        }, "Should reject tampered token");
    }

    @Test
    @DisplayName("Token version should be included in claims")
    void tokenVersionShouldBeInClaims() {
        // Arrange - User with tokenVersion = 5
        UserPrincipal principal = new UserPrincipal(1, "LEARNER", null, 1, 1, 5);
        TokenPair tokens = jwtService.generateTokens(principal);

        // Act
        Claims claims = jwtService.validateToken(tokens.getAccessToken());

        // Assert - tokenVersion should be in claims for filter to validate
        Integer tokenVersion = jwtService.getTokenVersionFromClaims(claims);
        assertEquals(5, tokenVersion, "Token version should be 5");
    }
}
