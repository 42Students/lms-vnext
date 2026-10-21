package com._42students.lms.repository.tpo;

import com._42students.lms.model.tpo.FollowUp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FollowUpRepository extends JpaRepository<FollowUp, Long> {
    List<FollowUp> findByRecruiterLeadIdOrderByDueAtAsc(Long recruiterLeadId);

    List<FollowUp> findByDoneAtIsNullAndDueAtLessThanEqualOrderByDueAtAsc(LocalDateTime cutoff);

    /** Open follow-ups due by the cutoff, for recruiter leads of one college only. */
    @org.springframework.data.jpa.repository.Query("select f from FollowUp f, RecruiterLead l where f.doneAt is null and f.dueAt <= :cutoff " +
            "and l.id = f.recruiterLeadId and l.collegeId = :collegeId order by f.dueAt asc")
    List<FollowUp> findDueForCollege(@org.springframework.data.repository.query.Param("cutoff") LocalDateTime cutoff, @org.springframework.data.repository.query.Param("collegeId") Integer collegeId);
}
