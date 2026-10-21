package com._42students.lms.service;

import com._42students.lms.dto.response.StudentCoursesResponseDTO;
import com._42students.lms.model.Learner;
import com._42students.lms.repository.*;
import com._42students.lms.service.impl.StudentCourseServiceImpl;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class StudentCourseConfigurationStatusTest {
    @Test
    void missingClassIsConfigurationErrorRatherThanGenuineEmptyCurriculum() {
        LearnerRepository learners = mock(LearnerRepository.class);
        Learner learner = new Learner();
        when(learners.findById(42)).thenReturn(Optional.of(learner));
        StudentCourseServiceImpl service = new StudentCourseServiceImpl(learners,
            mock(_ClassRepository.class), mock(BatchRepository.class), mock(NewProgramRepository.class),
            mock(SemesterRepository.class), mock(SemesterCourseRepository.class),
            mock(CourseRepository.class), mock(FacultyTeachingAssignmentRepository.class),
            mock(FacultyRepository.class));
        StudentCoursesResponseDTO response = service.getStudentCourses(42, null);
        assertEquals("NO_CLASS", response.getConfigurationStatus());
        assertTrue(response.getCourses().isEmpty());
    }
}
