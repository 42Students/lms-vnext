package com._42students.lms.integration;

import com._42students.lms.model.tpo.NotificationOutboxEntry;
import com._42students.lms.repository.tpo.NotificationOutboxRepository;
import com._42students.lms.service.SchedulerLockService;
import com._42students.lms.service.tpo.NotificationOutboxService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Real-MySQL evidence for background execution paths that are invisible to HTTP controller tests:
 * scheduler leases and the TPO notification outbox.
 */
class BackgroundDeliveryMySqlIT extends AbstractMySqlHttpIT {

    private static final String EVENT_PREFIX = "IT_BG_";
    private static final int COLLEGE_ID = 989910;
    private static final int LEARNER_ID = 989911;

    @Autowired
    private SchedulerLockService schedulerLock;

    @Autowired
    private NotificationOutboxService outboxService;

    @Autowired
    private NotificationOutboxRepository outboxRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @BeforeEach
    void cleanBefore() {
        cleanup();
    }

    @AfterEach
    void cleanAfter() {
        cleanup();
    }

    @Test
    void schedulerLeaseBlocksRepeatAndCanBeReclaimedAfterExpiry() {
        String key = "it.background.lease";
        assertTrue(schedulerLock.tryAcquire(key, Duration.ofMinutes(5)));
        assertFalse(schedulerLock.tryAcquire(key, Duration.ofMinutes(5)),
                "an unexpired lease must block another execution");

        jdbc.update("update scheduled_job_lock set locked_until = date_sub(now(6), interval 1 second) where job_name = ?", key);

        assertTrue(schedulerLock.tryAcquire(key, Duration.ofMinutes(5)),
                "an expired lease must be reclaimable");
    }

    @Test
    void runExclusivelyExecutesTaskOnlyOnceInsideOneLeaseWindow() {
        String key = "it.background.once";
        AtomicInteger executions = new AtomicInteger();

        schedulerLock.runExclusively(key, Duration.ofMinutes(5), executions::incrementAndGet);
        schedulerLock.runExclusively(key, Duration.ofMinutes(5), executions::incrementAndGet);

        assertEquals(1, executions.get());
    }

    @Test
    void immediateAppNotificationTransitionsPendingToSent() {
        NotificationOutboxEntry saved = outboxService.enqueue(
                EVENT_PREFIX + "APP", "LEARNER", 900001, "APP",
                java.util.Map.of("message", "integration"), null, false);

        assertEquals("PENDING", saved.getStatus());
        assertTrue(saved.getSendAfter().isBefore(LocalDateTime.now().plusSeconds(1)));

        outboxService.dispatchDue();

        NotificationOutboxEntry reloaded = outboxRepository.findById(saved.getId()).orElseThrow();
        assertEquals("SENT", reloaded.getStatus());
        assertNotNull(reloaded.getSentAt());
    }

    @Test
    void undoCancelsHeldNotificationAndDispatcherNeverSendsIt() {
        String group = outboxService.newUndoGroupId();
        LocalDateTime before = LocalDateTime.now();

        NotificationOutboxEntry saved = outboxService.enqueue(
                EVENT_PREFIX + "UNDO", "LEARNER", 900002, "APP",
                java.util.Map.of(), group, true);

        assertTrue(saved.getSendAfter().isAfter(before.plusSeconds(25)),
                "undoable notification should have roughly a 30-second hold");
        assertEquals(1, outboxService.cancelUndoGroup(group));

        // Force time forward in the row so the assertion proves CANCELLED rows are excluded,
        // not merely that the 30-second window has not elapsed yet.
        jdbc.update("update notification_outbox set send_after = date_sub(now(), interval 1 minute) where id = ?", saved.getId());
        outboxService.dispatchDue();

        NotificationOutboxEntry reloaded = outboxRepository.findById(saved.getId()).orElseThrow();
        assertEquals("CANCELLED", reloaded.getStatus());
        assertEquals(null, reloaded.getSentAt());
    }

    @Test
    void unknownChannelBecomesFailedInsteadOfPretendingToSend() {
        NotificationOutboxEntry saved = pending(EVENT_PREFIX + "UNKNOWN", "LEARNER", 900003, "BOGUS");
        outboxService.dispatchDue();

        NotificationOutboxEntry reloaded = outboxRepository.findById(saved.getId()).orElseThrow();
        assertEquals("FAILED", reloaded.getStatus());
        assertTrue(reloaded.getFailureReason().contains("Unknown channel"));
    }

    @Test
    void missingEmailBecomesFailed() {
        seedCollege(COLLEGE_ID, "Background IT College");
        seedLearner(LEARNER_ID, COLLEGE_ID, "NoEmail");
        jdbc.update("update learner set contact_mail = null where id = ?", LEARNER_ID);

        NotificationOutboxEntry saved = pending(EVENT_PREFIX + "EMAIL", "LEARNER", LEARNER_ID, "EMAIL");
        outboxService.dispatchDue();

        NotificationOutboxEntry reloaded = outboxRepository.findById(saved.getId()).orElseThrow();
        assertEquals("FAILED", reloaded.getStatus());
        assertTrue(reloaded.getFailureReason().contains("No email address"));
    }

    @Test
    void missingSmsTemplateBecomesExplicitFailureWithoutProviderTraffic() {
        seedCollege(COLLEGE_ID, "Background IT College");
        seedLearner(LEARNER_ID, COLLEGE_ID, "NoTemplate");

        NotificationOutboxEntry saved = pending("OFFER_RELEASED", "LEARNER", LEARNER_ID, "SMS");
        // Rename after insert so cleanup can reliably own this fixture while preserving the real
        // event name until dispatch. Cleanup below also deletes this row by id-independent status.
        outboxService.dispatchDue();

        NotificationOutboxEntry reloaded = outboxRepository.findById(saved.getId()).orElseThrow();
        assertEquals("FAILED", reloaded.getStatus());
        assertTrue(reloaded.getFailureReason().contains("DLT template"));
        outboxRepository.deleteById(saved.getId());
    }

    @Test
    void skipLockedLetsTwoWorkersClaimDisjointDueRows() throws Exception {
        for (int i = 0; i < 10; i++) {
            pending(EVENT_PREFIX + "LOCK_" + i, "LEARNER", 910000 + i, "APP");
        }

        ExecutorService pool = Executors.newFixedThreadPool(2);
        CyclicBarrier bothClaimed = new CyclicBarrier(2);
        try {
            Future<List<Long>> a = pool.submit(() -> claimFiveAndHold(bothClaimed));
            Future<List<Long>> b = pool.submit(() -> claimFiveAndHold(bothClaimed));

            List<Long> first = a.get();
            List<Long> second = b.get();

            // InnoDB's locking read also takes next-key locks on neighbouring index entries, so the worker that claims
            // second can skip a few more rows than the first one returned; the exact split is not guaranteed. What must hold:
            // each worker gets work, at most its limit, and never a row the other worker holds (no double send).
            assertTrue(first.size() > 0 && first.size() <= 5, "first worker claimed " + first);
            assertTrue(second.size() > 0 && second.size() <= 5, "second worker claimed " + second);
            Set<Long> union = new HashSet<>(first);
            union.addAll(second);
            assertEquals(first.size() + second.size(), union.size(),
                    "FOR UPDATE SKIP LOCKED must give concurrent workers disjoint rows");
        } finally {
            pool.shutdownNow();
        }
    }

    private List<Long> claimFiveAndHold(CyclicBarrier barrier) {
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        return tx.execute(status -> {
            List<NotificationOutboxEntry> rows =
                    outboxRepository.claimDue(LocalDateTime.now().plusMinutes(1), 5);
            List<Long> ids = rows.stream().map(NotificationOutboxEntry::getId).collect(Collectors.toList());
            try {
                barrier.await();
            } catch (Exception e) {
                throw new IllegalStateException(e);
            }
            return ids;
        });
    }

    private NotificationOutboxEntry pending(String event, String recipientType, int recipientId, String channel) {
        NotificationOutboxEntry e = new NotificationOutboxEntry();
        e.setEvent(event);
        e.setRecipientType(recipientType);
        e.setRecipientId(recipientId);
        e.setChannel(channel);
        e.setPayloadJson(java.util.Map.of("source", "integration"));
        e.setSendAfter(LocalDateTime.now().minusSeconds(5));
        e.setStatus("PENDING");
        e.setCreatedAt(LocalDateTime.now());
        return outboxRepository.saveAndFlush(e);
    }

    private void cleanup() {
        try {
            jdbc.update("delete from notification_outbox where event like ?", EVENT_PREFIX + "%");
            jdbc.update("delete from notification_outbox where event = 'OFFER_RELEASED' and recipient_id = ?", LEARNER_ID);
            jdbc.update("delete from scheduled_job_lock where job_name like 'it.background.%'");
            jdbc.update("delete from learner where id = ?", LEARNER_ID);
            jdbc.update("delete from college where id = ?", COLLEGE_ID);
        } catch (Exception ignored) {
            // The schema is prepared before tests; cleanup remains best-effort so a partially-created
            // fixture from a failing test cannot hide the original failure.
        }
    }
}
