package com._42students.lms.util;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.TimeZone;

import static org.junit.jupiter.api.Assertions.*;

class PlacementDateTimeUtilsTest {

    @Test
    void offsetBearingValuesAreConvertedToTheSameUtcInstant() {
        assertEquals(
                LocalDateTime.of(2026, 10, 2, 10, 15),
                PlacementDateTimeUtils.parseUtcDateTime("2026-10-02T15:45:00+05:30")
        );
        assertEquals(
                LocalDateTime.of(2026, 10, 2, 10, 15),
                PlacementDateTimeUtils.parseUtcDateTime("2026-10-02T10:15:00Z")
        );
    }

    @Test
    void legacyNaiveValuesRemainCanonicalUtcWallClockValues() {
        assertEquals(
                LocalDateTime.of(2026, 10, 2, 10, 15),
                PlacementDateTimeUtils.parseUtcDateTime("2026-10-02T10:15:00")
        );
    }

    @Test
    void civilDatesPreserveTheirExactDay() {
        assertEquals(
                LocalDateTime.of(2026, 10, 2, 0, 0),
                PlacementDateTimeUtils.parseUtcDateTime("2026-10-02")
        );
    }

    @Test
    void utcNowDoesNotDependOnJvmDefaultTimezone() {
        TimeZone original = TimeZone.getDefault();
        try {
            TimeZone.setDefault(TimeZone.getTimeZone("Pacific/Honolulu"));
            LocalDateTime before = LocalDateTime.now(java.time.ZoneOffset.UTC).minusSeconds(1);
            LocalDateTime actual = PlacementDateTimeUtils.nowUtc();
            LocalDateTime after = LocalDateTime.now(java.time.ZoneOffset.UTC).plusSeconds(1);
            assertFalse(actual.isBefore(before));
            assertFalse(actual.isAfter(after));
        } finally {
            TimeZone.setDefault(original);
        }
    }

    @Test
    void malformedValuesFailClosed() {
        assertNull(PlacementDateTimeUtils.parseUtcDateTime("not-a-date"));
        assertNull(PlacementDateTimeUtils.parseUtcDateTime("2026-02-30"));
        assertNull(PlacementDateTimeUtils.parseUtcDateTime(null));
    }

    @Test
    void bareDateDeadlineRunsThroughTheEndOfThatDayInIndia() {
        // 2026-10-10 23:59:59 IST == 2026-10-10 18:29:59 UTC (not 00:00 UTC = 05:30 IST)
        assertEquals(LocalDateTime.of(2026, 10, 10, 18, 29, 59), PlacementDateTimeUtils.parseUtcDeadline("2026-10-10"));
    }

    @Test
    void deadlineWithATimeIsUnchangedFromParseUtcDateTime() {
        assertEquals(PlacementDateTimeUtils.parseUtcDateTime("2026-10-10T09:00:00Z"),
                PlacementDateTimeUtils.parseUtcDeadline("2026-10-10T09:00:00Z"));
        assertNull(PlacementDateTimeUtils.parseUtcDeadline(null));
    }
}
