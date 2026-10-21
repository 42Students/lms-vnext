package com._42students.lms.event;

import com._42students.lms.service.JobApplicationStatusHistoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@Slf4j
public class ApplicationStatusChangedEventListener {

    @Autowired
    private JobApplicationStatusHistoryService statusHistoryService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onApplicationStatusChanged(ApplicationStatusChangedEvent event) {
        try {
            statusHistoryService.recordStatusChange(
                    event.getApplicationId(),
                    event.getOldStatus(),
                    event.getNewStatus(),
                    event.getChangedBy(),
                    event.getRejectionReason());
        } catch (Exception e) {
            log.error("Failed to record status history for application {} (event listener): {}",
                    event.getApplicationId(), e.getMessage(), e);
        }
    }
}

