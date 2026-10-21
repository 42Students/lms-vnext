package com._42students.lms.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class DashboardResponseDTO {
    private String className;
    private int facultyId;
    private int totalCount;
    private int totalPresent;
    private int absentCount;
    /** False until a faculty submits a bulk attendance mark for this session (see class_schedule.attendance_marked_at). */
    private boolean attendanceMarked;
    private List totalLearners;
    private List studentsAbsent;
}

