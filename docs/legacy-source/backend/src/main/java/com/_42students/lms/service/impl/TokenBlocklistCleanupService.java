package com._42students.lms.service.impl;

import com._42students.lms.repository.RefreshTokenBlocklistRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Scheduled cleanup of expired refresh token blocklist entries.
 * Prevents unbounded growth of the refresh_token_blocklist table.
 */
@Slf4j
@Service
public class TokenBlocklistCleanupService {

    @Autowired
    private RefreshTokenBlocklistRepository blocklistRepository;

    /**
     * Delete blocklist entries whose tokens have already expired.
     * Runs daily at 2:00 AM.
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void cleanupExpiredBlocklistEntries() {
        try {
            int deleted = blocklistRepository.deleteExpiredTokens(LocalDateTime.now());
            if (deleted > 0) {
                log.info("Token blocklist cleanup: removed {} expired entries", deleted);
            }
        } catch (Exception e) {
            log.error("Token blocklist cleanup failed", e);
        }
    }
}

