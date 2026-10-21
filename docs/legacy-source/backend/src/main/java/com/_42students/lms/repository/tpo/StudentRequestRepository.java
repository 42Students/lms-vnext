package com._42students.lms.repository.tpo;

import com._42students.lms.model.tpo.StudentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentRequestRepository extends JpaRepository<StudentRequest, Long> {
    List<StudentRequest> findByLearnerIdOrderByCreatedAtDesc(Integer learnerId);

    List<StudentRequest> findByStatusOrderByCreatedAtAsc(String status);

    /** Pending requests from students of one college only. */
    @org.springframework.data.jpa.repository.Query("select r from StudentRequest r, learner ln where r.status = 'PENDING' " +
            "and ln.id = r.learnerId and ln.collegeId = :collegeId order by r.createdAt asc")
    List<StudentRequest> findPendingForCollege(@org.springframework.data.repository.query.Param("collegeId") Integer collegeId);

    List<StudentRequest> findByStatusAndTypeOrderByCreatedAtAsc(String status, String type);
}
