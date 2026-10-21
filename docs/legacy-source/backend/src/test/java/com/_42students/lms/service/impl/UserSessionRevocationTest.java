package com._42students.lms.service.impl;

import com._42students.lms.model.RefreshTokenBlocklist;
import com._42students.lms.model.UserSession;
import com._42students.lms.repository.RefreshTokenBlocklistRepository;
import com._42students.lms.repository.UserSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Device-session revocation: the self-service path is owner-only (an ordinary teacher must not revoke a
 * learner's session), while suspend and superadmin revoke-all use the admin path, which must really revoke.
 * Both fail closed: the refresh token's JTI is blocklisted before the session row is removed.
 */
class UserSessionRevocationTest {

    private UserSessionRepository sessions;
    private RefreshTokenBlocklistRepository blocklist;
    private UserSessionServiceImpl service;

    @BeforeEach
    void setUp() {
        sessions = mock(UserSessionRepository.class);
        blocklist = mock(RefreshTokenBlocklistRepository.class);
        service = new UserSessionServiceImpl();
        ReflectionTestUtils.setField(service, "userSessionRepository", sessions);
        ReflectionTestUtils.setField(service, "blocklistRepository", blocklist);
        UserSession learnerSession = new UserSession();
        learnerSession.setJti("jti-learner");
        learnerSession.setUserId(42);
        learnerSession.setUserType("LEARNER");
        learnerSession.setExpiresAt(LocalDateTime.now().plusDays(7));
        when(sessions.findById("jti-learner")).thenReturn(Optional.of(learnerSession));
    }

    @Test
    void ownerRevokesOwnSessionAndItIsBlocklistedFirst() {
        service.revokeSession("jti-learner", 42, "LEARNER");
        var order = inOrder(blocklist, sessions);
        order.verify(blocklist).save(any(RefreshTokenBlocklist.class));
        order.verify(sessions).deleteById("jti-learner");
    }

    @Test
    void anotherFacultyCannotRevokeALearnersSessionThroughSelfService() {
        ResponseStatusException e = assertThrows(ResponseStatusException.class,
                () -> service.revokeSession("jti-learner", 7, "FACULTY"));
        assertEquals(HttpStatus.FORBIDDEN, e.getStatus());
        verify(sessions, never()).deleteById(any());
        verify(blocklist, never()).save(any());
    }

    @Test
    void adminPathRevokesAnotherUsersSession() {
        service.adminRevokeSession("jti-learner", 0, "FACULTY");
        verify(blocklist).save(any(RefreshTokenBlocklist.class));
        verify(sessions).deleteById("jti-learner");
    }

    @Test
    void adminPathFailsClosedWhenTheBlocklistIsUnavailable() {
        ReflectionTestUtils.setField(service, "blocklistRepository", null);
        assertThrows(IllegalStateException.class, () -> service.adminRevokeSession("jti-learner", 0, "FACULTY"));
        verify(sessions, never()).deleteById(any());
    }
}
