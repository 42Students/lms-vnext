package com._42students.lms.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

/**
 * Request body for POST /api/v1/upload/presign.
 * Used to obtain a presigned PUT URL for direct upload to R2.
 */
@Data
public class PresignUploadRequestDTO {

    @NotBlank(message = "fileName is required")
    @JsonProperty("fileName")
    private String fileName;

    @NotBlank(message = "contentType is required")
    @JsonProperty("contentType")
    private String contentType;

    @NotNull(message = "contentLength is required")
    @JsonProperty("contentLength")
    private Long contentLength;

    @JsonProperty("folder")
    private String folder;

    /**
     * Optional: video | lecture | ppt | pdf | image | assignment | generic
     */
    @JsonProperty("type")
    private String type;

    /**
     * Optional. When folder is profile-images or video-intros, if present the authenticated user's id must equal this value (binds upload to profile owner).
     */
    @JsonProperty("userId")
    private Integer userId;

    /**
     * Optional: bind lesson-content/video-intros uploads to a course scope.
     */
    @JsonProperty("courseId")
    private Integer courseId;

    /**
     * Optional: bind lesson-content/video-intros uploads to a class scope.
     */
    @JsonProperty("classId")
    private Integer classId;

    /**
     * Optional: bind assignment-submission uploads to the lesson content they will be submitted to.
     */
    @JsonProperty("lessonContentId")
    private Integer lessonContentId;

    /**
     * Optional: bind an "assignments"-folder upload (used by the Projects Resources tab) to a
     * specific project — when present, the caller must be an active member of that project. The
     * same folder is also used by unrelated course-assignment-submission uploads, which don't
     * have a projectId to supply, so this check is opt-in (only enforced when the field is sent)
     * rather than required for every "assignments" upload.
     */
    @JsonProperty("projectId")
    private String projectId;

    /**
     * Required when folder is "college-branding": the target college being branded. Unlike every
     * other folder, this scope comes from an explicit id rather than the caller's own tenant scope
     * — a superadmin editing branding has no collegeId of their own (they're typically global), so
     * the upload's storage path is derived from this field instead of resolveTenantPrefix().
     */
    @JsonProperty("collegeId")
    private Integer collegeId;
}

