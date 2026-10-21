package com._42students.lms.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

/**
 * Serializes LocalDateTime as ISO-8601 in UTC (with 'Z' suffix) so that
 * API consumers (e.g. Career Calendar) can parse and display in local time correctly.
 * Stored value is interpreted as UTC per Interview API contract.
 */
public class UtcLocalDateTimeSerializer extends JsonSerializer<LocalDateTime> {

    private static final DateTimeFormatter UTC_FORMATTER =
            DateTimeFormatter.ISO_OFFSET_DATE_TIME.withZone(ZoneOffset.UTC);

    @Override
    public void serialize(LocalDateTime value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        if (value == null) {
            gen.writeNull();
        } else {
            String isoUtc = value.atOffset(ZoneOffset.UTC).format(UTC_FORMATTER);
            gen.writeString(isoUtc);
        }
    }
}

