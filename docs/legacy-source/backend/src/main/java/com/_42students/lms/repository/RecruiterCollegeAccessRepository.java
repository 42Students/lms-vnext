package com._42students.lms.repository;

import com._42students.lms.model.RecruiterCollegeAccess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface RecruiterCollegeAccessRepository extends JpaRepository<RecruiterCollegeAccess, Integer> {

    /** Every grant row (any status) for this recruiter. Callers decide activeness with isActiveAt. */
    @Query("SELECT a FROM recruiter_college_access a WHERE a.recruiterId = :recruiterId AND a.isDeleted = false ORDER BY a.grantedAt ASC")
    List<RecruiterCollegeAccess> findAllForRecruiter(@Param("recruiterId") Integer recruiterId);

    @Query("SELECT a FROM recruiter_college_access a WHERE a.recruiterId = :recruiterId AND a.collegeId = :collegeId AND a.isDeleted = false")
    Optional<RecruiterCollegeAccess> findForRecruiterAndCollege(@Param("recruiterId") Integer recruiterId, @Param("collegeId") Integer collegeId);

    @Query("SELECT a FROM recruiter_college_access a WHERE a.collegeId IN :collegeIds AND a.isDeleted = false")
    List<RecruiterCollegeAccess> findAllForColleges(@Param("collegeIds") Collection<Integer> collegeIds);

    @Query("SELECT a FROM recruiter_college_access a WHERE a.recruiterId IN :recruiterIds AND a.isDeleted = false")
    List<RecruiterCollegeAccess> findAllForRecruiters(@Param("recruiterIds") Collection<Integer> recruiterIds);
}
