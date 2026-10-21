package com._42students.lms.enums;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ContentTypeTest {

    @Test
    void rejectsNullAndBlankInsteadOfCreatingLecture() {
        assertThrows(IllegalArgumentException.class, () -> ContentType.fromString(null));
        assertThrows(IllegalArgumentException.class, () -> ContentType.fromString(""));
        assertThrows(IllegalArgumentException.class, () -> ContentType.fromString(" \t "));
    }

    @Test
    void acceptsCanonicalResource() {
        assertEquals(ContentType.RESOURCE, ContentType.fromString("resource"));
        assertEquals(ContentType.RESOURCE, ContentType.fromString("RESOURCE"));
        assertEquals("resource", ContentType.RESOURCE.getContentType());
    }

    @Test
    void decodesTheRemainingContentTypes() {
        assertEquals(ContentType.VIDEO, ContentType.fromString("video"));
        assertEquals(ContentType.YOUTUBE, ContentType.fromString("youtube"));
        assertEquals(ContentType.LIVE_CLASS, ContentType.fromString("live class"));
        assertEquals(ContentType.LIVE_CLASS, ContentType.fromString("LIVE_CLASS"));
        assertEquals(ContentType.ASSIGNMENT, ContentType.fromString("assignment"));
    }

    @Test
    void rejectsUnknownTypesAndEmbeddedQuiz() {
        assertThrows(IllegalArgumentException.class, () -> ContentType.fromString("unknown"));
        assertThrows(IllegalArgumentException.class, () -> ContentType.fromString("quiz"));
    }
}
