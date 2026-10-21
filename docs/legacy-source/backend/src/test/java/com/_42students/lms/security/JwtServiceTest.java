package com._42students.lms.security;

import com._42students.lms.config.JwtConfig;
import com._42students.lms.dto.response.TokenPair;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for JwtService.
 * Tests token generation, validation, and edge cases.
 * 
 * These are pure unit tests that don't require Spring context.
 */
class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        // Create JwtConfig with test values
        JwtConfig config = new JwtConfig();
        config.setSecret("test-secret-key-for-jwt-testing-must-be-at-least-32-characters-long");
        config.setAccessExpirationMs(900000L); // 15 minutes
        config.setRefreshExpirationMs(259200000L); // 3 days
        config.setClockSkewSeconds(30);
        config.setIssuer("42lms-test");

        // Create JwtService and initialize
        jwtService = new JwtService(config);
        jwtService.init();
    }

    @Test
    @DisplayName("Should generate valid token pair with correct structure")
    void shouldGenerateValidTokenPair() {
        // Arrange
        UserPrincipal principal = new UserPrincipal(1, "LEARNER", null, 1, 1, 0);

        // Act
        TokenPair tokens = jwtService.generateTokens(principal);

        // Assert
        assertNotNull(tokens, "TokenPair should not be null");
        assertNotNull(tokens.getAccessToken(), "Access token should not be null");
        assertNotNull(tokens.getRefreshToken(), "Refresh token should not be null");
        assertNotNull(tokens.getRefreshTokenJti(), "Refresh token JTI should not be null");
        assertTrue(tokens.getExpiresIn() > 0, "ExpiresIn should be positive");
        
        // Tokens should be different
        assertNotEquals(tokens.getAccessToken(), tokens.getRefreshToken(), 
            "Access and refresh tokens should be different");
    }

    @Test
    @DisplayName("Should validate access token and extract correct claims")
    void shouldValidateAccessToken() {
        // Arrange
        UserPrincipal principal = new UserPrincipal(42, "FACULTY", "ADMIN", 10, 20, 5);
        TokenPair tokens = jwtService.generateTokens(principal);

        // Act
        Claims claims = jwtService.validateToken(tokens.getAccessToken());

        // Assert
        assertEquals("42", claims.getSubject(), "Subject should be user ID");
        assertEquals("FACULTY", claims.get("userType", String.class), "userType claim should match");
        assertEquals("ADMIN", claims.get("facultyType", String.class), "facultyType claim should match");
        assertEquals(10, claims.get("orgId", Integer.class), "orgId claim should match");
        assertEquals(20, claims.get("collegeId", Integer.class), "collegeId claim should match");
        assertEquals(5, claims.get("tokenVersion", Integer.class), "tokenVersion claim should match");
        assertEquals("access", claims.get("type", String.class), "type should be 'access'");
        assertTrue(jwtService.isAccessToken(claims), "Should be identified as access token");
    }

    @Test
    @DisplayName("Should validate refresh token and extract correct claims")
    void shouldValidateRefreshToken() {
        // Arrange
        UserPrincipal principal = new UserPrincipal(99, "LEARNER", null, 5, 15, 2);
        TokenPair tokens = jwtService.generateTokens(principal);

        // Act
        Claims claims = jwtService.validateToken(tokens.getRefreshToken());

        // Assert
        assertEquals("99", claims.getSubject(), "Subject should be user ID");
        assertEquals("LEARNER", claims.get("userType", String.class), "userType claim should match");
        assertEquals(2, claims.get("tokenVersion", Integer.class), "tokenVersion claim should match");
        assertEquals("refresh", claims.get("type", String.class), "type should be 'refresh'");
        assertTrue(jwtService.isRefreshToken(claims), "Should be identified as refresh token");
    }

    @Test
    @DisplayName("Should sign explicit super-admin capability and preserve root scope in refresh token")
    void shouldPreserveExplicitSuperAdminCapabilityAndScope() {
        UserPrincipal principal = UserPrincipal.forSuperAdminScoped(12, 34);
        TokenPair tokens = jwtService.generateTokens(principal);

        Claims accessClaims = jwtService.validateToken(tokens.getAccessToken());
        Claims refreshClaims = jwtService.validateToken(tokens.getRefreshToken());

        assertTrue(Boolean.TRUE.equals(accessClaims.get("superAdmin", Boolean.class)));
        assertTrue(Boolean.TRUE.equals(refreshClaims.get("superAdmin", Boolean.class)));
        assertEquals(12, refreshClaims.get("orgId", Integer.class));
        assertEquals(34, refreshClaims.get("collegeId", Integer.class));
    }

    @Test
    @DisplayName("Synthetic-looking id zero does not become super-admin without the explicit capability")
    void shouldNotInferSuperAdminFromIdZero() {
        UserPrincipal principal = new UserPrincipal(0, "FACULTY", "ADMIN", null, null, 0);
        TokenPair tokens = jwtService.generateTokens(principal);

        Claims accessClaims = jwtService.validateToken(tokens.getAccessToken());
        Claims refreshClaims = jwtService.validateToken(tokens.getRefreshToken());

        assertFalse(Boolean.TRUE.equals(accessClaims.get("superAdmin", Boolean.class)));
        assertFalse(Boolean.TRUE.equals(refreshClaims.get("superAdmin", Boolean.class)));
    }

    @Test
    @DisplayName("Should reject tampered token")
    void shouldRejectTamperedToken() {
        // Arrange
        UserPrincipal principal = new UserPrincipal(1, "LEARNER", null, 1, 1, 0);
        TokenPair tokens = jwtService.generateTokens(principal);
        
        // Tamper with the token by modifying a character
        String tamperedToken = tokens.getAccessToken() + "tampered";

        // Act & Assert
        assertThrows(JwtException.class, () -> {
            jwtService.validateToken(tamperedToken);
        }, "Should throw JwtException for tampered token");
    }

    @Test
    @DisplayName("Should distinguish between access and refresh tokens")
    void shouldDistinguishAccessAndRefreshTokens() {
        // Arrange
        UserPrincipal principal = new UserPrincipal(1, "LEARNER", null, 1, 1, 0);
        TokenPair tokens = jwtService.generateTokens(principal);

        // Act
        Claims accessClaims = jwtService.validateToken(tokens.getAccessToken());
        Claims refreshClaims = jwtService.validateToken(tokens.getRefreshToken());

        // Assert - Access token checks
        assertTrue(jwtService.isAccessToken(accessClaims), "Access token should be identified as access");
        assertFalse(jwtService.isRefreshToken(accessClaims), "Access token should not be identified as refresh");

        // Assert - Refresh token checks
        assertTrue(jwtService.isRefreshToken(refreshClaims), "Refresh token should be identified as refresh");
        assertFalse(jwtService.isAccessToken(refreshClaims), "Refresh token should not be identified as access");
    }
}
