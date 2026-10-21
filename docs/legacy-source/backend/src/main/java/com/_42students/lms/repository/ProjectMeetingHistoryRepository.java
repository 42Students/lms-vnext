package com._42students.lms.repository;

import com._42students.lms.model.ProjectMeetingHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectMeetingHistoryRepository extends JpaRepository<ProjectMeetingHistory, Integer> {

    // Despite the name, this had no bound at all — same class of bug as
    // ProjectResourceAuditRepository.findRecentByProjectId. A shared QA test meeting with a long
    // reschedule/edit history was contributing multiple megabytes per meeting to the mentor
    // Projects-list response (loadProjectMeetings loads this unconditionally, even for the
    // batched/list view). Bounded the same way.
    @Query("SELECT h FROM ProjectMeetingHistory h WHERE h.projectId = :projectId ORDER BY h.createdAt DESC, h.id DESC")
    List<ProjectMeetingHistory> findRecentByProjectId(@Param("projectId") Integer projectId, Pageable pageable);

    @Query("SELECT h FROM ProjectMeetingHistory h WHERE h.projectId = :projectId AND h.meetingKey = :meetingKey ORDER BY h.createdAt DESC, h.id DESC")
    List<ProjectMeetingHistory> findRecentByProjectIdAndMeetingKey(@Param("projectId") Integer projectId, @Param("meetingKey") String meetingKey);
}
