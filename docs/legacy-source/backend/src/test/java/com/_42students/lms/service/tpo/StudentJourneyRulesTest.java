package com._42students.lms.service.tpo;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class StudentJourneyRulesTest {

    private static Map<String, Object> e(String stage, String offer, Integer rSeq, String rKind, String rName, String rOut, Integer cSeq, String cKind, String cName, int total) {
        return StudentJourneyRules.entry(1, "Acme", "SDE", stage, offer, rSeq, rKind, rName, rOut, cSeq, cKind, cName, total);
    }

    @Test
    void appliedAndNothingElse() {
        Map<String, Object> m = e("APPLIED", null, null, null, null, null, null, null, null, 3);
        assertEquals(0, m.get("depth"));
        assertEquals("Applied", m.get("label"));
    }

    @Test
    void failedAtTheTechnicalRoundReadsAsNotSelectedThere() {
        Map<String, Object> m = e("REJECTED", null, 2, "INTERVIEW", "Technical interview", "FAIL", null, null, null, 3);
        assertEquals("NOT_SELECTED", m.get("outcome"));
        assertEquals("Not selected at Technical interview", m.get("label"));
        assertEquals(3, m.get("depth"));
    }

    @Test
    void clearedTheTestAndNowInTheNextRound() {
        Map<String, Object> m = e("SHORTLISTED", null, 1, "TEST", "Aptitude", "PASS", 2, "INTERVIEW", "Technical", 3);
        assertEquals("IN_PROGRESS", m.get("outcome"));
        assertEquals("In Technical", m.get("label"));
        assertEquals(3, m.get("depth"));
    }

    @Test
    void theLastInterviewRoundIsTheFinalRound() {
        Map<String, Object> m = e("INTERVIEW", null, 2, "INTERVIEW", "Technical", "PASS", 3, "INTERVIEW", "RECRUITER", 3);
        assertEquals(4, m.get("depth"));
    }

    @Test
    void anOfferBeatsEverythingAndAnAcceptedOneIsPlaced() {
        assertEquals("OFFERED", e("OFFERED", "RELEASED", 3, "INTERVIEW", "RECRUITER", "PASS", null, null, null, 3).get("outcome"));
        Map<String, Object> placed = e("HIRED", "ACCEPTED", 3, "INTERVIEW", "RECRUITER", "PASS", null, null, null, 3);
        assertEquals("PLACED", placed.get("outcome"));
        assertEquals(5, placed.get("depth"));
    }

    @Test
    void waitlistAbsentAndWithdrawn() {
        assertEquals("Waitlisted at Test", e("WAITLISTED", null, 1, "TEST", "Test", "HOLD", null, null, null, 2).get("label"));
        assertEquals("NOT_SELECTED", e("SHORTLISTED", null, 1, "TEST", "Test", "ABSENT", null, null, null, 2).get("outcome"));
        assertEquals("Withdrew", e("WITHDRAWN", null, null, null, null, null, null, null, null, 2).get("label"));
    }
}
