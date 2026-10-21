package com._42students.lms.repository.tpo;

import com._42students.lms.model.tpo.PlacementDebarment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlacementDebarmentRepository extends JpaRepository<PlacementDebarment, Long> {
    List<PlacementDebarment> findByLearnerIdAndLiftedAtIsNull(Integer learnerId);
}
