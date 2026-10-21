package com._42students.lms.sse;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Keeps track of all live SSE connections grouped by classId.
 *
 * Design choices:
 * - ConcurrentHashMap for the outer map (classId → emitter list)
 * - Collections.synchronizedList(ArrayList) for the inner list:
 *     write-heavy workload (adds/removes), so CopyOnWriteArrayList would
 *     copy the whole array on every mutation — too expensive at scale.
 * - SSE_TIMEOUT_MS set to 12 min — just under the 15-min JWT access token
 *     expiry. Client auto-reconnects with a fresh token each cycle.
 * - broadcast() is async (CompletableFuture) — one slow client never
 *     blocks others.
 * - Empty classId entries are cleaned up after the last emitter leaves.
 */
@Component
public class SseEmitterRegistry {

    private static final Logger log = LoggerFactory.getLogger(SseEmitterRegistry.class);

    /**
     * 12 minutes — intentionally shorter than the 15-min JWT access token
     * so the client reconnects with a fresh (valid) token each cycle.
     */
    static final long SSE_TIMEOUT_MS = 12 * 60 * 1000L;

    private final ConcurrentHashMap<Integer, List<SseEmitter>> registry =
            new ConcurrentHashMap<>();

    private final ObjectMapper objectMapper = new ObjectMapper();

    /** At most this many live streams per person; opening one more closes their oldest (LRN-N-05). */
    static final int MAX_PER_USER = 3;

    /** Live streams per person ("LEARNER:21", "FACULTY:21"), oldest first. */
    private final ConcurrentHashMap<String, Deque<SseEmitter>> byUser = new ConcurrentHashMap<>();

    /**
     * Register a new SSE emitter for the given classId.
     * Automatically removes itself (and cleans up the map entry) on
     * completion / timeout / error.
     */
    public SseEmitter register(int classId) {
        return register(classId, null);
    }

    /**
     * Register a stream for one person. The documented "max 3 per user" was never enforced (only a
     * per-class cap of 3000), so one account could hold any number of server connections. The oldest
     * is closed rather than refusing the new one, so a refreshed or new tab is never locked out.
     */
    public SseEmitter register(int classId, String userKey) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);

        List<SseEmitter> emitters = registry.computeIfAbsent(
                classId, k -> Collections.synchronizedList(new ArrayList<>()));
        emitters.add(emitter);

        SseEmitter evicted = null;
        if (userKey != null) {
            Deque<SseEmitter> mine = byUser.computeIfAbsent(userKey, k -> new ArrayDeque<>());
            synchronized (mine) {
                mine.addLast(emitter);
                if (mine.size() > MAX_PER_USER) evicted = mine.pollFirst();
            }
        }

        Runnable cleanup = () -> {
            removeEmitter(classId, emitter);
            if (userKey != null) removeUserEmitter(userKey, emitter);
        };
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());

        if (evicted != null) {
            try { evicted.complete(); } catch (Exception ignored) { /* already gone */ }
        }
        return emitter;
    }

    private void removeUserEmitter(String userKey, SseEmitter emitter) {
        Deque<SseEmitter> mine = byUser.get(userKey);
        if (mine == null) return;
        synchronized (mine) {
            mine.remove(emitter);
            if (mine.isEmpty()) byUser.remove(userKey, mine);
        }
    }

    /** Live streams one person holds (monitoring/tests). */
    public int userConnectionCount(String userKey) {
        Deque<SseEmitter> mine = byUser.get(userKey);
        if (mine == null) return 0;
        synchronized (mine) { return mine.size(); }
    }

    /**
     * Push a notification payload to all connected clients for the given classId.
     * Runs asynchronously so a slow or unresponsive client never blocks others.
     */
    public void broadcast(int classId, Object payload) {
        List<SseEmitter> emitters = registry.get(classId);
        if (emitters == null || emitters.isEmpty()) {
            // Clean up the empty entry while we're here
            registry.remove(classId);
            return;
        }

        String json;
        try {
            json = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            log.error("SSE: failed to serialize payload for classId {}", classId, e);
            return;
        }

        // Snapshot the list before iterating to avoid holding the lock during I/O
        List<SseEmitter> snapshot;
        synchronized (emitters) {
            snapshot = new ArrayList<>(emitters);
        }

        CompletableFuture.runAsync(() -> {
            List<SseEmitter> dead = new ArrayList<>();
            for (SseEmitter emitter : snapshot) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("notification")
                            .data(json));
                } catch (Exception e) {
                    dead.add(emitter);
                }
            }
            if (!dead.isEmpty()) {
                emitters.removeAll(dead);
                if (emitters.isEmpty()) {
                    registry.remove(classId);
                }
            }
        });
    }

    /**
     * Push a notification to the people it is for: a notification addressed to one learner ("Assignment submitted",
     * "Assignment due") goes to that learner's own streams only; a class-wide one to the whole class. Class-wide
     * broadcasting of a learner's own notification put it in every classmate's browser.
     */
    public void deliver(int classId, Integer learnerId, Object payload) {
        if (learnerId != null && learnerId > 0) {
            sendToUser("LEARNER:" + learnerId, payload);
        } else if (classId > 0) {
            broadcast(classId, payload);
        }
    }

    private void sendToUser(String userKey, Object payload) {
        Deque<SseEmitter> mine = byUser.get(userKey);
        if (mine == null) return;
        List<SseEmitter> snapshot;
        synchronized (mine) {
            snapshot = new ArrayList<>(mine);
        }
        if (snapshot.isEmpty()) return;
        String json;
        try {
            json = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            log.error("SSE: failed to serialize payload for {}", userKey, e);
            return;
        }
        CompletableFuture.runAsync(() -> {
            for (SseEmitter emitter : snapshot) {
                try {
                    emitter.send(SseEmitter.event().name("notification").data(json));
                } catch (Exception e) {
                    removeUserEmitter(userKey, emitter);
                }
            }
        });
    }

    private void removeEmitter(int classId, SseEmitter emitter) {
        List<SseEmitter> list = registry.get(classId);
        if (list == null) return;
        list.remove(emitter);
        if (list.isEmpty()) {
            registry.remove(classId);
        }
    }

    /** Number of active connections for a classId (monitoring/debugging). */
    public int connectionCount(int classId) {
        List<SseEmitter> list = registry.get(classId);
        return list == null ? 0 : list.size();
    }
}

