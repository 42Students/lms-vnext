package com._42students.lms.service.impl;

import com._42students.lms.repository.AuthHandoffTokenRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Scheduled cleanup of used/expired auth handoff tokens.
 * Prevents unbounded growth of the auth_handoff_token table.
 */
@Slf4j
@Service
public class AuthHandoffTokenCleanupService {

    @Autowired(required = false)
    private AuthHandoffTokenRepository authHandoffTokenRepository;

    /**
     * Soft-delete expired/used handoff tokens.
     * Runs daily at 2:15 AM (staggered from other cleanup jobs).
     */
    @Scheduled(cron = "0 15 2 * * *")
    public void cleanup() {
        if (authHandoffTokenRepository == null) return;
        try {
            int affected = authHandoffTokenRepository.softDeleteExpiredOrUsed(LocalDateTime.now());
            if (affected > 0) {
                log.info("Auth handoff token cleanup: soft-deleted {} used/expired tokens", affected);
            }
        } catch (Exception e) {
            log.error("Auth handoff token cleanup failed", e);
        }
    }
}


