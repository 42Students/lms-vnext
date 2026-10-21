package com._42students.lms.repository;

import com._42students.lms.model.ProjectResourceAudit;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectResourceAuditRepository extends JpaRepository<ProjectResourceAudit, Integer> {

    // Despite the name, this had no bound at all — every audit row a project's resources ever
    // accumulated was loaded and embedded into every resource's snapshot for every non-learner
    // viewer. Bounded the same way as ProjectActivityEventRepository.findRecentByProjectId.
    @Query("SELECT a FROM ProjectResourceAudit a WHERE a.projectId = :projectId ORDER BY a.createdAt DESC, a.id DESC")
    List<ProjectResourceAudit> findRecentByProjectId(@Param("projectId") Integer projectId, Pageable pageable);

    @Query("SELECT a FROM ProjectResourceAudit a WHERE a.projectId = :projectId AND a.resourceKey = :resourceKey ORDER BY a.createdAt DESC, a.id DESC")
    List<ProjectResourceAudit> findRecentByProjectIdAndResourceKey(@Param("projectId") Integer projectId, @Param("resourceKey") String resourceKey);
}
