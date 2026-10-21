package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.FacultyTeachingAssignmentService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class FacultyAssignmentReadAuthorizationTest {
    private FacultyTeachingAssignmentService service;
    private AccessControlService access;
    private SecurityContextUtil context;
    private UserPrincipal principal;
    private FacultyTeachingAssignmentController controller;

    @BeforeEach
    void setup() {
        service = mock(FacultyTeachingAssignmentService.class);
        access = mock(AccessControlService.class);
        context = mock(SecurityContextUtil.class);
        principal = mock(UserPrincipal.class);
        controller = new FacultyTeachingAssignmentController(service);
        ReflectionTestUtils.setField(controller, "accessControlService", access);
        ReflectionTestUtils.setField(controller, "securityContextUtil", context);
        when(context.getAuthenticatedUserPrincipal()).thenReturn(principal);
    }

    @Test
    void learnerCannotEnumerateAnyFacultyAssignmentsEvenInsideSameCollege() {
        when(principal.isLearner()).thenReturn(true);
        assertThrows(AccessDeniedException.class, () -> controller.getAssignmentsByFaculty(7));
        assertThrows(AccessDeniedException.class, () -> controller.getActiveAssignmentsByFaculty(7));
        verifyNoInteractions(service, access);
    }

    @Test
    void facultyStillReadsAuthorizedAssignments() {
        when(principal.isLearner()).thenReturn(false);
        when(service.getActiveAssignmentsByFaculty(7)).thenReturn(List.of());
        assertEquals(200, controller.getActiveAssignmentsByFaculty(7).getStatusCodeValue());
        verify(access).requireAccessFacultySchedule(principal, 7);
        verify(service).getActiveAssignmentsByFaculty(7);
    }
}
