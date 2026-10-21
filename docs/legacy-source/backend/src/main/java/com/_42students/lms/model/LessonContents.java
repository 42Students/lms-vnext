package com._42students.lms.model;

import com._42students.lms.config.IndiaLocalDateTimeSerializer;
import com._42students.lms.dto.request.ContentDataDTO;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import lombok.Data;
import org.hibernate.annotations.Type;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityListeners;
import javax.persistence.Table;
import javax.persistence.Transient;

@Data
@Entity(name = "lesson_contents")
@Table(name = "lesson_contents")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class LessonContents extends BaseModel {
    @Column(name = "lesson_id")
    private int lessonId;
    @Column(name = "course_id")
    private Integer courseId;
    @Column(name = "course_name")
    private String courseName;
    @Column(name = "class_id")
    private Integer classId;
    @Column(name = "faculty_id")
    private Integer facultyId;
    @Column(name = "sequence")
    private long sequence;
    @Column(name = "content_type")
    private String contentType; // assignment/video/youtube/lecture/ppt/pdf/BYO content
    @Column(name = "content_title")
    private String contentTitle;
    @Column(name = "content_data", columnDefinition = "json")
    @Type(type = "json")
    private ContentDataDTO contentDataDTO;
    @Column(name = "active")
    private boolean active;
    @Column(name = "enabled")
    private boolean enabled;
    @Column(name = "points")
    private long points;
    /**
     * Distinguishes a content row archived by deleting its parent lesson from a content row
     * explicitly removed on its own. Only the former is automatically restored with the lesson.
     */
    @Column(name = "deleted_with_lesson", nullable = false)
    private Boolean deletedWithLesson = false;

    /** Deadline for assignment submissions, stored as India wall-clock time (null = no deadline). */
    @JsonSerialize(using = IndiaLocalDateTimeSerializer.class)
    @Column(name = "deadline")
    private java.time.LocalDateTime deadline;

    /**
     * Optimistic lock. Completes the set started in V120 (Course, Lesson): lesson_contents is the
     * row an admin and a faculty member are most likely to edit at the same time — the admin from
     * the console's class-wise syllabus screen, the teacher from the course tab — and without a
     * version column the later write silently discarded the earlier one. Must stay null for new
     * entities (Spring Data's isNew() keys off a null version; a non-null default makes it call
     * merge() instead of persist()).
     */
    @javax.persistence.Version
    @Column(name = "version", nullable = false)
    private Long version;

    @Transient
    private String courseSlug; // Populated for API response; not persisted
    @Transient
    private String lessonName; // Populated for API response; not persisted
}

