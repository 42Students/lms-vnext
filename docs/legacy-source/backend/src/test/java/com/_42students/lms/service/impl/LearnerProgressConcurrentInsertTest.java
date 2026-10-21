package com._42students.lms.service.impl;

import com._42students.lms.dto.request.ContentProgressSaveRequest;
import com._42students.lms.model.LearnerContentProgress;
import com._42students.lms.repository.LearnerContentProgressRepository;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.SimpleTransactionStatus;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Prod: two progress saves for a never-started video raced; the loser hit the unique key and its
 * retry ran in the same broken session, giving the learner a 500. The retry now runs in a new
 * transaction and updates the row that won.
 */
class LearnerProgressConcurrentInsertTest {

    @Test
    void losingInsertUpdatesTheWinnerInAFreshTransaction() {
        LearnerContentProgressRepository repo = mock(LearnerContentProgressRepository.class);
        PlatformTransactionManager tm = mock(PlatformTransactionManager.class);
        when(tm.getTransaction(any(TransactionDefinition.class))).thenAnswer(inv -> new SimpleTransactionStatus());
        LearnerContentProgressServiceImpl service = new LearnerContentProgressServiceImpl(repo);
        ReflectionTestUtils.setField(service, "transactionManager", tm);

        LearnerContentProgress winner = new LearnerContentProgress();
        winner.setLearnerId(159);
        winner.setLessonContentId(643);
        winner.setAttempt(1);
        when(repo.findTopByLearnerIdAndLessonContentIdOrderByAttemptDesc(159, 643)).thenReturn(Optional.empty());
        when(repo.findByLearnerIdAndLessonContentIdAndAttempt(159, 643, 1)).thenReturn(Optional.of(winner));
        when(repo.saveAndFlush(any())).thenThrow(new DataIntegrityViolationException("Duplicate entry"))
                .thenAnswer(inv -> inv.getArgument(0));

        ContentProgressSaveRequest req = new ContentProgressSaveRequest();
        req.setLessonContentId(643);
        req.setLastPositionSeconds(30);
        req.setDurationSeconds(600);

        assertDoesNotThrow(() -> service.saveProgress(159, req));
        assertEquals(30, winner.getLastPositionSeconds());
        // one transaction for the failed insert, a separate one for the recovery
        verify(tm, times(2)).getTransaction(argThat(d -> d.getPropagationBehavior() == TransactionDefinition.PROPAGATION_REQUIRES_NEW));
    }
}
