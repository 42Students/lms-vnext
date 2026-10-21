package com._42students.lms.repository;

import com._42students.lms.model.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Integer> {
    
    @Query(value = "SELECT * FROM organization WHERE LOWER(name) = LOWER(:name) AND (is_deleted = false OR is_deleted IS NULL)", nativeQuery = true)
    Optional<Organization> findByNameIgnoreCase(@Param("name") String name);
}

