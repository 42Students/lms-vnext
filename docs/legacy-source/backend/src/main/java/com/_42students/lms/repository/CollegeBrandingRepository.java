package com._42students.lms.repository;

import com._42students.lms.model.CollegeBranding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CollegeBrandingRepository extends JpaRepository<CollegeBranding, Integer> {

    @Query("SELECT cb FROM CollegeBranding cb WHERE cb.isDeleted = false AND cb.collegeId = :collegeId")
    Optional<CollegeBranding> findActiveByCollegeId(@Param("collegeId") Integer collegeId);
}


