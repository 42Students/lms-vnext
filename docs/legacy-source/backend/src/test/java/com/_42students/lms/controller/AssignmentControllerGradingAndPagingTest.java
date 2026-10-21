package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.model.LessonContents;
import com._42students.lms.model.StudentAssignment;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AssignmentService;
import com._42students.lms.service.LessonContentsService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import org.springframework.test.util.ReflectionTestUtils;

class AssignmentControllerGradingAndPagingTest {
    private AssignmentController controller;
    private AssignmentService assignments;
    private LessonContentsService contents;
    private AccessControlService access;
    private UserPrincipal admin;
    private LessonContents content;

    @BeforeEach
    void setUp() {
        controller = new AssignmentController();
        assignments = mock(AssignmentService.class);
        contents = mock(LessonContentsService.class);
        access = mock(AccessControlService.class);
        SecurityContextUtil security = mock(SecurityContextUtil.class);
        admin = new UserPrincipal(31, "FACULTY", "ADMIN", 2, 9, 0);
        content = new LessonContents();
        content.setId(45);
        content.setCourseId(33);
        content.setPoints(100);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(admin);
        when(contents.findById(45)).thenReturn(Optional.of(content));
        ReflectionTestUtils.setField(controller, "assignmentService", assignments);
        ReflectionTestUtils.setField(controller, "lessonContentsService", contents);
        ReflectionTestUtils.setField(controller, "accessControlService", access);
        ReflectionTestUtils.setField(controller, "securityContextUtil", security);
    }

    private StudentAssignment submission() {
        StudentAssignment item = new StudentAssignment();
        item.setLessonContentId(45);
        item.setPointsObtained(10);
        return item;
    }

    @Test
    void callerSuppliedPageSizeIsCappedToOneHundred() {
        when(assignments.fetchSubmissions(eq(45), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        assertEquals(200, controller.fetchSubmissions(45, 2, Integer.MAX_VALUE).getStatusCodeValue());
        ArgumentCaptor<Pageable> paging = ArgumentCaptor.forClass(Pageable.class);
        verify(assignments).fetchSubmissions(eq(45), paging.capture());
        assertEquals(2, paging.getValue().getPageNumber());
        assertEquals(100, paging.getValue().getPageSize());
        verify(access).requireAccessCourse(admin, 33);
    }

    @Test
    void invalidPageDoesNotFallBackToLegacyFirstPage() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.fetchSubmissions(45, -1, 20));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verifyNoInteractions(assignments);
    }

    @Test
    void updatePointsPropagatesUnauthorizedAndOptimisticConflict() {
        when(assignments.fetchSubmission(76)).thenReturn(submission());
        doThrow(new AccessDeniedException("Out of scope"))
                .when(access).requireAccessCourse(admin, 33);
        assertThrows(AccessDeniedException.class, () -> controller.updatePoints(76, 10));
        org.mockito.Mockito.reset(access);
        when(assignments.updatePoints(76, 10)).thenThrow(new ResponseStatusException(HttpStatus.CONFLICT, "Stale grade"));
        ResponseStatusException conflict = assertThrows(ResponseStatusException.class,
                () -> controller.updatePoints(76, 10));
        assertEquals(HttpStatus.CONFLICT, conflict.getStatus());
    }

    @Test
    void invalidGradeRemainsBadRequestWithoutLeakingStackTraces() {
        when(assignments.fetchSubmission(76)).thenReturn(submission());
        when(assignments.updatePoints(76, 101)).thenThrow(new IllegalArgumentException("Exceeds maximum points"));
        assertEquals(400, controller.updatePoints(76, 101).getStatusCodeValue());
    }

    @Test
    void descriptiveGradeConflictIsNotConvertedToBadRequest() {
        when(assignments.fetchSubmission(76)).thenReturn(submission());
        when(assignments.addDescriptivePoints(76, 5))
                .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT, "Concurrent grading"));
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.updateAssignmentPoints(76, 5));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
    }
}
