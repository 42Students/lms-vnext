package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.FacultyService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

class FacultyControllerUniqueClassesScopeTest {
    @Test
    void foreignFacultyCountChecksScopeBeforeQuery() {
        FacultyController controller = new FacultyController();
        AccessControlService access = mock(AccessControlService.class);
        FacultyService faculty = mock(FacultyService.class);
        SecurityContextUtil security = mock(SecurityContextUtil.class);
        UserPrincipal learner = new UserPrincipal(42, "LEARNER", null, 1, 7, 0);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(learner);
        doThrow(new AccessDeniedException("foreign faculty"))
  .when(access).requireAccessFacultySchedule(learner, 42);
        ReflectionTestUtils.setField(controller, "accessControlService", access);
        ReflectionTestUtils.setField(controller, "facultyService", faculty);
        ReflectionTestUtils.setField(controller, "securityContextUtil", security);

        assertThrows(AccessDeniedException.class,
  () -> controller.getUniqueClassesTaughtByFaculty(42));
        verify(access).requireAccessFacultySchedule(learner, 42);
        verify(faculty, never()).getUniqueClassesTaughtByFaculty(anyInt());
    }
}
