package com._42students.lms.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

import java.util.List;

/** Learner curriculum course cards. Slug is preferred; ID supports legacy slugless courses. */
@Data
@JsonNaming(PropertyNamingStrategy.SnakeCaseStrategy.class)
public class StudentCoursesResponseDTO {
    private Integer studentId;
    private String studentName;
    private Integer classId;
    private String className;
    private Integer batchId;
    private String batchName;
    private Integer programId;
    private String programName;
    private Integer semesterId;
    private Integer currentSemester;
    private String semesterName;
    private String academicYear;
    private List<CourseWithFacultyDTO> courses;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Integer requestedSemesterId;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Boolean semesterFallbackApplied;
    /** READY means a valid academic context, including a genuinely empty course mapping. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String configurationStatus;

    /** Remove detail HTML and personal faculty email from /byStudent without changing /byClass. */
    public StudentCoursesResponseDTO redactForLearnerListing() {
        if (courses != null) {
            for (CourseWithFacultyDTO course : courses) {
                if (course == null) continue;
                course.setHtmlContent(null);
                course.setIntroductionContent(null);
                if (course.getFaculty() != null) course.getFaculty().setEmail(null);
                if (course.getInstructors() != null) {
                    for (FacultyInfoDTO instructor : course.getInstructors()) {
                        if (instructor != null) instructor.setEmail(null);
                    }
                }
            }
        }
        return this;
    }

    @Data
    @JsonNaming(PropertyNamingStrategy.SnakeCaseStrategy.class)
    public static class CourseWithFacultyDTO {
        private Integer id;
        private String slug;
        private String courseName;
        private String courseCode;
        private Integer credits;
        private Boolean isMandatory;
        /** The class this card is taught in: the learner's section, or an elective's group-backed class. */
        private Integer classId;
        private Boolean isElective = false;
        @JsonInclude(JsonInclude.Include.NON_NULL)
        private String electiveSlotName;
        @JsonInclude(JsonInclude.Include.NON_NULL)
        private Long electiveOfferingId;
        private String imageUrl;
        @JsonInclude(JsonInclude.Include.NON_NULL)
        private String htmlContent;
        @JsonInclude(JsonInclude.Include.NON_NULL)
        private String introductionContent;
        private FacultyInfoDTO faculty;
        @JsonInclude(JsonInclude.Include.NON_EMPTY)
        private List<FacultyInfoDTO> instructors;
    }

    @Data
    @JsonNaming(PropertyNamingStrategy.SnakeCaseStrategy.class)
    public static class FacultyInfoDTO {
        private Integer id;
        private String name;
        @JsonInclude(JsonInclude.Include.NON_NULL)
        private String email;
        private String role;
    }
}
