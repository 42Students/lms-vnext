package com._42students.lms.repository;

import com._42students.lms.model.Qualification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QualificationRepository extends JpaRepository<Qualification, Integer> {
    
    @Query(value = "SELECT * FROM qualification WHERE learner_id = :learnerId AND is_deleted = false ORDER BY start_year DESC, end_year DESC", nativeQuery = true)
    List<Qualification> findByLearnerId(@Param("learnerId") Integer learnerId);
    
    List<Qualification> findByLearnerIdAndIsDeletedFalse(Integer learnerId);
}



