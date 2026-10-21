package com._42students.lms.service;

import com._42students.lms.dto.request.SemesterCourseDTO;
import com._42students.lms.model.SemesterCourse;

import java.util.List;

public interface SemesterCourseService {
    
    SemesterCourse addCourseToSemester(SemesterCourseDTO dto);
    
    List<SemesterCourse> addCoursesToSemester(Integer semesterId, List<Integer> courseIds);
    
    void removeCourseFromSemester(Integer semesterId, Integer courseId);
    
    void removeAllCoursesFromSemester(Integer semesterId);
    
    List<SemesterCourse> getCoursesBySemester(Integer semesterId);
    
    SemesterCourse updateSemesterCourse(Integer id, SemesterCourseDTO dto);
}

