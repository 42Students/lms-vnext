package com._42students.lms.repository;

import com._42students.lms.model.JobPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JobPreferencesRepository extends JpaRepository<JobPreferences, Integer> {
    Optional<JobPreferences> findByLearnerIdAndIsDeletedFalse(Integer learnerId);
}



