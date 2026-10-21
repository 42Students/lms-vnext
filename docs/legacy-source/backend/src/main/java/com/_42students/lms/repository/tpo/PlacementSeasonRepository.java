package com._42students.lms.repository.tpo;

import com._42students.lms.model.tpo.PlacementSeason;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlacementSeasonRepository extends JpaRepository<PlacementSeason, Long> {
    List<PlacementSeason> findByCollegeIdOrderByStartDateDesc(Integer collegeId);

    Optional<PlacementSeason> findFirstByCollegeIdAndIsCurrentTrueOrderByStartDateDesc(Integer collegeId);
}
