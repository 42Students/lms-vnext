package com._42students.lms.repository;

import com._42students.lms.model.ProjectTaskComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectTaskCommentRepository extends JpaRepository<ProjectTaskComment, Integer> {

    @Query("SELECT c FROM ProjectTaskComment c WHERE c.projectId = :projectId AND c.projectTaskId = :taskId AND c.isDeleted = false ORDER BY c.id ASC")
    List<ProjectTaskComment> findActiveByTaskId(@Param("projectId") Integer projectId, @Param("taskId") Integer taskId);
}
