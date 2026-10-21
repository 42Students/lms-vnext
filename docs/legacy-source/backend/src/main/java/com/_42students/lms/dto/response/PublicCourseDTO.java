package com._42students.lms.dto.response;

import com._42students.lms.dto.request.MetaData;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Public course DTO for course-by-slug and similar endpoints.
 * Includes id so the frontend can set course context (e.g. teacher course tabs) and call APIs that accept courseId.
 * Includes meta_data (course.contents) so the "In this Course" section on the course Home tab can display
 * introduction_content and html_content.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class PublicCourseDTO {
    private Integer id;
    private String slug;
    private String courseName;
    private String shortTitle;
    private Boolean active;
    private Integer deptId;
    private Integer allowedForDisplay;
    /** Course contents (e.g. introduction_content, html_content) for "In this Course" on course Home. */
    private MetaData metaData;
}

