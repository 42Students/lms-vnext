package com._42students.lms.repository;

import com._42students.lms.model.Semester;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SemesterRepository extends JpaRepository<Semester, Integer> {

    @Query("SELECT s FROM Semester s WHERE s.programId = :programId " +
           "AND (s.isDeleted = false OR s.isDeleted IS NULL) " +
           "ORDER BY s.semesterNumber ASC, s.id ASC")
    List<Semester> findByProgramIdOrderBySemesterNumber(@Param("programId") Integer programId);

    List<Semester> findByProgramIdAndIsActiveOrderBySemesterNumber(Integer programId, Boolean isActive);
    Optional<Semester> findFirstByProgramIdAndSemesterNumber(Integer programId, Integer semesterNumber);

    @Query("SELECT s FROM Semester s WHERE s.programId = :programId AND s.isActive = true ORDER BY s.semesterNumber")
    List<Semester> findActiveSemestersByProgram(@Param("programId") Integer programId);

    boolean existsByProgramIdAndSemesterNumber(Integer programId, Integer semesterNumber);

    @Query("SELECT s FROM Semester s WHERE s.programId IN (" +
            "SELECT p.id FROM NewProgram p WHERE p.deptId IN (" +
            "SELECT d.id FROM department d WHERE d.collegeId = :collegeId" +
            ")) ORDER BY s.programId, s.semesterNumber")
    List<Semester> findByCollegeScope(@Param("collegeId") Integer collegeId);

    @Query("SELECT s FROM Semester s WHERE s.programId IN (" +
            "SELECT p.id FROM NewProgram p WHERE p.deptId IN (" +
            "SELECT d.id FROM department d WHERE d.collegeId = :collegeId" +
            ")) ORDER BY s.programId, s.semesterNumber")
    org.springframework.data.domain.Page<Semester> findByCollegeScopePaged(@Param("collegeId") Integer collegeId,
            org.springframework.data.domain.Pageable pageable);

    @Query("SELECT s FROM Semester s WHERE s.programId IN (" +
            "SELECT p.id FROM NewProgram p WHERE p.deptId IN (" +
            "SELECT d.id FROM department d WHERE d.collegeId IN (" +
            "SELECT c.id FROM college c WHERE c.orgId = :orgId" +
            ")" +
            ")) ORDER BY s.programId, s.semesterNumber")
    List<Semester> findByOrgScope(@Param("orgId") Integer orgId);
}
