package com._42students.lms.service.tpo;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Step 13 (N12) and Announcements V2 (docs/tpo-announcements/ANNOUNCEMENTS-V2-2026-10-12.md): an audience fixed when it is sent,
 * notices held for the Undo window, scheduling, ending, a button, reminders only to those who haven't read; 42 to placement cells.
 */
class PlacementAnnouncementServiceTest {

    private final NamedParameterJdbcTemplate jdbc = mock(NamedParameterJdbcTemplate.class);
    private final NotificationOutboxService outbox = mock(NotificationOutboxService.class);
    private final PlacementEligibilityService eligibility = mock(PlacementEligibilityService.class);
    private final TpoAuditService audit = mock(TpoAuditService.class);
    private final TpoMailService mail = mock(TpoMailService.class);
    private final PlacementAnnouncementService svc = new PlacementAnnouncementService(jdbc, outbox, eligibility, audit, mail);
    private final PlacementAnnouncementService.Author tpo = new PlacementAnnouncementService.Author("FACULTY", 12);

    private static PlacementEligibilityService.Resolved resolved(String status) {
        PlacementEligibilityService.Resolved r = new PlacementEligibilityService.Resolved();
        r.status = status;
        return r;
    }

    private PlacementAnnouncementService.Draft draft(String title, String body) {
        PlacementAnnouncementService.Draft d = new PlacementAnnouncementService.Draft();
        d.title = title;
        d.body = body;
        return d;
    }

    @BeforeEach
    void setUp() {
        when(jdbc.queryForObject(contains("LAST_INSERT_ID"), any(MapSqlParameterSource.class), eq(Long.class))).thenReturn(3L);
        Map<Integer, PlacementEligibilityService.Resolved> students = new LinkedHashMap<>();
        students.put(1, resolved(PlacementEligibilityService.ELIGIBLE));
        students.put(2, resolved(PlacementEligibilityService.INELIGIBLE));
        students.put(3, resolved(PlacementEligibilityService.ELIGIBLE));
        when(eligibility.resolveCollege(6)).thenReturn(students);
        // send() reads the saved row back.
        Map<String, Object> row = new HashMap<>();
        row.put("id", 3L); row.put("college_id", 6); row.put("audience_kind", "PLACEMENTS"); row.put("audience_json", "{\"kind\":\"PLACEMENTS\"}");
        row.put("title", "Pre-placement talk"); row.put("body", "Omega talks on Monday."); row.put("email", 0); row.put("audience_label", "Students in placements");
        when(jdbc.queryForList(contains("SELECT * FROM placement_announcement WHERE id = :id AND is_deleted = 0"), any(MapSqlParameterSource.class))).thenReturn(List.of(row));
    }

    @Test
    void studentsInPlacementsAreTheDefaultAudienceAndTheNoticesWaitForUndo() {
        Map<String, Object> out = svc.postToStudents(6, draft("Pre-placement talk", "Omega talks on Monday at 3 in Seminar Hall 1."), tpo);
        assertEquals(2, out.get("studentsTold"));
        assertEquals(30, out.get("undoSeconds"));
        // held = true: nothing goes before the Undo window ends; the recipient list is fixed now.
        verify(outbox, times(2)).enqueue(eq("PLACEMENT_ANNOUNCEMENT"), eq("LEARNER"), any(), eq("APP"), any(), anyString(), eq(true));
        verify(jdbc, times(2)).update(contains("INSERT IGNORE INTO placement_announcement_recipient"), any(MapSqlParameterSource.class));
    }

    @Test
    void announcementsAreNeverEmailedToStudents() {
        PlacementAnnouncementService.Draft d = draft("Talk", "Body");
        d.email = true;
        Map<String, Object> row = new HashMap<>();
        row.put("id", 3L); row.put("college_id", 6); row.put("audience_kind", "PLACEMENTS"); row.put("audience_json", null); row.put("title", "Talk"); row.put("body", "Body"); row.put("email", 1);
        when(jdbc.queryForList(contains("SELECT * FROM placement_announcement WHERE id = :id AND is_deleted = 0"), any(MapSqlParameterSource.class))).thenReturn(List.of(row));
        when(mail.isConfigured(anyString())).thenReturn(true);
        svc.postToStudents(6, d, tpo);
        verify(outbox, never()).enqueue(anyString(), anyString(), any(), eq("EMAIL"), any(), any(), anyBoolean());
    }

    @Test
    void notifyOffTellsNobody() {
        PlacementAnnouncementService.Draft d = draft("Note", "Body");
        d.notify = false;
        svc.postToStudents(6, d, tpo);
        verify(outbox, never()).enqueue(anyString(), anyString(), any(), anyString(), any(), any(), eq(true));
    }

    @Test
    void aScheduledOneWaitsAndAPastTimeIsRefused() {
        PlacementAnnouncementService.Draft d = draft("Mock test", "Friday 10 AM");
        d.sendAt = "2099-01-01T08:00";
        Map<String, Object> out = svc.postToStudents(6, d, tpo);
        assertEquals(null, out.get("studentsTold"));
        verify(outbox, never()).enqueue(anyString(), anyString(), any(), anyString(), any(), any(), eq(true));
        d.sendAt = "2020-01-01T08:00";
        assertThrows(IllegalArgumentException.class, () -> svc.postToStudents(6, d, tpo));
        d.sendAt = "2099-01-02T08:00";
        d.showUntil = "2099-01-01T08:00";
        assertThrows(IllegalArgumentException.class, () -> svc.postToStudents(6, d, tpo), "it has to end after it is sent");
    }

    @Test
    void aTitleAndABodyAreNeededAndTextIsStoredAsTyped() {
        assertThrows(IllegalArgumentException.class, () -> svc.postToStudents(6, draft(" ", "Body"), tpo));
        assertThrows(IllegalArgumentException.class, () -> svc.postToStudents(6, draft("Title", ""), tpo));
        verify(jdbc, never()).update(contains("INSERT INTO placement_announcement "), any(MapSqlParameterSource.class));
        assertEquals("R&D <team>", PlacementAnnouncementService.clean("  R&D <team> "));
    }

    @Test
    void aDriveAudienceIsThatDrivesApplicantsAtThisCollegeOnly() {
        PlacementAnnouncementService.Audience a = new PlacementAnnouncementService.Audience();
        a.kind = "DRIVE";
        a.jobId = 40;
        when(jdbc.queryForList(contains("FROM job WHERE id = :j AND college_id = :c"), any(MapSqlParameterSource.class), eq(String.class))).thenReturn(List.of());
        assertThrows(IllegalArgumentException.class, () -> svc.preview(6, a), "another college's drive");
        when(jdbc.queryForList(contains("FROM job WHERE id = :j AND college_id = :c"), any(MapSqlParameterSource.class), eq(String.class))).thenReturn(List.of("Omega · SDE"));
        when(jdbc.queryForList(contains("FROM job_application WHERE job_id = :j"), any(MapSqlParameterSource.class), eq(Integer.class))).thenReturn(List.of(7, 8));
        a.stage = "ACTIVE";
        Map<String, Object> p = svc.preview(6, a);
        assertEquals(2, p.get("count"));
        assertEquals("Omega · SDE: still in the drive", p.get("label"));
    }

    @Test
    void aBatchOfAnotherCollegeOrAnEmptyPickIsRefused() {
        PlacementAnnouncementService.Audience a = new PlacementAnnouncementService.Audience();
        a.kind = "BATCHES";
        assertThrows(IllegalArgumentException.class, () -> svc.preview(6, a));
        a.batchIds = List.of(99L);
        when(jdbc.queryForList(contains("FROM placement_batch pb LEFT JOIN batch b ON b.id = pb.batch_id WHERE pb.college_id = :c AND pb.batch_id IN (:ids)"), any(MapSqlParameterSource.class)))
                .thenReturn(List.of());
        assertThrows(IllegalArgumentException.class, () -> svc.preview(6, a));
        a.kind = "SOMEONE";
        assertThrows(IllegalArgumentException.class, () -> svc.preview(6, a));
    }

    @Test
    void aButtonNeedsAnHttpsLink() {
        assertArrayEquals(new String[]{"Open", "https://forms.gle/x"}, PlacementAnnouncementService.link(null, "https://forms.gle/x"));
        assertArrayEquals(new String[]{null, null}, PlacementAnnouncementService.link("", " "));
        assertThrows(IllegalArgumentException.class, () -> PlacementAnnouncementService.link("Register", "http://plain.example"));
        assertThrows(IllegalArgumentException.class, () -> PlacementAnnouncementService.link("Register", "javascript:alert(1)"));
        assertThrows(IllegalArgumentException.class, () -> PlacementAnnouncementService.link("Register", ""));
    }

    @Test
    void undoOnlyInsideTheWindowAndRemindNotTwiceAnHour() {
        Map<String, Object> own = new HashMap<>();
        own.put("id", 3L); own.put("college_id", 6); own.put("sent_at", java.time.LocalDateTime.now()); own.put("undo_group", "g1"); own.put("title", "t"); own.put("body", "b");
        when(jdbc.queryForList(contains("WHERE id = :id AND college_id = :c AND audience = 'STUDENTS' AND is_deleted = 0"), any(MapSqlParameterSource.class))).thenReturn(List.of(own));
        when(jdbc.queryForObject(contains("INTERVAL 30 SECOND"), any(MapSqlParameterSource.class), eq(Integer.class))).thenReturn(0);
        assertThrows(IllegalStateException.class, () -> svc.undo(6, 3));
        when(jdbc.queryForObject(contains("INTERVAL 30 SECOND"), any(MapSqlParameterSource.class), eq(Integer.class))).thenReturn(1);
        svc.undo(6, 3);
        verify(outbox).cancelUndoGroup("g1");
        verify(jdbc).update(contains("UPDATE notification_outbox SET status = 'CANCELLED'"), any(MapSqlParameterSource.class));
        when(jdbc.queryForObject(contains("last_reminded_at >= UTC_TIMESTAMP() - INTERVAL 60 MINUTE"), any(MapSqlParameterSource.class), eq(Integer.class))).thenReturn(1);
        assertThrows(IllegalStateException.class, () -> svc.remind(6, 3));
    }

    @Test
    void fortyTwoReachesPlacementCellsOnlyOrThePickedOnes() {
        when(jdbc.queryForList(contains("FROM college c WHERE EXISTS"), any(MapSqlParameterSource.class))).thenReturn(List.of(
                Map.of("id", 6, "name", "NSRIT"), Map.of("id", 9, "name", "KLU"), Map.of("id", 10, "name", "IIIT Dharwad")));
        Map<String, Object> all = svc.postToTpos(draft("New: recruiter workspace", "Recruiters can now review drives."), new PlacementAnnouncementService.Author("SUPER_ADMIN", 1));
        assertEquals(3, all.get("colleges"));
        verify(audit, times(3)).bell(any(), eq("ANNOUNCEMENT_FROM_42"), anyString(), anyString(), eq("/tpo/announcements?tab=from42"));
        PlacementAnnouncementService.Draft d = draft("Pilot", "Only some");
        d.audience = new PlacementAnnouncementService.Audience();
        d.audience.collegeIds = List.of(9, 999);
        assertEquals(1, svc.postToTpos(d, new PlacementAnnouncementService.Author("SUPER_ADMIN", 1)).get("colleges"), "a college without a placement cell is ignored");
        d.audience.collegeIds = List.of(999);
        assertThrows(IllegalArgumentException.class, () -> svc.postToTpos(d, new PlacementAnnouncementService.Author("SUPER_ADMIN", 1)));
    }

    @Test
    void previewsAreShort() {
        assertEquals(140, PlacementAnnouncementService.preview("x".repeat(500)).length());
    }
}
