package com._42students.lms.repository;

import com._42students.lms.model.CollegeCompany;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import javax.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

@Repository
public interface CollegeCompanyRepository extends JpaRepository<CollegeCompany, Long> {

    Optional<CollegeCompany> findByCollegeIdAndCompanyId(Integer collegeId, Integer companyId);

    Optional<CollegeCompany> findByJoinTokenHash(String joinTokenHash);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT cc FROM CollegeCompany cc WHERE cc.collegeId = :collegeId AND cc.companyId = :companyId")
    Optional<CollegeCompany> lockByCollegeAndCompany(@Param("collegeId") Integer collegeId, @Param("companyId") Integer companyId);

    /** True when any college of this organization has the company in its list (org-scoped job posting surfaces). */
    @Query("SELECT COUNT(cc) > 0 FROM CollegeCompany cc, college c WHERE c.id = cc.collegeId AND c.orgId = :orgId " +
           "AND cc.companyId = :companyId AND cc.isDeleted = false")
    boolean isListedInOrganization(@Param("orgId") Integer orgId, @Param("companyId") Integer companyId);

    @Query("SELECT cc FROM CollegeCompany cc WHERE cc.collegeId = :collegeId AND (:includeDeleted = true OR cc.isDeleted = false)")
    List<CollegeCompany> findForCollege(@Param("collegeId") Integer collegeId, @Param("includeDeleted") boolean includeDeleted);
}
