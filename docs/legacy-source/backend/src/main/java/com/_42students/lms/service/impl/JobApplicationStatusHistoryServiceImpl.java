package com._42students.lms.service.impl;

import com._42students.lms.model.JobApplication;
import com._42students.lms.model.JobApplicationStatusHistory;
import com._42students.lms.repository.JobApplicationRepository;
import com._42students.lms.repository.JobApplicationStatusHistoryRepository;
import com._42students.lms.service.JobApplicationStatusHistoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class JobApplicationStatusHistoryServiceImpl implements JobApplicationStatusHistoryService {

    @Autowired
    private JobApplicationStatusHistoryRepository repository;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    @Override
    @Transactional
    public void recordStatusChange(Integer applicationId, String oldStatus, String newStatus, Integer changedBy, String rejectionReason) {
        if (applicationId == null || newStatus == null || newStatus.trim().isEmpty()) {
            log.warn("Skipping history record: applicationId or newStatus missing");
            return;
        }
        if (oldStatus != null && oldStatus.equalsIgnoreCase(newStatus)) {
            return;
        }
        try {
            JobApplicationStatusHistory h = new JobApplicationStatusHistory();
            h.setApplicationId(applicationId);
            h.setOldStatus(oldStatus != null && !oldStatus.trim().isEmpty() ? oldStatus.trim() : null);
            h.setNewStatus(newStatus.trim());
            h.setChangedAt(LocalDateTime.now());
            h.setChangedBy(changedBy);
            if (rejectionReason != null && !rejectionReason.trim().isEmpty()) {
                h.setRejectionReason(rejectionReason.length() > 500 ? rejectionReason.substring(0, 500) : rejectionReason);
            }
            repository.save(h);
            log.debug("Recorded history: application {} {} -> {}", applicationId, oldStatus, newStatus);
        } catch (Exception e) {
            log.error("Failed to record status history for application {}: {}", applicationId, e.getMessage());
            // Do not rethrow - history is non-critical; main transaction should not fail
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobApplicationStatusHistory> getHistoryForApplication(Integer applicationId) {
        if (applicationId == null) return List.of();
        List<JobApplicationStatusHistory> history = repository.findByApplicationIdOrderByChangedAtAsc(applicationId);
        // Fallback: applications created before history feature may have no records
        if (history.isEmpty()) {
            Optional<JobApplication> appOpt = jobApplicationRepository.findById(applicationId);
            if (appOpt.isPresent()) {
                JobApplication app = appOpt.get();
                JobApplicationStatusHistory synthetic = new JobApplicationStatusHistory();
                synthetic.setApplicationId(applicationId);
                synthetic.setOldStatus(null);
                synthetic.setNewStatus(app.getApplicationStatus() != null ? app.getApplicationStatus() : "APPLIED");
                LocalDateTime changedAt = app.getAppliedAt() != null
                    ? app.getAppliedAt()
                    : (app.getStatusUpdatedAt() != null ? app.getStatusUpdatedAt() : LocalDateTime.now());
                synthetic.setChangedAt(changedAt);
                synthetic.setChangedBy(app.getStatusUpdatedBy());
                if ("REJECTED".equalsIgnoreCase(synthetic.getNewStatus()) && app.getRejectionReason() != null) {
                    synthetic.setRejectionReason(app.getRejectionReason());
                }
                return List.of(synthetic);
            }
        }
        return history;
    }
}

