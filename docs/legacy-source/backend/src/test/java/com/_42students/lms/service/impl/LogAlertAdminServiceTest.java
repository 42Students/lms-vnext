package com._42students.lms.service.impl;

import com._42students.lms.dto.response.LogKnownErrorResponse;
import com._42students.lms.model.LogAlertSignature;
import com._42students.lms.model.LogAlertState;
import com._42students.lms.repository.LogAlertSignatureAccountRepository;
import com._42students.lms.repository.LogAlertSignatureRepository;
import com._42students.lms.repository.LogAlertStateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LogAlertAdminServiceTest {

    @Mock private LogAlertStateRepository stateRepository;
    @Mock private LogAlertSignatureRepository signatureRepository;
    @Mock private LogAlertSignatureAccountRepository signatureAccountRepository;
    @Mock private KubernetesPodInfoService podInfoService;

    @InjectMocks private LogAlertAdminService service;

    @BeforeEach
    void setup() {
        lenient().when(stateRepository.save(any(LogAlertState.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void getLastViewedAtReturnsNullWhenNoStateRowExistsYet() {
        when(stateRepository.findByStateKey(anyString())).thenReturn(Optional.empty());
        assertNull(service.getLastViewedAt());
    }

    @Test
    void getLastViewedAtReturnsThePersistedValue() {
        LogAlertState state = new LogAlertState();
        Instant viewedAt = Instant.now().minusSeconds(120);
        state.setAdminLastViewedAt(viewedAt);
        when(stateRepository.findByStateKey(anyString())).thenReturn(Optional.of(state));
        assertEquals(viewedAt, service.getLastViewedAt());
    }

    @Test
    void markViewedNowCreatesTheRowWhenMissingThenUpdatesOnlyTheViewedColumn() {
        when(stateRepository.findByStateKey(anyString())).thenReturn(Optional.empty());

        service.markViewedNow();

        verify(stateRepository).save(any(LogAlertState.class));
        verify(stateRepository).updateAdminLastViewed(anyString(), any(Instant.class));
    }

    @Test
    void markViewedNowDoesNotInsertAgainWhenRowAlreadyExists() {
        when(stateRepository.findByStateKey(anyString())).thenReturn(Optional.of(new LogAlertState()));

        service.markViewedNow();

        verify(stateRepository, never()).save(any());
        verify(stateRepository).updateAdminLastViewed(anyString(), any(Instant.class));
    }

    @Test
    void markViewedNowToleratesLosingTheInsertRaceToTheAlertingPoller() {
        when(stateRepository.findByStateKey(anyString())).thenReturn(Optional.empty());
        when(stateRepository.save(any(LogAlertState.class))).thenThrow(new DataIntegrityViolationException("dup"));

        assertDoesNotThrow(() -> service.markViewedNow());
        verify(stateRepository).updateAdminLastViewed(anyString(), any(Instant.class));
    }

    @Test
    void getBackendStartedAtFallsBackToProcessStartWhenKubernetesApiIsUnavailable() {
        when(podInfoService.getOwnDeploymentPodTimes(anyString())).thenReturn(Optional.empty());
        Instant first = service.getBackendStartedAt();
        Instant second = service.getBackendStartedAt();
        assertEquals(first, second);
    }

    @Test
    void getBackendStartedAtUsesTheMostRecentReplicaStartFromKubernetesWhenAvailable() {
        Instant earliest = Instant.now().minusSeconds(600);
        Instant latest = Instant.now().minusSeconds(60);
        when(podInfoService.getOwnDeploymentPodTimes("component=lms-be"))
                .thenReturn(Optional.of(new KubernetesPodInfoService.PodTimes(earliest, latest, 2)));

        assertEquals(latest, service.getBackendStartedAt());
    }

    @Test
    void listKnownErrorsReturnsEmptyWhenNoneTracked() {
        when(signatureRepository.findByEnvironmentOrderByLastSeenAtDesc("PRODUCTION")).thenReturn(List.of());
        assertTrue(service.listKnownErrors("PRODUCTION").isEmpty());
        verify(signatureAccountRepository, never()).countBySignatureIds(any());
    }

    @Test
    void listKnownErrorsAttachesBlastRadiusWhereKnownAndLeavesItNullOtherwise() {
        LogAlertSignature withAccounts = new LogAlertSignature();
        withAccounts.setId(1L);
        withAccounts.setSampleMessage("boom");
        withAccounts.setOccurrenceCount(10);
        LogAlertSignature withoutAccounts = new LogAlertSignature();
        withoutAccounts.setId(2L);
        withoutAccounts.setSampleMessage("NullPointerException");
        withoutAccounts.setOccurrenceCount(3);
        when(signatureRepository.findByEnvironmentOrderByLastSeenAtDesc("PRODUCTION"))
                .thenReturn(List.of(withAccounts, withoutAccounts));
        when(signatureAccountRepository.countBySignatureIds(List.of(1L, 2L)))
                .thenReturn(List.of(countRow(1L, 7L)));

        List<LogKnownErrorResponse> result = service.listKnownErrors("PRODUCTION");

        assertEquals(2, result.size());
        assertEquals(7L, result.get(0).getDistinctAccountCount());
        assertNull(result.get(1).getDistinctAccountCount());
    }

    private LogAlertSignatureAccountRepository.CountRow countRow(Long sigId, Long cnt) {
        return new LogAlertSignatureAccountRepository.CountRow() {
            public Long getSigId() { return sigId; }
            public Long getCnt() { return cnt; }
        };
    }

    @Test
    void setMutedReturnsFalseWhenSignatureWasNeverRecordedByThePoller() {
        when(signatureRepository.findByEnvironmentAndSignatureHash(anyString(), anyString())).thenReturn(Optional.empty());
        assertFalse(service.setMuted("PRODUCTION", "some message", "/x", true));
        verify(signatureRepository, never()).save(any());
    }

    @Test
    void setMutedByIdReturnsFalseWhenSignatureDoesNotExist() {
        when(signatureRepository.findById(404L)).thenReturn(Optional.empty());
        assertFalse(service.setMutedById(404L, true));
        verify(signatureRepository, never()).save(any());
    }

    @Test
    void setMutedByIdTogglesTheFlagOnAnExistingSignature() {
        LogAlertSignature signature = new LogAlertSignature();
        signature.setId(5L);
        signature.setMuted(false);
        when(signatureRepository.findById(5L)).thenReturn(Optional.of(signature));

        boolean result = service.setMutedById(5L, true);

        assertTrue(result);
        assertTrue(signature.isMuted());
        verify(signatureRepository).save(signature);
    }

    @Test
    void setMutedTogglesTheFlagOnAnExistingSignature() {
        LogAlertSignature signature = new LogAlertSignature();
        signature.setMuted(false);
        when(signatureRepository.findByEnvironmentAndSignatureHash(anyString(), anyString())).thenReturn(Optional.of(signature));

        boolean result = service.setMuted("PRODUCTION", "some message", "/x", true);

        assertTrue(result);
        assertTrue(signature.isMuted());
        verify(signatureRepository).save(signature);
    }
}
