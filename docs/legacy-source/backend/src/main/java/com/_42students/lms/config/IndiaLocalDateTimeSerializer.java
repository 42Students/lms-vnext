package com._42students.lms.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * For LocalDateTime fields stored as India wall-clock time (e.g. quiz dueAt, which the quiz
 * builder saves as the author's local time with no offset). The global UtcLocalDateTimeSerializer
 * would label that value "Z", so browsers showed every quiz deadline 5h30m late and re-saving a
 * quiz shifted its deadline by 5h30m. Emitting the real +05:30 offset fixes every consumer.
 */
public class IndiaLocalDateTimeSerializer extends JsonSerializer<LocalDateTime> {
    private static final ZoneId INDIA = ZoneId.of("Asia/Kolkata");

    @Override
    public void serialize(LocalDateTime value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        if (value == null) {
            gen.writeNull();
        } else {
            gen.writeString(value.atZone(INDIA).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        }
    }
}
