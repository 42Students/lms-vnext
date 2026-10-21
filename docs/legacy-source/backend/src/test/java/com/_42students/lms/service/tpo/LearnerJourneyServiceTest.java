package com._42students.lms.service.tpo;

import com._42students.lms.model.tpo.CollegePlacementRules;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Student redesign (14 Oct 2026): the student's journey reads the placement cell's rounds. A student with an interview booked for
 * tomorrow was told "No interviews scheduled yet" because every student page read the older interview table.
 */
class LearnerJourneyServiceTest {

    private final NamedParameterJdbcTemplate jdbc = mock(NamedParameterJdbcTemplate.class);
    private final LearnerJourneyService service = new LearnerJourneyService(jdbc);

    private static Map<String, Object> row(Object... kv) {
        Map<String, Object> m = new HashMap<>();
        for (int i = 0; i < kv.length; i += 2) m.put((String) kv[i], kv[i + 1]);
        return m;
    }

    private void stub(List<Map<String, Object>> apps, List<Map<String, Object>> rounds, List<Map<String, Object>> results,
                      List<Map<String, Object>> booked, List<Map<String, Object>> asks, List<Map<String, Object>> offers) {
        when(jdbc.queryForList(anyString(), any(MapSqlParameterSource.class))).thenAnswer(inv -> {
            String sql = inv.getArgument(0);
            if (sql.startsWith("SELECT a.id AS applicationId")) return apps;
            if (sql.contains("FROM job_round WHERE job_id IN")) return rounds;
            if (sql.contains("FROM round_result")) return results;
            if (sql.contains("FROM round_assignment")) return booked;
            if (sql.contains("FROM reschedule_request")) return asks;
            if (sql.contains("FROM job_offer")) return offers;
            return List.of();
        });
    }

    private static final LocalDateTime TOMORROW = LocalDateTime.now().plusDays(1).withHour(4).withMinute(30);

    private static List<Map<String, Object>> threeRounds() {
        return List.of(
                row("roundId", 10L, "jobId", 47, "seq", 1, "kind", "TEST", "name", "Online test", "scheduledAt", LocalDateTime.now().minusDays(7)),
                row("roundId", 11L, "jobId", 47, "seq", 2, "kind", "INTERVIEW", "name", "Technical interview", "venue", "Block A"),
                row("roundId", 12L, "jobId", 47, "seq", 3, "kind", "INTERVIEW", "name", "HR interview"));
    }

    @Test
    void aClearedTestThenABookedInterviewThenALaterRound() {
        stub(List.of(row("applicationId", 501, "jobId", 47, "status", "INTERVIEW", "lifecycle", "PUBLISHED", "company", "Test Industry Co", "role", "GET")),
                threeRounds(),
                List.of(row("a", 501, "r", 10L, "outcome", "PASS")),
                List.of(row("a", 501, "r", 11L, "startsAt", TOMORROW, "room", "Room 101")),
                List.of(), List.of());
        Map<String, Object> j = service.journey(42);
        @SuppressWarnings("unchecked") Map<String, Object> app = ((List<Map<String, Object>>) j.get("applications")).get(0);
        @SuppressWarnings("unchecked") List<Map<String, Object>> rounds = (List<Map<String, Object>>) app.get("rounds");
        assertEquals(List.of("CLEARED", "SCHEDULED", "LATER"), rounds.stream().map(r -> r.get("state")).toList());
        assertEquals("Room 101", rounds.get(1).get("room"));
        assertEquals(TOMORROW, rounds.get(1).get("startsAt"));
        // Booked into a round with no result yet: withdrawing goes through the placement cell.
        assertEquals("REQUEST", app.get("withdraw"));
        @SuppressWarnings("unchecked") List<Map<String, Object>> schedule = (List<Map<String, Object>>) j.get("schedule");
        assertEquals(1, schedule.size(), "the booked interview is on the schedule; the later round without a date is not");
        assertEquals("Technical interview", schedule.get(0).get("name"));
        assertEquals(Boolean.FALSE, schedule.get(0).get("expected"));
    }

    @Test
    void theNextRoundWithADateButNoBookingIsExpected_andBeforeAnyBookingTheyWithdrawThemselves() {
        List<Map<String, Object>> rounds = List.of(row("roundId", 10L, "jobId", 47, "seq", 1, "kind", "TEST", "name", "Online test", "scheduledAt", TOMORROW, "venue", "Lab 2"));
        stub(List.of(row("applicationId", 501, "jobId", 47, "status", "APPLIED", "lifecycle", "PUBLISHED")), rounds, List.of(), List.of(), List.of(), List.of());
        Map<String, Object> j = service.journey(42);
        @SuppressWarnings("unchecked") Map<String, Object> app = ((List<Map<String, Object>>) j.get("applications")).get(0);
        @SuppressWarnings("unchecked") List<Map<String, Object>> schedule = (List<Map<String, Object>>) j.get("schedule");
        assertEquals("SELF", app.get("withdraw"));
        assertEquals(1, schedule.size());
        assertEquals(Boolean.TRUE, schedule.get(0).get("expected"));
        assertEquals("Lab 2", schedule.get(0).get("room"));
    }

    @Test
    void aRoundNotClearedEndsTheTrack() {
        stub(List.of(row("applicationId", 501, "jobId", 47, "status", "REJECTED", "lifecycle", "PUBLISHED")), threeRounds(),
                List.of(row("a", 501, "r", 10L, "outcome", "FAIL")), List.of(), List.of(), List.of());
        @SuppressWarnings("unchecked") Map<String, Object> app = ((List<Map<String, Object>>) service.journey(42).get("applications")).get(0);
        @SuppressWarnings("unchecked") List<Map<String, Object>> rounds = (List<Map<String, Object>>) app.get("rounds");
        assertEquals(List.of("NOT_CLEARED", "NOT_REACHED", "NOT_REACHED"), rounds.stream().map(r -> r.get("state")).toList());
        assertNull(app.get("withdraw"));
    }

    @Test
    void aCancelledDriveKeepsItsReasonAndLeavesNothingOnTheSchedule() {
        stub(List.of(row("applicationId", 501, "jobId", 47, "status", "APPLIED", "lifecycle", "CANCELLED", "cancelReason", "The company paused hiring.")),
                threeRounds(), List.of(), List.of(row("a", 501, "r", 11L, "startsAt", TOMORROW)), List.of(), List.of());
        Map<String, Object> j = service.journey(42);
        @SuppressWarnings("unchecked") Map<String, Object> app = ((List<Map<String, Object>>) j.get("applications")).get(0);
        assertEquals("The company paused hiring.", app.get("cancelReason"));
        assertEquals(Boolean.FALSE, app.get("live"));
        assertTrue(((List<?>) j.get("schedule")).isEmpty());
        assertNull(app.get("withdraw"));
    }

    @Test
    void aPendingRescheduleAskAndTheOfferAreCarried() {
        stub(List.of(row("applicationId", 501, "jobId", 47, "status", "INTERVIEW", "lifecycle", "PUBLISHED")), threeRounds(),
                List.of(row("a", 501, "r", 10L, "outcome", "PASS")), List.of(row("a", 501, "r", 11L, "startsAt", TOMORROW)),
                List.of(row("a", 501, "r", 11L, "status", "PENDING", "askedAt", LocalDateTime.now())),
                List.of(row("offerId", 9L, "applicationId", 501, "status", "RELEASED")));
        Map<String, Object> j = service.journey(42);
        @SuppressWarnings("unchecked") Map<String, Object> app = ((List<Map<String, Object>>) j.get("applications")).get(0);
        @SuppressWarnings("unchecked") List<Map<String, Object>> rounds = (List<Map<String, Object>>) app.get("rounds");
        assertEquals("PENDING", ((Map<?, ?>) rounds.get(1).get("moveAsk")).get("status"));
        assertEquals(9L, ((Map<?, ?>) app.get("offer")).get("offerId"));
        assertEquals(1, ((List<?>) j.get("offers")).size());
    }

    @Test
    void onlyAppliedResultsCount() {
        // The query itself is the guard: a staged result (applied_at null) or a replaced one is never read.
        stub(List.of(row("applicationId", 501, "jobId", 47, "status", "APPLIED", "lifecycle", "PUBLISHED")), threeRounds(), List.of(), List.of(), List.of(), List.of());
        org.mockito.ArgumentCaptor<String> sql = org.mockito.ArgumentCaptor.forClass(String.class);
        service.journey(42);
        org.mockito.Mockito.verify(jdbc, org.mockito.Mockito.atLeastOnce()).queryForList(sql.capture(), any(MapSqlParameterSource.class));
        String results = sql.getAllValues().stream().filter(s -> s.contains("FROM round_result")).findFirst().orElseThrow();
        assertTrue(results.contains("applied_at IS NOT NULL") && results.contains("superseded_by IS NULL"));
        assertFalse(results.contains("score") || results.contains("comment") || results.contains("reason_category"));
    }

    @Test
    void noApplicationsIsAnEmptyJourney() {
        stub(List.of(), List.of(), List.of(), List.of(), List.of(), List.of());
        Map<String, Object> j = service.journey(42);
        assertTrue(((List<?>) j.get("applications")).isEmpty());
        assertTrue(((List<?>) j.get("schedule")).isEmpty());
    }

    @Test
    void theRulesAreReadAsPlainPointsWithTheCollegesNumbers() {
        CollegePlacementRules r = new CollegePlacementRules();
        r.setCountsAsPlacedAt("OFFER_ACCEPTED");
        r.setMaxHeldOffers(2);
        r.setUpliftPct(40);
        r.setMinResponseHours(48);
        List<Map<String, String>> points = new PlacementRulesService(null, null, null).studentPoints(r);
        assertEquals("When you count as placed", points.get(0).get("title"));
        assertTrue(points.get(0).get("text").startsWith("When you accept an offer"));
        assertTrue(points.get(1).get("text").startsWith("Up to 2 offers at a time."));
        assertTrue(points.get(2).get("text").contains("at least 40% more"));
        assertTrue(points.get(3).get("text").contains("48 hours"));
        points.forEach(p -> assertFalse(p.get("text").contains("Settings") || p.get("text").contains("A student"), p.get("text")));
    }

    @Test
    void everyNoticeOpensThePageWhereTheStudentActsOnIt() {
        assertEquals("/learn/my-placements/schedule", LearnerPlacementService.linkFor("ROUND_SCHEDULED", Map.of()));
        assertEquals("/learn/my-placements/offers", LearnerPlacementService.linkFor("OFFER_RELEASED", Map.of()));
        assertEquals("/learn/my-placements/jobs/47", LearnerPlacementService.linkFor("DRIVE_CANCELLED", Map.of("jobId", 47)));
        assertEquals("/learn/my-placements/applications", LearnerPlacementService.linkFor("APPLICATION_STATUS_CHANGED", Map.of()));
        assertEquals("/learn/my-placements/placement", LearnerPlacementService.linkFor("MARKED_ABSENT", Map.of()));
        assertNull(LearnerPlacementService.linkFor("SOMETHING_NEW", Map.of()));
    }
}
