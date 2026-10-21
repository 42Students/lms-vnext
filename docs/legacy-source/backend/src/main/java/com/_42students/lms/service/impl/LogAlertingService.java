package com._42students.lms.service.impl;

import com._42students.lms.dto.request.GcpLogQueryRequest;
import com._42students.lms.dto.response.GcpLogSearchResponse;
import com._42students.lms.dto.response.GcpLogSummaryResponse;
import com._42students.lms.model.LogAlertSignature;
import com._42students.lms.model.LogAlertSignatureAccount;
import com._42students.lms.model.LogAlertState;
import com._42students.lms.repository.BugReportRepository;
import com._42students.lms.repository.LogAlertSignatureAccountRepository;
import com._42students.lms.repository.LogAlertSignatureRepository;
import com._42students.lms.repository.LogAlertStateRepository;
import com._42students.lms.service.GcpCloudLoggingService;
import com._42students.lms.service.SchedulerLockService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Polls Cloud Logging for new PRODUCTION ERROR+ entries on a schedule -- independent of anyone
 * having the Logs page open, which is the whole point: a page that only tells you about problems
 * while you're already looking at it isn't monitoring anything for someone who can't watch it all
 * day. Only ever alerts on a genuinely new error *signature* (see LogSignatureUtil) -- a recurring
 * known error updates its counters silently. That's a deliberate choice: at student-platform scale
 * a "known" error can happen constantly, and re-alerting on every occurrence is exactly the alert
 * fatigue that makes a solo operator start ignoring the channel altogether.
 */
@Slf4j
@Service
public class LogAlertingService {

    private static final String STATE_KEY = "PRODUCTION_ERROR_POLL";
    /** Hard ceiling so a runaway burst can't turn into hundreds of Telegram messages in one pass. */
    private static final int MAX_ALERTS_PER_POLL = 5;
    /** Look back this far on the very first run (no cursor yet) so we don't alert on years of history. */
    private static final Duration INITIAL_LOOKBACK = Duration.ofMinutes(15);
    /**
     * Cap on pages fetched per poll (50 entries/page, GcpCloudLoggingService's own server-side max).
     * A single un-paginated page previously meant a burst of &gt;50 ERROR+ entries since the last
     * cursor silently dropped everything older than the newest 50 -- the cursor advanced past them
     * with no record ever made. Paginating up to this cap, and advancing the cursor only as far as
     * what was actually processed when the cap is hit (see pollForNewErrorsInternal), means a bigger
     * backlog takes a few more 2-minute cycles to fully catch up on instead of silently losing entries.
     */
    private static final int MAX_PAGES_PER_POLL = 4;
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");
    /** A muted error that fires this many times in one 2-minute poll is no longer known noise. */
    static final int MUTED_SPIKE_THRESHOLD = 25;
    /** A FIXED error still appearing this long after it was marked fixed cannot be a stale pod any more. */
    private static final Duration REGRESSION_GRACE = Duration.ofHours(24);
    /**
     * Only ClientErrorReportController's messages carry this marker today, so blast radius (distinct
     * accounts hit by a signature) is only ever known for frontend-reported errors -- a native
     * backend exception logged elsewhere has no structured account id to extract. Disclosed via a
     * null distinctAccountCount rather than silently showing zero (see LogAlertSignatureAccount).
     */
    private static final Pattern ACCOUNT_MARKER = Pattern.compile("account=(\\d+)/");

    @Autowired private GcpCloudLoggingService loggingService;
    @Autowired private LogAlertSignatureRepository signatureRepository;
    @Autowired private LogAlertSignatureAccountRepository signatureAccountRepository;
    @Autowired private LogAlertStateRepository stateRepository;
    @Autowired private TelegramNotifierService telegramNotifier;
    @Autowired(required = false) private BugReportRepository bugReportRepository;
    @Autowired(required = false) private SchedulerLockService schedulerLock;

    /** The environment these alerts are about (production when absent, as before). */
    @Autowired(required = false) private AlertEnvironment alertEnvironment;

    private String env() {
        return alertEnvironment == null ? "PRODUCTION" : alertEnvironment.name();
    }

    @Scheduled(fixedDelay = 120_000, initialDelay = 60_000)
    public void pollForNewErrors() {
        if (schedulerLock == null) {
            pollForNewErrorsInternal();
            return;
        }
        schedulerLock.runExclusively("logs.errorAlertPoll", Duration.ofMinutes(5), this::pollForNewErrorsInternal);
    }

    void pollForNewErrorsInternal() {
        try {
            LogAlertState state = ensureStateRow();
            Instant since = state.getPollCursorAt() != null
                    ? state.getPollCursorAt()
                    : Instant.now().minus(INITIAL_LOOKBACK);

            FetchResult fetched = fetchErrorsSince(since);
            if (fetched.entries.isEmpty()) {
                return;
            }

            int alertsSent = 0;
            int newSignaturesSuppressed = 0;
            List<LogAlertSignature> regressions = new ArrayList<>();
            java.util.Map<LogAlertSignature, Integer> mutedBatchCounts = new java.util.IdentityHashMap<>();
            Instant newestSeen = since;
            Instant oldestProcessed = null;
            // Cloud Logging returns newest-first; process oldest-first so occurrence counters and
            // the advancing cursor reflect real chronological order.
            for (int i = fetched.entries.size() - 1; i >= 0; i--) {
                GcpLogSummaryResponse entry = fetched.entries.get(i);
                Instant entryTime = parseTimestamp(entry.getTimestamp());
                if (entryTime == null || !entryTime.isAfter(since)) continue;
                if (entryTime.isAfter(newestSeen)) newestSeen = entryTime;
                if (oldestProcessed == null) oldestProcessed = entryTime;

                String normalized = LogSignatureUtil.normalize(null, entry.getMessage(), entry.getHttpPath());
                String hash = LogSignatureUtil.hash(normalized);
                var existingSignature = signatureRepository.findByEnvironmentAndSignatureHash(env(), hash);
                if (existingSignature.isPresent()) {
                    LogAlertSignature known = existingSignature.get();
                    boolean newRegression = recordExistingOccurrence(known, entryTime, entry);
                    if (newRegression) regressions.add(known);
                    if (known.isMuted()) mutedBatchCounts.merge(known, 1, Integer::sum);
                    continue;
                }

                if (alertsSent < MAX_ALERTS_PER_POLL) {
                    // Only persist the signature once Telegram actually confirms delivery -- a
                    // failed send (network blip, Telegram rate limit) previously still marked the
                    // signature "seen", so that exact error would never alert again even though
                    // nobody was ever actually told about it. Leaving it unpersisted means the next
                    // time this same error happens, it's still "new" and tries again.
                    boolean delivered = sendNewErrorAlert(entry, entryTime, hash);
                    alertsSent++;
                    if (delivered) {
                        persistNewSignature(hash, entry, entryTime);
                    }
                } else {
                    // Rate-limited, not failed -- still record it so the count/first-seen time is
                    // accurate and it doesn't re-attempt an individual alert next poll; the "N more
                    // suppressed" summary below is what tells the operator about these.
                    persistNewSignature(hash, entry, entryTime);
                    newSignaturesSuppressed++;
                }
            }

            for (LogAlertSignature regressed : regressions) {
                telegramNotifier.send(regressionAlertText(regressed));
            }
            mutedBatchCounts.forEach((muted, count) -> {
                if (count >= MUTED_SPIKE_THRESHOLD) {
                    muted.setMuted(false);
                    signatureRepository.save(muted);
                    telegramNotifier.send(spikeAlertText(muted, count));
                }
            });

            if (newSignaturesSuppressed > 0) {
                telegramNotifier.send(String.format(
                        "%d more new error types in this batch were suppressed to avoid spam. Check the Logs page for the full picture.",
                        newSignaturesSuppressed));
            }

            // If the backlog was bigger than MAX_PAGES_PER_POLL could cover, only advance the
            // cursor to the oldest entry actually processed -- not to "now" -- so the untouched
            // older remainder is picked up on the next poll(s) instead of being silently skipped.
            stateRepository.updatePollCursor(STATE_KEY,
                    fetched.truncated && oldestProcessed != null ? oldestProcessed : newestSeen);
        } catch (Exception e) {
            // A poll failure (Cloud Logging unavailable, transient network issue, etc.) must not
            // kill future scheduled runs -- log and try again next cycle.
            log.warn("Log-alert poll failed: {}", e.getMessage());
        }
    }

    /** Ensures the single shared state row exists, tolerating a race with another writer's own first insert. */
    private LogAlertState ensureStateRow() {
        return stateRepository.findByStateKey(STATE_KEY).orElseGet(() -> {
            try {
                LogAlertState fresh = new LogAlertState();
                fresh.setStateKey(STATE_KEY);
                return stateRepository.save(fresh);
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                // Someone else (e.g. a concurrent "mark viewed" call) inserted it first.
                return stateRepository.findByStateKey(STATE_KEY).orElseThrow(() -> e);
            }
        });
    }

    /** @param truncated true if more pages existed beyond MAX_PAGES_PER_POLL -- see its javadoc. */
    private static final class FetchResult {
        final List<GcpLogSummaryResponse> entries;
        final boolean truncated;
        FetchResult(List<GcpLogSummaryResponse> entries, boolean truncated) {
            this.entries = entries;
            this.truncated = truncated;
        }
    }

    private FetchResult fetchErrorsSince(Instant since) {
        GcpLogQueryRequest request = new GcpLogQueryRequest();
        request.setEnvironment(env());
        request.setLevel("ERROR");
        // Window is measured back from "now", not from `since` directly -- pick the smallest
        // supported window that still covers the gap, capped at 24h so a long backend outage
        // doesn't silently widen the query to 7 days' worth of entries in one poll.
        Duration gap = Duration.between(since, Instant.now());
        String window = gap.compareTo(Duration.ofMinutes(15)) <= 0 ? "15M"
                : gap.compareTo(Duration.ofHours(1)) <= 0 ? "1H"
                : gap.compareTo(Duration.ofHours(6)) <= 0 ? "6H"
                : "24H";
        request.setWindow(window);
        request.setSize(50);

        List<GcpLogSummaryResponse> all = new ArrayList<>();
        String pageToken = null;
        Instant anchor = null;
        boolean truncated = false;
        for (int page = 0; page < MAX_PAGES_PER_POLL; page++) {
            request.setPageToken(pageToken);
            request.setAnchor(anchor);
            GcpLogSearchResponse response = loggingService.search(request);
            anchor = response.getQueriedAt(); // keep the pagination anchor stable across pages
            List<GcpLogSummaryResponse> items = response.getItems() == null ? List.of() : response.getItems();
            all.addAll(items);
            pageToken = response.getNextPageToken();
            if (pageToken == null || items.isEmpty()) break;
            if (page == MAX_PAGES_PER_POLL - 1) truncated = true;
        }
        if (truncated) {
            log.warn("Log-alert poll: more than {} pages of PRODUCTION ERROR+ entries since the last cursor; "
                    + "continuing over subsequent polls rather than fetching unboundedly in one pass", MAX_PAGES_PER_POLL);
        }
        return new FetchResult(all, truncated);
    }

    // Neither of the next two methods is @Transactional: they're only ever called via a plain
    // `this.` method call from pollForNewErrorsInternal in this same class, which bypasses Spring's
    // proxy entirely and would make the annotation a no-op anyway. Each does exactly one
    // repository call, which is already atomic on its own.

    /**
     * Bumps counters for a known error and remembers which release produced it. Returns true only
     * the first time a FIXED error is seen again (the caller alerts), so a regression is announced
     * once instead of on every occurrence.
     */
    boolean recordExistingOccurrence(LogAlertSignature signature, Instant entryTime, GcpLogSummaryResponse entry) {
        String commit = entry.getCommit();
        if (commit != null && !commit.isBlank() && !"unknown".equals(commit)) signature.setLastSeenCommit(commit);
        if (signature.getSamplePath() == null && entry.getHttpPath() != null) {
            signature.setSamplePath(entry.getHttpPath().substring(0, Math.min(255, entry.getHttpPath().length())));
        }
        boolean newRegression = signature.getRegressedAt() == null && isRegression(signature, entryTime, commit);
        if (newRegression) signature.setRegressedAt(entryTime);
        recordExistingOccurrence(signature, entryTime, entry.getMessage());
        return newRegression;
    }

    /**
     * A FIXED error counts as back when the release that was supposed to fix it produced it again
     * (same commit), or when it shows up a day after being marked fixed -- long enough that a pod
     * still running the old code during the rollout cannot explain it.
     */
    static boolean isRegression(LogAlertSignature signature, Instant entryTime, String commit) {
        if (!"FIXED".equals(signature.getFixStatus()) || signature.getFixedAt() == null) return false;
        if (!entryTime.isAfter(signature.getFixedAt())) return false;
        if (commitsMatch(signature.getFixedInCommit(), commit)) return true;
        return entryTime.isAfter(signature.getFixedAt().plus(REGRESSION_GRACE));
    }

    static boolean commitsMatch(String a, String b) {
        if (a == null || b == null || a.isBlank() || b.isBlank() || "unknown".equals(b)) return false;
        String x = a.trim().toLowerCase(java.util.Locale.ROOT);
        String y = b.trim().toLowerCase(java.util.Locale.ROOT);
        if (x.length() < 7 || y.length() < 7) return false;
        return x.startsWith(y) || y.startsWith(x);
    }

    static String regressionAlertText(LogAlertSignature s) {
        StringBuilder text = new StringBuilder("REGRESSION: an error marked fixed has come back\n");
        if (s.getSamplePath() != null) text.append("Path: ").append(s.getSamplePath()).append("\n");
        text.append("Message: ").append(s.getSampleMessage() == null ? "(no message)"
                : s.getSampleMessage().substring(0, Math.min(300, s.getSampleMessage().length())));
        if (s.getFixedInCommit() != null) text.append("\nMarked fixed in ").append(s.getFixedInCommit());
        if (s.getLastSeenCommit() != null) text.append("\nSeen on release ").append(s.getLastSeenCommit());
        return text.toString();
    }

    static String spikeAlertText(LogAlertSignature s, int count) {
        StringBuilder text = new StringBuilder("A muted error is spiking (")
                .append(count).append(" occurrences in one poll) -- unmuted.\n");
        if (s.getSamplePath() != null) text.append("Path: ").append(s.getSamplePath()).append("\n");
        text.append("Message: ").append(s.getSampleMessage() == null ? "(no message)"
                : s.getSampleMessage().substring(0, Math.min(300, s.getSampleMessage().length())));
        if (s.getMutedReason() != null) text.append("\nIt was muted because: ").append(s.getMutedReason());
        return text.toString();
    }

    /** Bumps the counters for an error shape already known -- never sends anything. */
    void recordExistingOccurrence(LogAlertSignature signature, Instant entryTime, String message) {
        signature.setLastSeenAt(entryTime);
        signature.setOccurrenceCount(signature.getOccurrenceCount() + 1);
        signatureRepository.save(signature);
        recordAccountIfPresent(signature.getId(), message, entryTime);
    }

    /** Persists a brand-new error shape as "seen" -- called once we've decided it should count as delivered. */
    void persistNewSignature(String hash, GcpLogSummaryResponse entry, Instant entryTime) {
        LogAlertSignature fresh = new LogAlertSignature();
        fresh.setEnvironment(env());
        fresh.setSignatureHash(hash);
        fresh.setSampleMessage(entry.getMessage() == null ? null
                : entry.getMessage().substring(0, Math.min(500, entry.getMessage().length())));
        fresh.setFirstSeenAt(entryTime);
        fresh.setLastSeenAt(entryTime);
        fresh.setOccurrenceCount(1);
        if (entry.getCommit() != null && !entry.getCommit().isBlank() && !"unknown".equals(entry.getCommit())) {
            fresh.setLastSeenCommit(entry.getCommit());
        }
        if (entry.getHttpPath() != null) {
            fresh.setSamplePath(entry.getHttpPath().substring(0, Math.min(255, entry.getHttpPath().length())));
        }
        LogAlertSignature saved = signatureRepository.save(fresh);
        Long id = saved != null ? saved.getId() : fresh.getId();
        recordAccountIfPresent(id, entry.getMessage(), entryTime);
    }

    /** No-op unless `message` carries the "account=<id>/<ROLE>" marker ClientErrorReportController writes. */
    private void recordAccountIfPresent(Long signatureId, String message, Instant seenAt) {
        if (signatureId == null || message == null) return;
        Matcher m = ACCOUNT_MARKER.matcher(message);
        if (!m.find()) return;
        try {
            Long accountId = Long.valueOf(m.group(1));
            if (!signatureAccountRepository.existsBySignatureIdAndAccountId(signatureId, accountId)) {
                signatureAccountRepository.save(new LogAlertSignatureAccount(signatureId, accountId, seenAt));
            }
        } catch (Exception e) {
            log.warn("Failed to record blast-radius account for signature {}: {}", signatureId, e.getMessage());
        }
    }

    /** @return true if Telegram confirmed delivery (or nothing needed sending) -- see TelegramNotifierService#send. */
    private boolean sendNewErrorAlert(GcpLogSummaryResponse entry, Instant entryTime, String signatureHash) {
        String time = entryTime.atZone(ZoneOffset.UTC).format(TIME_FMT) + " UTC";
        String message = entry.getMessage() == null ? "(no message)"
                : entry.getMessage().substring(0, Math.min(300, entry.getMessage().length()));
        StringBuilder text = new StringBuilder();
        text.append("New error type in production, ").append(time).append("\n");
        if (entry.getHttpPath() != null) {
            text.append("Path: ").append(entry.getHttpPath()).append("\n");
        }
        text.append("Message: ").append(message);

        long relatedReports = correlatedBugReportCount(entryTime);
        if (relatedReports > 0) {
            text.append("\n").append(relatedReports)
                    .append(" bug report(s) filed by students in the surrounding 30 minutes -- may be related.");
        }
        // Telegram caps callback_data at 64 BYTES total. "ack:" (4) + a full SHA-256 hex hash (64)
        // is 68 -- every alert with this button was being rejected outright with 400
        // BUTTON_DATA_INVALID, which is a much worse failure than it sounds: since a signature is
        // only persisted once delivery is confirmed (see the caller), a rejected send never marks
        // the error "seen", so it re-attempted and re-failed identically on every later occurrence
        // of the same error -- the exact error type this whole feature exists to surface was the
        // one type of alert that could never actually arrive. 16 hex chars (64 bits) is far more
        // than enough entropy for a button whose only job is editing a message on tap, not
        // resolving a specific database row.
        String shortHashForButton = signatureHash.length() > 16 ? signatureHash.substring(0, 16) : signatureHash;
        return telegramNotifier.send(text.toString(), "ack:" + shortHashForButton);
    }

    /**
     * Phase 3: a cheap correlation signal between "an error just started happening" and "students
     * are also independently reporting something wrong" -- two systems (Cloud Logging and the bug
     * tracker) that otherwise never talk to each other.
     */
    private long correlatedBugReportCount(Instant entryTime) {
        if (bugReportRepository == null) return 0;
        try {
            LocalDateTime center = LocalDateTime.ofInstant(entryTime, ZoneOffset.UTC);
            return bugReportRepository.countByEnvironmentAndCreatedAtBetween(
                    env(), center.minusMinutes(15), center.plusMinutes(15));
        } catch (Exception e) {
            log.debug("Bug-report correlation lookup failed (non-fatal): {}", e.getMessage());
            return 0;
        }
    }

    private Instant parseTimestamp(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return Instant.parse(raw);
        } catch (Exception e) {
            return null;
        }
    }
}
