package com._42students.lms.repository;

import com._42students.lms.model.LearnerSavedJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LearnerSavedJobRepository extends JpaRepository<LearnerSavedJob, Integer> {
    Optional<LearnerSavedJob> findByLearnerIdAndJobId(Integer learnerId, Integer jobId);

    boolean existsByLearnerIdAndJobId(Integer learnerId, Integer jobId);

    void deleteByLearnerIdAndJobId(Integer learnerId, Integer jobId);

    List<LearnerSavedJob> findByLearnerIdOrderByCreatedAtDesc(Integer learnerId);
}

