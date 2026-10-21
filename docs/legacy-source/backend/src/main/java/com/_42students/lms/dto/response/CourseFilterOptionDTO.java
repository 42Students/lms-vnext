package com._42students.lms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight {slug, courseName} pair for course-filter dropdowns (All Quizzes / All
 * Assignments). Slug, not the internal numeric id — matches ActiveCourseResponseDTO's existing
 * convention of not exposing raw courseId in learner/faculty-facing course pickers.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseFilterOptionDTO {
    private String slug;
    private String courseName;
}
