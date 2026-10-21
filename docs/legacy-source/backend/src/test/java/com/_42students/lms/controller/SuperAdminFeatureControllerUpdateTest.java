package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.FeatureFlagUpdateRequest;
import com._42students.lms.model.College;
import com._42students.lms.repository.ProjectMemberRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AdminAuditLogService;
import com._42students.lms.service.AppSettingsService;
import com._42students.lms.service.CollegeService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.ResponseEntity;

import javax.servlet.http.HttpServletRequest;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Edge-case sweep for the update endpoint, written against findings #17/#18/#22 from the Feature
 * Controls edge-case audit (FEATURE-CONTROLS-EDGE-CASE-AUDIT-2026-09-05.md): a request missing
 * "enabled" must be rejected, not silently disable the module, and a collegeId that doesn't exist
 * must not be allowed to create an orphaned app_setting row.
 */
class SuperAdminFeatureControllerUpdateTest {

    private static final int COLLEGE_ID = 42;

    private AppSettingsService appSettingsService;
    private AdminAuditLogService adminAuditLogService;
    private CollegeService collegeService;
    private com._42students.lms.service.ModuleAccessResolver resolver;
    private SuperAdminFeatureController controller;
    private HttpServletRequest httpRequest;

    @BeforeEach
    void setUp() {
        appSettingsService = Mockito.mock(AppSettingsService.class);
        AccessControlService accessControlService = Mockito.mock(AccessControlService.class);
        collegeService = Mockito.mock(CollegeService.class);
        resolver = Mockito.mock(com._42students.lms.service.ModuleAccessResolver.class);
        Mockito.lenient().when(resolver.resolveAll(Mockito.anyList())).thenReturn(java.util.Map.of(
                "projects", new com._42students.lms.service.ModuleAccessResolver.Resolution(true, "DEFAULT", null, false),
                "placements", new com._42students.lms.service.ModuleAccessResolver.Resolution(true, "DEFAULT", null, false)));
        adminAuditLogService = Mockito.mock(AdminAuditLogService.class);
        SecurityContextUtil securityContextUtil = Mockito.mock(SecurityContextUtil.class);
        ScopeResolutionService scopeResolutionService = Mockito.mock(ScopeResolutionService.class);
        ProjectMemberRepository projectMemberRepository = Mockito.mock(ProjectMemberRepository.class);
        httpRequest = Mockito.mock(HttpServletRequest.class);

        UserPrincipal globalSuperAdmin = new UserPrincipal(0, "FACULTY", "ADMIN", null, null, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(globalSuperAdmin);

        College college = new College();
        college.setId(COLLEGE_ID);
        when(collegeService.findById(COLLEGE_ID)).thenReturn(Optional.of(college));

        controller = new SuperAdminFeatureController(appSettingsService, accessControlService, collegeService,
                adminAuditLogService, securityContextUtil, scopeResolutionService, projectMemberRepository, resolver);
    }

    private FeatureFlagUpdateRequest request(String module, Boolean enabled) {
        FeatureFlagUpdateRequest body = new FeatureFlagUpdateRequest();
        body.setModule(module);
        body.setEnabled(enabled);
        return body;
    }

    @Test
    @DisplayName("REGRESSION #17: a null body is rejected, not treated as disable-everything")
    void nullBody_rejected() {
        ResponseEntity<?> response = controller.update(COLLEGE_ID, null, httpRequest);

        assertEquals(400, response.getStatusCodeValue());
        Mockito.verifyNoInteractions(appSettingsService);
    }

    @Test
    @DisplayName("REGRESSION #17/#18: a body missing \"enabled\" is rejected rather than silently disabling the module")
    void missingEnabled_rejected() {
        ResponseEntity<?> response = controller.update(COLLEGE_ID, request("projects", null), httpRequest);

        assertEquals(400, response.getStatusCodeValue());
        assertTrue(String.valueOf(response.getBody()).contains("module") && String.valueOf(response.getBody()).contains("enabled"));
        verify(appSettingsService, never()).upsert(anyString(), any(), anyString(), anyString());
    }

    @Test
    @DisplayName("a blank module is rejected")
    void blankModule_rejected() {
        ResponseEntity<?> response = controller.update(COLLEGE_ID, request("  ", true), httpRequest);

        assertEquals(400, response.getStatusCodeValue());
        verify(appSettingsService, never()).upsert(anyString(), any(), anyString(), anyString());
    }

    @Test
    @DisplayName("an unknown module key is rejected with its own message, not silently accepted")
    void unknownModule_rejected() {
        ResponseEntity<?> response = controller.update(COLLEGE_ID, request("attendance", true), httpRequest);

        assertEquals(400, response.getStatusCodeValue());
        assertTrue(String.valueOf(response.getBody()).contains("Unknown module"));
        verify(appSettingsService, never()).upsert(anyString(), any(), anyString(), anyString());
    }

    @Test
    @DisplayName("REGRESSION #22: a collegeId that doesn't exist is rejected instead of creating an orphaned setting row")
    void collegeNotFound_rejected() {
        when(collegeService.findById(999)).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.update(999, request("projects", false), httpRequest);

        assertEquals(404, response.getStatusCodeValue());
        verify(appSettingsService, never()).upsert(anyString(), any(), anyString(), anyString());
    }

    @Test
    @DisplayName("a valid, complete request succeeds and upserts the right key/value")
    void validRequest_succeeds() {
        ResponseEntity<?> response = controller.update(COLLEGE_ID, request("projects", false), httpRequest);

        assertEquals(200, response.getStatusCodeValue());
        verify(appSettingsService).upsert(eq("COLLEGE"), eq(COLLEGE_ID), eq("module.projects.enabled"), eq("false"));
        verify(adminAuditLogService).logRequired(eq(httpRequest), eq("COLLEGE_FEATURE_TOGGLE"), eq("COLLEGE"),
                eq(String.valueOf(COLLEGE_ID)), eq(null), eq(COLLEGE_ID), any());
    }
}
