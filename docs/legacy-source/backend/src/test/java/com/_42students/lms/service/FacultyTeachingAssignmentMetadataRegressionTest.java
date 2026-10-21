package com._42students.lms.service;

import com._42students.lms.dto.response.FacultyTeachingAssignmentResponseDTO;
import com._42students.lms.model.FacultyTeachingAssignment;
import com._42students.lms.repository.*;
import com._42students.lms.service.impl.FacultyTeachingAssignmentServiceImpl;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class FacultyTeachingAssignmentMetadataRegressionTest {
    @Test
    void metadataDatabaseFailureMustNotProduceApparentlyHealthyCourseList() {
        FacultyTeachingAssignmentRepository assignments = mock(FacultyTeachingAssignmentRepository.class);
        FacultyRepository faculties = mock(FacultyRepository.class);
        CourseRepository courses = mock(CourseRepository.class);
        _ClassRepository classes = mock(_ClassRepository.class);
        BatchRepository batches = mock(BatchRepository.class);
        FacultyTeachingAssignment row = new FacultyTeachingAssignment();
        row.setId(5);
        row.setFacultyId(9);
        row.setCourseId(10);
        row.setClassId(11);
        when(assignments.findByFacultyIdAndIsActive(9, true)).thenReturn(List.of(row));
        when(faculties.findAllById(any())).thenThrow(new IllegalStateException("DB offline"));
        FacultyTeachingAssignmentServiceImpl service =
            new FacultyTeachingAssignmentServiceImpl(assignments, faculties, courses, classes, batches);
        assertThrows(IllegalStateException.class, () -> service.getActiveAssignmentsByFaculty(9));
    }

    @Test
    void orphanCourseIsExplicitlyFlaggedRatherThanPretendingValid() {
        FacultyTeachingAssignmentRepository assignments = mock(FacultyTeachingAssignmentRepository.class);
        FacultyRepository faculties = mock(FacultyRepository.class);
        CourseRepository courses = mock(CourseRepository.class);
        _ClassRepository classes = mock(_ClassRepository.class);
        BatchRepository batches = mock(BatchRepository.class);
        FacultyTeachingAssignment row = new FacultyTeachingAssignment();
        row.setId(5);
        row.setFacultyId(9);
        row.setCourseId(10);
        row.setClassId(11);
        when(assignments.findByFacultyIdAndIsActive(9, true)).thenReturn(List.of(row));
        when(faculties.findAllById(any())).thenReturn(List.of());
        when(courses.findAllById(any())).thenReturn(List.of());
        when(classes.findAllById(any())).thenReturn(List.of());
        when(batches.findAllById(any())).thenReturn(List.of());
        FacultyTeachingAssignmentServiceImpl service =
            new FacultyTeachingAssignmentServiceImpl(assignments, faculties, courses, classes, batches);
        List<FacultyTeachingAssignmentResponseDTO> result = service.getActiveAssignmentsByFaculty(9);
        assertEquals(1, result.size());
        assertEquals(Boolean.TRUE, result.get(0).getMetadataIncomplete());
        assertNull(result.get(0).getCourseName());
    }
}
