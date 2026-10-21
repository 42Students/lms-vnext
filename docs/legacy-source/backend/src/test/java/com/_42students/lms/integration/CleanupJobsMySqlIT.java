package com._42students.lms.integration;

import com._42students.lms.service.impl.AuthHandoffTokenCleanupService;
import com._42students.lms.service.impl.TokenBlocklistCleanupService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** Real-MySQL evidence for authentication-table cleanup jobs. */
class CleanupJobsMySqlIT extends AbstractMySqlHttpIT {

    private static final String PREFIX = "it-cleanup-";

    @Autowired
    private AuthHandoffTokenCleanupService handoffCleanup;

    @Autowired
    private TokenBlocklistCleanupService blocklistCleanup;

    @BeforeEach
    void cleanBefore() {
        cleanup();
    }

    @AfterEach
    void cleanAfter() {
        cleanup();
    }

    @Test
    void handoffCleanupSoftDeletesExpiredAndUsedButKeepsLiveUnusedToken() {
        LocalDateTime now = LocalDateTime.now();
        insertHandoff(PREFIX + "expired", false, now.minusMinutes(5));
        insertHandoff(PREFIX + "used", true, now.plusHours(1));
        insertHandoff(PREFIX + "live", false, now.plusHours(1));

        handoffCleanup.cleanup();

        assertEquals(1, deletedFlag(PREFIX + "expired"));
        assertEquals(1, deletedFlag(PREFIX + "used"));
        assertEquals(0, deletedFlag(PREFIX + "live"));
    }

    @Test
    void refreshBlocklistCleanupDeletesOnlyNaturallyExpiredEntries() {
        LocalDateTime now = LocalDateTime.now();
        insertBlock(PREFIX + "expired-jti", now.minusMinutes(1));
        insertBlock(PREFIX + "live-jti", now.plusHours(2));

        blocklistCleanup.cleanupExpiredBlocklistEntries();

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from refresh_token_blocklist where jti = ?",
                Integer.class, PREFIX + "expired-jti"));
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from refresh_token_blocklist where jti = ?",
                Integer.class, PREFIX + "live-jti"));
    }

    @Test
    void cleanupJobsAreIdempotentWhenRunTwice() {
        insertHandoff(PREFIX + "used-twice", true, LocalDateTime.now().plusHours(1));
        insertBlock(PREFIX + "expired-twice", LocalDateTime.now().minusHours(1));

        handoffCleanup.cleanup();
        handoffCleanup.cleanup();
        blocklistCleanup.cleanupExpiredBlocklistEntries();
        blocklistCleanup.cleanupExpiredBlocklistEntries();

        assertEquals(1, deletedFlag(PREFIX + "used-twice"));
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from refresh_token_blocklist where jti = ?",
                Integer.class, PREFIX + "expired-twice"));
    }

    // Bound as java.sql.Timestamp, the same way Hibernate binds the cleanup job's LocalDateTime cutoff, so the
    // driver applies the same JVM->connection time-zone shift to both sides (a raw LocalDateTime is not shifted,
    // which made "5 minutes ago" look hours in the future whenever the JVM was not on UTC).
    private void insertHandoff(String token, boolean used, LocalDateTime expiresAt) {
        jdbc.update("insert into auth_handoff_token "
                        + "(token, access_token, refresh_token, expires_at, used, is_deleted, created_at, updated_at) "
                        + "values (?, 'access', 'refresh', ?, ?, 0, now(), now())",
                token, java.sql.Timestamp.valueOf(expiresAt), used);
    }

    private int deletedFlag(String token) {
        Integer value = jdbc.queryForObject(
                "select is_deleted from auth_handoff_token where token = ?", Integer.class, token);
        return value == null ? -1 : value;
    }

    private void insertBlock(String jti, LocalDateTime expiresAt) {
        jdbc.update("insert into refresh_token_blocklist "
                        + "(jti, user_id, user_type, blocked_at, expires_at) values (?, 989990, 'LEARNER', now(), ?)",
                jti, java.sql.Timestamp.valueOf(expiresAt));
    }

    private void cleanup() {
        try {
            jdbc.update("delete from auth_handoff_token where token like ?", PREFIX + "%");
            jdbc.update("delete from refresh_token_blocklist where jti like ?", PREFIX + "%");
        } catch (Exception ignored) {
        }
    }
}
