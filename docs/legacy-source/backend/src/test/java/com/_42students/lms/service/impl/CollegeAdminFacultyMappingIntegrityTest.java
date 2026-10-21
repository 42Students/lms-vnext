package com._42students.lms.service.impl;

import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.model.FacultyCourseMapping;
import com._42students.lms.repository.FacultyCourseMappingRepository;
import com._42students.lms.repository.SemesterCourseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class CollegeAdminFacultyMappingIntegrityTest {
    private FacultyServiceImpl service;
    private FacultyCourseMappingRepository repository;
    private ScopeResolutionService scopes;
    private SemesterCourseRepository curriculum;

    @BeforeEach
    void setup() {
        service = new FacultyServiceImpl();
        repository = mock(FacultyCourseMappingRepository.class);
        scopes = mock(ScopeResolutionService.class);
        curriculum = mock(SemesterCourseRepository.class);
        ReflectionTestUtils.setField(service, "facultyCourseMappingRepository", repository);
        ReflectionTestUtils.setField(service, "scopeResolutionService", scopes);
        ReflectionTestUtils.setField(service, "semesterCourseRepository", curriculum);
        when(scopes.resolveFacultyToCollegeId(11)).thenReturn(9);
        when(scopes.resolveCourseToCollegeId(12)).thenReturn(9);
        when(scopes.resolveClassToCollegeId(13)).thenReturn(9);
        when(scopes.resolveClassToProgramId(13)).thenReturn(14);
        when(curriculum.existsByProgramIdAndCourseId(14, 12)).thenReturn(true);
    }

    @Test
    void singleCreateWritesOneMapping() {
        when(repository.findByFacultyIdAndCourseIdAndClassId(11, 12, 13)).thenReturn(List.of());
        service.createFacultyCourses(11, 12, 13);
        verify(repository).save(argThat(m -> m.getFacultyId() == 11 && m.getCourseId() == 12
                && m.getClassId() == 13 && m.getActive() == 1));
    }

    @Test
    void bulkCreateRejectsDuplicateActiveMapping() {
        FacultyCourseMapping active = new FacultyCourseMapping();
        active.setActive(1);
        when(repository.findByFacultyIdAndCourseIdAndClassId(11, 12, 13)).thenReturn(List.of(active));
        assertThrows(IllegalArgumentException.class, () -> service.createFacultyCoursesBulk(11, 12, 13));
        verify(repository, never()).save(any());
    }

    @Test
    void archivedMappingIsReactivatedInsteadOfDuplicated() {
        FacultyCourseMapping archived = new FacultyCourseMapping();
        archived.setActive(0);
        when(repository.findByFacultyIdAndCourseIdAndClassId(11, 12, 13)).thenReturn(List.of(archived));
        service.createFacultyCourses(11, 12, 13);
        assertEquals(1, archived.getActive());
        verify(repository).save(same(archived));
    }

    @Test
    void unrelatedCourseCannotBeAssignedToClass() {
        when(curriculum.existsByProgramIdAndCourseId(14, 12)).thenReturn(false);
        assertThrows(IllegalArgumentException.class, () -> service.createFacultyCourses(11, 12, 13));
        verifyNoInteractions(repository);
    }

    @Test
    void classWithMultipleInstructorsFailsInsteadOfSelectingFirst() {
        doCallRealMethod().when(repository).getFacultyId(13);
        when(repository.getFacultyIdsForClass(13)).thenReturn(List.of(11, 22));
        assertThrows(ResponseStatusException.class, () -> repository.getFacultyId(13));
    }
}
