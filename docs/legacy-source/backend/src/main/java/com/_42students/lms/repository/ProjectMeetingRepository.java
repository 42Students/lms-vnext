package com._42students.lms.repository;

import com._42students.lms.model.ProjectMeeting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMeetingRepository extends JpaRepository<ProjectMeeting, Integer> {

    @Query("SELECT m FROM ProjectMeeting m WHERE m.projectId = :projectId AND m.isDeleted = false ORDER BY m.meetingDate ASC, m.startTime ASC, m.sortOrder ASC, m.id ASC")
    List<ProjectMeeting> findActiveByProjectId(@Param("projectId") Integer projectId);

    // Batched variant for list endpoints (toDtoBatch) — one query for the whole project list
    // instead of one per project.
    @Query("SELECT m FROM ProjectMeeting m WHERE m.projectId IN :projectIds AND m.isDeleted = false ORDER BY m.meetingDate ASC, m.startTime ASC, m.sortOrder ASC, m.id ASC")
    List<ProjectMeeting> findActiveByProjectIdIn(@Param("projectIds") Collection<Integer> projectIds);

    @Query("SELECT m FROM ProjectMeeting m WHERE m.projectId = :projectId AND m.meetingKey = :meetingKey AND m.isDeleted = false")
    Optional<ProjectMeeting> findActiveByProjectIdAndMeetingKey(@Param("projectId") Integer projectId, @Param("meetingKey") String meetingKey);

    // project_id/meeting_key is a hard unique key even for soft-deleted rows, so reusing a key
    // (e.g. the array-index-based fallback for a meeting with no explicit key) after a prior
    // meeting at that key was cancelled must revive the existing row rather than insert a new one.
    @Query("SELECT m FROM ProjectMeeting m WHERE m.projectId = :projectId AND m.meetingKey = :meetingKey")
    Optional<ProjectMeeting> findByProjectIdAndMeetingKey(@Param("projectId") Integer projectId, @Param("meetingKey") String meetingKey);

    // Organizer double-booking check needs to see this organizer's meetings across every
    // workspace they mentor, not just the one being edited — narrowed to the given date so it
    // stays cheap regardless of how many workspaces/meetings the organizer has overall.
    @Query("SELECT m FROM ProjectMeeting m WHERE m.organizerId = :organizerId AND m.meetingDate = :meetingDate AND m.isDeleted = false")
    List<ProjectMeeting> findActiveByOrganizerIdAndMeetingDate(@Param("organizerId") Integer organizerId, @Param("meetingDate") java.time.LocalDate meetingDate);

    // Same as above but across a date range — the single-date lookup only catches conflicts that
    // share the exact same LOCAL calendar date, which misses a real overlap once each meeting's
    // own timezone is converted to a common instant (e.g. 11pm IST on day N is still evening on
    // day N in UTC-heavy zones but late on day N-1 in others). One day of padding on each side
    // covers every timezone offset that exists (max UTC+14 to UTC-12).
    @Query("SELECT m FROM ProjectMeeting m WHERE m.organizerId = :organizerId AND m.meetingDate BETWEEN :startDate AND :endDate AND m.isDeleted = false")
    List<ProjectMeeting> findActiveByOrganizerIdAndMeetingDateBetween(@Param("organizerId") Integer organizerId, @Param("startDate") java.time.LocalDate startDate, @Param("endDate") java.time.LocalDate endDate);

    @Query("SELECT m FROM ProjectMeeting m WHERE m.projectId = :projectId AND m.isDeleted = true ORDER BY m.meetingDate ASC, m.startTime ASC, m.sortOrder ASC, m.id ASC")
    List<ProjectMeeting> findInactiveByProjectId(@Param("projectId") Integer projectId);
}
