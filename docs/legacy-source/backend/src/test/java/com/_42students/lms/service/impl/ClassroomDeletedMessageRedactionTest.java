package com._42students.lms.service.impl;

import com._42students.lms.model.ClassroomMessage;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Release audit 2026-10-09: polling with "since" returned deleted messages with their text and sender. */
class ClassroomDeletedMessageRedactionTest {

    private static ClassroomMessage message(boolean deleted) {
        ClassroomMessage m = new ClassroomMessage();
        m.setId(7);
        m.setCourseId(3);
        m.setClassId(9);
        m.setSenderId(21);
        m.setSenderName("Ravi");
        m.setSenderRole("Learner");
        m.setMessageText("my phone is 98xxxxxx01");
        m.setPinned(true);
        m.setIsDeleted(deleted);
        m.setUpdatedAt(LocalDateTime.of(2026, 10, 9, 10, 0));
        return m;
    }

    @Test
    void deletedMessageTravelsAsItsIdOnly() {
        ClassroomMessage original = message(true);
        ClassroomMessage out = ClassroomServiceImpl.withoutDeletedContent(original);

        assertEquals(7, out.getId());
        assertTrue(out.getIsDeleted());
        assertEquals(original.getUpdatedAt(), out.getUpdatedAt());
        assertNull(out.getMessageText());
        assertNull(out.getSenderName());
        assertNull(out.getSenderId());
        // The managed row itself is untouched.
        assertEquals("my phone is 98xxxxxx01", original.getMessageText());
    }

    @Test
    void liveMessageIsReturnedAsIs() {
        ClassroomMessage live = message(false);
        assertSame(live, ClassroomServiceImpl.withoutDeletedContent(live));
    }
}
