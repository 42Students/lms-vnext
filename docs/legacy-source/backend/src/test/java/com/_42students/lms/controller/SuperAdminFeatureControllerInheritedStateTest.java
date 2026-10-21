package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.FeatureFlagUpdateRequest;
import com._42students.lms.dto.response.CollegeFeatureFlagsDTO;
import com._42students.lms.dto.response.CollegeResponseDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.College;
import com._42students.lms.repository.ProjectMemberRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.*;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SuperAdminFeatureControllerInheritedStateTest {
    private final AppSettingsService settings = mock(AppSettingsService.class);
    private final AccessControlService access = mock(AccessControlService.class);
    private final CollegeService colleges = mock(CollegeService.class);
    private final AdminAuditLogService audit = mock(AdminAuditLogService.class);
    private final SecurityContextUtil security = mock(SecurityContextUtil.class);
    private final ScopeResolutionService scopes = mock(ScopeResolutionService.class);
    private final ProjectMemberRepository members = mock(ProjectMemberRepository.class);
    private final ModuleAccessResolver resolver = mock(ModuleAccessResolver.class);
    private final HttpServletRequest request = mock(HttpServletRequest.class);
    private SuperAdminFeatureController controller;

    @BeforeEach void setUp() {
        controller = new SuperAdminFeatureController(settings, access, colleges, audit,
                security, scopes, members, resolver);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(
                new UserPrincipal(1, "FACULTY", "ADMIN", null, null, 0));
    }

    @Test void listShowsInheritedLockedOffAndItsSourceRatherThanLocalDefaultOn() {
        CollegeResponseDTO college = new CollegeResponseDTO();
        college.setId(5); college.setOrgId(2); college.setName("College Five");
        when(colleges.fetchCollegeList()).thenReturn(List.of(college));
        when(resolver.fetchRowsForScopes(anyList(), anyList())).thenReturn(List.of());
        when(resolver.resolveAll(anyList(), anyList())).thenReturn(Map.of(
                "projects", new ModuleAccessResolver.Resolution(false, "ORGANIZATION", 2, true),
                "placements", new ModuleAccessResolver.Resolution(true, "DEFAULT", null, false),
                "electives", new ModuleAccessResolver.Resolution(true, "DEFAULT", null, false)));
        Response<?> response = (Response<?>) controller.list().getBody();
        CollegeFeatureFlagsDTO result = (CollegeFeatureFlagsDTO) ((List<?>) response.getData()).get(0);
        assertFalse(result.isProjectsEnabled());
        assertFalse(result.getModules().get("projects"));
        assertEquals("ORGANIZATION", result.getModuleDetails().get("projects").get("effectiveLevel"));
        assertEquals(2, result.getModuleDetails().get("projects").get("effectiveScopeId"));
        assertEquals(false, result.getModuleDetails().get("projects").get("editableHere"));
        assertTrue(result.isPlacementsEnabled());
        verify(resolver, times(1)).fetchRowsForScopes(anyList(), anyList());
        verify(settings, never()).getForScopeTypeGroupedByScopeId(anyString(), anyList());
    }

    @Test void ancestorLockRejectsCollegeWriteBeforeMutationOrAudit() {
        FeatureFlagUpdateRequest body = new FeatureFlagUpdateRequest();
        body.setModule("projects"); body.setEnabled(true);
        College college = new College(); college.setId(5); college.setOrgId(2);
        when(colleges.findById(5)).thenReturn(Optional.of(college));
        when(resolver.resolveAll(anyList())).thenReturn(Map.of(
                "projects", new ModuleAccessResolver.Resolution(false, "ORGANIZATION", 2, true)));
        assertEquals(HttpStatus.CONFLICT, controller.update(5, body, request).getStatusCode());
        verify(settings, never()).upsert(anyString(), any(), anyString(), anyString());
        verify(audit, never()).logRequired(any(), anyString(), anyString(), any(), any(), any(), any());
    }

    @Test void missingInheritedResolutionFailsClosed() {
        CollegeResponseDTO college = new CollegeResponseDTO();
        college.setId(5); college.setName("College Five");
        when(colleges.fetchCollegeList()).thenReturn(List.of(college));
        when(resolver.fetchRowsForScopes(anyList(), anyList())).thenReturn(List.of());
        when(resolver.resolveAll(anyList(), anyList())).thenReturn(Map.of());
        org.springframework.web.server.ResponseStatusException error = assertThrows(
                org.springframework.web.server.ResponseStatusException.class, controller::list);
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, error.getStatus());
    }
}
