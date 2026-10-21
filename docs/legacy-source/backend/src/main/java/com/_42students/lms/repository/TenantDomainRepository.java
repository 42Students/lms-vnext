package com._42students.lms.repository;

import com._42students.lms.model.TenantDomain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface TenantDomainRepository extends JpaRepository<TenantDomain, Integer> {

    @Query("SELECT td FROM TenantDomain td WHERE td.isDeleted = false AND LOWER(td.host) = LOWER(:host)")
    Optional<TenantDomain> findActiveByHost(@Param("host") String host);

    @Query("SELECT td FROM TenantDomain td WHERE td.isDeleted = false AND td.isVerified = true AND LOWER(td.host) = LOWER(:host)")
    Optional<TenantDomain> findVerifiedActiveByHost(@Param("host") String host);

    @Query("SELECT td FROM TenantDomain td WHERE td.isDeleted = false AND td.collegeId = :collegeId ORDER BY td.isPrimary DESC, td.id ASC")
    List<TenantDomain> findActiveByCollegeId(@Param("collegeId") Integer collegeId);

    @Query("SELECT td.host FROM TenantDomain td WHERE td.isDeleted = false AND td.collegeId = :collegeId AND td.isPrimary = true ORDER BY td.id ASC")
    List<String> findPrimaryHostsByCollegeId(@Param("collegeId") Integer collegeId);

    @Query("SELECT td.host FROM TenantDomain td WHERE td.isDeleted = false AND td.isVerified = true AND td.collegeId = :collegeId AND td.isPrimary = true ORDER BY td.id ASC")
    List<String> findVerifiedPrimaryHostsByCollegeId(@Param("collegeId") Integer collegeId);

    @Modifying
    @Transactional
    @Query("UPDATE TenantDomain td SET td.isPrimary = false WHERE td.isDeleted = false AND td.collegeId = :collegeId AND (:exceptId IS NULL OR td.id <> :exceptId)")
    int clearPrimaryForCollege(@Param("collegeId") Integer collegeId, @Param("exceptId") Integer exceptId);
}

