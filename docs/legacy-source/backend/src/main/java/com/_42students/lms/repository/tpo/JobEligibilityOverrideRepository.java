package com._42students.lms.repository.tpo;

import com._42students.lms.model.tpo.JobEligibilityOverride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobEligibilityOverrideRepository extends JpaRepository<JobEligibilityOverride, Long> {
    List<JobEligibilityOverride> findByJobId(Integer jobId);

    Optional<JobEligibilityOverride> findByJobIdAndLearnerId(Integer jobId, Integer learnerId);
}
