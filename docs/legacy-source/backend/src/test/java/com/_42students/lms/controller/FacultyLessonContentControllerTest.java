package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.LessonContentsDTO;
import com._42students.lms.model.Lesson;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.LessonService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class FacultyLessonContentControllerTest {
    private SecurityContextUtil security;
    private AccessControlService access;
    private FacultyTeachingAssignmentRepository assignments;
    private LessonService lessons;
    private LessonContentController delegate;
    private FacultyLessonContentController controller;
    private LessonContentsDTO request;

    @BeforeEach
    void setUp() {
        security = mock(SecurityContextUtil.class);
        access = mock(AccessControlService.class);
        assignments = mock(FacultyTeachingAssignmentRepository.class);
        lessons = mock(LessonService.class);
        delegate = mock(LessonContentController.class);
        controller = new FacultyLessonContentController(security, access, assignments, lessons, delegate);
        request = new LessonContentsDTO();
        request.setLessonId(7);
        request.setClassId(9);
        Lesson lesson = mock(Lesson.class);
        when(lesson.getCourseId()).thenReturn(5);
        when(lessons.fetchCourseId(7)).thenReturn(lesson);
        when(security.getAuthenticatedUserPrincipal())
                .thenReturn(new UserPrincipal(31, "FACULTY", "TEACHER", 2, 9, 0));
    }

    @Test
    void activeAssignmentToExactCourseAndClassAllowsCreation() throws Exception {
        when(assignments.existsByFacultyIdAndCourseIdAndIsActive(31, 5, true)).thenReturn(true);
        when(assignments.existsByFacultyIdAndCourseIdAndClassIdAndIsActive(31, 5, 9, true)).thenReturn(true);
        when(delegate.createLessonContents(request)).thenReturn(ResponseEntity.ok().build());

        assertEquals(200, controller.create(request).getStatusCodeValue());
        verify(delegate).createLessonContents(request);
        verify(access).requireAccessCourse(any(UserPrincipal.class), eq(5));
        verify(access).requireAccessClass(any(UserPrincipal.class), eq(9));
    }

    @Test
    void teacherWithoutActiveAssignmentCannotCreate() {
        assertThrows(ResponseStatusException.class, () -> controller.create(request));
        verifyNoInteractions(delegate);
    }

    @Test
    void teacherAssignedToCourseButNotRequestedClassCannotCreate() {
        when(assignments.existsByFacultyIdAndCourseIdAndIsActive(31, 5, true)).thenReturn(true);
        assertThrows(ResponseStatusException.class, () -> controller.create(request));
        verifyNoInteractions(delegate);
    }

    @Test
    void learnerCannotCreateEvenWhenLessonExists() {
        when(security.getAuthenticatedUserPrincipal())
                .thenReturn(new UserPrincipal(31, "LEARNER", null, 2, 9, 0));
        assertThrows(ResponseStatusException.class, () -> controller.create(request));
        verifyNoInteractions(assignments, delegate);
    }

    @Test
    void missingLessonCannotCreate() {
        request.setLessonId(99);
        assertThrows(ResponseStatusException.class, () -> controller.create(request));
        verifyNoInteractions(assignments, delegate);
    }
}
