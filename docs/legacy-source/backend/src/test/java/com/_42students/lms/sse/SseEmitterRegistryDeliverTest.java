package com._42students.lms.sse;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;

/**
 * Release audit 2026-10-09: a notification addressed to one learner ("Assignment submitted", "Assignment due") was
 * broadcast to every stream of the class, so it reached each classmate's browser. It now goes to that learner only.
 */
class SseEmitterRegistryDeliverTest {

    @Test
    void learnerNotificationIsNotBroadcastToTheClass() {
        SseEmitterRegistry registry = spy(new SseEmitterRegistry());
        registry.register(9, "LEARNER:21");
        registry.register(9, "LEARNER:22");

        registry.deliver(9, 21, Map.of("title", "Assignment submitted"));

        verify(registry, never()).broadcast(anyInt(), any());
    }

    @Test
    void classNotificationStillReachesTheWholeClass() {
        SseEmitterRegistry registry = spy(new SseEmitterRegistry());
        Object payload = Map.of("title", "Class moved to Room 4");

        registry.deliver(9, null, payload);
        registry.deliver(9, 0, payload);

        verify(registry, org.mockito.Mockito.times(2)).broadcast(9, payload);
    }
}
