package com._42students.lms.repository;

import com._42students.lms.model.ProjectResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectResourceRepository extends JpaRepository<ProjectResource, Integer> {

    @Query("SELECT r FROM ProjectResource r WHERE r.projectId = :projectId AND r.isDeleted = false ORDER BY r.resourceOrder ASC, r.id ASC")
    List<ProjectResource> findActiveByProjectIdOrderByResourceOrderAscIdAsc(@Param("projectId") Integer projectId);

    @Query("SELECT r FROM ProjectResource r WHERE r.projectId = :projectId AND r.resourceKey = :resourceKey AND r.isDeleted = false")
    Optional<ProjectResource> findActiveByProjectIdAndResourceKey(@Param("projectId") Integer projectId, @Param("resourceKey") String resourceKey);

    // Includes soft-deleted rows, so the template-vs-workspace merge can tell a deliberately
    // deleted resource apart from one that was simply never materialized.
    @Query("SELECT r FROM ProjectResource r WHERE r.projectId = :projectId")
    List<ProjectResource> findAllByProjectId(@Param("projectId") Integer projectId);

    // Used by FileUploadController#enforceKeyAccess to re-derive which project (if any) an
    // "assignments"-folder storage key belongs to, so a download/stream/delete request can be
    // checked against that project's membership the same way /upload/presign checks it at
    // upload time. fileUrl/attachmentUrl may hold either the bare tenant-scoped key or the full
    // public R2 URL (see sanitizeResourceUrl), so match on a suffix rather than exact equality.
    @Query("SELECT DISTINCT r.projectId FROM ProjectResource r WHERE r.isDeleted = false AND "
            + "(r.fileUrl LIKE CONCAT('%', :key) OR r.attachmentUrl LIKE CONCAT('%', :key) OR r.resourceUrl LIKE CONCAT('%', :key))")
    List<Integer> findActiveProjectIdsByFileKeySuffix(@Param("key") String key);

    // Same key-suffix match as above, but returns the resource row(s) themselves so the caller
    // can check `visibility` — membership alone isn't enough for a "Mentor Only" resource's file.
    @Query("SELECT r FROM ProjectResource r WHERE r.isDeleted = false AND "
            + "(r.fileUrl LIKE CONCAT('%', :key) OR r.attachmentUrl LIKE CONCAT('%', :key) OR r.resourceUrl LIKE CONCAT('%', :key))")
    List<ProjectResource> findActiveByFileKeySuffix(@Param("key") String key);
}
