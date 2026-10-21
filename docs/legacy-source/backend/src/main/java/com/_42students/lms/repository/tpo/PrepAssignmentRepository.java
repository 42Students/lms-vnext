package com._42students.lms.repository.tpo;

import com._42students.lms.model.tpo.PrepAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrepAssignmentRepository extends JpaRepository<PrepAssignment, Long> {
    List<PrepAssignment> findByLearnerIdOrderByDueAtAsc(Integer learnerId);
}
