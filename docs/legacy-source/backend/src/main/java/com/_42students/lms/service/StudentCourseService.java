package com._42students.lms.service;

import com._42students.lms.dto.response.SemesterSummaryDTO;
import com._42students.lms.dto.response.StudentCoursesResponseDTO;

import java.util.List;

public interface StudentCourseService {

    /**
     * Get courses for a student, optionally for a specific semester (identified by semesterId).
     * When semesterId is null, or does not belong to the student's own program, falls back to
     * their batch's current semester.
     */
    StudentCoursesResponseDTO getStudentCourses(Integer studentId, Integer semesterId);

    /**
     * Get courses for a class based on their batch's current semester.
     */
    StudentCoursesResponseDTO getCoursesByClass(Integer classId);

    /**
     * List the semesters belonging to the student's own program (for the semester picker).
     * Resolves the student's program server-side via Learner -> Class -> Batch -> Program, so a
     * learner can only ever see their own program's semesters.
     */
    List<SemesterSummaryDTO> getStudentSemesters(Integer studentId);
}

