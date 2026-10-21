package com._42students.lms.model;

import lombok.Data;

import javax.persistence.*;

@Data
@Entity
@Table(name = "faculty_course_associations")
public class FacultyCourseAssociation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "faculty_id")
    private int facultyId;

    @Column(name = "course_id")
    private int courseId;

    @Column(name = "active", columnDefinition = "int default 1")
    private int active;  // New column "active"

    // Constructors, getters, setters
}
 
