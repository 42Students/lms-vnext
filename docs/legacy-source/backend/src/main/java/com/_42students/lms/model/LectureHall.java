package com._42students.lms.model;

import com._42students.lms.enums.RoomType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;

@Data
@Entity(name = "lecture_hall")
@Table(name = "lecture_hall")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class LectureHall extends BaseModel {
    @Column(name = "college_id")
    private int collegeId;
    @Column(name = "dept_id")
    private int deptId;
    @Column(name = "name")
    private String name;
    @Column(name = "capacity")
    private int capacity;
    @Column(name = "description")
    private String description;
    @Column(name = "room_type")
    private RoomType roomType;
}

