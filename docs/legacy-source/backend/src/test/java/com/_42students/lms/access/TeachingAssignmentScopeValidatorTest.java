package com._42students.lms.access;

import com._42students.lms.dto.request.FacultyTeachingAssignmentDTO;
import com._42students.lms.dto.response.FacultyTeachingAssignmentResponseDTO;
import com._42students.lms.model.Batch;
import com._42students.lms.model.FacultyTeachingAssignment;
import com._42students.lms.model.Semester;
import com._42students.lms.model._Class;
import com._42students.lms.repository.BatchRepository;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.repository.SemesterRepository;
import com._42students.lms.repository._ClassRepository;
import com._42students.lms.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.sql.Date;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TeachingAssignmentScopeValidatorTest {
    private ScopeResolutionService scopes;
    private AccessControlService access;
    private _ClassRepository classes;
    private BatchRepository batches;
    private SemesterRepository semesters;
    private FacultyTeachingAssignmentRepository assignments;
    private TeachingAssignmentScopeValidator validator;
    private UserPrincipal admin;
    private FacultyTeachingAssignmentDTO request;

    @BeforeEach
    void setup() {
        scopes = mock(ScopeResolutionService.class);
        access = mock(AccessControlService.class);
        classes = mock(_ClassRepository.class);
        batches = mock(BatchRepository.class);
        semesters = mock(SemesterRepository.class);
        assignments = mock(FacultyTeachingAssignmentRepository.class);
        validator = new TeachingAssignmentScopeValidator(scopes, access, classes);
        ReflectionTestUtils.setField(validator, "batchRepository", batches);
        ReflectionTestUtils.setField(validator, "semesterRepository", semesters);
        ReflectionTestUtils.setField(validator, "assignmentRepository", assignments);
        admin = mock(UserPrincipal.class);
        request = new FacultyTeachingAssignmentDTO();
        request.setFacultyId(12);
        request.setCourseId(13);
        request.setClassId(14);
        request.setBatchId(15);
        request.setSemesterNumber(2);
        when(scopes.resolveFacultyToCollegeId(12)).thenReturn(1);
        when(scopes.resolveClassToCollegeId(14)).thenReturn(1);
        when(scopes.resolveCourseToCollegeId(13)).thenReturn(1);
        when(scopes.resolveBatchToCollegeId(15L)).thenReturn(1);
        when(scopes.resolveProgramToCollegeId(21)).thenReturn(1);
        _Class clazz = new _Class();
        clazz.setProgramId(21);
        clazz.setBatchId(15);
        when(classes.findByIdAndNotDeleted(14)).thenReturn(Optional.of(clazz));
        Batch batch = new Batch();
        batch.setId(15L);
        batch.setProgramId(21L);
        when(batches.findById(15L)).thenReturn(Optional.of(batch));
        Semester semester = new Semester(21, 2, "Semester 2");
        semester.setId(23);
        when(semesters.findFirstByProgramIdAndSemesterNumber(21, 2)).thenReturn(Optional.of(semester));
    }

    @Test
    void sameCollegeConsistentAssignmentIsAllowed() {
        assertDoesNotThrow(() -> validator.validate(admin, request, null, false));
        verify(access).requireAccessCollege(admin, 1);
        verify(access).requireAccessClass(admin, 14);
        verify(access).requireAccessBatch(admin, 15L);
    }

    @Test
    void crossCollegeFacultyIsRejected() {
        when(scopes.resolveFacultyToCollegeId(12)).thenReturn(2);
        assertThrows(IllegalArgumentException.class, () -> validator.validate(admin, request, null, false));
        verify(access, never()).requireAccessCollege(any(), any());
    }

    @Test
    void crossCollegeCourseIsRejected() {
        when(scopes.resolveCourseToCollegeId(13)).thenReturn(2);
        assertThrows(IllegalArgumentException.class, () -> validator.validate(admin, request, null, false));
    }

    @Test
    void classAndBatchMismatchIsRejected() {
        request.setBatchId(17);
        assertThrows(IllegalArgumentException.class, () -> validator.validate(admin, request, null, false));
    }

    @Test
    void sameCollegeButDifferentClassAndBatchProgramsAreRejected() {
        batches.findById(15L).ifPresent(batch -> batch.setProgramId(22L));
        assertThrows(IllegalArgumentException.class, () -> validator.validate(admin, request, null, false));
    }

    @Test
    void missingSemesterInActualClassProgramIsRejected() {
        when(semesters.findFirstByProgramIdAndSemesterNumber(21, 2)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> validator.validate(admin, request, null, false));
    }

    @Test
    void updateMustValidateDestinationRatherThanOnlyPreviousClass() {
        FacultyTeachingAssignmentResponseDTO previous = new FacultyTeachingAssignmentResponseDTO();
        previous.setFacultyId(12);
        previous.setCourseId(13);
        previous.setClassId(14);
        previous.setBatchId(15);
        previous.setSemesterNumber(2);
        request.setClassId(25);
        when(scopes.resolveClassToCollegeId(25)).thenReturn(3);
        assertThrows(IllegalArgumentException.class,
                () -> validator.validate(admin, request, previous, false));
    }

    @Test
    void updateCannotSetEndEarlierThanExistingStart() {
        FacultyTeachingAssignmentResponseDTO previous = new FacultyTeachingAssignmentResponseDTO();
        previous.setId(81);
        previous.setFacultyId(12);
        previous.setCourseId(13);
        previous.setClassId(14);
        previous.setBatchId(15);
        previous.setSemesterNumber(2);
        FacultyTeachingAssignment persisted = new FacultyTeachingAssignment();
        persisted.setStartDate(Date.valueOf("2026-10-10"));
        when(assignments.findById(81)).thenReturn(Optional.of(persisted));
        request.setStartDate(null);
        request.setEndDate(Date.valueOf("2026-10-09"));
        assertThrows(IllegalArgumentException.class,
                () -> validator.validate(admin, request, previous, false));
    }

    @Test
    void bulkRejectsOneForeignCourseBeforeWritingAnyAssignments() {
        request.setCourseIds(List.of(13, 99));
        when(scopes.resolveCourseToCollegeId(99)).thenReturn(2);
        assertThrows(IllegalArgumentException.class, () -> validator.validate(admin, request, null, true));
    }

    @Test
    void bulkAcceptsCourseIdsWithoutRedundantSingleCourseId() {
        request.setCourseId(null);
        request.setCourseIds(List.of(13));
        assertDoesNotThrow(() -> validator.validate(admin, request, null, true));
        verify(scopes).resolveCourseToCollegeId(13);
    }

    @Test
    void bulkRejectsDuplicateCourseIds() {
        request.setCourseId(null);
        request.setCourseIds(List.of(13, 13));
        assertThrows(IllegalArgumentException.class, () -> validator.validate(admin, request, null, true));
    }

    @Test
    void invalidSemesterAndDateRangeAreRejected() {
        request.setSemesterNumber(0);
        assertThrows(IllegalArgumentException.class, () -> validator.validate(admin, request, null, false));
        request.setSemesterNumber(2);
        request.setStartDate(Date.valueOf("2026-10-02"));
        request.setEndDate(Date.valueOf("2026-10-01"));
        assertThrows(IllegalArgumentException.class, () -> validator.validate(admin, request, null, false));
    }
}
