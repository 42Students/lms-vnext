package com._42students.lms.dto.electives;

import lombok.Data;

import java.util.List;

/** Request bodies for the electives admin API. */
public final class ElectiveRequests {

    private ElectiveRequests() {
    }

    @Data
    public static class SlotRequest {
        private Integer programId;
        private Integer semesterNumber;
        private String academicYear;
        private String name;
        private String description;
        private Integer credits;
        private Integer minPick;
        private Integer maxPick;
    }

    @Data
    public static class OfferingRequest {
        private Integer courseId;
        /** null = unlimited. */
        private Integer capacity;
    }

    @Data
    public static class FacultyRequest {
        /** First id becomes PRIMARY, the rest CO_TEACHER. Empty list clears the offering's faculty. */
        private List<Integer> facultyIds;
    }

    @Data
    public static class AllocateRequest {
        private List<Integer> learnerIds;
        private List<String> rollNumbers;
        /** Allocate every active learner of this section class. */
        private Integer fromClassId;
        private String note;
    }

    @Data
    public static class RemoveRequest {
        private String reason;
        private Boolean lock;
    }
}
