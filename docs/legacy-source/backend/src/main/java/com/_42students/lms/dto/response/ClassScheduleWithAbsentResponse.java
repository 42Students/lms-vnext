package com._42students.lms.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class ClassScheduleWithAbsentResponse {
    private String className;
    private int facultyId;
    private int courseId;
    private String courseSlug;
    private String startTime;
    private String endTime;
    private int learnerCount;
    private int classScheduleId;
    private int classId;
    private int lectureHallId;
    private List<Integer> absentClassScheduleIds; // New field for absent class schedule IDs
}

