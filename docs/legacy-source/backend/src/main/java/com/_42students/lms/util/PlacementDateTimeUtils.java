package com._42students.lms.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * Canonical placement time contract.
 *
 * Persisted LocalDateTime placement timestamps are UTC wall-clock values. Offset-bearing wire
 * values are converted to the same UTC instant before the offset is discarded. Bare ISO
 * LocalDateTime values are treated as already-UTC for backward compatibility. Bare YYYY-MM-DD
 * values are civil calendar dates and keep their exact day.
 */
public final class PlacementDateTimeUtils {
    private PlacementDateTimeUtils() {}

    public static LocalDateTime nowUtc() {
        return LocalDateTime.now(ZoneOffset.UTC);
    }

    public static LocalDate todayUtc() {
        return LocalDate.now(ZoneOffset.UTC);
    }

    /** A persisted UTC wall-clock value written as an unambiguous instant ("2026-10-02T10:00:00Z"), so a browser converts it to its own zone correctly. */
    public static String toUtcIso(LocalDateTime value) {
        return value == null ? null : value.toInstant(ZoneOffset.UTC).toString();
    }

    private static final ZoneId INDIA = ZoneId.of("Asia/Kolkata");

    /**
     * A persisted UTC value as an India wall-clock time, for text a person reads (emails, notices). The interview notices
     * formatted the UTC value directly, so a 10:00 am interview read "04:30 AM" (19 Oct 2026).
     */
    public static String indiaFormat(LocalDateTime utc, String pattern) {
        // English always ("10:00 AM", "20 Oct"): the JVM's default locale wrote "am" on some machines.
        return utc == null ? null : utc.atZone(ZoneOffset.UTC).withZoneSameInstant(INDIA).format(DateTimeFormatter.ofPattern(pattern, java.util.Locale.ENGLISH));
    }

    /**
     * Deadline semantics on top of parseUtcDateTime: a bare YYYY-MM-DD means "through the end of
     * that day" in India, stored as the matching UTC instant. Read as midnight UTC it closed
     * applications at 05:30 IST on the deadline day itself.
     */
    public static LocalDateTime parseUtcDeadline(Object raw) {
        if (raw == null) return null;
        String value = String.valueOf(raw).trim();
        if (value.matches("\\d{4}-\\d{2}-\\d{2}")) {
            try {
                return LocalDate.parse(value, DateTimeFormatter.ISO_LOCAL_DATE)
                        .atTime(LocalTime.of(23, 59, 59))
                        .atZone(INDIA)
                        .withZoneSameInstant(ZoneOffset.UTC)
                        .toLocalDateTime();
            } catch (DateTimeParseException ignored) {
                return null;
            }
        }
        return parseUtcDateTime(raw);
    }

    public static LocalDateTime parseUtcDateTime(Object raw) {
        if (raw == null) return null;
        String value = String.valueOf(raw).trim();
        if (value.isEmpty()) return null;

        if (value.matches("\\d{4}-\\d{2}-\\d{2}")) {
            try {
                return LocalDate.parse(value, DateTimeFormatter.ISO_LOCAL_DATE).atStartOfDay();
            } catch (DateTimeParseException ignored) {
                return null;
            }
        }

        String normalized = value.replace(' ', 'T');

        // Parse offset/Z values first. Parsing them directly as LocalDateTime can accept the
        // syntax while discarding the offset, changing the represented instant.
        try {
            return OffsetDateTime.parse(normalized, DateTimeFormatter.ISO_DATE_TIME)
                    .withOffsetSameInstant(ZoneOffset.UTC)
                    .toLocalDateTime();
        } catch (DateTimeParseException ignored) {
            // Fall through to the legacy naive UTC representation.
        }

        try {
            return LocalDateTime.parse(normalized, DateTimeFormatter.ISO_DATE_TIME);
        } catch (DateTimeParseException ignored) {
            return null;
        }
    }
}
