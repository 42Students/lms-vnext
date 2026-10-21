package com._42students.lms.repository.tpo;

import com._42students.lms.model.tpo.ExternalPlacement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ExternalPlacementRepository extends JpaRepository<ExternalPlacement, Long> {

    @Query("SELECT e FROM ExternalPlacement e WHERE e.learnerId = :learnerId AND e.isDeleted = false")
    List<ExternalPlacement> findActiveForLearner(@Param("learnerId") Integer learnerId);
}
