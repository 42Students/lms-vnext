package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class NotificationDTO {
    @NotBlank(message = "HTML content is required")
    @Size(max = 50000, message = "HTML content cannot exceed 50000 characters")
    private String htmlContent;
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title cannot exceed 200 characters")
    private String title;
    private int classId;
    private int courseId;
    private Integer learnerId;
    private String courseSlug;   // Optional: when set, resolved to courseId on server
    private boolean isRead;
    private boolean isDeleted;
    private String notificationType;
    private String contextLabel;
    /** Gap 8.7: Deep link to application */
    private Integer applicationId;
    private Integer jobId;
    /** 21.1.5: Assessment URL for Take Assessment CTA */
    private String assessmentUrl;
    /** Gap #12: Deep link to interview */
    private Integer interviewId;

    /** IDOR fix: set server-side from authenticated principal; client-supplied value is ignored */
    private Integer creatorFacultyId;

    /**
     * M2: optional "send later" timestamp, yyyy-MM-dd HH:mm:ss. Null keeps the pre-existing
     * behaviour exactly -- the notification is delivered the moment it is created.
     */
    private String scheduledAt;
}

