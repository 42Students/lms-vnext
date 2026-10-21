package com._42students.lms.dto.response;
import lombok.Data;
@Data
public class SimplifiedClassScheduleResponse {
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
    private String courseName;
    private String title;
}

