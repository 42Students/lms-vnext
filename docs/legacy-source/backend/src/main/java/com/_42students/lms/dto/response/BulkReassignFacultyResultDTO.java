package com._42students.lms.dto.response;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * W1 in the super-admin audit: "A faculty member leaves mid-semester -- their timetable can
 * never be reassigned." Class schedule update/delete endpoints already existed with no UI; this
 * is the report for the bulk "move everything from Faculty A to Faculty B" action built on top
 * of them.
 */
@Data
public class BulkReassignFacultyResultDTO {
    private int scanned;
    private int reassigned;
    private List<FailedItem> failed = new ArrayList<>();

    @Data
    public static class FailedItem {
        private final int classScheduleId;
        private final String reason;
    }
}
