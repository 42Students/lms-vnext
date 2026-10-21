package com._42students.lms.service.impl;

import com._42students.lms.model.RefreshTokenBlocklist;
import com._42students.lms.model.UserSession;
import com._42students.lms.repository.RefreshTokenBlocklistRepository;
import com._42students.lms.repository.UserSessionRepository;
import com._42students.lms.service.UserSessionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
public class UserSessionServiceImpl implements UserSessionService {

    @Autowired
    private UserSessionRepository userSessionRepository;

    @Autowired(required = false)
    private RefreshTokenBlocklistRepository blocklistRepository;

    @Override
    @Transactional
    public void createSession(String jti, Integer userId, String userType,
                               String deviceName, String userAgent, String ipAddress,
                               LocalDateTime expiresAt) {
        UserSession session = new UserSession();
        session.setJti(jti);
        session.setUserId(userId);
        session.setUserType(userType);
        session.setDeviceName(deviceName);
        session.setUserAgent(userAgent != null && userAgent.length() > 512
                ? userAgent.substring(0, 512) : userAgent);
        session.setIpAddress(ipAddress);
        session.setCreatedAt(LocalDateTime.now());
        session.setLastUsedAt(LocalDateTime.now());
        session.setExpiresAt(expiresAt);
        try {
            userSessionRepository.save(session);
        } catch (Exception e) {
            // Non-fatal — session tracking should never block login
            log.warn("AC-05: Failed to create session for user {}: {}", userId, e.getMessage());
        }
    }

    @Override
    @Transactional
    public void rotateSession(String oldJti, String newJti) {
        int updated = userSessionRepository.rotateJti(oldJti, newJti, LocalDateTime.now());
        if (updated == 0) {
            log.debug("AC-05: No session row found for oldJti={} during rotation", oldJti);
        }
    }

    @Override
    @Transactional
    public void deleteSession(String jti) {
        userSessionRepository.deleteByJti(jti);
    }

    @Override
    public List<UserSession> getActiveSessions(Integer userId, String userType) {
        return userSessionRepository.findByUserIdAndUserTypeOrderByLastUsedAtDesc(userId, userType);
    }

    @Override
    @Transactional
    public void revokeSession(String jti, Integer requestingUserId, String requestingUserType) {
        UserSession session = userSessionRepository.findById(jti)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

        // This endpoint is deliberately owner-only. Administrative all-session revocation
        // goes through /api/v1/auth/revoke-sessions, which performs scoped access checks before
        // incrementing tokenVersion. Treating every FACULTY as an admin here let an ordinary
        // lecturer revoke any known learner/faculty JTI.
        boolean ownsSession = session.getUserId().equals(requestingUserId)
                && session.getUserType().equalsIgnoreCase(requestingUserType);
        if (!ownsSession) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot revoke another user's session");
        }
        blocklistAndDelete(session, requestingUserId, requestingUserType);
    }

    @Override
    @Transactional
    public void adminRevokeSession(String jti, Integer actorId, String actorType) {
        UserSession session = userSessionRepository.findById(jti)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
        blocklistAndDelete(session, actorId, actorType);
    }

    private void blocklistAndDelete(UserSession session, Integer actorId, String actorType) {
        String jti = session.getJti();
        // Revocation must fail closed: deleting the session row without persisting the JTI
        // blocklist leaves the refresh token usable even though the UI says the device was
        // revoked. If the blocklist is unavailable, leave the session intact and surface failure.
        if (blocklistRepository == null) {
            throw new IllegalStateException("Token blocklist unavailable");
        }
        RefreshTokenBlocklist blocked = new RefreshTokenBlocklist();
        blocked.setJti(jti);
        blocked.setUserId(session.getUserId());
        blocked.setUserType(session.getUserType());
        blocked.setBlockedAt(LocalDateTime.now());
        blocked.setExpiresAt(session.getExpiresAt());
        blocklistRepository.save(blocked);

        userSessionRepository.deleteById(jti);
        log.info("AC-05 AUDIT: Session {} revoked by userId={} userType={}",
                jti, actorId, actorType);
    }

    /** Clean up expired sessions daily at 2 AM */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupExpiredSessions() {
        int deleted = userSessionRepository.deleteExpired(LocalDateTime.now());
        if (deleted > 0) {
            log.info("AC-05: Cleaned up {} expired sessions", deleted);
        }
    }
}

