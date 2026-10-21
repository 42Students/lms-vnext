package com._42students.lms.dto.request;

import lombok.Data;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

/**
 * Create-only shape for a classroom chat message. Deliberately excludes id/senderId/senderName/
 * senderRole/pinned/isDeleted — those are always server-derived, never client-writable.
 *
 * Field names are camelCase (not snake_case like most other request DTOs) to match the existing
 * ClassroomMessage entity's wire shape, which the frontend already sends against unchanged.
 */
@Data
public class ClassroomMessageCreateDTO {
    @NotNull(message = "courseId is required")
    @Min(1)
    private Integer courseId;

    @NotNull(message = "classId is required")
    @Min(1)
    private Integer classId;

    @NotBlank(message = "messageText is required")
    @Size(max = 4000, message = "messageText must not exceed 4000 characters")
    private String messageText;
}
