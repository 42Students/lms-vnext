package com._42students.lms.repository;

import com._42students.lms.model.BugReportAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BugReportAttachmentRepository extends JpaRepository<BugReportAttachment, Long> {
    List<BugReportAttachment> findByBugReportIdOrderByCreatedAtAsc(Long bugReportId);
    long countByBugReportId(Long bugReportId);
    Optional<BugReportAttachment> findByStorageKey(String storageKey);
}
