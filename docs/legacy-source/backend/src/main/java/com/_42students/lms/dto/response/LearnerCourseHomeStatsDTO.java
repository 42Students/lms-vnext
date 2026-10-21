package com._42students.lms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Full response for learner course home dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearnerCourseHomeStatsDTO {
    private int version;
    private CourseInfoSection course;
    private LearnerCourseProgressDTO progress;
    private LearnerCourseGradesDTO grades;
    private AttendanceSection attendance;
    private LearnerCourseNextContentDTO nextContent;
    private List<ContentBreakdownItemDTO> contentBreakdown;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CourseInfoSection {
        private Integer id;
        private String slug;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceSection {
        private Double percent;
        private boolean available;
    }
}

