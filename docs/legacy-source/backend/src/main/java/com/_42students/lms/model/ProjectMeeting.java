package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.hibernate.annotations.Type;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;
import javax.persistence.Version;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Entity
// Mirrors uk_project_meeting_key in V84__project_meetings.sql.
@Table(name = "project_meeting", uniqueConstraints = @UniqueConstraint(name = "uk_project_meeting_key", columnNames = {"project_id", "meeting_key"}))
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
public class ProjectMeeting extends BaseModel {

    @Column(name = "project_id", nullable = false)
    private Integer projectId;

    @Column(name = "meeting_key", nullable = false, length = 120)
    private String meetingKey;

    @Column(name = "deleted_by_workspace", nullable = false)
    private Boolean deletedByWorkspace = false;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "agenda", columnDefinition = "TEXT")
    private String agenda;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "outcome", columnDefinition = "TEXT")
    private String outcome;

    @Column(name = "meeting_status", length = 40)
    private String meetingStatus = "SCHEDULED";

    // PLANNING | STANDUP | REVIEW | RETRO | GENERAL. Stage 6 — lets the sprint lifecycle
    // surface "plan your next sprint" / "run a retro" prompts against the right meeting.
    @Column(name = "meeting_type", length = 20)
    private String meetingType = "GENERAL";

    @Column(name = "retro_went_well", columnDefinition = "TEXT")
    private String retroWentWell;

    @Column(name = "retro_didnt_go_well", columnDefinition = "TEXT")
    private String retroDidntGoWell;

    // JSON array of {text, taskKey}. taskKey is set once an action item has been promoted to a
    // backlog task (Stage 6), so the retro view can show "-> Sprint 21 task" instead of dead text.
    @Column(name = "retro_actions", columnDefinition = "TEXT")
    private String retroActions;

    @Column(name = "meeting_date")
    private LocalDate meetingDate;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "timezone", length = 80)
    private String timezone;

    @Column(name = "organizer_id")
    private Integer organizerId;

    @Column(name = "organizer_name", length = 160)
    private String organizerName;

    @Type(type = "json")
    @Column(name = "attendees", columnDefinition = "json")
    private Object attendees;

    @Type(type = "json")
    @Column(name = "action_items", columnDefinition = "json")
    private Object actionItems;

    @Column(name = "linked_sprint_key", length = 120)
    private String linkedSprintKey;

    @Column(name = "linked_sprint_label", length = 200)
    private String linkedSprintLabel;

    @Column(name = "linked_task_key", length = 120)
    private String linkedTaskKey;

    @Column(name = "linked_task_label", length = 200)
    private String linkedTaskLabel;

    @Column(name = "reminder_at")
    private LocalDateTime reminderAt;

    @Column(name = "reminder_channel", length = 40)
    private String reminderChannel;

    @Column(name = "follow_up_at")
    private LocalDateTime followUpAt;

    @Column(name = "follow_up_status", length = 40)
    private String followUpStatus;

    @Column(name = "follow_up_notes", columnDefinition = "TEXT")
    private String followUpNotes;

    @Column(name = "calendar_event_id", length = 160)
    private String calendarEventId;

    // Unused since Google Calendar auto-sync was removed — meetings now rely entirely on the
    // manually-entered link stored in calendarEventId (see syncProjectMeetings' meetingUrl mapping).
    @Column(name = "meet_link", length = 500)
    private String meetLink;

    @Column(name = "calendar_provider", length = 60)
    private String calendarProvider;

    /**
     * PENDING/SYNCED/FAILED — the Calendar create/update/remove call runs asynchronously after
     * the DB transaction commits, so this is the only signal a caller has that the invite the
     * meeting record implies actually went out (or didn't).
     */
    @Column(name = "calendar_sync_status", length = 20, nullable = false)
    private String calendarSyncStatus = "PENDING";

    @Column(name = "calendar_sync_error", length = 500)
    private String calendarSyncError;

    @Column(name = "created_by")
    private Integer createdBy;

    // LEARNER or FACULTY (V197): createdBy alone cannot tell learner #42 from faculty #42.
    @Column(name = "created_by_type", length = 20)
    private String createdByType;

    @Column(name = "updated_by")
    private Integer updatedBy;

    @Version
    @Column(name = "version", nullable = false)
    // Must stay null (not 0L) for new entities: Spring Data JPA's isNew() check for
    // @Version fields is "version == null" — a non-null default makes it call merge()
    // instead of persist() for brand-new rows, silently discarding the generated id on
    // the caller's entity reference (merge() returns a different managed instance).
    private Long version;
}
