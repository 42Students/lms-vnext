package com._42students.lms.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import javax.validation.constraints.*;

/**
 * Recipient info for NotificationDispatcherService.
 * Used to send In-App (classId, courseId), Email (email), and SMS (phone, recipientName).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRecipientDTO {
    @Email @Size(max = 255)
    private String email;
    @Size(max = 255)
    private String phone;
    /** Display name for SMS and email (e.g. learner first + last name). */
    @Size(max = 255)
    private String recipientName;
    /** Optional: learnerId for per-learner feature-flag gating of notifications. */
    @Min(1)
    private Integer learnerId;
    @Min(1)
    private Integer classId;
    @Min(1)
    private Integer courseId;
}

