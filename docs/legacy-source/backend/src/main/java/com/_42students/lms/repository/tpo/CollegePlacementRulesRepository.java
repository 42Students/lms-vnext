package com._42students.lms.repository.tpo;

import com._42students.lms.model.tpo.CollegePlacementRules;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CollegePlacementRulesRepository extends JpaRepository<CollegePlacementRules, Integer> {
}
