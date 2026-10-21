package com._42students.lms.repository;

import com._42students.lms.model.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Integer> {
    @Query(value = "select * from department where college_id=:collegeId AND (is_deleted = false OR is_deleted IS NULL)", nativeQuery = true)
    List<Department> fetchAllDepartments(@Param("collegeId") int collegeId);

    // A2 in the super-admin audit: the academic structure had no pagination anywhere, so every
    // list endpoint returned every row for a college in one response. Additive paged variant --
    // the unpaged method above is untouched, so no existing caller changes behaviour. Native
    // queries need an explicit countQuery for Spring Data to paginate them.
    @Query(value = "select * from department where college_id=:collegeId AND (is_deleted = false OR is_deleted IS NULL)",
            countQuery = "select count(*) from department where college_id=:collegeId AND (is_deleted = false OR is_deleted IS NULL)",
            nativeQuery = true)
    org.springframework.data.domain.Page<Department> fetchAllDepartmentsPaged(@Param("collegeId") int collegeId,
            org.springframework.data.domain.Pageable pageable);


    @Query(value = "SELECT d.* FROM department d " +
            "INNER JOIN college c ON d.college_id = c.id " +
            "WHERE c.org_id = :orgId AND (d.is_deleted = false OR d.is_deleted IS NULL)", nativeQuery = true)
    List<Department> fetchAllDepartmentsByOrganizationId(@Param("orgId") int orgId);

    @Query(value = "select * from department where id=:deptId", nativeQuery = true)
    Department fetchDepartmentById(@Param("deptId") int deptId);

    /**
     * For scope resolution: return department only if not soft-deleted.
     */
    @Query(value = "SELECT * FROM department WHERE id = :id AND (is_deleted = false OR is_deleted IS NULL) LIMIT 1", nativeQuery = true)
    Optional<Department> findByIdAndNotDeleted(@Param("id") Integer id);

    /**
     * Case-insensitive name uniqueness check within a college, excluding soft-deleted rows.
     */
    @Query(value = "SELECT * FROM department WHERE college_id = :collegeId AND LOWER(TRIM(name)) = LOWER(TRIM(:name)) " +
            "AND (is_deleted = false OR is_deleted IS NULL)", nativeQuery = true)
    List<Department> findByExactName(@Param("collegeId") Integer collegeId, @Param("name") String name);
}

