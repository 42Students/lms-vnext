package com._42students.lms.dto.electives;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** Read models for the electives admin API. */
public final class ElectiveViews {

    private ElectiveViews() {
    }

    @Getter
    @Setter
    public static class SlotView {
        private Long id;
        private Integer collegeId;
        private Integer programId;
        private String programName;
        private Integer semesterNumber;
        private String academicYear;
        private String name;
        private String description;
        private Integer credits;
        private Integer minPick;
        private Integer maxPick;
        private String status;
        private LocalDateTime createdAt;
        private int offeringCount;
        /** Active seat enrolments across live offerings; one learner can contribute more than once when maxPick > 1. */
        private int allocatedCount;
        /** Unique learners currently ACTIVE or WAITLISTED in at least one live offering of this slot. */
        private int currentStudentCount;
        private boolean hasEnrollmentHistory;
        private List<OfferingView> offerings = new ArrayList<>();
    }

    @Getter
    @Setter
    public static class OfferingView {
        private Long id;
        private Long slotId;
        private Integer courseId;
        private String courseName;
        private String courseCode;
        private Long groupId;
        private Integer backedClassId;
        private String backedClassName;
        private Integer capacity;
        private Integer activeCount;
        private Integer waitlistedCount;
        private Integer seatsLeft;
        private String status;
        private List<FacultyView> faculty = new ArrayList<>();
    }

    @Getter
    @Setter
    public static class FacultyView {
        private Integer id;
        private String name;
        private String role;
    }

    @Getter
    @Setter
    public static class AllocationResult {
        private int requested;
        private int added;
        private int waitlisted;
        private int unchanged;
        private List<Entry> results = new ArrayList<>();
        private List<Entry> errors = new ArrayList<>();
        /** Timetable clashes between the offering and the learner's own section (warn only). */
        private List<Entry> warnings = new ArrayList<>();

        @Getter
        @Setter
        public static class Entry {
            private Integer learnerId;
            private String rollNumber;
            private String name;
            private String state;
            private String message;
        }
    }

    @Getter
    @Setter
    public static class UnallocatedRow {
        private Integer learnerId;
        private String name;
        private String rollNumber;
        private String department;
        private Integer classId;
        private String className;
        /** Number of ACTIVE/WAITLISTED offerings of this slot the learner already holds. */
        private int currentPickCount;
    }
}
