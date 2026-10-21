package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.sql.Timestamp;

@Data
@Entity(name = "class_schedule")
@Table(name = "class_schedule")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class ClassSchedule extends BaseModel {
    @Column(name = "class_id")
    private int classId;
    @Column(name = "course_id")
    private int courseId;
    @Transient
    private String courseSlug; // Populated for API response; not persisted
    @Column(name = "faculty_id")
    private int facultyId;
    @Column(name = "start_time")
    private String startTime;
    @Column(name = "end_time")
    private String endTime;
    @Column(name = "lecture_hall_id") 
    private int lectureHallId;
    @Column(name = "title")
    private String title;
    // Null until a faculty submits a bulk attendance mark for this session -- distinguishes
    // "nobody has taken attendance yet" from "attendance was taken and nobody was absent".
    @Column(name = "attendance_marked_at")
    private Timestamp attendanceMarkedAt;

}

