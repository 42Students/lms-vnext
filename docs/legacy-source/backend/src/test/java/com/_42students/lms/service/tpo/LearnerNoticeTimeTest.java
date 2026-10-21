package com._42students.lms.service.tpo;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** Night audit 13 Oct 2026: a notice said "Please respond by 2026-10-15 03:43:18.812" (UTC, as stored). */
class LearnerNoticeTimeTest {

    @Test
    void storedUtcTimesReadAsIndiaTime() {
        assertEquals("15 Oct, 9:13 AM", LearnerPlacementService.indiaTime("2026-10-15 03:43:18.812"));
        assertEquals("15 Oct, 9:13 AM", LearnerPlacementService.indiaTime("2026-10-15T03:43"));
        assertEquals("1 Nov, 12:30 AM", LearnerPlacementService.indiaTime("2026-10-31 19:00:00"));
    }

    @Test
    void anythingElseIsLeftAlone() {
        assertEquals("next week", LearnerPlacementService.indiaTime("next week"));
        assertEquals("", LearnerPlacementService.indiaTime(""));
    }
}
