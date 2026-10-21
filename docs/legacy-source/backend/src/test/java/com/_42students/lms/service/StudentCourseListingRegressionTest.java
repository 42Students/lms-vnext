package com._42students.lms.service;

import com._42students.lms.dto.response.StudentCoursesResponseDTO;
import com._42students.lms.model.*;
import com._42students.lms.repository.*;
import com._42students.lms.service.impl.StudentCourseServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class StudentCourseListingRegressionTest {
    private LearnerRepository learners;
    private _ClassRepository classes;
    private BatchRepository batches;
    private NewProgramRepository programs;
    private SemesterRepository semesters;
    private SemesterCourseRepository mappings;
    private CourseRepository courses;
    private FacultyTeachingAssignmentRepository assignments;
    private FacultyRepository faculties;
    private StudentCourseServiceImpl service;
    private Course live;
    private SemesterCourse mapping;
    private NewProgram program;

    @BeforeEach
    void setup() {
        learners = mock(LearnerRepository.class);
        classes = mock(_ClassRepository.class);
        batches = mock(BatchRepository.class);
        programs = mock(NewProgramRepository.class);
        semesters = mock(SemesterRepository.class);
        mappings = mock(SemesterCourseRepository.class);
        courses = mock(CourseRepository.class);
        assignments = mock(FacultyTeachingAssignmentRepository.class);
        faculties = mock(FacultyRepository.class);
        service = new StudentCourseServiceImpl(learners, classes, batches, programs,
            semesters, mappings, courses, assignments, faculties);

        Learner learner = new Learner();
        learner.setClassId(7);
        when(learners.findById(5)).thenReturn(Optional.of(learner));
        _Class clazz = new _Class();
        clazz.setName("Section A");
        clazz.setBatchId(11);
        when(classes.findById(7)).thenReturn(Optional.of(clazz));
        Batch batch = new Batch();
        batch.setId(11L);
        batch.setProgramId(13L);
        batch.setCurrentSemester(2);
        batch.setAcademicYear("2026-27");
        when(batches.findById(11L)).thenReturn(Optional.of(batch));
        program = new NewProgram();
        program.setId(13);
        program.setName("Engineering");
        when(programs.findById(13)).thenReturn(Optional.of(program));
        Semester semester = new Semester();
        semester.setId(17);
        semester.setProgramId(13);
        semester.setSemesterNumber(2);
        semester.setName("Second Semester");
        when(semesters.findFirstByProgramIdAndSemesterNumber(13, 2)).thenReturn(Optional.of(semester));
        mapping = new SemesterCourse();
        mapping.setCourseId(23);
        when(mappings.findBySemesterIdOrderByCourseOrder(17)).thenReturn(List.of(mapping));
        live = new Course();
        live.setId(23);
        live.setCourseName("Structures");
        live.setShortTitle("CE201");
        when(courses.findAllById(any())).thenReturn(List.of(live));
        when(assignments.findByClassIdAndIsActive(7, true)).thenReturn(List.of());
        when(faculties.findAllById(any())).thenReturn(List.of());
    }

    @Test
    void sluglessLegacyCourseKeepsUsableNumericIdentifierAndResolvedSemester() {
        StudentCoursesResponseDTO result = service.getStudentCourses(5, null);
        assertEquals("READY", result.getConfigurationStatus());
        assertEquals(17, result.getSemesterId());
        assertEquals(2, result.getCurrentSemester());
        assertEquals(1, result.getCourses().size());
        assertEquals(23, result.getCourses().get(0).getId());
        assertNull(result.getCourses().get(0).getSlug());
        verify(courses, times(1)).findAllById(any());
    }

    @Test
    void missingProgramNeverExposesGhostCardsFromOrphanedSemester() {
        when(programs.findById(13)).thenReturn(Optional.empty());
        StudentCoursesResponseDTO result = service.getStudentCourses(5, null);
        assertEquals("PROGRAM_NOT_FOUND", result.getConfigurationStatus());
        assertTrue(result.getCourses().isEmpty());
        assertTrue(service.getStudentSemesters(5).isEmpty());
        verify(semesters, never()).findFirstByProgramIdAndSemesterNumber(eq(13), eq(2));
        verify(courses, never()).findAllById(any());
    }

    @Test
    void deletedProgramNeverExposesGhostCardsOrSemesterOptions() {
        program.setIsDeleted(true);
        StudentCoursesResponseDTO result = service.getStudentCourses(5, null);
        assertEquals("PROGRAM_NOT_FOUND", result.getConfigurationStatus());
        assertTrue(result.getCourses().isEmpty());
        assertTrue(service.getStudentSemesters(5).isEmpty());
        verify(courses, never()).findAllById(any());
    }

    @Test
    void softDeletedCourseNeverBecomesAnUnopenableCard() {
        live.setIsDeleted(true);
        assertTrue(service.getStudentCourses(5, null).getCourses().isEmpty());
    }

    @Test
    void explicitlyHiddenCourseIsNotListedButLegacyNullVisibilityRemainsVisible() {
        live.setAllowedForDisplay(0);
        assertTrue(service.getStudentCourses(5, null).getCourses().isEmpty());
        live.setAllowedForDisplay(null);
        assertEquals(1, service.getStudentCourses(5, null).getCourses().size());
    }

    @Test
    void currentPrimaryInstructorWinsOverCoTeacherAndWrongTerm() {
        FacultyTeachingAssignment co = new FacultyTeachingAssignment();
        co.setId(1);
        co.setFacultyId(31);
        co.setCourseId(23);
        co.setSemesterNumber(2);
        co.setRole(FacultyTeachingAssignment.TeachingRole.CO_TEACHER);
        FacultyTeachingAssignment primary = new FacultyTeachingAssignment();
        primary.setId(2);
        primary.setFacultyId(32);
        primary.setCourseId(23);
        primary.setSemesterNumber(2);
        primary.setRole(FacultyTeachingAssignment.TeachingRole.PRIMARY);
        FacultyTeachingAssignment old = new FacultyTeachingAssignment();
        old.setId(3);
        old.setFacultyId(33);
        old.setCourseId(23);
        old.setSemesterNumber(1);
        old.setRole(FacultyTeachingAssignment.TeachingRole.PRIMARY);
        when(assignments.findByClassIdAndIsActive(7, true)).thenReturn(List.of(co, primary, old));
        Faculty assistant = new Faculty();
        assistant.setId(31);
        assistant.setFirstName("Assistant");
        Faculty lead = new Faculty();
        lead.setId(32);
        lead.setFirstName("Lead");
        when(faculties.findAllById(any())).thenReturn(List.of(assistant, lead));
        StudentCoursesResponseDTO result = service.getStudentCourses(5, null);
        assertEquals("Lead", result.getCourses().get(0).getFaculty().getName());
        assertEquals("PRIMARY", result.getCourses().get(0).getFaculty().getRole());
        verify(assignments, times(1)).findByClassIdAndIsActive(7, true);
        verify(faculties, times(1)).findAllById(any());
    }

    @Test
    void foreignSemesterFallbackExposesActualResolvedSemesterId() {
        Semester foreign = new Semester();
        foreign.setId(99);
        foreign.setProgramId(88);
        when(semesters.findById(99)).thenReturn(Optional.of(foreign));
        StudentCoursesResponseDTO result = service.getStudentCourses(5, 99);
        assertEquals(17, result.getSemesterId());
        verify(semesters).findFirstByProgramIdAndSemesterNumber(eq(13), eq(2));
    }
}
