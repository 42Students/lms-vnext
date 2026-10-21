package com._42students.lms.repository;

import com._42students.lms.model.NewProgram;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NewProgramRepository extends JpaRepository<NewProgram, Integer> {
    
    @Query("SELECT p FROM NewProgram p WHERE p.deptId = ?1")
    List<NewProgram> findByDeptId(int deptId);

    @Query(value = "SELECT p.* FROM new_program p " +
            "INNER JOIN department d ON p.dept_id = d.id " +
            "WHERE d.college_id = :collegeId", nativeQuery = true)
    List<NewProgram> findByCollegeId(@Param("collegeId") int collegeId);

    // A2 in the super-admin audit: the academic structure had no pagination anywhere, so every
    // list endpoint returned every row for a college in one response. Additive paged variant --
    // the unpaged method above is untouched, so no existing caller changes behaviour. Native
    // queries need an explicit countQuery for Spring Data to paginate them.
    @Query(value = "SELECT p.* FROM new_program p INNER JOIN department d ON p.dept_id = d.id WHERE d.college_id = :collegeId",
            countQuery = "SELECT count(*) FROM new_program p INNER JOIN department d ON p.dept_id = d.id WHERE d.college_id = :collegeId",
            nativeQuery = true)
    org.springframework.data.domain.Page<NewProgram> findByCollegeIdPaged(@Param("collegeId") int collegeId,
            org.springframework.data.domain.Pageable pageable);


    @Query(value = "SELECT p.* FROM new_program p " +
            "INNER JOIN department d ON p.dept_id = d.id " +
            "INNER JOIN college c ON d.college_id = c.id " +
            "WHERE c.org_id = :orgId", nativeQuery = true)
    List<NewProgram> findByOrganizationId(@Param("orgId") int orgId);

    /**
     * For scope resolution: return program only if not soft-deleted.
     */
    @Query("SELECT p FROM NewProgram p WHERE p.id = :id AND (p.isDeleted = false OR p.isDeleted IS NULL)")
    Optional<NewProgram> findByIdAndNotDeleted(@Param("id") Integer id);

    /**
     * Case-insensitive name uniqueness check within a department.
     */
    @Query("SELECT p FROM NewProgram p WHERE p.deptId = :deptId AND LOWER(TRIM(p.name)) = LOWER(TRIM(:name))")
    List<NewProgram> findByDeptIdAndExactName(@Param("deptId") Integer deptId, @Param("name") String name);
}

