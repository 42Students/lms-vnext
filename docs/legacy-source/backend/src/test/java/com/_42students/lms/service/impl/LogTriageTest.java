package com._42students.lms.service.impl;

import com._42students.lms.dto.response.GcpLogSearchResponse;
import com._42students.lms.dto.response.GcpLogSummaryResponse;
import com._42students.lms.model.LogAlertSignature;
import com._42students.lms.model.LogAlertState;
import com._42students.lms.repository.BugReportRepository;
import com._42students.lms.repository.LogAlertSignatureAccountRepository;
import com._42students.lms.repository.LogAlertSignatureRepository;
import com._42students.lms.repository.LogAlertStateRepository;
import com._42students.lms.service.GcpCloudLoggingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/** Fix status, mute reasons, regression detection and spike-unmute for tracked errors. */
@ExtendWith(MockitoExtension.class)
class LogTriageTest {

    @Mock private LogAlertStateRepository stateRepository;
    @Mock private LogAlertSignatureRepository signatureRepository;
    @Mock private LogAlertSignatureAccountRepository signatureAccountRepository;
    @Mock private KubernetesPodInfoService podInfoService;
    @Mock private GcpCloudLoggingService loggingService;
    @Mock private TelegramNotifierService telegramNotifier;
    @Mock private BugReportRepository bugReportRepository;

    @InjectMocks private LogAlertAdminService admin;
    @InjectMocks private LogAlertingService poller;

    @BeforeEach
    void setup() {
        lenient().when(signatureRepository.save(any(LogAlertSignature.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(stateRepository.findByStateKey(anyString())).thenReturn(Optional.empty());
        lenient().when(stateRepository.save(any(LogAlertState.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(bugReportRepository.countByEnvironmentAndCreatedAtBetween(anyString(), any(), any())).thenReturn(0L);
        lenient().when(telegramNotifier.send(anyString())).thenReturn(true);
        lenient().when(telegramNotifier.send(anyString(), anyString())).thenReturn(true);
    }

    private LogAlertSignature signature() {
        LogAlertSignature s = new LogAlertSignature();
        s.setId(7L);
        s.setSampleMessage("Boom");
        s.setFirstSeenAt(Instant.now().minus(3, ChronoUnit.DAYS));
        s.setLastSeenAt(Instant.now().minus(1, ChronoUnit.HOURS));
        s.setOccurrenceCount(4);
        return s;
    }

    // ---- status --------------------------------------------------------------------------

    @Test
    void markingFixedRemembersTheCommitAndTimeAndClearsAnyRegression() {
        LogAlertSignature s = signature();
        s.setRegressedAt(Instant.now());
        when(signatureRepository.findById(7L)).thenReturn(Optional.of(s));

        var updated = admin.setStatus(7L, "fixed", " abc1234 ", "null check added", "LMS-0042").orElseThrow();

        assertEquals("FIXED", updated.getFixStatus());
        assertEquals("abc1234", updated.getFixedInCommit());
        assertNotNull(updated.getFixedAt());
        assertNull(updated.getRegressedAt());
        assertEquals("LMS-0042", updated.getIssuePublicId());
        assertFalse(updated.isMuted());
    }

    @Test
    void markingExpectedMutesWithTheNoteAsTheReason() {
        LogAlertSignature s = signature();
        when(signatureRepository.findById(7L)).thenReturn(Optional.of(s));

        var updated = admin.setStatus(7L, "EXPECTED", null, "client disconnects", null).orElseThrow();

        assertTrue(updated.isMuted());
        assertEquals("client disconnects", updated.getMutedReason());
    }

    @Test
    void revertingExpectedToOpenUnmutesIt() {
        LogAlertSignature s = signature();
        s.setFixStatus("EXPECTED");
        s.setMuted(true);
        s.setMutedReason("noise");
        when(signatureRepository.findById(7L)).thenReturn(Optional.of(s));

        var updated = admin.setStatus(7L, "OPEN", null, null, null).orElseThrow();

        assertFalse(updated.isMuted());
        assertNull(updated.getMutedReason());
        assertNull(updated.getFixedInCommit());
    }

    @Test
    void anUnknownStatusIsRejectedAndAMissingSignatureIsEmpty() {
        assertThrows(IllegalArgumentException.class, () -> admin.setStatus(7L, "DONE", null, null, null));
        when(signatureRepository.findById(9L)).thenReturn(Optional.empty());
        assertTrue(admin.setStatus(9L, "OPEN", null, null, null).isEmpty());
    }

    @Test
    void mutingRecordsTheReasonAndUnmutingClearsIt() {
        LogAlertSignature s = signature();
        when(signatureRepository.findById(7L)).thenReturn(Optional.of(s));

        admin.setMutedById(7L, true, "  known noise from crawlers  ");
        assertTrue(s.isMuted());
        assertEquals("known noise from crawlers", s.getMutedReason());

        admin.setMutedById(7L, false, "ignored");
        assertFalse(s.isMuted());
        assertNull(s.getMutedReason());
    }

    @Test
    void linkingAnIssueLeavesTheDecisionAndHistoryAlone() {
        LogAlertSignature s = signature();
        s.setFixStatus("FIXED");
        s.setFixedInCommit("abc1234");
        s.setFixedAt(Instant.now().minus(2, ChronoUnit.DAYS));
        s.setRegressedAt(Instant.now().minus(1, ChronoUnit.HOURS));
        s.setMuted(true);
        when(signatureRepository.findById(7L)).thenReturn(Optional.of(s));

        var updated = admin.linkIssue(7L, "  LMS-0042 ").orElseThrow();

        assertEquals("LMS-0042", updated.getIssuePublicId());
        assertEquals("FIXED", updated.getFixStatus());
        assertEquals("abc1234", updated.getFixedInCommit());
        assertNotNull(updated.getRegressedAt());
        assertTrue(updated.isMuted());
        assertTrue(admin.linkIssue(7L, "   ").orElseThrow().getIssuePublicId() == null);
    }

    @Test
    void linkingAnIssueToAMissingErrorIsEmpty() {
        when(signatureRepository.findById(99L)).thenReturn(Optional.empty());
        assertTrue(admin.linkIssue(99L, "LMS-1").isEmpty());
    }

    // ---- regression rule -----------------------------------------------------------------

    @Test
    void anErrorFromTheVeryReleaseThatShouldHaveFixedItIsARegression() {
        LogAlertSignature s = signature();
        s.setFixStatus("FIXED");
        s.setFixedInCommit("abcdef1");
        s.setFixedAt(Instant.now().minus(30, ChronoUnit.MINUTES));

        assertTrue(LogAlertingService.isRegression(s, Instant.now(), "abcdef1234567890"));
    }

    @Test
    void anErrorFromADifferentReleaseSoonAfterMarkingFixedIsNotYetARegression() {
        LogAlertSignature s = signature();
        s.setFixStatus("FIXED");
        s.setFixedInCommit("abcdef1");
        s.setFixedAt(Instant.now().minus(30, ChronoUnit.MINUTES));

        assertFalse(LogAlertingService.isRegression(s, Instant.now(), "0123456789abcdef"));
        assertFalse(LogAlertingService.isRegression(s, Instant.now(), null));
    }

    @Test
    void anythingAfterADayCountsEvenWithoutAMatchingCommit() {
        LogAlertSignature s = signature();
        s.setFixStatus("FIXED");
        s.setFixedInCommit("abcdef1");
        s.setFixedAt(Instant.now().minus(30, ChronoUnit.HOURS));

        assertTrue(LogAlertingService.isRegression(s, Instant.now(), "unknown"));
    }

    @Test
    void openAndExpectedErrorsAreNeverRegressions() {
        LogAlertSignature s = signature();
        assertFalse(LogAlertingService.isRegression(s, Instant.now(), "abcdef1234"));
        s.setFixStatus("EXPECTED");
        assertFalse(LogAlertingService.isRegression(s, Instant.now(), "abcdef1234"));
    }

    @Test
    void shortOrMissingCommitsNeverMatch() {
        assertFalse(LogAlertingService.commitsMatch("abc", "abc"));
        assertFalse(LogAlertingService.commitsMatch(null, "abcdef1"));
        assertTrue(LogAlertingService.commitsMatch("ABCDEF1", "abcdef1234"));
    }

    // ---- poller behaviour ----------------------------------------------------------------

    private GcpLogSummaryResponse entry(String commit, Instant at) {
        return GcpLogSummaryResponse.builder().message("Boom").httpPath("/api/v1/x")
                .timestamp(at.toString()).commit(commit).build();
    }

    @Test
    void aFixedErrorSeenAgainOnTheSameReleaseAlertsOnceAndIsFlagged() {
        LogAlertSignature s = signature();
        s.setFixStatus("FIXED");
        s.setFixedInCommit("abcdef1");
        s.setFixedAt(Instant.now().minus(10, ChronoUnit.MINUTES));
        when(signatureRepository.findByEnvironmentAndSignatureHash(eq("PRODUCTION"), anyString())).thenReturn(Optional.of(s));
        when(loggingService.search(any())).thenReturn(GcpLogSearchResponse.builder()
                .items(List.of(entry("abcdef1234567890", Instant.now().minusSeconds(20)),
                        entry("abcdef1234567890", Instant.now().minusSeconds(10))))
                .build());

        poller.pollForNewErrorsInternal();

        assertNotNull(s.getRegressedAt());
        assertEquals("abcdef1234567890", s.getLastSeenCommit());
        verify(telegramNotifier, times(1)).send(startsWith("REGRESSION"));
    }

    @Test
    void aMutedErrorThatSuddenlyFloodsComesBackWithAnAlert() {
        LogAlertSignature s = signature();
        s.setMuted(true);
        s.setMutedReason("crawler noise");
        when(signatureRepository.findByEnvironmentAndSignatureHash(eq("PRODUCTION"), anyString())).thenReturn(Optional.of(s));
        List<GcpLogSummaryResponse> burst = new java.util.ArrayList<>();
        for (int i = 0; i < LogAlertingService.MUTED_SPIKE_THRESHOLD; i++) {
            burst.add(entry(null, Instant.now().minusSeconds(100 - i)));
        }
        when(loggingService.search(any())).thenReturn(GcpLogSearchResponse.builder().items(burst).build());

        poller.pollForNewErrorsInternal();

        assertFalse(s.isMuted());
        verify(telegramNotifier).send(contains("spiking"));
    }

    @Test
    void aMutedErrorBelowTheThresholdStaysMuted() {
        LogAlertSignature s = signature();
        s.setMuted(true);
        when(signatureRepository.findByEnvironmentAndSignatureHash(eq("PRODUCTION"), anyString())).thenReturn(Optional.of(s));
        when(loggingService.search(any())).thenReturn(GcpLogSearchResponse.builder()
                .items(List.of(entry(null, Instant.now().minusSeconds(10)), entry(null, Instant.now().minusSeconds(5))))
                .build());

        poller.pollForNewErrorsInternal();

        assertTrue(s.isMuted());
        verify(telegramNotifier, never()).send(anyString());
    }

    @Test
    void aBrandNewErrorRemembersItsReleaseAndPath() {
        when(signatureRepository.findByEnvironmentAndSignatureHash(eq("PRODUCTION"), anyString())).thenReturn(Optional.empty());
        when(loggingService.search(any())).thenReturn(GcpLogSearchResponse.builder()
                .items(List.of(entry("f00dbabe1234", Instant.now().minusSeconds(10)))).build());

        poller.pollForNewErrorsInternal();

        var captor = org.mockito.ArgumentCaptor.forClass(LogAlertSignature.class);
        verify(signatureRepository).save(captor.capture());
        assertEquals("f00dbabe1234", captor.getValue().getLastSeenCommit());
        assertEquals("/api/v1/x", captor.getValue().getSamplePath());
    }
}
