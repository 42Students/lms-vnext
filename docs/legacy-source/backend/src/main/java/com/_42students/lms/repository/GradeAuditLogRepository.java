package com._42students.lms.repository;

import com._42students.lms.model.GradeAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GradeAuditLogRepository extends JpaRepository<GradeAuditLog, Long> {
    List<GradeAuditLog> findByStudentAssignmentIdOrderByCreatedAtDesc(int studentAssignmentId);
}

