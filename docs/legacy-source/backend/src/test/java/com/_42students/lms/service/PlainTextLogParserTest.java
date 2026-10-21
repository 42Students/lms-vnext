package com._42students.lms.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PlainTextLogParserTest {

    private static final String ESC = "\u001B";

    @Test
    void readsLevelLoggerAndMessageFromAColoredConsoleLine() {
        String raw = "2026-09-28T09:00:00,171" + ESC + "[m " + ESC + "[32mINFO  " + ESC + "[m[" + ESC + "[1;34mscheduling-1"
                + ESC + "[m] " + ESC + "[1;33mc.x.NotificationSchedulerService" + ESC + "[m : Sent 3 reminders";
        PlainTextLogParser.Parsed parsed = PlainTextLogParser.parse(raw);
        assertEquals("INFO", parsed.severity);
        assertEquals("c.x.NotificationSchedulerService", parsed.logger);
        assertEquals("Sent 3 reminders", parsed.message);
        assertFalse(parsed.message.contains(ESC));
    }

    @Test
    void anErrorHeaderKeepsTheStackTraceAsTheException() {
        String raw = "2026-09-28 09:00:00,115 ERROR [main] c.x.Job : Reminder failed\nnested exception\n\tat a.b.C.d(C.java:1)";
        PlainTextLogParser.Parsed parsed = PlainTextLogParser.parse(raw);
        assertEquals("ERROR", parsed.severity);
        assertEquals("Reminder failed", parsed.message);
        assertTrue(parsed.exception.contains("at a.b.C.d"));
    }

    @Test
    void warnIsNormalizedToWarning() {
        assertEquals("WARNING", PlainTextLogParser.parse("2026-09-28 09:00:00,1 WARN [t] c.x.A : careful").severity);
    }

    @Test
    void aBareStackTraceEntryIsTreatedAsAnError() {
        String raw = "org.springframework.dao.InvalidDataAccessResourceUsageException: could not execute query\n\tat org.x.Y.z(Y.java:9)";
        PlainTextLogParser.Parsed parsed = PlainTextLogParser.parse(raw);
        assertEquals("ERROR", parsed.severity);
        assertEquals("org.springframework.dao.InvalidDataAccessResourceUsageException: could not execute query", parsed.message);
        assertNotNull(parsed.exception);
    }

    @Test
    void plainTextWithNoLevelKeepsTheEntryLabelAndIsNotInventedAsAnError() {
        PlainTextLogParser.Parsed parsed = PlainTextLogParser.parse("Started LmsApplication in 41 seconds");
        assertNull(parsed.severity);
        assertEquals("Started LmsApplication in 41 seconds", parsed.message);
        assertNull(parsed.exception);
    }

    @Test
    void blankInputYieldsNothing() {
        assertNull(PlainTextLogParser.parse("   "));
        assertNull(PlainTextLogParser.parse(null));
    }
}
