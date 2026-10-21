package com._42students.lms.repository;

import com._42students.lms.model.ProjectRelease;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectReleaseRepository extends JpaRepository<ProjectRelease, Integer> {

    @Query("SELECT r FROM ProjectRelease r WHERE r.projectId = :projectId AND r.isDeleted = false ORDER BY r.sortOrder ASC, r.id ASC")
    List<ProjectRelease> findActiveByProjectId(@Param("projectId") Integer projectId);

    @Query("SELECT r FROM ProjectRelease r WHERE r.projectId = :projectId AND r.releaseKey = :releaseKey AND r.isDeleted = false")
    Optional<ProjectRelease> findActiveByProjectIdAndReleaseKey(@Param("projectId") Integer projectId, @Param("releaseKey") String releaseKey);

    // Unlike the active-only lookup, detects historical soft-deleted keys reserved by the DB.
    @Query("SELECT r FROM ProjectRelease r WHERE r.projectId = :projectId AND r.releaseKey = :releaseKey")
    Optional<ProjectRelease> findByProjectIdAndReleaseKey(@Param("projectId") Integer projectId, @Param("releaseKey") String releaseKey);

    @Query("SELECT COUNT(r) FROM ProjectRelease r WHERE r.projectId = :projectId AND r.isDeleted = false")
    long countActiveByProjectId(@Param("projectId") Integer projectId);
}
