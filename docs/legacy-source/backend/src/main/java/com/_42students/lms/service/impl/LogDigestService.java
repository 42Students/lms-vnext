package com._42students.lms.service.impl;

import com._42students.lms.dto.response.DeployMarkerResponse;
import com._42students.lms.dto.response.LogDigestResponse;
import com._42students.lms.model.LogAlertSignature;
import com._42students.lms.repository.LogAlertSignatureRepository;
import com._42students.lms.service.GcpCloudLoggingService;
import com._42students.lms.service.SchedulerLockService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * The "did anything need me today" summary: error types that appeared for the first time, fixed
 * errors that came back, and the deploys in between. Built from the tracked signatures, so it is
 * cheap enough to compute on request; a copy goes to Telegram every morning so a quiet day means
 * there is nothing to open.
 */
@Slf4j
@Service
public class LogDigestService {
    private static final int MAX_ITEMS = 10;
    private static final int TELEGRAM_LIMIT = 3800;
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("MMM d, HH:mm");

    @Autowired private LogAlertSignatureRepository signatureRepository;
    @Autowired private GcpCloudLoggingService loggingService;
    @Autowired private TelegramNotifierService telegramNotifier;
    @Autowired(required = false) private SchedulerLockService schedulerLock;

    /** The environment these alerts are about (production when absent, as before). */
    @Autowired(required = false) private AlertEnvironment alertEnvironment;

    private String env() {
        return alertEnvironment == null ? "PRODUCTION" : alertEnvironment.name();
    }

    public LogDigestResponse build(Duration lookback) {
        Instant until = Instant.now();
        Instant since = until.minus(lookback);
        List<LogAlertSignature> all = signatureRepository.findByEnvironmentOrderByLastSeenAtDesc(env());

        List<LogDigestResponse.Item> newErrors = all.stream()
                .filter(s -> !s.isMuted() && s.getFirstSeenAt() != null && !s.getFirstSeenAt().isBefore(since))
                .sorted(Comparator.comparing(LogAlertSignature::getOccurrenceCount).reversed())
                .limit(MAX_ITEMS).map(LogDigestService::toItem).collect(Collectors.toList());
        List<LogDigestResponse.Item> regressions = all.stream()
                .filter(s -> s.getRegressedAt() != null && !s.getRegressedAt().isBefore(since))
                .limit(MAX_ITEMS).map(LogDigestService::toItem).collect(Collectors.toList());
        List<LogDigestResponse.Item> fixed = all.stream()
                .filter(s -> "FIXED".equals(s.getFixStatus()) && s.getRegressedAt() == null
                        && s.getFixedAt() != null && !s.getFixedAt().isBefore(since))
                .limit(MAX_ITEMS).map(LogDigestService::toItem).collect(Collectors.toList());
        int stillActive = (int) all.stream()
                .filter(s -> !s.isMuted() && !"FIXED".equals(s.getFixStatus())
                        && s.getLastSeenAt() != null && !s.getLastSeenAt().isBefore(since))
                .count();

        List<DeployMarkerResponse> deploys;
        try {
            deploys = loggingService.deployMarkers(env(), Math.max(1, (int) Math.ceil(lookback.toHours() / 24.0)));
            deploys = deploys.stream().filter(d -> !d.getAt().isBefore(since)).collect(Collectors.toList());
        } catch (Exception e) {
            log.debug("Digest could not read deploy markers (non-fatal): {}", e.getMessage());
            deploys = List.of();
        }

        return LogDigestResponse.builder()
                .since(since).until(until)
                .newErrors(newErrors).regressions(regressions).fixed(fixed)
                .stillActive(stillActive).deploys(deploys)
                .quiet(newErrors.isEmpty() && regressions.isEmpty())
                .build();
    }

    static LogDigestResponse.Item toItem(LogAlertSignature s) {
        return LogDigestResponse.Item.builder()
                .id(s.getId())
                .message(s.getSampleMessage())
                .path(s.getSamplePath())
                .firstSeenAt(s.getFirstSeenAt())
                .lastSeenAt(s.getLastSeenAt())
                .occurrences(s.getOccurrenceCount())
                .fixedInCommit(s.getFixedInCommit())
                .issuePublicId(s.getIssuePublicId())
                .build();
    }

    static String format(LogDigestResponse digest) {
        long hours = Duration.between(digest.getSince(), digest.getUntil()).toHours();
        boolean weekly = hours >= 48;
        StringBuilder text = new StringBuilder(weekly ? "42LMS weekly log summary (last " : "42LMS daily log digest (last ")
                .append(weekly ? Math.round(hours / 24.0) + " days" : hours + "h").append(")\n");
        if (digest.isQuiet()) {
            text.append("All quiet: no new error types and nothing that was fixed has come back.\n");
        }
        if (!digest.getRegressions().isEmpty()) {
            text.append("\nCame back after being marked fixed (").append(digest.getRegressions().size()).append("):\n");
            digest.getRegressions().forEach(i -> text.append(line(i)));
        }
        if (!digest.getNewErrors().isEmpty()) {
            text.append("\nNew error types (").append(digest.getNewErrors().size()).append("):\n");
            digest.getNewErrors().forEach(i -> text.append(line(i)));
        }
        if (digest.getFixed() != null && !digest.getFixed().isEmpty()) {
            text.append("\nMarked fixed (").append(digest.getFixed().size()).append("):\n");
            digest.getFixed().forEach(i -> text.append(line(i)));
        }
        text.append("\nStill active and open: ").append(digest.getStillActive());
        if (!digest.getDeploys().isEmpty()) {
            text.append("\nDeploys: ").append(digest.getDeploys().stream()
                    .map(d -> shortCommit(d.getCommit()) + " at " + d.getAt().atZone(ZoneOffset.UTC).format(TIME_FMT) + " UTC")
                    .collect(Collectors.joining(", ")));
        }
        String out = text.toString();
        return out.length() <= TELEGRAM_LIMIT ? out : out.substring(0, TELEGRAM_LIMIT) + "\n...";
    }

    private static String line(LogDigestResponse.Item item) {
        String message = item.getMessage() == null ? "(no message)"
                : item.getMessage().substring(0, Math.min(140, item.getMessage().length())).replace('\n', ' ');
        return "- " + (item.getPath() != null ? item.getPath() + ": " : "") + message
                + " (x" + item.getOccurrences() + ")\n";
    }

    private static String shortCommit(String commit) {
        return commit == null || commit.length() <= 7 ? String.valueOf(commit) : commit.substring(0, 7);
    }

    /** 09:00 IST, once a day, on one pod only. */
    @Scheduled(cron = "0 30 3 * * *", zone = "UTC")
    public void sendDailyDigest() {
        if (schedulerLock == null) {
            sendNow();
            return;
        }
        schedulerLock.runExclusively("logs.dailyDigest", Duration.ofMinutes(10), this::sendNow);
    }

    /** Mondays 09:00 IST: what got fixed, what came back, what is new, over the past week. */
    @Scheduled(cron = "0 30 3 * * MON", zone = "UTC")
    public void sendWeeklySummary() {
        if (schedulerLock == null) {
            sendNow(Duration.ofDays(7));
            return;
        }
        schedulerLock.runExclusively("logs.weeklySummary", Duration.ofMinutes(10), () -> sendNow(Duration.ofDays(7)));
    }

    /** @return true if Telegram confirmed delivery. */
    public boolean sendNow() {
        return sendNow(Duration.ofHours(24));
    }

    boolean sendNow(Duration lookback) {
        try {
            return telegramNotifier.send(format(build(lookback)));
        } catch (Exception e) {
            log.warn("Daily log digest failed: {}", e.getMessage());
            return false;
        }
    }
}
