package com._42students.lms.service.impl;

import com._42students.lms.dto.request.LogContextRequest;
import com._42students.lms.dto.response.DeployMarkerResponse;
import com._42students.lms.dto.response.LogContextResponse;
import com._42students.lms.dto.response.LogDigestResponse;
import com._42students.lms.model.LogAlertSignature;
import com._42students.lms.repository.LogAlertSignatureRepository;
import com._42students.lms.service.GcpCloudLoggingService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LogDigestAndContextTest {

    @Mock private LogAlertSignatureRepository signatureRepository;
    @Mock private GcpCloudLoggingService loggingService;
    @Mock private TelegramNotifierService telegramNotifier;
    @Mock private JdbcTemplate jdbc;

    @InjectMocks private LogDigestService digestService;
    @InjectMocks private LogContextService contextService;

    private LogAlertSignature signature(long id, String message, Instant firstSeen, long count) {
        LogAlertSignature s = new LogAlertSignature();
        s.setId(id);
        s.setSampleMessage(message);
        s.setSamplePath("/api/v1/x" + id);
        s.setFirstSeenAt(firstSeen);
        s.setLastSeenAt(Instant.now().minusSeconds(60));
        s.setOccurrenceCount(count);
        return s;
    }

    // ---- digest --------------------------------------------------------------------------

    @Test
    void digestListsNewErrorsAndRegressionsButSkipsMutedAndOldOnes() {
        Instant recent = Instant.now().minus(2, ChronoUnit.HOURS);
        LogAlertSignature fresh = signature(1, "Brand new", recent, 9);
        LogAlertSignature muted = signature(2, "Muted new", recent, 50);
        muted.setMuted(true);
        LogAlertSignature old = signature(3, "Old one", Instant.now().minus(10, ChronoUnit.DAYS), 200);
        LogAlertSignature regressed = signature(4, "Came back", Instant.now().minus(10, ChronoUnit.DAYS), 30);
        regressed.setFixStatus("FIXED");
        regressed.setFixedInCommit("abc1234");
        regressed.setRegressedAt(recent);
        when(signatureRepository.findByEnvironmentOrderByLastSeenAtDesc("PRODUCTION"))
                .thenReturn(List.of(fresh, muted, old, regressed));
        when(loggingService.deployMarkers(anyString(), anyInt())).thenReturn(List.of(
                DeployMarkerResponse.builder().at(Instant.now().minus(1, ChronoUnit.HOURS)).commit("bbb2222").pods(2).build(),
                DeployMarkerResponse.builder().at(Instant.now().minus(5, ChronoUnit.DAYS)).commit("aaa1111").pods(2).build()));

        LogDigestResponse digest = digestService.build(Duration.ofHours(24));

        assertEquals(1, digest.getNewErrors().size());
        assertEquals("Brand new", digest.getNewErrors().get(0).getMessage());
        assertEquals(1, digest.getRegressions().size());
        assertEquals("abc1234", digest.getRegressions().get(0).getFixedInCommit());
        assertEquals(2, digest.getStillActive()); // fresh + old (both seen recently, open, unmuted); regressed is FIXED
        assertEquals(1, digest.getDeploys().size());
        assertFalse(digest.isQuiet());
    }

    @Test
    void aDayWithNothingNewIsQuietAndTheMessageSaysSo() {
        when(signatureRepository.findByEnvironmentOrderByLastSeenAtDesc("PRODUCTION")).thenReturn(List.of());
        when(loggingService.deployMarkers(anyString(), anyInt())).thenThrow(new RuntimeException("no cloud"));

        LogDigestResponse digest = digestService.build(Duration.ofHours(24));

        assertTrue(digest.isQuiet());
        assertTrue(digest.getDeploys().isEmpty());
        assertTrue(LogDigestService.format(digest).contains("All quiet"));
    }

    @Test
    void theTelegramTextNamesRegressionsFirstAndStaysUnderTheMessageLimit() {
        List<LogDigestResponse.Item> many = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            many.add(LogDigestResponse.Item.builder().message("x".repeat(400)).path("/api/v1/p" + i).occurrences(3).build());
        }
        LogDigestResponse digest = LogDigestResponse.builder()
                .since(Instant.now().minus(24, ChronoUnit.HOURS)).until(Instant.now())
                .newErrors(many)
                .regressions(List.of(LogDigestResponse.Item.builder().message("Came back").path("/api/v1/r").occurrences(2).build()))
                .stillActive(4).deploys(List.of()).quiet(false).build();

        String text = LogDigestService.format(digest);

        assertTrue(text.indexOf("Came back after") < text.indexOf("New error types"));
        assertTrue(text.length() <= 3810);
    }

    @Test
    void theWeeklyViewListsWhatGotFixedAndIsLabelledAsAWeek() {
        LogAlertSignature fixedThisWeek = signature(5, "Was broken", Instant.now().minus(20, ChronoUnit.DAYS), 40);
        fixedThisWeek.setFixStatus("FIXED");
        fixedThisWeek.setFixedInCommit("abc1234");
        fixedThisWeek.setFixedAt(Instant.now().minus(2, ChronoUnit.DAYS));
        LogAlertSignature fixedLongAgo = signature(6, "Fixed ages ago", Instant.now().minus(60, ChronoUnit.DAYS), 40);
        fixedLongAgo.setFixStatus("FIXED");
        fixedLongAgo.setFixedAt(Instant.now().minus(30, ChronoUnit.DAYS));
        when(signatureRepository.findByEnvironmentOrderByLastSeenAtDesc("PRODUCTION")).thenReturn(List.of(fixedThisWeek, fixedLongAgo));
        when(loggingService.deployMarkers(anyString(), anyInt())).thenReturn(List.of());

        LogDigestResponse digest = digestService.build(Duration.ofDays(7));

        assertEquals(1, digest.getFixed().size());
        assertEquals("Was broken", digest.getFixed().get(0).getMessage());
        String text = LogDigestService.format(digest);
        assertTrue(text.contains("weekly log summary (last 7 days)"));
        assertTrue(text.contains("Marked fixed (1)"));
        assertTrue(LogDigestService.format(digestService.build(Duration.ofHours(24))).contains("daily log digest (last 24h)"));
    }

    @Test
    void sendNowReportsWhetherTelegramDelivered() {
        when(signatureRepository.findByEnvironmentOrderByLastSeenAtDesc("PRODUCTION")).thenReturn(List.of());
        when(loggingService.deployMarkers(anyString(), anyInt())).thenReturn(List.of());
        when(telegramNotifier.send(anyString())).thenReturn(true);

        assertTrue(digestService.sendNow());
    }

    // ---- context lookups -----------------------------------------------------------------

    @Test
    void anEmptyRequestTouchesNoTables() {
        LogContextResponse response = contextService.resolve(new LogContextRequest());
        assertTrue(response.getUsers().isEmpty());
        assertTrue(response.getColleges().isEmpty());
        verifyNoInteractions(jdbc);
    }

    @Test
    void onlyPositiveKnownUserTypesAreLookedUpAndSuperAdminIsSkipped() {
        LogContextRequest request = new LogContextRequest();
        request.setUsers(List.of(ref(0, "FACULTY"), ref(-3, "LEARNER"), ref(15, "faculty"), ref(7, "LEARNER"),
                ref(8, "ALIEN"), ref(null, "LEARNER")));
        when(jdbc.query(anyString(), any(Object[].class), any(RowMapper.class))).thenReturn(List.of());

        contextService.resolve(request);

        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Object[]> params = ArgumentCaptor.forClass(Object[].class);
        verify(jdbc, times(2)).query(sql.capture(), params.capture(), any(RowMapper.class));
        assertTrue(sql.getAllValues().get(0).contains("FROM learner"));
        assertArrayEquals(new Object[]{7}, params.getAllValues().get(0));
        assertTrue(sql.getAllValues().get(1).contains("FROM faculty"));
        assertArrayEquals(new Object[]{15}, params.getAllValues().get(1));
        assertFalse(sql.getAllValues().get(0).contains("15"), "ids must be bound parameters, never concatenated");
    }

    @Test
    void anOversizedRequestIsCapped() {
        LogContextRequest request = new LogContextRequest();
        List<Integer> ids = new ArrayList<>();
        for (int i = 1; i <= 500; i++) ids.add(i);
        request.setCollegeIds(ids);
        when(jdbc.query(anyString(), any(Object[].class), any(RowMapper.class))).thenReturn(List.of());

        contextService.resolve(request);

        ArgumentCaptor<Object[]> params = ArgumentCaptor.forClass(Object[].class);
        verify(jdbc).query(anyString(), params.capture(), any(RowMapper.class));
        assertEquals(LogContextService.MAX_IDS, params.getValue().length);
    }

    @Test
    void facultyTypeIsShownByNameEvenThoughTheColumnStoresItsOrdinal() {
        assertEquals("PERMANENT", LogContextService.facultyTypeName("0"));
        assertEquals("ADMIN", LogContextService.facultyTypeName("4"));
        assertEquals("TPO", LogContextService.facultyTypeName(String.valueOf(com._42students.lms.enums.FacultyType.TPO.ordinal())));
        assertEquals("99", LogContextService.facultyTypeName("99"));
        assertEquals("MENTOR", LogContextService.facultyTypeName("MENTOR"));
        assertNull(LogContextService.facultyTypeName(null));
        assertNull(LogContextService.facultyTypeName(" "));
    }

    @Test
    void placeholdersAndNamesAreFormattedSafely() {
        assertEquals("?,?,?", LogContextService.placeholders(3));
        assertEquals("Asha Rao", LogContextService.fullName(" Asha ", "Rao "));
        assertEquals("Asha", LogContextService.fullName("Asha", null));
        assertNull(LogContextService.fullName(null, "  "));
    }

    private static LogContextRequest.UserRef ref(Integer id, String type) {
        LogContextRequest.UserRef ref = new LogContextRequest.UserRef();
        ref.setId(id);
        ref.setUserType(type);
        return ref;
    }
}
