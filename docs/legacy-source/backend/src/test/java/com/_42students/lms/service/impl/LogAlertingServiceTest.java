package com._42students.lms.service.impl;

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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LogAlertingServiceTest {

    @Mock private GcpCloudLoggingService loggingService;
    @Mock private LogAlertSignatureRepository signatureRepository;
    @Mock private LogAlertSignatureAccountRepository signatureAccountRepository;
    @Mock private LogAlertStateRepository stateRepository;
    @Mock private TelegramNotifierService telegramNotifier;
    @Mock private BugReportRepository bugReportRepository;

    @InjectMocks private LogAlertingService service;

    @Captor private ArgumentCaptor<LogAlertSignature> signatureCaptor;
    @Captor private ArgumentCaptor<String> messageCaptor;

    @BeforeEach
    void setup() {
        lenient().when(stateRepository.findByStateKey(anyString())).thenReturn(Optional.empty());
        // ensureStateRow() saves a fresh row when none exists yet; a real save() returns the same
        // (now-managed) entity it was given.
        lenient().when(stateRepository.save(any(LogAlertState.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(bugReportRepository.countByEnvironmentAndCreatedAtBetween(anyString(), any(), any())).thenReturn(0L);
        // Default to "delivered" so persistence happens as expected in tests that don't care about
        // the delivery-failure path specifically; aFailedTelegramSendDoesNotPermanentlyMarkTheErrorAsSeen overrides this.
        lenient().when(telegramNotifier.send(anyString(), anyString())).thenReturn(true);
    }

    private GcpLogSummaryResponse entry(String message, String path, Instant timestamp) {
        return GcpLogSummaryResponse.builder().message(message).httpPath(path).timestamp(timestamp.toString()).build();
    }

    @Test
    void aNewErrorFromAKnownAccountRecordsItForBlastRadius() {
        when(loggingService.search(any())).thenReturn(GcpLogSearchResponse.builder()
                .items(List.of(entry("[Frontend] boom | account=42/LEARNER", "/dashboard", Instant.now().minusSeconds(10))))
                .build());
        when(signatureRepository.findByEnvironmentAndSignatureHash(eq("PRODUCTION"), anyString()))
                .thenReturn(Optional.empty());
        LogAlertSignature saved = new LogAlertSignature();
        saved.setId(77L);
        when(signatureRepository.save(any(LogAlertSignature.class))).thenReturn(saved);

        service.pollForNewErrorsInternal();

        ArgumentCaptor<LogAlertSignatureAccount> captor = ArgumentCaptor.forClass(LogAlertSignatureAccount.class);
        verify(signatureAccountRepository).save(captor.capture());
        assertEquals(77L, captor.getValue().getSignatureId());
        assertEquals(42L, captor.getValue().getAccountId());
    }

    @Test
    void aRecurringErrorFromANewAccountAddsToBlastRadiusWithoutReAlerting() {
        LogAlertSignature existing = new LogAlertSignature();
        existing.setId(5L);
        existing.setOccurrenceCount(3);
        when(loggingService.search(any())).thenReturn(GcpLogSearchResponse.builder()
                .items(List.of(entry("[Frontend] boom | account=99/LEARNER", "/dashboard", Instant.now().minusSeconds(10))))
                .build());
        when(signatureRepository.findByEnvironmentAndSignatureHash(eq("PRODUCTION"), anyString()))
                .thenReturn(Optional.of(existing));

        service.pollForNewErrorsInternal();

        verify(telegramNotifier, never()).send(anyString(), anyString());
        ArgumentCaptor<LogAlertSignatureAccount> captor = ArgumentCaptor.forClass(LogAlertSignatureAccount.class);
        verify(signatureAccountRepository).save(captor.capture());
        assertEquals(5L, captor.getValue().getSignatureId());
        assertEquals(99L, captor.getValue().getAccountId());
    }

    @Test
    void theSameAccountHittingTheSameSignatureTwiceIsOnlyRecordedOnce() {
        LogAlertSignature existing = new LogAlertSignature();
        existing.setId(5L);
        when(loggingService.search(any())).thenReturn(GcpLogSearchResponse.builder()
                .items(List.of(entry("[Frontend] boom | account=42/LEARNER", "/dashboard", Instant.now().minusSeconds(10))))
                .build());
        when(signatureRepository.findByEnvironmentAndSignatureHash(eq("PRODUCTION"), anyString()))
                .thenReturn(Optional.of(existing));
        when(signatureAccountRepository.existsBySignatureIdAndAccountId(5L, 42L)).thenReturn(true);

        service.pollForNewErrorsInternal();

        verify(signatureAccountRepository, never()).save(any());
    }

    @Test
    void aBackendErrorWithNoAccountMarkerRecordsNoBlastRadius() {
        when(loggingService.search(any())).thenReturn(GcpLogSearchResponse.builder()
                .items(List.of(entry("NullPointerException at foo.Bar", "/api/v1/x", Instant.now().minusSeconds(10))))
                .build());
        when(signatureRepository.findByEnvironmentAndSignatureHash(eq("PRODUCTION"), anyString()))
                .thenReturn(Optional.empty());

        service.pollForNewErrorsInternal();

        verify(signatureAccountRepository, never()).save(any());
    }

    @Test
    void firstOccurrenceOfAnErrorSendsOneAlertAndPersistsSignature() {
        when(loggingService.search(any())).thenReturn(GcpLogSearchResponse.builder()
                .items(List.of(entry("Boom", "/api/v1/x", Instant.now().minusSeconds(10))))
                .build());
        when(signatureRepository.findByEnvironmentAndSignatureHash(eq("PRODUCTION"), anyString()))
                .thenReturn(Optional.empty());

        service.pollForNewErrorsInternal();

        verify(telegramNotifier, times(1)).send(messageCaptor.capture(), anyString());
        assertTrue(messageCaptor.getValue().contains("New error type"));
        verify(signatureRepository).save(signatureCaptor.capture());
        assertEquals(1, signatureCaptor.getValue().getOccurrenceCount());
        verify(stateRepository).updatePollCursor(anyString(), any(Instant.class));
    }

    @Test
    void recurringKnownErrorDoesNotReAlert() {
        when(loggingService.search(any())).thenReturn(GcpLogSearchResponse.builder()
                .items(List.of(entry("Boom again", "/api/v1/x", Instant.now().minusSeconds(10))))
                .build());
        LogAlertSignature existing = new LogAlertSignature();
        existing.setOccurrenceCount(5);
        when(signatureRepository.findByEnvironmentAndSignatureHash(eq("PRODUCTION"), anyString()))
                .thenReturn(Optional.of(existing));

        service.pollForNewErrorsInternal();

        verify(telegramNotifier, never()).send(anyString(), anyString());
        verify(signatureRepository).save(existing);
        assertEquals(6, existing.getOccurrenceCount());
    }

    @Test
    void noEntriesMeansNoAlertsAndNoStateWrite() {
        when(loggingService.search(any())).thenReturn(GcpLogSearchResponse.builder().items(List.of()).build());

        service.pollForNewErrorsInternal();

        verifyNoInteractions(telegramNotifier);
        verify(stateRepository, never()).updatePollCursor(anyString(), any());
    }

    @Test
    void aPollFailureIsSwallowedNotPropagated() {
        when(loggingService.search(any())).thenThrow(new RuntimeException("Cloud Logging unavailable"));
        assertDoesNotThrow(() -> service.pollForNewErrorsInternal());
    }

    @Test
    void theAcknowledgeButtonCallbackDataStaysWithinTelegramsSixtyFourByteLimit() {
        // Regression test for a real production incident: "ack:" (4 bytes) + a full SHA-256 hex
        // hash (64 bytes) is 68 bytes, over Telegram's 64-byte callback_data cap -- every real
        // alert with this button was rejected outright with 400 BUTTON_DATA_INVALID, and because a
        // signature is only persisted on confirmed delivery, the rejected alert's error type could
        // never successfully notify on any later occurrence either.
        when(loggingService.search(any())).thenReturn(GcpLogSearchResponse.builder()
                .items(List.of(entry("Boom", "/api/v1/x", Instant.now().minusSeconds(10))))
                .build());
        when(signatureRepository.findByEnvironmentAndSignatureHash(eq("PRODUCTION"), anyString()))
                .thenReturn(Optional.empty());
        ArgumentCaptor<String> callbackDataCaptor = ArgumentCaptor.forClass(String.class);

        service.pollForNewErrorsInternal();

        verify(telegramNotifier).send(anyString(), callbackDataCaptor.capture());
        int byteLength = callbackDataCaptor.getValue().getBytes(java.nio.charset.StandardCharsets.UTF_8).length;
        assertTrue(byteLength <= 64, "callback_data was " + byteLength + " bytes, Telegram's limit is 64");
    }

    @Test
    void recurringErrorLooksUpItsSignatureExactlyOnce() {
        // Regression guard: an earlier version of recordExistingOccurrence re-queried the
        // repository a second time internally after the caller had already fetched it.
        when(loggingService.search(any())).thenReturn(GcpLogSearchResponse.builder()
                .items(List.of(entry("Boom again", "/api/v1/x", Instant.now().minusSeconds(10))))
                .build());
        LogAlertSignature existing = new LogAlertSignature();
        existing.setOccurrenceCount(5);
        when(signatureRepository.findByEnvironmentAndSignatureHash(eq("PRODUCTION"), anyString()))
                .thenReturn(Optional.of(existing));

        service.pollForNewErrorsInternal();

        verify(signatureRepository, times(1)).findByEnvironmentAndSignatureHash(eq("PRODUCTION"), anyString());
    }

    @Test
    void aFailedTelegramSendDoesNotPermanentlyMarkTheErrorAsSeen() {
        // If delivery fails, the signature must NOT be persisted -- otherwise the very error
        // nobody was told about would never alert again, since alerting only fires on first sight.
        when(loggingService.search(any())).thenReturn(GcpLogSearchResponse.builder()
                .items(List.of(entry("Boom", "/api/v1/x", Instant.now().minusSeconds(10))))
                .build());
        when(signatureRepository.findByEnvironmentAndSignatureHash(eq("PRODUCTION"), anyString()))
                .thenReturn(Optional.empty());
        when(telegramNotifier.send(anyString(), anyString())).thenReturn(false);

        service.pollForNewErrorsInternal();

        verify(telegramNotifier, times(1)).send(anyString(), anyString());
        verify(signatureRepository, never()).save(any());
        // The cursor still advances past this entry -- it isn't re-fetched from Cloud Logging, but
        // if the same error recurs later it will still be treated as "new" and retried.
        verify(stateRepository).updatePollCursor(anyString(), any(Instant.class));
    }

    @Test
    void aRateLimitedSuppressedSignatureIsStillPersistedEvenThoughNoIndividualAlertWasSent() {
        List<GcpLogSummaryResponse> entries = new java.util.ArrayList<>();
        for (int i = 0; i < 7; i++) {
            entries.add(entry("Distinct error " + i, "/api/v1/x" + i, Instant.now().minusSeconds(60 - i)));
        }
        when(loggingService.search(any())).thenReturn(GcpLogSearchResponse.builder().items(entries).build());
        when(signatureRepository.findByEnvironmentAndSignatureHash(eq("PRODUCTION"), anyString()))
                .thenReturn(Optional.empty());

        service.pollForNewErrorsInternal();

        // All 7 distinct new signatures get persisted -- 5 because delivery succeeded, 2 because
        // they were rate-limited (not failed) and are recorded so they don't re-attempt next poll.
        verify(signatureRepository, times(7)).save(any(LogAlertSignature.class));
    }

    @Test
    void aBacklogBiggerThanThePageCapAdvancesTheCursorOnlyToWhatWasActuallyProcessed() {
        // Simulates a burst bigger than MAX_PAGES_PER_POLL (4) pages can cover in one poll: each
        // page returns one entry and still has a nextPageToken, i.e. even the last page fetched
        // has more behind it. The fix under test: the cursor must advance only to the OLDEST entry
        // actually processed (not "now"/newest), so the remainder is picked up on later polls
        // instead of being silently skipped forever.
        Instant t1 = Instant.now().minusSeconds(40); // oldest
        Instant t2 = Instant.now().minusSeconds(30);
        Instant t3 = Instant.now().minusSeconds(20);
        Instant t4 = Instant.now().minusSeconds(10); // newest fetched, but more still exist beyond it
        GcpLogSearchResponse page1 = GcpLogSearchResponse.builder()
                .items(List.of(entry("err4", "/x4", t4))).nextPageToken("p2").queriedAt(Instant.now()).build();
        GcpLogSearchResponse page2 = GcpLogSearchResponse.builder()
                .items(List.of(entry("err3", "/x3", t3))).nextPageToken("p3").queriedAt(Instant.now()).build();
        GcpLogSearchResponse page3 = GcpLogSearchResponse.builder()
                .items(List.of(entry("err2", "/x2", t2))).nextPageToken("p4").queriedAt(Instant.now()).build();
        GcpLogSearchResponse page4 = GcpLogSearchResponse.builder()
                .items(List.of(entry("err1", "/x1", t1))).nextPageToken("p5-more-exist").queriedAt(Instant.now()).build();
        when(loggingService.search(any())).thenReturn(page1, page2, page3, page4);
        when(signatureRepository.findByEnvironmentAndSignatureHash(eq("PRODUCTION"), anyString()))
                .thenReturn(Optional.empty());

        service.pollForNewErrorsInternal();

        verify(loggingService, times(4)).search(any());
        ArgumentCaptor<Instant> cursorCaptor = ArgumentCaptor.forClass(Instant.class);
        verify(stateRepository).updatePollCursor(anyString(), cursorCaptor.capture());
        // Cursor lands on the oldest of the 4 fetched entries (t1), not the newest (t4) -- so the
        // next poll picks up right after it rather than jumping past the untouched remainder.
        assertEquals(t1, cursorCaptor.getValue());
    }

    @Test
    void moreThanFiveNewSignaturesInOnePollSendsASummaryInsteadOfSpamming() {
        List<GcpLogSummaryResponse> entries = new java.util.ArrayList<>();
        for (int i = 0; i < 7; i++) {
            entries.add(entry("Distinct error " + i, "/api/v1/x" + i, Instant.now().minusSeconds(60 - i)));
        }
        when(loggingService.search(any())).thenReturn(GcpLogSearchResponse.builder().items(entries).build());
        when(signatureRepository.findByEnvironmentAndSignatureHash(eq("PRODUCTION"), anyString()))
                .thenReturn(Optional.empty());

        service.pollForNewErrorsInternal();

        // 5 individual "new error" alerts + 1 summary for the 2 suppressed ones.
        verify(telegramNotifier, times(5)).send(anyString(), anyString());
        verify(telegramNotifier, times(1)).send(contains("suppressed"));
    }
}
