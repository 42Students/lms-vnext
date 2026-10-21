package com._42students.lms.controller;

import com._42students.lms.enums.ContentType;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;

class LessonContentTypeRequiredAdviceTest {
    @Test
    void rejectsMissingContentTypeOnNewHttpWrites() {
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> LessonContentTypeRequiredAdvice.requireContentType(null));
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
    }

    @Test
    void acceptsEveryRemainingContentType() {
        for (ContentType type : ContentType.values()) {
            assertDoesNotThrow(() -> LessonContentTypeRequiredAdvice.requireContentType(type));
        }
    }

    @Test
    void retiredTypeNamesAreRejectedWithAClearMessage() {
        for (String retired : new String[] {"pdf", "PPT", "lecture", "BYO content", "byo", "google meet", "GOOGLE_MEET"}) {
            IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                    () -> ContentType.fromString(retired));
            assertTrue(error.getMessage().contains("retired"), retired);
        }
    }
}
