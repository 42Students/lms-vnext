package com._42students.lms.service;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.controller.SuperAdminFeatureController;
import com._42students.lms.dto.request.FeatureFlagUpdateRequest;
import com._42students.lms.model.AdminAuditLog;
import com._42students.lms.model.AppSetting;
import com._42students.lms.model.College;
import com._42students.lms.model.Learner;
import com._42students.lms.repository.*;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ModuleAccessHistoryVisibilityTest {
    private final AppSettingsService settings = mock(AppSettingsService.class);
    private final ModuleAccessResolver resolver = mock(ModuleAccessResolver.class);
    private final AccessControlService access = mock(AccessControlService.class);
    private final AdminAuditLogService audit = mock(AdminAuditLogService.class);
    private final LearnerRepository learners = mock(LearnerRepository.class);
    private final CollegeRepository colleges = mock(CollegeRepository.class);
    private final HttpServletRequest request = mock(HttpServletRequest.class);
    private final UserPrincipal admin = new UserPrincipal(1, "FACULTY", "ADMIN", null, null, 0);
    private ModuleAccessService service;

    @BeforeEach
    void setUp() {
        when(access.isSuperAdmin(any())).thenReturn(true);
        College existing = new College();
        existing.setId(5);
        lenient().when(colleges.findById(5)).thenReturn(Optional.of(existing));
        service = new ModuleAccessService(settings, resolver, access, audit,
                mock(DepartmentRepository.class), mock(NewProgramRepository.class),
                mock(BatchRepository.class), mock(_ClassRepository.class), learners,
                colleges, mock(OrganizationRepository.class), mock(FacultyRepository.class));
    }

    private AdminAuditLog event(String action, int minute) {
        AdminAuditLog row = new AdminAuditLog();
        row.setActionKey(action);
        row.setCreatedAt(LocalDateTime.of(2026, 9, 19, 12, minute));
        row.setPayloadJson(Map.of("module", "projects"));
        return row;
    }

    private List<String> stubHistoryWithLimits(List<Integer> requestedPageSizes) {
        List<String> keys = new ArrayList<>();
        when(audit.search(anyString(), isNull(), isNull(), eq(5), isNull(), isNull(),
                isNull(), isNull(), eq(0), anyInt())).thenAnswer(inv -> {
            String action = inv.getArgument(0);
            requestedPageSizes.add(inv.getArgument(9));
            keys.add(action);
            if ("COLLEGE_FEATURE_TOGGLE".equals(action))
                return new PageImpl<>(List.of(event(action, 50)));
            if ("MODULE_ACCESS_SET".equals(action))
                return new PageImpl<>(List.of(event(action, 40)));
            return new PageImpl<>(List.of(event(action, 30)));
        });
        return keys;
    }

    @Test
    void negativeZeroAndOversizedHistoryLimitsAreBoundedAndNeverCrash() {
        for (int limit : new int[]{-50, 0, 90000}) {
            reset(audit);
            List<Integer> sizes = new ArrayList<>();
            stubHistoryWithLimits(sizes);
            Map<String, Object> result = service.listHistory(admin, 5, limit);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> entries = (List<Map<String, Object>>) result.get("entries");
            assertEquals(limit > 200 ? 3 : 1, entries.size());
            assertEquals(List.of(limit > 200 ? 200 : 1, limit > 200 ? 200 : 1, limit > 200 ? 200 : 1), sizes);
        }
    }

    @Test
    void collegeFeatureToggleAppearsInHistoryAlongsideHierarchicalAndBulkChanges() {
        List<Integer> sizes = new ArrayList<>();
        List<String> queried = stubHistoryWithLimits(sizes);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> entries = (List<Map<String, Object>>) service.listHistory(admin, 5, 10).get("entries");
        assertEquals(List.of("MODULE_ACCESS_SET", "MODULE_ACCESS_BULK_SET", "COLLEGE_FEATURE_TOGGLE"), queried);
        assertEquals("COLLEGE_FEATURE_TOGGLE", entries.get(0).get("action"));
        assertEquals("MODULE_ACCESS_SET", entries.get(1).get("action"));
        assertEquals("MODULE_ACCESS_BULK_SET", entries.get(2).get("action"));
    }

    @Test
    void lockOnlyLearnerIsDiscoverableEvenWithoutAnEnabledRow() {
        Learner learner = new Learner();
        learner.setId(77);
        learner.setCollegeId(5);
        learner.setFirstName("Locked");
        when(learners.findActiveByCollegeIdForOverrides(5)).thenReturn(List.of(learner));
        when(settings.findLearnerModuleRows(List.of(77))).thenReturn(List.of());
        AppSetting lock = new AppSetting();
        lock.setScopeId(77);
        lock.setSettingKey("module.projects.locked");
        lock.setSettingValue("true");
        when(settings.findLearnerModuleLockRows(List.of(77))).thenReturn(List.of(lock));
        Map<String, Object> result = service.listLearnerOverrides(admin, 5);
        assertEquals(1, result.get("count"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> students = (List<Map<String, Object>>) result.get("students");
        assertEquals(Map.of(), students.get(0).get("overrides"));
        assertEquals(Map.of("projects", true), students.get(0).get("locks"));
    }

    @Test
    void unrelatedOrFalseLockIsNotPresentedAsAnOverride() {
        Learner learner = new Learner();
        learner.setId(77);
        learner.setCollegeId(5);
        when(learners.findActiveByCollegeIdForOverrides(5)).thenReturn(List.of(learner));
        AppSetting falseLock = new AppSetting();
        falseLock.setScopeId(77);
        falseLock.setSettingKey("module.projects.locked");
        falseLock.setSettingValue("false");
        when(settings.findLearnerModuleLockRows(List.of(77))).thenReturn(List.of(falseLock));
        assertEquals(0, service.listLearnerOverrides(admin, 5).get("count"));
    }

    @Test
    void featureControlWriteRequiresAuditAndTransactionalRollback() throws Exception {
        var collegeService = mock(CollegeService.class);
        var security = mock(SecurityContextUtil.class);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(admin);
        College college = new College();
        college.setId(5);
        when(collegeService.findById(5)).thenReturn(Optional.of(college));
        when(settings.getSettingValue("COLLEGE", 5, "module.projects.enabled")).thenReturn("false");
        when(resolver.resolveAll(anyList())).thenReturn(Map.of(
                "projects", new ModuleAccessResolver.Resolution(true, "DEFAULT", null, false),
                "placements", new ModuleAccessResolver.Resolution(true, "DEFAULT", null, false)));
        SuperAdminFeatureController controller = new SuperAdminFeatureController(
                settings, access, collegeService, audit, security,
                mock(ScopeResolutionService.class), mock(ProjectMemberRepository.class), resolver);
        FeatureFlagUpdateRequest body = new FeatureFlagUpdateRequest();
        body.setModule("projects");
        body.setEnabled(true);
        assertEquals(HttpStatus.OK, controller.update(5, body, request).getStatusCode());
        verify(audit).logRequired(eq(request), eq("COLLEGE_FEATURE_TOGGLE"), eq("COLLEGE"),
                eq("5"), isNull(), eq(5), argThat(p ->
                    "false".equals(p.get("previousValue")) && Boolean.TRUE.equals(p.get("enabled"))));
        verify(audit, never()).log(any(), anyString(), anyString(), anyString(), any(), any(), any());
        assertTrue(SuperAdminFeatureController.class
                .getMethod("update", Integer.class, FeatureFlagUpdateRequest.class, HttpServletRequest.class)
                .isAnnotationPresent(Transactional.class));
    }
}
