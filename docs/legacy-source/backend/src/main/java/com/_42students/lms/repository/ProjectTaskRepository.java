package com._42students.lms.repository;

import com._42students.lms.model.ProjectTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ProjectTaskRepository extends JpaRepository<ProjectTask, Integer> {

    @Query("SELECT t FROM ProjectTask t WHERE t.projectId = :projectId AND t.isDeleted = false ORDER BY t.sortOrder ASC, t.id ASC")
    List<ProjectTask> findActiveByProjectId(@Param("projectId") Integer projectId);

    @Query("SELECT COUNT(t) FROM ProjectTask t WHERE t.projectId = :projectId AND t.isDeleted = false")
    long countActiveByProjectId(@Param("projectId") Integer projectId);

    // Includes soft-deleted rows. Needed so the template-vs-workspace merge can tell the
    // difference between "never materialized" (show the template's virtual definition)
    // and "materialized then deleted" (a deliberate delete that must stay suppressed
    // instead of the merge silently falling back to the template row again).
    @Query("SELECT t FROM ProjectTask t WHERE t.projectId = :projectId")
    List<ProjectTask> findAllByProjectId(@Param("projectId") Integer projectId);

    // Batched variants for list endpoints (toDtoBatch) — one query for the whole project list
    // instead of two (active + all) per project.
    @Query("SELECT t FROM ProjectTask t WHERE t.projectId IN :projectIds AND t.isDeleted = false ORDER BY t.sortOrder ASC, t.id ASC")
    List<ProjectTask> findActiveByProjectIdIn(@Param("projectIds") Collection<Integer> projectIds);

    @Query("SELECT t FROM ProjectTask t WHERE t.projectId IN :projectIds")
    List<ProjectTask> findAllByProjectIdIn(@Param("projectIds") Collection<Integer> projectIds);
}
