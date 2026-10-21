package com._42students.lms.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Names and structure for the ids that appear on log lines, resolved on demand for an authorized
 * admin. Logs themselves only ever carry ids; this is where an id becomes something a person can read.
 */
@Data
@Builder
public class LogContextResponse {
    private List<UserContext> users;
    private List<CollegeContext> colleges;

    @Data
    @Builder
    public static class UserContext {
        private Integer id;
        /** LEARNER or FACULTY, as sent in the request. */
        private String userType;
        private String displayName;
        private String uniqueId;
        private String rollNumber;
        private String facultyType;
        private Integer collegeId;
        private Integer organizationId;
        private Integer classId;
        private String className;
        private Integer batchId;
        private Integer programId;
        private Integer deptId;
    }

    @Data
    @Builder
    public static class CollegeContext {
        private Integer id;
        private String name;
        private String uniqueId;
        private Integer organizationId;
    }
}
