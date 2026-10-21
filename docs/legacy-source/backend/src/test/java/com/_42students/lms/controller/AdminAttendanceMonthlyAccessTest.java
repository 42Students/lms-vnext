package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.response.FilteredClassScheduleResponse;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.ClassScheduleService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class AdminAttendanceMonthlyAccessTest {
    private ClassScheduleService schedules;
    private AccessControlService access;
    private SecurityContextUtil security;
    private AdminAttendanceController controller;
    private UserPrincipal admin;

    @BeforeEach
    void setUp() {
        schedules = mock(ClassScheduleService.class);
        access = mock(AccessControlService.class);
        security = mock(SecurityContextUtil.class);
        admin = new UserPrincipal(31, "FACULTY", "ADMIN", 2, 9, 0);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(admin);
        controller = new AdminAttendanceController();
        ReflectionTestUtils.setField(controller, "classScheduleService", schedules);
        ReflectionTestUtils.setField(controller, "accessControlService", access);
        ReflectionTestUtils.setField(controller, "securityContextUtil", security);
    }

    @Test
    void authorizedAdminGetsTheMonthlyGrid() {
        FilteredClassScheduleResponse data = new FilteredClassScheduleResponse();
        when(schedules.getFilteredClassSchedulesForAdmin(14, 5, "2026-09-01", "2026-09-30"))
                .thenReturn(data);

        ResponseEntity<FilteredClassScheduleResponse> result = controller.getMonthlyGrid(
                9, 14, 5, "2026-09-01", "2026-09-30");

        assertEquals(200, result.getStatusCodeValue());
        assertSame(data, result.getBody());
        verify(access).requirePerformAdminActionForCollege(admin, 9);
        verify(access).requireAccessClass(admin, 14);
    }

    @Test
    void wrongCollegeIsDeniedBeforeReadingStudentAttendance() {
        doThrow(new AccessDeniedException("Wrong college"))
                .when(access).requirePerformAdminActionForCollege(admin, 10);
        assertThrows(AccessDeniedException.class, () -> controller.getMonthlyGrid(
                10, 14, 5, "2026-09-01", "2026-09-30"));
        verifyNoInteractions(schedules);
    }

    @Test
    void unauthorizedClassIsDeniedBeforeReadingStudentAttendance() {
        doThrow(new AccessDeniedException("Wrong class"))
                .when(access).requireAccessClass(any(UserPrincipal.class), eq(15));
        assertThrows(AccessDeniedException.class, () -> controller.getMonthlyGrid(
                9, 15, 5, "2026-09-01", "2026-09-30"));
        verifyNoInteractions(schedules);
    }

    @Test
    void invalidCollegeIsRejectedWithoutReadingStudentAttendance() {
        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> controller.getMonthlyGrid(
                0, 14, 5, "2026-09-01", "2026-09-30"));
        assertEquals(400, error.getRawStatusCode());
        verifyNoInteractions(schedules, access);
    }
}
