package com._42students.lms.service.tpo;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** 13 Oct 2026: the evening-before interview reminder, and the details both interview emails carry. */
class InterviewReminderServiceTest {

    private final NamedParameterJdbcTemplate jdbc = mock(NamedParameterJdbcTemplate.class);
    private final NotificationOutboxService outbox = mock(NotificationOutboxService.class);
    private final InterviewReminderService reminders = new InterviewReminderService(jdbc, outbox);

    private static Map<String, Object> row(LocalDateTime startsUtc, String room, String mode, String link) {
        Map<String, Object> r = new HashMap<>();
        r.put("assignmentId", 7L); r.put("learnerId", 159); r.put("roundId", 4L); r.put("round", "Technical interview");
        r.put("company", "Omega"); r.put("role", "Developer"); r.put("startsAt", startsUtc); r.put("room", room);
        r.put("mode", mode); r.put("meetingUrl", link); r.put("whatToBring", "Resume");
        return r;
    }

    @Test
    void theEmailShowsIndiaTime() {
        Map<String, Object> p = InterviewReminderService.payload(row(LocalDateTime.of(2026, 10, 14, 5, 0), "Lab 2", "ON_CAMPUS", null));
        assertEquals("Wed 14 Oct, 10:30 AM", p.get("when"));
        assertEquals("Lab 2", p.get("venue"));
        assertEquals("2026-10-14T05:00", p.get("startsAt"));
        assertEquals("Technical interview", p.get("round"));
    }

    @Test
    void aVirtualRoundGivesTheLinkAndNothingSavedSaysSo() {
        assertEquals("Online: https://meet.example.test/x", InterviewReminderService.payload(row(null, "", "VIRTUAL", "https://meet.example.test/x")).get("venue"));
        Map<String, Object> none = InterviewReminderService.payload(row(null, null, "ON_CAMPUS", null));
        assertEquals("Venue to be confirmed", none.get("venue"));
        assertEquals("Time to be confirmed", none.get("when"));
    }

    @Test
    void tomorrowInIndiaIsSearchedInUtcAndEachStudentIsRemindedOnce() {
        LocalDateTime starts = LocalDateTime.of(2026, 10, 14, 5, 0);
        when(jdbc.queryForList(contains("ra.reminded_for IS NULL OR ra.reminded_for <>"), any(MapSqlParameterSource.class)))
                .thenReturn(List.of(row(starts, "Lab 2", "ON_CAMPUS", null)));
        assertEquals(1, reminders.remindFor(LocalDate.of(2026, 10, 14)));

        ArgumentCaptor<MapSqlParameterSource> window = ArgumentCaptor.forClass(MapSqlParameterSource.class);
        verify(jdbc).queryForList(contains("ra.notified_at IS NOT NULL"), window.capture());
        assertEquals(LocalDateTime.of(2026, 10, 13, 18, 30), window.getValue().getValue("from"));
        assertEquals(LocalDateTime.of(2026, 10, 14, 18, 30), window.getValue().getValue("to"));

        verify(outbox).enqueue(eq("ROUND_REMINDER"), eq("LEARNER"), eq(159), eq("APP"), any(), eq(null), eq(false));
        ArgumentCaptor<MapSqlParameterSource> marked = ArgumentCaptor.forClass(MapSqlParameterSource.class);
        verify(jdbc).update(contains("SET reminded_for = :t"), marked.capture());
        assertEquals(starts, marked.getValue().getValue("t"));
    }

    @Test
    void theMorningNudgeIsInTheAppOnlyForTheRestOfTheIndiaDayAndOncePerStartTime() {
        LocalDateTime starts = LocalDateTime.of(2026, 10, 14, 5, 0); // 10:30 am India
        when(jdbc.queryForList(contains("ra.reminded_today_for IS NULL OR ra.reminded_today_for <>"), any(MapSqlParameterSource.class)))
                .thenReturn(List.of(row(starts, "Lab 2", "ON_CAMPUS", null)));
        java.time.ZonedDateTime eightAm = java.time.ZonedDateTime.of(2026, 10, 14, 8, 0, 0, 0, java.time.ZoneId.of("Asia/Kolkata"));
        assertEquals(1, reminders.remindToday(eightAm));

        ArgumentCaptor<MapSqlParameterSource> window = ArgumentCaptor.forClass(MapSqlParameterSource.class);
        verify(jdbc).queryForList(contains("ra.notified_at IS NOT NULL"), window.capture());
        assertEquals(LocalDateTime.of(2026, 10, 14, 2, 30), window.getValue().getValue("from")); // now: an interview already over is left alone
        assertEquals(LocalDateTime.of(2026, 10, 14, 18, 30), window.getValue().getValue("to")); // midnight India

        verify(outbox).enqueue(eq("ROUND_TODAY"), eq("LEARNER"), eq(159), eq("APP"), any(), eq(null), eq(false));
        ArgumentCaptor<MapSqlParameterSource> marked = ArgumentCaptor.forClass(MapSqlParameterSource.class);
        verify(jdbc).update(contains("SET reminded_today_for = :t"), marked.capture());
        assertEquals(starts, marked.getValue().getValue("t"));
        // in the app only: no email channel for it, and students may not get an email for it at all
        assertEquals(false, NotificationOutboxService.STUDENT_EMAIL_EVENTS.contains("ROUND_TODAY"));
    }

    @Test
    void aRowWithoutATimeIsSkipped() {
        when(jdbc.queryForList(anyString(), any(MapSqlParameterSource.class))).thenReturn(List.of(row(null, "Lab 2", "ON_CAMPUS", null)));
        assertEquals(0, reminders.remindFor(LocalDate.of(2026, 10, 14)));
        verify(outbox, never()).enqueue(anyString(), anyString(), any(), anyString(), any(), any(), any(Boolean.class));
    }
}
