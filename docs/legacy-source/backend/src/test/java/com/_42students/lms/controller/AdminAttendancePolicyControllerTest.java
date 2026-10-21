package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AppSettingsService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class AdminAttendancePolicyControllerTest {

    private AccessControlService accessControlService;
    private SecurityContextUtil securityContextUtil;
    private AppSettingsService appSettingsService;
    private AdminAttendancePolicyController controller;
    private UserPrincipal admin;

    @BeforeEach
    void setUp() {
        accessControlService = mock(AccessControlService.class);
        securityContextUtil = mock(SecurityContextUtil.class);
        appSettingsService = mock(AppSettingsService.class);
        controller = new AdminAttendancePolicyController(accessControlService, securityContextUtil, appSettingsService);
        admin = new UserPrincipal(31, "FACULTY", "ADMIN", 2, 9, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(admin);
    }

    @Test
    void returnsOnlyAttendancePolicyKeysForAuthorizedCollege() {
        when(appSettingsService.getInt("COLLEGE", 9, "attendance.correctionWindowHours", 24)).thenReturn(48);
        when(appSettingsService.getInt("COLLEGE", 9, "attendance.eligibilityThresholdPercent", 75)).thenReturn(80);

        ResponseEntity<Map<String, Object>> response = controller.getAttendancePolicy(9);

        assertEquals(200, response.getStatusCodeValue());
        assertEquals(Map.of(
                "attendance.correctionWindowHours", 48,
                "attendance.eligibilityThresholdPercent", 80), response.getBody().get("settings"));
        assertEquals(2, ((Map<?, ?>) response.getBody().get("settings")).size());
        verify(accessControlService).requirePerformAdminActionForCollege(admin, 9);
    }

    @Test
    void anotherCollegesPolicyIsDeniedBeforeSettingsAreRead() {
        doThrow(new AccessDeniedException("Wrong college"))
                .when(accessControlService).requirePerformAdminActionForCollege(any(), eq(10));

        assertThrows(AccessDeniedException.class, () -> controller.getAttendancePolicy(10));
        verifyNoInteractions(appSettingsService);
    }

    @Test
    void invalidCollegeIdIsRejectedBeforeSettingsAreRead() {
        ResponseEntity<Map<String, Object>> response = controller.getAttendancePolicy(-1);
        assertEquals(400, response.getStatusCodeValue());
        assertTrue(response.getBody().containsKey("message"));
        verifyNoInteractions(appSettingsService);
    }
}
