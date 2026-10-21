package com._42students.lms.repository;

import com._42students.lms.model.JobApplicationStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface JobApplicationStatusHistoryRepository extends JpaRepository<JobApplicationStatusHistory, Integer> {

    @Query("SELECT h FROM JobApplicationStatusHistory h WHERE h.applicationId = :applicationId AND (h.isDeleted IS NULL OR h.isDeleted = false) ORDER BY h.changedAt ASC")
    List<JobApplicationStatusHistory> findByApplicationIdOrderByChangedAtAsc(Integer applicationId);

    @Query("SELECT h FROM JobApplicationStatusHistory h WHERE h.applicationId IN :applicationIds AND h.newStatus = :newStatus AND (h.isDeleted IS NULL OR h.isDeleted = false) ORDER BY h.applicationId ASC, h.changedAt ASC")
    List<JobApplicationStatusHistory> findByApplicationIdsAndNewStatusOrderByChangedAtAsc(@Param("applicationIds") List<Integer> applicationIds,
                                                                                           @Param("newStatus") String newStatus);
}

