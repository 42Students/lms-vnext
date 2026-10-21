package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.ContentDataDTO;
import com._42students.lms.dto.response.PageResponseDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.LessonContents;
import com._42students.lms.repository.LessonContentsRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AssignmentService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class AdminAssignmentControllerEditTest {
    private AdminAssignmentController controller;
    private LessonContentsRepository contents;
    private AssignmentService assignments;
    private AccessControlService access;
    private SecurityContextUtil security;
    private UserPrincipal admin;

    private static void inject(AdminAssignmentController target, String name, Object value) throws Exception {
        Field field = AdminAssignmentController.class.getDeclaredField(name);
        field.setAccessible(true);
        field.set(target, value);
    }

    @BeforeEach
    void setUp() throws Exception {
        controller = new AdminAssignmentController();
        contents = mock(LessonContentsRepository.class);
        assignments = mock(AssignmentService.class);
        access = mock(AccessControlService.class);
        security = mock(SecurityContextUtil.class);
        admin = new UserPrincipal(31, "FACULTY", "ADMIN", 2, 9, 0);
        inject(controller, "lessonContentsRepository", contents);
        inject(controller, "assignmentService", assignments);
        inject(controller, "accessControlService", access);
        inject(controller, "securityContextUtil", security);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(admin);
    }

    @Test
    void listIncludesLessonAndOriginalInstructionsNeededByLockedEditForm() {
        LessonContents assignment = new LessonContents();
        assignment.setId(12);
        assignment.setCourseId(3);
        assignment.setLessonId(19);
        assignment.setContentTitle("Week one");
        ContentDataDTO content = new ContentDataDTO();
        content.setHtmlContent("Read chapter one first");
        assignment.setContentDataDTO(content);
        when(contents.findAssignmentsByCollegePaged(eq(9), eq(null), eq(null), any()))
                .thenReturn(new PageImpl<>(List.of(assignment), PageRequest.of(0, 20), 1));

        ResponseEntity<Response<PageResponseDTO<Map<String, Object>>>> response = controller.listAssignments(9, null, null, 0, 20);

        assertEquals(200, response.getStatusCodeValue());
        Map<String, Object> row = response.getBody().getData().getContent().get(0);
        assertEquals(12, row.get("id"));
        assertEquals(19, row.get("lessonId"));
        assertEquals(3, row.get("courseId"));
        assertEquals("Read chapter one first", row.get("description"));
        verify(access).requirePerformAdminActionForCollege(admin, 9);
    }

    @Test
    void assignmentWithoutInstructionsStillReturnsEditableLessonId() {
        LessonContents assignment = new LessonContents();
        assignment.setId(13);
        assignment.setLessonId(20);
        when(contents.findAssignmentsByCollegePaged(eq(9), eq(null), eq(null), any()))
                .thenReturn(new PageImpl<>(List.of(assignment), PageRequest.of(0, 20), 1));

        Map<String, Object> row = controller.listAssignments(9, null, null, 0, 20)
                .getBody().getData().getContent().get(0);

        assertEquals(20, row.get("lessonId"));
        assertNull(row.get("description"));
    }

    @Test
    void unauthorizedCollegeIsRejectedBeforeAssignmentsAreQueried() {
        doThrow(new AccessDeniedException("Wrong college"))
                .when(access).requirePerformAdminActionForCollege(admin, 10);

        assertThrows(AccessDeniedException.class, () -> controller.listAssignments(10, null, null, 0, 20));
        verifyNoInteractions(contents, assignments);
    }

    @Test
    void invalidCollegeIsRejectedBeforeAssignmentsAreQueried() {
        assertEquals(400, controller.listAssignments(0, null, null, 0, 20).getStatusCodeValue());
        verifyNoInteractions(contents, assignments);
    }

    @Test
    void positiveClassFilterIsAccessCheckedAndPassedToQuery() {
        when(contents.findAssignmentsByCollegePaged(eq(9), eq(3), eq(44), any()))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 20), 0));

        assertEquals(200, controller.listAssignments(9, 3, 44, 0, 20).getStatusCodeValue());

        verify(access).requireAccessClass(admin, 44);
        verify(contents).findAssignmentsByCollegePaged(eq(9), eq(3), eq(44), any());
    }
}
