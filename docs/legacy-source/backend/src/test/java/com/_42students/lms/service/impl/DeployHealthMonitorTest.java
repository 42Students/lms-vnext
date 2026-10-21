package com._42students.lms.service.impl;

import com._42students.lms.dto.response.DeployHealthResponse;
import com._42students.lms.dto.response.DeployMarkerResponse;
import com._42students.lms.model.LogAlertState;
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
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeployHealthMonitorTest {

    @Mock private GcpCloudLoggingService loggingService;
    @Mock private LogAlertStateRepository stateRepository;
    @Mock private TelegramNotifierService telegramNotifier;

    @InjectMocks private DeployHealthMonitor monitor;

    private final Instant now = Instant.parse("2026-09-28T12:00:00Z");

    @BeforeEach
    void setup() {
        lenient().when(stateRepository.findByStateKey(anyString())).thenReturn(Optional.empty());
        lenient().when(stateRepository.save(any(LogAlertState.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(telegramNotifier.send(anyString())).thenReturn(true);
    }

    private DeployMarkerResponse deploy(long minutesAgo) {
        return DeployMarkerResponse.builder().at(now.minus(minutesAgo, ChronoUnit.MINUTES)).commit("abcdef1234567").pods(2).build();
    }

    private DeployHealthResponse health(String verdict, int before, int after) {
        return DeployHealthResponse.builder().verdict(verdict).errorsBefore(before).errorsAfter(after).windowMinutes(10).build();
    }

    @Test
    void aJumpAfterASettledDeployAlertsOnceAndRecordsTheDeploy() {
        DeployMarkerResponse d = deploy(30);
        when(loggingService.deployMarkers(anyString(), anyInt())).thenReturn(List.of(d));
        when(loggingService.deployHealth(eq("PRODUCTION"), eq(d.getAt()))).thenReturn(health("JUMP", 1, 40));

        monitor.checkInternal(now);

        verify(telegramNotifier).send(contains("Errors jumped after a deploy"));
        verify(stateRepository).updatePollCursor(DeployHealthMonitor.STATE_KEY, d.getAt());
    }

    @Test
    void aHealthyDeployIsRecordedWithoutAnyAlert() {
        DeployMarkerResponse d = deploy(30);
        when(loggingService.deployMarkers(anyString(), anyInt())).thenReturn(List.of(d));
        when(loggingService.deployHealth(anyString(), any())).thenReturn(health("OK", 3, 2));

        monitor.checkInternal(now);

        verify(telegramNotifier, never()).send(anyString());
        verify(stateRepository).updatePollCursor(DeployHealthMonitor.STATE_KEY, d.getAt());
    }

    @Test
    void itWaitsUntilTheComparisonWindowIsComplete() {
        when(loggingService.deployMarkers(anyString(), anyInt())).thenReturn(List.of(deploy(5)));

        monitor.checkInternal(now);

        verify(loggingService, never()).deployHealth(anyString(), any());
        verifyNoInteractions(telegramNotifier);
    }

    @Test
    void aDeployAlreadyEvaluatedIsNeverEvaluatedTwice() {
        DeployMarkerResponse d = deploy(30);
        LogAlertState state = new LogAlertState();
        state.setStateKey(DeployHealthMonitor.STATE_KEY);
        state.setPollCursorAt(d.getAt());
        when(stateRepository.findByStateKey(DeployHealthMonitor.STATE_KEY)).thenReturn(Optional.of(state));
        when(loggingService.deployMarkers(anyString(), anyInt())).thenReturn(List.of(d));

        monitor.checkInternal(now);

        verify(loggingService, never()).deployHealth(anyString(), any());
        verifyNoInteractions(telegramNotifier);
    }

    @Test
    void anOldDeployIsRecordedButNotPagedAbout() {
        DeployMarkerResponse d = deploy(60 * 5);
        when(loggingService.deployMarkers(anyString(), anyInt())).thenReturn(List.of(d));
        when(loggingService.deployHealth(anyString(), any())).thenReturn(health("JUMP", 0, 50));

        monitor.checkInternal(now);

        verify(stateRepository).updatePollCursor(DeployHealthMonitor.STATE_KEY, d.getAt());
        verify(telegramNotifier, never()).send(anyString());
    }

    @Test
    void noDeploysOrAFailingLookupIsQuietlyIgnored() {
        when(loggingService.deployMarkers(anyString(), anyInt())).thenReturn(List.of());
        monitor.checkInternal(now);

        when(loggingService.deployMarkers(anyString(), anyInt())).thenThrow(new RuntimeException("cloud logging down"));
        assertDoesNotThrow(() -> monitor.checkInternal(now));

        verifyNoInteractions(telegramNotifier);
    }

    @Test
    void onlyAJumpAlertsAndTheTextNamesTheReleaseAndCounts() {
        assertTrue(DeployHealthMonitor.shouldAlert(health("JUMP", 0, 9)));
        assertFalse(DeployHealthMonitor.shouldAlert(health("ELEVATED", 2, 4)));
        assertFalse(DeployHealthMonitor.shouldAlert(null));
        String text = DeployHealthMonitor.alertText(deploy(30), DeployHealthResponse.builder().errorsBefore(1).errorsAfter(40).capped(true).build());
        assertTrue(text.contains("abcdef1"));
        assertTrue(text.contains("after: 40+"));
    }
}
