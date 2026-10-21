package com._42students.lms.dto.response;

import lombok.Data;

/**
 * DTO for Discussion response including profile picture URL
 */
@Data
public class DiscussionResponseDTO {
    private Integer id;
    private Integer lessonContentId;
    private String contentText;
    private Integer sequence;
    private Integer userId;
    private String userName;
    private String profileName;
    private String profileImageUrl; // Profile picture URL from Learner or Faculty website field
    /** Class name for learners (e.g. "CSE - A"); null for faculty. */
    private String className;
    /** Roll number for learners; null for faculty. */
    private String rollNumber;
    /** When the post was created (ISO-8601). */
    private String createdAt;
}


