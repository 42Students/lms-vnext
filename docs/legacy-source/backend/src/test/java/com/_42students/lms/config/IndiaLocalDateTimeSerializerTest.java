package com._42students.lms.config;

import com._42students.lms.dto.response.QuizResponseDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertTrue;

class IndiaLocalDateTimeSerializerTest {

    @Test
    void quizDueAtIsSentWithTheIndiaOffsetNotZ() throws Exception {
        // Mirror the app: global LocalDateTime -> UTC "Z" serializer, field-level override wins.
        SimpleModule utc = new SimpleModule().addSerializer(LocalDateTime.class, new UtcLocalDateTimeSerializer());
        ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule()).registerModule(utc);
        QuizResponseDTO dto = QuizResponseDTO.builder().id(1).dueAt(LocalDateTime.of(2026, 10, 4, 10, 0)).build();

        String json = mapper.writeValueAsString(dto);

        assertTrue(json.contains("\"dueAt\":\"2026-10-04T10:00:00+05:30\""), json);
    }
}
