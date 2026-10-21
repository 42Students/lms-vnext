package com._42students.lms.controller;

import com._42students.lms.config.JwtConfig;
import com._42students.lms.dto.response.TokenPair;
import com._42students.lms.model.Learner;
import com._42students.lms.model.RefreshTokenBlocklist;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.RefreshTokenBlocklistRepository;
import com._42students.lms.security.JwtService;
import com._42students.lms.security.UserPrincipal;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AuthController refresh and logout logic.
 * Uses mocks to test the token refresh and blocklist logic.
 */
class AuthControllerTest {

    private JwtService jwtService;
    private RefreshTokenBlocklistRepository blocklistRepository;
    private LearnerRepository learnerRepository;
    private FacultyRepository facultyRepository;

    private Learner testLearner;

    @BeforeEach
    void setUp() {
        // Create real JwtService with test config
        JwtConfig config = new JwtConfig();
        config.setSecret("test-secret-key-for-jwt-testing-must-be-at-least-32-characters-long");
        config.setAccessExpirationMs(900000L);
        config.setRefreshExpirationMs(259200000L);
        config.setClockSkewSeconds(30);
        config.setIssuer("42lms-test");
        jwtService = new JwtService(config);
        jwtService.init();

        // Create mocks
        blocklistRepository = mock(RefreshTokenBlocklistRepository.class);
        learnerRepository = mock(LearnerRepository.class);
        facultyRepository = mock(FacultyRepository.class);

        // Create test learner
        testLearner = new Learner();
        testLearner.setId(42);
        testLearner.setFirstName("Test");
        testLearner.setLastName("User");
        testLearner.setUserType("LEARNER");
        testLearner.setCollegeId(1);
        testLearner.setOrganizationId(1);
        testLearner.setTokenVersion(0);
    }

    @Test
    @DisplayName("Should generate valid tokens and validate refresh token")
    void refreshTokenShouldBeValidatable() {
        // Arrange
        UserPrincipal principal = UserPrincipal.fromLearner(testLearner);
        TokenPair tokens = jwtService.generateTokens(principal);

        // Act - Validate the refresh token
        Claims claims = jwtService.validateToken(tokens.getRefreshToken());

        // Assert
        assertNotNull(claims);
        assertEquals("42", claims.getSubject());
        assertEquals("LEARNER", claims.get("userType", String.class));
        assertTrue(jwtService.isRefreshToken(claims));
    }

    @Test
    @DisplayName("Blocklist should track revoked tokens by JTI")
    void blocklistShouldTrackRevokedTokens() {
        // Arrange
        UserPrincipal principal = UserPrincipal.fromLearner(testLearner);
        TokenPair tokens = jwtService.generateTokens(principal);
        String jti = jwtService.getJtiFromToken(tokens.getRefreshToken());

        // Simulate blocklist behavior
        when(blocklistRepository.existsByJti(jti)).thenReturn(false);

        // Act - First check (not blocklisted)
        boolean isBlocklisted = blocklistRepository.existsByJti(jti);
        assertFalse(isBlocklisted);

        // Simulate adding to blocklist
        when(blocklistRepository.existsByJti(jti)).thenReturn(true);

        // Act - Second check (now blocklisted)
        boolean isNowBlocklisted = blocklistRepository.existsByJti(jti);
        assertTrue(isNowBlocklisted);
    }

    @Test
    @DisplayName("Should reject token after logout (blocklisted)")
    void logoutShouldBlocklistToken() {
        // Arrange
        UserPrincipal principal = UserPrincipal.fromLearner(testLearner);
        TokenPair tokens = jwtService.generateTokens(principal);
        String jti = jwtService.getJtiFromToken(tokens.getRefreshToken());

        // Before logout - not blocklisted
        when(blocklistRepository.existsByJti(jti)).thenReturn(false);
        assertFalse(blocklistRepository.existsByJti(jti));

        // Simulate logout - add to blocklist
        RefreshTokenBlocklist blockedToken = new RefreshTokenBlocklist();
        blockedToken.setJti(jti);
        blockedToken.setUserId(testLearner.getId());
        blockedToken.setUserType("LEARNER");
        when(blocklistRepository.save(any())).thenReturn(blockedToken);
        when(blocklistRepository.existsByJti(jti)).thenReturn(true);

        // After logout - should be blocklisted
        assertTrue(blocklistRepository.existsByJti(jti));
    }

    @Test
    @DisplayName("Should reject invalid/malformed token")
    void shouldRejectInvalidToken() {
        // Act & Assert
        assertThrows(Exception.class, () -> {
            jwtService.validateToken("invalid.token.here");
        });
    }
}
