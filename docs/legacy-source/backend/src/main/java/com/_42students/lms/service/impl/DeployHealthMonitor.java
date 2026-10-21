package com._42students.lms.service.impl;

import com._42students.lms.dto.response.DeployHealthResponse;
import com._42students.lms.dto.response.DeployMarkerResponse;
import com._42students.lms.model.LogAlertState;
import com._42students.lms.repository.LogAlertStateRepository;
import com._42students.lms.service.GcpCloudLoggingService;
import com._42students.lms.service.SchedulerLockService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Makes a bad release announce itself: once a deploy has had a few minutes to settle, compares
 * error volume in the 10 minutes before and after it and sends a Telegram alert if it jumped.
 * Each deploy is evaluated once (the last evaluated deploy time is stored), on one replica only.
 */
@Slf4j
@Service
public class DeployHealthMonitor {
    static final String STATE_KEY = "PRODUCTION_DEPLOY_HEALTH";
    /** The comparison window is 10 minutes, so wait until it is complete before judging. */
    static final Duration SETTLE = Duration.ofMinutes(12);
    /** A deploy older than this is history, not news: record it, do not page anyone about it. */
    static final Duration STALE_AFTER = Duration.ofHours(3);

    @Autowired private GcpCloudLoggingService loggingService;
    @Autowired private LogAlertStateRepository stateRepository;
    @Autowired private TelegramNotifierService telegramNotifier;
    @Autowired(required = false) private SchedulerLockService schedulerLock;

    /** The environment these alerts are about (production when absent, as before). */
    @Autowired(required = false) private AlertEnvironment alertEnvironment;

    private String env() {
        return alertEnvironment == null ? "PRODUCTION" : alertEnvironment.name();
    }

    @Scheduled(fixedDelay = 300_000, initialDelay = 180_000)
    public void check() {
        if (schedulerLock == null) {
            checkInternal(Instant.now());
            return;
        }
        schedulerLock.runExclusively("logs.deployHealth", Duration.ofMinutes(4), () -> checkInternal(Instant.now()));
    }

    void checkInternal(Instant now) {
        try {
            List<DeployMarkerResponse> markers = loggingService.deployMarkers(env(), 1);
            if (markers.isEmpty()) return;
            DeployMarkerResponse latest = markers.get(0);
            if (now.isBefore(latest.getAt().plus(SETTLE))) return;

            LogAlertState state = stateRepository.findByStateKey(STATE_KEY).orElseGet(() -> {
                LogAlertState fresh = new LogAlertState();
                fresh.setStateKey(STATE_KEY);
                return stateRepository.save(fresh);
            });
            if (state.getPollCursorAt() != null && !latest.getAt().isAfter(state.getPollCursorAt())) return;

            DeployHealthResponse health = loggingService.deployHealth(env(), latest.getAt());
            stateRepository.updatePollCursor(STATE_KEY, latest.getAt());

            boolean stale = now.isAfter(latest.getAt().plus(STALE_AFTER));
            if (!stale && shouldAlert(health)) {
                telegramNotifier.send(alertText(latest, health));
            }
        } catch (Exception e) {
            log.debug("Deploy health check skipped: {}", e.getMessage());
        }
    }

    static boolean shouldAlert(DeployHealthResponse health) {
        return health != null && "JUMP".equals(health.getVerdict());
    }

    static String alertText(DeployMarkerResponse deploy, DeployHealthResponse health) {
        String commit = deploy.getCommit() == null || deploy.getCommit().length() <= 7
                ? String.valueOf(deploy.getCommit()) : deploy.getCommit().substring(0, 7);
        return "Errors jumped after a deploy\n"
                + "Release " + commit + " went live at " + deploy.getAt() + "\n"
                + "Errors in the 10 minutes before: " + health.getErrorsBefore()
                + ", after: " + health.getErrorsAfter() + (health.isCapped() ? "+" : "") + "\n"
                + "Open the Logs page and compare, or roll back if it is serious.";
    }
}
