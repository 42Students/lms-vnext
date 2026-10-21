package com._42students.lms.service;

import com._42students.lms.model.UserSession;

import java.util.List;

/**
 * AC-05: Per-device session management.
 */
public interface UserSessionService {

    /** Record a new session on login */
    void createSession(String jti, Integer userId, String userType,
                       String deviceName, String userAgent, String ipAddress,
                       java.time.LocalDateTime expiresAt);

    /** Rotate JTI when a refresh token is exchanged */
    void rotateSession(String oldJti, String newJti);

    /** Delete session on logout */
    void deleteSession(String jti);

    /** List all active sessions for a user */
    List<UserSession> getActiveSessions(Integer userId, String userType);

    /** Revoke a specific session by JTI (admin/user-initiated) */
    void revokeSession(String jti, Integer requestingUserId, String requestingUserType);

    /**
     * Revokes another user's session on behalf of an administrator. No ownership check here: the
     * caller must already have authorized the actor for the target user (suspend, superadmin
     * revoke-all). Fails closed like revokeSession: the JTI is blocklisted before the row is removed.
     */
    void adminRevokeSession(String jti, Integer actorId, String actorType);
}

