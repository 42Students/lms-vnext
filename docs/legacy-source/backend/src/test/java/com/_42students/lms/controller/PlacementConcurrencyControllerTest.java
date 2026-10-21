package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.model.JobApplication;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AdminJobService;
import com._42students.lms.service.FeatureFlagService;
import com._42students.lms.service.PlacementJobService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class PlacementConcurrencyControllerTest {

    @Test
    void collegeAdminNotesManualVersionConflictReturns409() {
        AdminJobController controller = new AdminJobController();
        AdminJobService service = mock(AdminJobService.class);
        SecurityContextUtil security = mock(SecurityContextUtil.class);
        AccessControlService access = mock(AccessControlService.class);
        FeatureFlagService flags = mock(FeatureFlagService.class);

        ReflectionTestUtils.setField(controller, "adminJobService", service);
        ReflectionTestUtils.setField(controller, "securityContextUtil", security);
        ReflectionTestUtils.setField(controller, "accessControlService", access);
        ReflectionTestUtils.setField(controller, "featureFlagService", flags);

        UserPrincipal principal = new UserPrincipal(77, "FACULTY", "ADMIN", 3, 7, 0);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(principal);
        doThrow(new ResponseStatusException(HttpStatus.CONFLICT,
                "These notes were updated by someone else. Please refresh and try again."))
                .when(service).updateApplicationNotes(55, "fresh note", 900, 7, 3L);

        var response = controller.updateApplicationNotes(
                900, 55, 7, Map.of("internalNotes", "fresh note", "version", 3L));

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("These notes were updated by someone else. Please refresh and try again.",
                response.getBody().getMessage());
    }

    @Test
    void organizationNotesJpaRaceReturns409() {
        PlacementJobController controller = new PlacementJobController();
        PlacementJobService service = mock(PlacementJobService.class);
        SecurityContextUtil security = mock(SecurityContextUtil.class);
        AccessControlService access = mock(AccessControlService.class);
        HttpServletRequest request = mock(HttpServletRequest.class);

        ReflectionTestUtils.setField(controller, "placementJobService", service);
        ReflectionTestUtils.setField(controller, "securityContextUtil", security);
        ReflectionTestUtils.setField(controller, "accessControlService", access);

        UserPrincipal principal = new UserPrincipal(88, "FACULTY", "ADMIN", 3, null, 0);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(principal);
        when(security.getAuthenticatedOrganizationId(request)).thenReturn(3);
        when(access.isSuperAdmin(principal)).thenReturn(false);
        doThrow(new ObjectOptimisticLockingFailureException(JobApplication.class, 55))
                .when(service).updateApplicationNotes(55, "fresh note", 3, 3L);

        var response = controller.updateApplicationNotes(
                55, Map.of("internalNotes", "fresh note", "version", 3L), request);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("These notes were updated by someone else. Please refresh and try again.",
                response.getBody().getMessage());
    }
}
