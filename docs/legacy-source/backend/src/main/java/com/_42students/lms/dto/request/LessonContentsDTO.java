package com._42students.lms.dto.request;

import com._42students.lms.enums.ContentType;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import javax.validation.constraints.*;

@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class LessonContentsDTO {
    @Min(1)
    private Integer lessonContentId;
    @Min(1)
    private Integer lessonId;
    @Min(1)
    private Integer courseId;
    @Size(max = 255)
    private String courseSlug;   // Optional: when set, resolved to courseId on server
    @Min(1)
    private Integer facultyId;
    private Integer classId;
    private long sequence;
    @NotNull
    private ContentType contentType; // assignment/video/youtube/lecture/ppt/pdf/BYO content
    @NotBlank @Size(max = 255)
    private String contentTitle;
    private ContentDataDTO contentDataDTO;
    private Boolean active;
    private Boolean enabled;
    @Min(0)
    private long points;

    // Part B "Assignments: create or delete an assignment" -- the model already had a `deadline`
    // column (LessonContents.deadline) but nothing in the create/update path could set it, so an
    // admin-created assignment could never have a due date.
    private java.time.LocalDateTime deadline;

    /**
     * Explicitly removes the deadline.
     *
     * <p>A null {@code deadline} is ignored rather than treated as "clear it", because most
     * callers of this DTO simply do not set the field and clearing on their behalf would silently
     * remove a cutoff they never mentioned. Jackson cannot distinguish "absent" from "sent as
     * null", so removal needs to be said out loud rather than inferred.
     */
    private Boolean clearDeadline;
}

