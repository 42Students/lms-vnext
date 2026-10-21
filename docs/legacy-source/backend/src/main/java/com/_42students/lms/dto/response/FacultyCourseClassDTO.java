package com._42students.lms.dto.response;

import com._42students.lms.model.Course;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class FacultyCourseClassDTO {
    private int facultyId;
    private String facultyName;
    private int courseId;
    private String courseSlug;
    private int classId;
    private String className;
    private Course course;

   // Constructors
   public FacultyCourseClassDTO() {
}

public FacultyCourseClassDTO(int facultyId, String facultyName, int courseId, int classId, String className, Course course) {
    this.facultyId = facultyId;
    this.facultyName = facultyName;
    this.courseId = courseId;
    this.classId = classId;
    this.className = className;
    this.course = course;
}

// Getters and setters
public int getFacultyId() {
    return facultyId;
}

public void setFacultyId(int facultyId) {
    this.facultyId = facultyId;
}

public String getFacultyName() {
    return facultyName;
}

public void setFacultyName(String facultyName) {
    this.facultyName = facultyName;
}

public int getCourseId() {
    return courseId;
}

public void setCourseId(int courseId) {
    this.courseId = courseId;
}

public int getClassId() {
    return classId;
}

public void setClassId(int classId) {
    this.classId = classId;
}

public String getClassName() {
    return className;
}

public void setClassName(String className) {
    this.className = className;
}

public Course getCourse() {
    return course;
}

public void setCourse(Course course) {
    this.course = course;
}

    
}



