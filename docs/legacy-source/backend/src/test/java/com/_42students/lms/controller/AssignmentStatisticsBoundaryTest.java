package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.model.LessonContents;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AssignmentService;
import com._42students.lms.service.LessonContentsService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

/** Regression for the distinct stats read path; paginated learner list SQL does not protect it. */
class AssignmentStatisticsBoundaryTest {
    private AssignmentController controller;
    private AssignmentService assignments;
    private LessonContentsService contents;
    private AccessControlService access;
    private UserPrincipal teacher;

    @BeforeEach
    void setup() {
        controller = new AssignmentController();
        assignments = mock(AssignmentService.class);
        contents = mock(LessonContentsService.class);
        access = mock(AccessControlService.class);
        SecurityContextUtil security = mock(SecurityContextUtil.class);
        teacher = new UserPrincipal(17, "FACULTY", "TEACHER", 1, 10, 0);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(teacher);
        controller.assignmentService = assignments;
        controller.lessonContentsService = contents;
        controller.accessControlService = access;
        controller.securityContextUtil = security;
    }

    private LessonContents content(int id, Integer courseId, Integer classId) {
        LessonContents content = new LessonContents();
        content.setId(id);
        content.setCourseId(courseId);
        content.setClassId(classId);
        when(contents.findById(id)).thenReturn(Optional.of(content));
        return content;
    }

    @Test
    void sharedAssignmentSingleStatsChecksCourseBeforeReadingStats() throws Exception {
        content(99, 801, null);
        controller.getSubmissionStats(99);
        verify(access).requireAccessCourse(teacher, 801);
        verify(assignments).getSubmissionStats(99);
    }

    @Test
    void sharedAssignmentInOtherCollegeCannotReadSingleStats() throws Exception {
        content(99, 801, null);
        doThrow(new AccessDeniedException("different college"))
                .when(access).requireAccessCourse(teacher, 801);
        assertThrows(AccessDeniedException.class, () -> controller.getSubmissionStats(99));
        verify(assignments, never()).getSubmissionStats(anyInt());
    }

    @Test
    void classSpecificAssignmentChecksBothCourseAndClass() throws Exception {
        content(99, 801, 41);
        controller.getSubmissionStats(99);
        verify(access).requireAccessCourse(teacher, 801);
        verify(access).requireAccessClass(teacher, 41);
        verify(assignments).getSubmissionStats(99);
    }

    @Test
    void mismatchedClassCourseDenialDoesNotReadStats() throws Exception {
        content(99, 801, 41);
        doThrow(new AccessDeniedException("wrong course"))
                .when(access).requireAccessCourse(teacher, 801);
        assertThrows(AccessDeniedException.class, () -> controller.getSubmissionStats(99));
        verify(access, never()).requireAccessClass(any(), anyInt());
        verify(assignments, never()).getSubmissionStats(anyInt());
    }

    @Test
    void bulkOmitsUnauthorizedSharedItemsWithoutReadingTheirStats() {
        content(99, 801, null);
        content(100, 802, null);
        doThrow(new AccessDeniedException("different college"))
                .when(access).requireAccessCourse(teacher, 801);
        ResponseEntity<?> result = controller.getSubmissionStatsBulk(List.of(99, 100));
        assertEquals(200, result.getStatusCodeValue());
        verify(assignments, never()).getSubmissionStats(99);
        verify(assignments).getSubmissionStats(100);
        verify(access).requireAccessCourse(teacher, 801);
        verify(access).requireAccessCourse(teacher, 802);
    }

    @Test
    void bulkOmitsMismatchedClassCourseWithoutReadingStats() {
        content(99, 801, 41);
        doThrow(new AccessDeniedException("different college"))
                .when(access).requireAccessCourse(teacher, 801);
        controller.getSubmissionStatsBulk(List.of(99));
        verify(assignments, never()).getSubmissionStats(anyInt());
    }

    @Test
    void bulkOmitsNonexistentAndScopeLessRows() {
        when(contents.findById(99)).thenReturn(Optional.empty());
        content(100, null, null);
        controller.getSubmissionStatsBulk(List.of(99, 100));
        verifyNoInteractions(assignments);
    }

    @Test
    void legacyClassOnlyRowStillRequiresItsClass() throws Exception {
        content(99, null, 41);
        controller.getSubmissionStats(99);
        verify(access).requireAccessClass(teacher, 41);
        verify(access, never()).requireAccessCourse(any(), anyInt());
    }
    @Test
    void unauthenticatedSingleStatsNeverReadData() throws Exception {
        when(controller.securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(null);
        ResponseEntity<?> result = controller.getSubmissionStats(99);
        assertEquals(403, result.getStatusCodeValue());
        verifyNoInteractions(assignments, contents, access);
    }

    @Test
    void learnerCannotReadSingleOrBulkStats() throws Exception {
        when(controller.securityContextUtil.getAuthenticatedUserPrincipal())
                .thenReturn(new UserPrincipal(42, "LEARNER", null, 1, 10, 0));
        assertEquals(403, controller.getSubmissionStats(99).getStatusCodeValue());
        assertEquals(403, controller.getSubmissionStatsBulk(List.of(99)).getStatusCodeValue());
        verifyNoInteractions(assignments, contents, access);
    }

    @Test
    void missingSingleAssignmentIsNotSentToStatsService() throws Exception {
        when(contents.findById(99)).thenReturn(Optional.empty());
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.getSubmissionStats(99));
        assertEquals(404, ex.getStatus().value());
        verifyNoInteractions(assignments);
    }

    @Test
    void invalidCourseAndClassMetadataDoesNotReadStats() throws Exception {
        content(99, null, null);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.getSubmissionStats(99));
        assertEquals(400, ex.getStatus().value());
        verifyNoInteractions(assignments, access);
    }

}
