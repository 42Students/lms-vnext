package com._42students.lms.repository.tpo;

import com._42students.lms.model.tpo.PlacementRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlacementRegistrationRepository extends JpaRepository<PlacementRegistration, Long> {
    Optional<PlacementRegistration> findByLearnerIdAndSeasonId(Integer learnerId, Long seasonId);

    List<PlacementRegistration> findBySeasonId(Long seasonId);

    /** Every registration of these learners, whatever season it was stored under (there is no season in the product). */
    List<PlacementRegistration> findByLearnerIdIn(java.util.Collection<Integer> learnerIds);
}
