package com._42students.lms.sse;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** LRN-N-05: one person holds at most three live streams; a fourth closes their oldest. */
class SseEmitterRegistryPerUserTest {

    @Test
    void fourthStreamClosesTheOldestNotTheNewest() {
        SseEmitterRegistry registry = new SseEmitterRegistry();
        for (int i = 0; i < 4; i++) registry.register(9, "LEARNER:21");
        assertEquals(3, registry.userConnectionCount("LEARNER:21"));
        // Learner 21 and faculty 21 are different people.
        registry.register(9, "FACULTY:21");
        assertEquals(1, registry.userConnectionCount("FACULTY:21"));
        assertEquals(3, registry.userConnectionCount("LEARNER:21"));
    }
}
