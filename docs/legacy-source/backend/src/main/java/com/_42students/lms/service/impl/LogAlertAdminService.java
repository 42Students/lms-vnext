package com._42students.lms.service.impl;

import com._42students.lms.dto.response.LogKnownErrorResponse;
import com._42students.lms.model.LogAlertSignature;
import com._42students.lms.model.LogAlertState;
import com._42students.lms.repository.LogAlertSignatureAccountRepository;
import com._42students.lms.repository.LogAlertSignatureRepository;
import com._42students.lms.repository.LogAlertStateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Backs the small admin-facing pieces of the Logs page that aren't the log query itself: "what's
 * new since I last looked" (persisted server-side so it survives a refresh or a different device),
 * and muting a known-noisy error signature.
 */
@Service
public class LogAlertAdminService {

    private static final String STATE_KEY = "PRODUCTION_ERROR_POLL";

    @Autowired private LogAlertStateRepository stateRepository;
    @Autowired private LogAlertSignatureRepository signatureRepository;
    @Autowired private LogAlertSignatureAccountRepository signatureAccountRepository;
    @Autowired private TelegramNotifierService telegramNotifier;
    @Autowired private KubernetesPodInfoService podInfoService;

    private final Instant processStartedAt = Instant.now();

    public Instant getLastViewedAt() {
        return stateRepository.findByStateKey(STATE_KEY).map(LogAlertState::getAdminLastViewedAt).orElse(null);
    }

    @Transactional
    public void markViewedNow() {
        // Column-scoped update rather than load-whole-row-then-save: the alerting poller writes
        // pollCursorAt on the same row independently, and a plain save() here could overwrite
        // whatever cursor value it just wrote with a stale in-memory copy from this request's read.
        ensureStateRow();
        stateRepository.updateAdminLastViewed(STATE_KEY, Instant.now());
    }

    /** Ensures the single shared state row exists, tolerating a race with another writer's own first insert. */
    private void ensureStateRow() {
        if (stateRepository.findByStateKey(STATE_KEY).isPresent()) return;
        try {
            LogAlertState fresh = new LogAlertState();
            fresh.setStateKey(STATE_KEY);
            stateRepository.save(fresh);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // The alerting poller inserted it first -- fine, the row exists either way.
        }
    }

    /**
     * "When was this backend last deployed" -- reads both lms-be replicas' actual start times from
     * the Kubernetes API (see KubernetesPodInfoService) and returns the most recent one, so the
     * answer is the same regardless of which of the 2 pods happens to serve this particular request.
     * Falls back to this JVM's own process-start time (the previous approximation, which *can*
     * legitimately differ pod-to-pod mid-rollout) when the Kubernetes API isn't reachable -- not
     * running in-cluster (local dev, tests), or the RBAC grant isn't live yet.
     */
    public Instant getBackendStartedAt() {
        return podInfoService.getOwnDeploymentPodTimes("component=lms-be")
                .map(times -> times.latestStart)
                .orElse(processStartedAt);
    }

    /**
     * Lets an admin confirm the Telegram pipeline actually works without waiting for a real
     * production error to happen to trigger it. Reports whether it's configured at all, separately
     * from whether the send itself succeeded, so "nothing arrived" is diagnosable from the response
     * alone instead of just silently doing nothing.
     */
    public TestAlertResult sendTestAlert() {
        if (!telegramNotifier.isConfigured()) {
            return new TestAlertResult(false, false);
        }
        boolean delivered = telegramNotifier.send(
                "✅ Test alert from 42LMS Logs monitoring -- if you're reading this, the pipeline works end to end.");
        return new TestAlertResult(true, delivered);
    }

    public static final class TestAlertResult {
        public final boolean configured;
        public final boolean delivered;
        public TestAlertResult(boolean configured, boolean delivered) {
            this.configured = configured;
            this.delivered = delivered;
        }
    }

    /**
     * The "known errors" admin view: every tracked signature for an environment, newest-last-seen
     * first, with blast radius (distinct accounts hit) where it's known -- see LogAlertSignatureAccount
     * for why that's only ever populated for frontend-reported errors.
     */
    public List<LogKnownErrorResponse> listKnownErrors(String environment) {
        List<LogAlertSignature> signatures = signatureRepository.findByEnvironmentOrderByLastSeenAtDesc(environment);
        if (signatures.isEmpty()) return List.of();
        List<Long> ids = signatures.stream().map(LogAlertSignature::getId).collect(Collectors.toList());
        Map<Long, Long> distinctAccountCounts = signatureAccountRepository.countBySignatureIds(ids).stream()
                .collect(Collectors.toMap(LogAlertSignatureAccountRepository.CountRow::getSigId,
                        LogAlertSignatureAccountRepository.CountRow::getCnt));
        return signatures.stream()
                .map(s -> LogKnownErrorResponse.builder()
                        .id(s.getId())
                        .sampleMessage(s.getSampleMessage())
                        .firstSeenAt(s.getFirstSeenAt())
                        .lastSeenAt(s.getLastSeenAt())
                        .occurrenceCount(s.getOccurrenceCount())
                        .muted(s.isMuted())
                        .signatureHash(s.getSignatureHash())
                        .fixStatus(s.getFixStatus())
                        .fixedInCommit(s.getFixedInCommit())
                        .fixedAt(s.getFixedAt())
                        .statusNote(s.getStatusNote())
                        .mutedReason(s.getMutedReason())
                        .issuePublicId(s.getIssuePublicId())
                        .lastSeenCommit(s.getLastSeenCommit())
                        .regressedAt(s.getRegressedAt())
                        .samplePath(s.getSamplePath())
                        .distinctAccountCount(distinctAccountCounts.get(s.getId()))
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public boolean setMuted(String environment, String message, String httpPath, boolean muted) {
        String hash = LogSignatureUtil.hash(LogSignatureUtil.normalize(null, message, httpPath));
        var existing = signatureRepository.findByEnvironmentAndSignatureHash(environment, hash);
        if (existing.isEmpty()) return false;
        LogAlertSignature signature = existing.get();
        signature.setMuted(muted);
        signatureRepository.save(signature);
        return true;
    }

    /**
     * Same as {@link #setMuted}, but by signature id directly -- used by the "known errors" list,
     * which only has the stored (possibly truncated) sampleMessage and no separate httpPath column,
     * so re-deriving the original hash from it isn't reliable the way it is from a live log entry
     * that still has both fields.
     */
    @Transactional
    public boolean setMutedById(Long signatureId, boolean muted) {
        return setMutedById(signatureId, muted, null);
    }

    /** Muting records why, so a future reader knows whether the reason still holds; unmuting clears it. */
    @Transactional
    public boolean setMutedById(Long signatureId, boolean muted, String reason) {
        var existing = signatureRepository.findById(signatureId);
        if (existing.isEmpty()) return false;
        LogAlertSignature signature = existing.get();
        signature.setMuted(muted);
        signature.setMutedReason(muted ? truncate(reason, 255) : null);
        signatureRepository.save(signature);
        return true;
    }

    public static final java.util.Set<String> FIX_STATUSES = java.util.Set.of("OPEN", "FIXED", "EXPECTED");

    /**
     * Records the triage decision for an error signature.
     * FIXED remembers the commit and time so a later occurrence can be flagged as a regression;
     * EXPECTED mutes the error (benign) with the note as the reason; OPEN reverts both.
     * Returns empty when the signature does not exist; throws on an unknown status.
     */
    @Transactional
    public java.util.Optional<LogAlertSignature> setStatus(Long signatureId, String status, String commit,
                                                           String note, String issuePublicId) {
        String normalized = status == null ? "" : status.trim().toUpperCase(java.util.Locale.ROOT);
        if (!FIX_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("status must be one of " + FIX_STATUSES);
        }
        var existing = signatureRepository.findById(signatureId);
        if (existing.isEmpty()) return java.util.Optional.empty();
        LogAlertSignature signature = existing.get();

        String previous = signature.getFixStatus();
        signature.setFixStatus(normalized);
        signature.setStatusNote(truncate(note, 500));
        signature.setRegressedAt(null);
        if (issuePublicId != null && !issuePublicId.isBlank()) {
            signature.setIssuePublicId(truncate(issuePublicId.trim(), 32));
        }
        switch (normalized) {
            case "FIXED":
                signature.setFixedInCommit(truncate(commit == null || commit.isBlank() ? null : commit.trim(), 64));
                signature.setFixedAt(Instant.now());
                break;
            case "EXPECTED":
                signature.setFixedInCommit(null);
                signature.setFixedAt(null);
                signature.setMuted(true);
                signature.setMutedReason(truncate(note == null || note.isBlank() ? "Marked expected" : note, 255));
                break;
            default:
                signature.setFixedInCommit(null);
                signature.setFixedAt(null);
                if ("EXPECTED".equals(previous)) {
                    signature.setMuted(false);
                    signature.setMutedReason(null);
                }
        }
        return java.util.Optional.of(signatureRepository.save(signature));
    }

    /** Attaches a tracker issue to an error without touching its fix status, mute state or history. */
    @Transactional
    public java.util.Optional<LogAlertSignature> linkIssue(Long signatureId, String issuePublicId) {
        var existing = signatureRepository.findById(signatureId);
        if (existing.isEmpty()) return java.util.Optional.empty();
        LogAlertSignature signature = existing.get();
        String cleaned = issuePublicId == null ? null : issuePublicId.trim();
        signature.setIssuePublicId(cleaned == null || cleaned.isEmpty() ? null : truncate(cleaned, 32));
        return java.util.Optional.of(signatureRepository.save(signature));
    }

    private static String truncate(String value, int max) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.length() <= max ? trimmed : trimmed.substring(0, max);
    }
}
