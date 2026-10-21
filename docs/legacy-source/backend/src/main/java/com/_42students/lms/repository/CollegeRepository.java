package com._42students.lms.repository;

import com._42students.lms.model.College;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CollegeRepository extends JpaRepository<College, Integer> {
    @Query(value = "select * from college where org_id=:orgId", nativeQuery = true)
    List<College> fetchColleges(@Param("orgId") int orgId);

    @Query(value = "select * from college where id=:collegeId and (is_deleted = 0 or is_deleted is null)", nativeQuery = true)
    College fetchCollege(@Param("collegeId") int collegeId);
    
    @Query(value = "select * from college where LOWER(name) = LOWER(:name) and is_deleted = false", nativeQuery = true)
    Optional<College> findByNameIgnoreCase(@Param("name") String name);

    @Query(value = "select * from college where LOWER(unique_id) = LOWER(:uniqueId) and (is_deleted = 0 or is_deleted is null) limit 1", nativeQuery = true)
    Optional<College> findByUniqueIdIgnoreCase(@Param("uniqueId") String uniqueId);

    @Query(value = "select name from college where (is_deleted = 0 or is_deleted is null) and (:q is null or LOWER(name) like CONCAT('%', LOWER(:q), '%')) order by name asc limit 50", nativeQuery = true)
    List<String> searchCollegeNames(@Param("q") String query);
}

