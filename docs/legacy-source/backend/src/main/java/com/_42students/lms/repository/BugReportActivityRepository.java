package com._42students.lms.repository;

import com._42students.lms.model.BugReportActivity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BugReportActivityRepository extends JpaRepository<BugReportActivity, Long> {
    List<BugReportActivity> findByBugReportIdOrderByCreatedAtAsc(Long bugReportId);
}
