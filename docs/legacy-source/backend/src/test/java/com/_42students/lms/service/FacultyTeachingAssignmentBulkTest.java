package com._42students.lms.service;

import com._42students.lms.dto.request.FacultyTeachingAssignmentDTO;
import com._42students.lms.model.FacultyTeachingAssignment;
import com._42students.lms.repository.BatchRepository;
import com._42students.lms.repository.CourseRepository;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.repository._ClassRepository;
import com._42students.lms.service.impl.FacultyTeachingAssignmentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.sql.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class FacultyTeachingAssignmentBulkTest {
    private FacultyTeachingAssignmentRepository assignments;
    private FacultyTeachingAssignmentServiceImpl service;
    private FacultyTeachingAssignmentDTO request;

    @BeforeEach
    void setup() {
        assignments = mock(FacultyTeachingAssignmentRepository.class);
        service = new FacultyTeachingAssignmentServiceImpl(assignments, mock(FacultyRepository.class),
            mock(CourseRepository.class), mock(_ClassRepository.class), mock(BatchRepository.class));
        request = new FacultyTeachingAssignmentDTO();
        request.setFacultyId(7);
        request.setClassId(8);
        request.setBatchId(9);
        request.setSemesterNumber(2);
        request.setCourseIds(List.of(21, 22));
        request.setStartDate(Date.valueOf("2026-09-01"));
        request.setEndDate(Date.valueOf("2026-12-01"));
    }

    @Test
    void bulkPassesDatesToAllCourseRows() {
        when(assignments.save(any(FacultyTeachingAssignment.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        assertEquals(2, service.createBulkAssignments(request).size());
        org.mockito.ArgumentCaptor<FacultyTeachingAssignment> rows =
            org.mockito.ArgumentCaptor.forClass(FacultyTeachingAssignment.class);
        verify(assignments, times(2)).save(rows.capture());
        assertEquals(List.of(21, 22), rows.getAllValues().stream()
            .map(FacultyTeachingAssignment::getCourseId).toList());
        rows.getAllValues().forEach(row -> {
            assertEquals(request.getStartDate(), row.getStartDate());
            assertEquals(request.getEndDate(), row.getEndDate());
        });
    }

    @Test
    void bulkPropagatesWriteErrorsForTransactionalRollbackRatherThanReportingPartialSuccess() {
        when(assignments.save(any(FacultyTeachingAssignment.class)))
            .thenAnswer(invocation -> {
                FacultyTeachingAssignment assignment = invocation.getArgument(0);
                if (assignment.getCourseId() == 22) throw new IllegalStateException("write failed");
                return assignment;
            });
        assertThrows(IllegalStateException.class, () -> service.createBulkAssignments(request));
        verify(assignments, times(2)).save(any(FacultyTeachingAssignment.class));
    }
}
