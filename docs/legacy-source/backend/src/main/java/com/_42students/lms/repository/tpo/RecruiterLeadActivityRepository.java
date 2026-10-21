package com._42students.lms.repository.tpo;

import com._42students.lms.model.tpo.RecruiterLeadActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecruiterLeadActivityRepository extends JpaRepository<RecruiterLeadActivity, Long> {
    List<RecruiterLeadActivity> findByRecruiterLeadIdOrderByCreatedAtDesc(Long recruiterLeadId);
}
