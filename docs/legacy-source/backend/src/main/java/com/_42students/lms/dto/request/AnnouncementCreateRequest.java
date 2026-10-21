package com._42students.lms.dto.request;

import com._42students.lms.enums.AnnouncementType;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

@Data
public class AnnouncementCreateRequest {
    @NotNull(message = "Receiver type is required")
    private AnnouncementType receiverType;

    @NotNull(message = "Receiver value is required")
    private Long receiverValue;

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @NotBlank(message = "Message is required")
    @Size(max = 10000, message = "Message must not exceed 10000 characters")
    private String message;

    private Long senderId;
    private String senderType;

    /**
     * Part B: schedule / expiry / pin, none of which existed. All optional -- omitting them keeps
     * the old behaviour exactly (visible immediately, never expires, unpinned).
     */
    private java.time.LocalDateTime scheduledAt;
    private java.time.LocalDateTime expiresAt;
    private Boolean isPinned;
}
 
