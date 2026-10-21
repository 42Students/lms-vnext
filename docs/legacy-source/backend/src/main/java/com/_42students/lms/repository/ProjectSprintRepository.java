package com._42students.lms.repository;

import com._42students.lms.model.ProjectSprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectSprintRepository extends JpaRepository<ProjectSprint, Integer> {

    @Query("SELECT m FROM ProjectSprint m WHERE m.projectId = :projectId AND m.isDeleted = false ORDER BY m.sortOrder ASC, m.id ASC")
    List<ProjectSprint> findActiveByProjectId(@Param("projectId") Integer projectId);

    @Query("SELECT m FROM ProjectSprint m WHERE m.projectId = :projectId AND m.sprintKey = :sprintKey AND m.isDeleted = false")
    Optional<ProjectSprint> findActiveByProjectIdAndSprintKey(@Param("projectId") Integer projectId, @Param("sprintKey") String sprintKey);

    // Includes soft-deleted rows, so the template-vs-workspace merge can tell a deliberately
    // deleted sprint apart from one that was simply never materialized.
    @Query("SELECT m FROM ProjectSprint m WHERE m.projectId = :projectId")
    List<ProjectSprint> findAllByProjectId(@Param("projectId") Integer projectId);

    // Batched variants for list endpoints (toDtoBatch) — one query for the whole project list
    // instead of two (active + all) per project.
    @Query("SELECT m FROM ProjectSprint m WHERE m.projectId IN :projectIds AND m.isDeleted = false ORDER BY m.sortOrder ASC, m.id ASC")
    List<ProjectSprint> findActiveByProjectIdIn(@Param("projectIds") Collection<Integer> projectIds);

    @Query("SELECT m FROM ProjectSprint m WHERE m.projectId IN :projectIds")
    List<ProjectSprint> findAllByProjectIdIn(@Param("projectIds") Collection<Integer> projectIds);
}
