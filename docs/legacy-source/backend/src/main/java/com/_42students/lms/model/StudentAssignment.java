package com._42students.lms.model;

import com._42students.lms.dto.request.AssignmentSubmissionAssetDTO;
import com._42students.lms.dto.request.FileDTO;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.hibernate.annotations.Type;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity(name = "student_assignment")
@Table(name = "student_assignment")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class StudentAssignment extends BaseModel {
    @Column(name = "assignment_name")
    private String assignmentName;
    @Column(name = "lesson_content_id")
    private int lessonContentId;
    @Column(name = "student_id")
    private int studentId;
    @Column(name = "student_first_name")
    private String studentFirstName;
    @Column(name = "student_last_name")
    private String studentLastName;
    @Column(name = "faculty_id")
    private Integer facultyId;
    @Column(name = "assignment_contents", columnDefinition = "json")
    @Type(type = "json")
    private FileDTO fileDTO;
    @Column(name = "grading_date")
    private String gradingDate;
    @Column(name = "html_content")
    private String htmlContent;
    @Column(name = "submission_type")
    private String submissionType;
    @Column(name = "submission_link")
    private String submissionLink;
    @Column(name = "submission_assets", columnDefinition = "json")
    @Type(type = "json")
    private List<AssignmentSubmissionAssetDTO> submissionAssets;
    @Column(name = "points")
    private long points;
    @Column(name = "points_obtained")
    private long pointsObtained;
    @Column(name = "graded")
    private int graded; // 0 represents not graded, 1 represents graded

    // --- Grading/regrade hardening fields (shared by assignment and, formerly, legacy quiz submissions) ---

    /** Optimistic locking version for concurrent grading protection */
    @Version
    @Column(name = "version")
    private int version;

    /** Explicit grading status: NOT_GRADED, AUTO_GRADED, MANUALLY_GRADED, PARTIALLY_GRADED */
    @Column(name = "grading_status")
    private String gradingStatus = "NOT_GRADED";

    /** Faculty ID who last graded this submission */
    @Column(name = "graded_by")
    private Integer gradedBy;

    /** Timestamp of last grading action */
    @Column(name = "graded_at")
    private LocalDateTime gradedAt;

    /** Points before last grade change (audit trail) */
    @Column(name = "previous_points")
    private long previousPoints;

    /** Attempt number (for re-attempt support) */
    @Column(name = "attempt_number")
    private int attemptNumber = 1;

    /** AQ-05: Grade is only visible to learners after faculty explicitly publishes it */
    @Column(name = "is_grade_published")
    private boolean isGradePublished = false;

    /** AQ-11: Semester number at time of submission — scopes attempt counter so it resets each semester */
    @Column(name = "semester_number")
    private Integer semesterNumber;

}

