package com._42students.lms.service.tpo;

import com._42students.lms.model.tpo.NotificationOutboxEntry;
import com._42students.lms.repository.tpo.NotificationOutboxRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** 13 Oct 2026, owner: a student gets email only for signing in and for interviews; everything else is in the app only. */
class StudentEmailRuleTest {

    private final NotificationOutboxRepository repo = mock(NotificationOutboxRepository.class);
    @SuppressWarnings("unchecked")
    private final NotificationOutboxService outbox = new NotificationOutboxService(repo, mock(NamedParameterJdbcTemplate.class),
            mock(TpoMailService.class), mock(Environment.class), mock(ObjectProvider.class));

    @BeforeEach
    void setUp() {
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    private List<String> channelsQueuedFor(String event) {
        outbox.enqueue(event, "LEARNER", 159, "APP", Map.of(), null, false);
        ArgumentCaptor<NotificationOutboxEntry> saved = ArgumentCaptor.forClass(NotificationOutboxEntry.class);
        verify(repo, atLeastOnce()).save(saved.capture());
        return saved.getAllValues().stream().map(NotificationOutboxEntry::getChannel).toList();
    }

    @Test
    void anInterviewBeingSetIsEmailed() {
        assertEquals(List.of("APP", "SMS", "EMAIL"), channelsQueuedFor("ROUND_SCHEDULED"));
    }

    @Test
    void theInterviewReminderIsEmailed() {
        assertEquals(List.of("APP", "EMAIL"), channelsQueuedFor("ROUND_REMINDER"));
    }

    @Test
    void theMorningOfNudgeIsInTheAppOnly() {
        assertEquals(List.of("APP"), channelsQueuedFor("ROUND_TODAY"));
    }

    @Test
    void theDailyDigestGoesAtEightInTheMorningIndiaTime() {
        java.time.ZoneId india = java.time.ZoneId.of("Asia/Kolkata");
        // before 8 am: today at 8 am India = 02:30 UTC
        assertEquals(java.time.LocalDateTime.of(2026, 10, 19, 2, 30),
                NotificationOutboxService.nextDigestAt(java.time.ZonedDateTime.of(2026, 10, 19, 6, 0, 0, 0, india)));
        // after 8 am: tomorrow
        assertEquals(java.time.LocalDateTime.of(2026, 10, 20, 2, 30),
                NotificationOutboxService.nextDigestAt(java.time.ZonedDateTime.of(2026, 10, 19, 13, 0, 0, 0, india)));
    }

    @Test
    void anOfferKeepsItsSmsButIsNotEmailed() {
        assertEquals(List.of("APP", "SMS"), channelsQueuedFor("OFFER_RELEASED"));
    }

    @Test
    void aNewDriveIsInTheAppOnly() {
        assertEquals(List.of("APP"), channelsQueuedFor("DRIVE_PUBLISHED"));
    }

    @Test
    void aDirectStudentEmailForAnythingElseIsNotQueued() {
        assertNull(outbox.enqueue("PLACEMENT_ANNOUNCEMENT", "LEARNER", 159, "EMAIL", Map.of(), "g", true));
        assertNull(outbox.enqueue("APPLICATION_STATUS_CHANGED", "LEARNER", 159, "EMAIL", Map.of(), null, false));
        verify(repo, never()).save(any());
    }

    @Test
    void recruitersAndSmsAreNotTouchedByTheRule() {
        assertFalse(NotificationOutboxService.studentEmailBlocked("REQUEST_DECIDED", "RECRUITER", "EMAIL"));
        assertFalse(NotificationOutboxService.studentEmailBlocked("OFFER_RELEASED", "LEARNER", "SMS"));
        assertFalse(NotificationOutboxService.studentEmailBlocked("OFFER_RELEASED", "LEARNER", "APP"));
        assertTrue(NotificationOutboxService.studentEmailBlocked("OFFER_RELEASED", "LEARNER", "EMAIL"));
    }
}
