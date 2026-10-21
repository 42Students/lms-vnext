package com._42students.lms.repository;

import com._42students.lms.model.ProjectDelivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectDeliveryRepository extends JpaRepository<ProjectDelivery, Integer> {

    @Query("SELECT d FROM ProjectDelivery d WHERE d.projectId = :projectId AND d.isDeleted = false")
    Optional<ProjectDelivery> findActiveByProjectId(@Param("projectId") Integer projectId);

    // Batched variant for list endpoints (toDtoBatch) — one query for the whole project list
    // instead of one per project.
    @Query("SELECT d FROM ProjectDelivery d WHERE d.projectId IN :projectIds AND d.isDeleted = false")
    List<ProjectDelivery> findActiveByProjectIdIn(@Param("projectIds") Collection<Integer> projectIds);

    // Used by FileUploadController#enforceKeyAccess to re-derive which project (if any) an
    // "assignments"-folder storage key belongs to, so a submission download/stream/delete
    // request can be checked against that project's membership the same way /upload/presign
    // checks it at upload time. attachment_url/source_url/storage_key may hold either the bare
    // tenant-scoped key or the full public R2 URL, so match on a suffix rather than exact
    // equality; attachments is a JSON list of {url, ...} entries, so it's matched as text via
    // CAST(... AS CHAR) rather than exact/suffix matching a structured value.
    @Query(value = "SELECT DISTINCT project_id FROM project_delivery WHERE is_deleted = false AND "
            + "(attachment_url LIKE CONCAT('%', :key) OR source_url LIKE CONCAT('%', :key) "
            + "OR storage_key LIKE CONCAT('%', :key) OR CAST(attachments AS CHAR) LIKE CONCAT('%', :key))",
            nativeQuery = true)
    List<Integer> findActiveProjectIdsByFileKeySuffix(@Param("key") String key);
}
