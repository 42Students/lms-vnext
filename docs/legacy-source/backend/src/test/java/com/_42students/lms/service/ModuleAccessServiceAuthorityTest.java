package com._42students.lms.service;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.access.AccessDeniedException;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * The authority rules are the security boundary of this feature: without them a college-admin could
 * pass any department/class/learner id and change another college's students, or re-enable at
 * PROGRAM level a module a super-admin turned off for their whole college. Both are tested here
 * directly rather than through the controller.
 */
class ModuleAccessServiceAuthorityTest {

    private static final int OWN_COLLEGE = 5;
    private static final int OTHER_COLLEGE = 9;

    private AppSettingsService appSettingsService;
    private ModuleAccessResolver resolver;
    private AccessControlService accessControlService;
    private AdminAuditLogService auditLogService;
    private ModuleAccessService service;
    private HttpServletRequest request;
    private com._42students.lms.repository.CollegeRepository collegeRepository;
    private com._42students.lms.repository.OrganizationRepository organizationRepository;
    private com._42students.lms.repository.DepartmentRepository departmentRepository;
    private com._42students.lms.repository.LearnerRepository learnerRepository;

    @BeforeEach
    void setUp() {
        appSettingsService = Mockito.mock(AppSettingsService.class);
        resolver = Mockito.mock(ModuleAccessResolver.class);
        accessControlService = Mockito.mock(AccessControlService.class);
        auditLogService = Mockito.mock(AdminAuditLogService.class);
        request = Mockito.mock(HttpServletRequest.class);
        collegeRepository = Mockito.mock(com._42students.lms.repository.CollegeRepository.class);
        organizationRepository = Mockito.mock(com._42students.lms.repository.OrganizationRepository.class);
        departmentRepository = Mockito.mock(com._42students.lms.repository.DepartmentRepository.class);
        learnerRepository = Mockito.mock(com._42students.lms.repository.LearnerRepository.class);
        com._42students.lms.model.College existingCollege = new com._42students.lms.model.College();
        existingCollege.setId(OWN_COLLEGE);
        Mockito.lenient().when(collegeRepository.findById(OWN_COLLEGE))
                .thenReturn(java.util.Optional.of(existingCollege));
        com._42students.lms.model.Department existingDepartment = new com._42students.lms.model.Department();
        existingDepartment.setId(12);
        Mockito.lenient().when(departmentRepository.findById(12))
                .thenReturn(java.util.Optional.of(existingDepartment));
        when(resolver.chainForLearner(any())).thenAnswer(invocation -> {
            com._42students.lms.model.Learner learner = invocation.getArgument(0);
            return List.of(new ModuleAccessResolver.ScopeRef("LEARNER", learner.getId()),
                    new ModuleAccessResolver.ScopeRef("COLLEGE", learner.getCollegeId()),
                    new ModuleAccessResolver.ScopeRef("GLOBAL", null));
        });
        when(resolver.fetchRowsForScopes(any(), any())).thenReturn(List.of());
        when(resolver.resolveAll(any(), any())).thenReturn(java.util.Map.of(
                "projects", new ModuleAccessResolver.Resolution(true, "DEFAULT", null, false),
                "electives", new ModuleAccessResolver.Resolution(true, "DEFAULT", null, false)));
        // The hierarchy repositories are only used by getCollegeTree, which these authority tests
        // don't exercise — mocked purely to satisfy the constructor.
        service = new ModuleAccessService(appSettingsService, resolver, accessControlService, auditLogService,
                departmentRepository,
                Mockito.mock(com._42students.lms.repository.NewProgramRepository.class),
                Mockito.mock(com._42students.lms.repository.BatchRepository.class),
                Mockito.mock(com._42students.lms.repository._ClassRepository.class),
                learnerRepository,
                collegeRepository,
                organizationRepository,
                Mockito.mock(com._42students.lms.repository.FacultyRepository.class));
    }

    /** A learner/class/etc. node that resolves up to the given college. */
    private void nodeBelongsTo(int collegeId) {
        when(resolver.chainFromNode(anyString(), any())).thenReturn(List.of(
                new ModuleAccessResolver.ScopeRef("LEARNER", 77),
                new ModuleAccessResolver.ScopeRef("COLLEGE", collegeId),
                new ModuleAccessResolver.ScopeRef("GLOBAL", null)));
        when(resolver.resolveAll(any())).thenReturn(new java.util.LinkedHashMap<>());
    }

    private UserPrincipal collegeAdmin() {
        return new UserPrincipal(11, "FACULTY", "ADMIN", null, OWN_COLLEGE, 0);
    }

    private UserPrincipal globalSuperAdmin() {
        return new UserPrincipal(1, "FACULTY", "ADMIN", null, null, 0);
    }

    @Test
    @DisplayName("college-admin cannot set module access at COLLEGE level — that is the super-admin's entitlement call")
    void collegeAdminCannotWriteAtCollegeLevel() {
        when(accessControlService.isSuperAdmin(any())).thenReturn(false);

        AccessDeniedException e = assertThrows(AccessDeniedException.class, () ->
                service.setValue(collegeAdmin(), "COLLEGE", OWN_COLLEGE, "electives", false, null, request));

        assertEquals("Super-admin access required", e.getMessage());
        verify(appSettingsService, never()).upsert(anyString(), any(), anyString(), anyString());
    }

    @Test
    @DisplayName("college-admin cannot set GLOBAL or ORGANIZATION level either")
    void collegeAdminCannotWriteAtGlobalOrOrg() {
        when(accessControlService.isSuperAdmin(any())).thenReturn(false);

        assertThrows(AccessDeniedException.class, () ->
                service.setValue(collegeAdmin(), "GLOBAL", null, "electives", false, null, request));
        assertThrows(AccessDeniedException.class, () ->
                service.setValue(collegeAdmin(), "ORGANIZATION", 2, "electives", false, null, request));
        verify(appSettingsService, never()).upsert(anyString(), any(), anyString(), anyString());
    }

    @Test
    @DisplayName("College Admin cannot change their own learner module access")
    void collegeAdminCannotWriteOwnCollegeLearner() {
        when(accessControlService.isSuperAdmin(any())).thenReturn(false);
        nodeBelongsTo(OWN_COLLEGE);
        assertThrows(AccessDeniedException.class, () ->
                service.setValue(collegeAdmin(), "LEARNER", 77, "electives", false, null, request));
        verify(appSettingsService, never()).upsert(anyString(), any(), anyString(), anyString());
        verify(appSettingsService, never()).delete(anyString(), any(), anyString());
    }

    @Test
    @DisplayName("SECURITY: college-admin cannot set a learner belonging to another college, even by passing the id directly")
    void collegeAdminCannotWriteForeignLearner() {
        when(accessControlService.isSuperAdmin(any())).thenReturn(false);
        nodeBelongsTo(OTHER_COLLEGE);
        Mockito.doThrow(new AccessDeniedException("Access denied to this college"))
                .when(accessControlService).requirePerformAdminActionForCollege(any(), eq(OTHER_COLLEGE));

        assertThrows(AccessDeniedException.class, () ->
                service.setValue(collegeAdmin(), "LEARNER", 77, "electives", false, null, request));

        verify(appSettingsService, never()).upsert(anyString(), any(), anyString(), anyString());
    }

    @Test
    @DisplayName("SECURITY: college-admin cannot lock a setting — the lock is what stops them overriding a super-admin")
    void collegeAdminCannotLock() {
        when(accessControlService.isSuperAdmin(any())).thenReturn(false);
        nodeBelongsTo(OWN_COLLEGE);

        assertThrows(AccessDeniedException.class, () ->
                service.setValue(collegeAdmin(), "LEARNER", 77, "electives", false, true, request));

        verify(appSettingsService, never()).upsert(anyString(), any(), eq("module.electives.locked"), anyString());
    }

    @Test
    @DisplayName("super-admin can set COLLEGE level and lock it")
    void superAdminCanWriteAndLockCollegeLevel() {
        when(accessControlService.isSuperAdmin(any())).thenReturn(true);
        nodeBelongsTo(OWN_COLLEGE);

        service.setValue(globalSuperAdmin(), "COLLEGE", OWN_COLLEGE, "electives", false, true, request);

        verify(appSettingsService).upsert(eq("COLLEGE"), eq(OWN_COLLEGE), eq("module.electives.enabled"), eq("false"));
        verify(appSettingsService).upsert(eq("COLLEGE"), eq(OWN_COLLEGE), eq("module.electives.locked"), eq("true"));
    }

    @Test
    @DisplayName("Superadmin may clear a learner override to restore inheritance")
    void nullEnabledClearsOverride() {
        when(accessControlService.isSuperAdmin(any())).thenReturn(true);
        nodeBelongsTo(OWN_COLLEGE);

        service.setValue(new UserPrincipal(1, "FACULTY", "ADMIN", null, OWN_COLLEGE, 0), "LEARNER", 77, "electives", null, null, request);

        verify(appSettingsService).delete(eq("LEARNER"), eq(77), eq("module.electives.enabled"));
        verify(appSettingsService, never()).upsert(anyString(), any(), anyString(), anyString());
    }

    @Test
    @DisplayName("SECURITY: a college-scoped super-admin cannot touch another college's node")
    void scopedSuperAdminCannotCrossColleges() {
        when(accessControlService.isSuperAdmin(any())).thenReturn(true);
        nodeBelongsTo(OTHER_COLLEGE);
        UserPrincipal scoped = new UserPrincipal(1, "FACULTY", "ADMIN", null, OWN_COLLEGE, 0);

        assertThrows(AccessDeniedException.class, () ->
                service.setValue(scoped, "LEARNER", 77, "electives", false, null, request));

        verify(appSettingsService, never()).upsert(anyString(), any(), anyString(), anyString());
    }

    @Test
    @DisplayName("bulk: one foreign learner in the selection fails the whole request rather than half-applying it")
    void bulkRejectsForeignLearnerBeforeWritingAnything() {
        when(accessControlService.isSuperAdmin(any())).thenReturn(false);
        // Authority is now resolved for the whole selection in one query rather than a chain walk
        // per learner, so the learners have to exist for the college check to be reached.
        when(learnerRepository.findAllById(any())).thenReturn(List.of(
                learnerIn(77, OTHER_COLLEGE), learnerIn(78, OTHER_COLLEGE), learnerIn(79, OTHER_COLLEGE)));
        Mockito.doThrow(new AccessDeniedException("Access denied to this college"))
                .when(accessControlService).requirePerformAdminActionForCollege(any(), anyInt());

        assertThrows(AccessDeniedException.class, () ->
                service.setBulkForLearners(collegeAdmin(), "electives", false, List.of(77, 78, 79), request));

        verify(appSettingsService, never()).upsert(anyString(), any(), anyString(), anyString());
    }

    @Test
    @DisplayName("REGRESSION: a selection containing an id that no longer exists is rejected, not silently skipped")
    void bulkRejectsUnknownLearnerIds() {
        when(accessControlService.isSuperAdmin(any())).thenReturn(true);
        // Two requested, one found — a stale selection must not report success for students it
        // never touched.
        when(learnerRepository.findAllById(any())).thenReturn(List.of(learnerIn(77, OWN_COLLEGE)));

        assertThrows(IllegalArgumentException.class, () ->
                service.setBulkForLearners(globalSuperAdmin(), "electives", false, List.of(77, 78), request));

        verify(appSettingsService, never()).upsert(anyString(), any(), anyString(), anyString());
    }

    @Test
    @DisplayName("bulk de-duplicates ids so the same student isn't written twice or double-counted in the audit")
    void bulkDeduplicatesIds() {
        when(accessControlService.isSuperAdmin(any())).thenReturn(true);
        when(learnerRepository.findAllById(any())).thenReturn(List.of(learnerIn(77, OWN_COLLEGE)));

        service.setBulkForLearners(globalSuperAdmin(), "electives", false, List.of(77, 77, 77), request);

        verify(appSettingsService, Mockito.times(1))
                .upsert(eq("LEARNER"), eq(77), eq("module.electives.enabled"), eq("false"));
    }

    private com._42students.lms.model.Learner learnerIn(int id, int collegeId) {
        com._42students.lms.model.Learner l = new com._42students.lms.model.Learner();
        l.setId(id);
        l.setCollegeId(collegeId);
        return l;
    }

    @Test
    @DisplayName("bulk rejects an unreasonably large selection rather than attempting it")
    void bulkRejectsOversizedSelection() {
        when(accessControlService.isSuperAdmin(any())).thenReturn(true);
        nodeBelongsTo(OWN_COLLEGE);
        List<Integer> tooMany = new java.util.ArrayList<>();
        for (int i = 1; i <= 1001; i++) tooMany.add(i);

        assertThrows(IllegalArgumentException.class, () ->
                service.setBulkForLearners(globalSuperAdmin(), "electives", false, tooMany, request));
    }

    @Test
    @DisplayName("an unknown module is rejected, not silently written as a new setting key")
    void unknownModuleRejected() {
        when(accessControlService.isSuperAdmin(any())).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () ->
                service.setValue(globalSuperAdmin(), "LEARNER", 77, "not-a-module", false, null, request));
        verify(appSettingsService, never()).upsert(anyString(), any(), anyString(), anyString());
    }

    @Test
    @DisplayName("REGRESSION: a rejected lock request writes nothing at all, not even the value change")
    void rejectedLockLeavesNoPartialWrite() {
        when(accessControlService.isSuperAdmin(any())).thenReturn(false);
        nodeBelongsTo(OWN_COLLEGE);

        assertThrows(AccessDeniedException.class, () ->
                service.setValue(collegeAdmin(), "LEARNER", 77, "electives", false, true, request));

        // The authority check used to run after the value write, so a request that failed still
        // applied half of what it asked for.
        verify(appSettingsService, never()).upsert(anyString(), any(), anyString(), anyString());
        verify(appSettingsService, never()).delete(anyString(), any(), anyString());
    }

    @Test
    @DisplayName("SECURITY REGRESSION: an org-scoped super-admin cannot write a college in ANOTHER organization")
    void orgScopedSuperAdminCannotCrossOrganizations() {
        when(accessControlService.isSuperAdmin(any())).thenReturn(true);
        nodeBelongsTo(OTHER_COLLEGE);
        // The other college belongs to org 99; the principal is scoped to org 7.
        com._42students.lms.model.College other = new com._42students.lms.model.College();
        other.setId(OTHER_COLLEGE);
        other.setOrgId(99);
        when(collegeRepository.findById(OTHER_COLLEGE)).thenReturn(java.util.Optional.of(other));
        UserPrincipal orgScoped = new UserPrincipal(1, "FACULTY", "ADMIN", 7, null, 0);

        // Previously this fell out of requireWithinSuperAdminScope with NO check at all, behind a
        // comment claiming chainFromNode already resolved it — it resolves the college but never
        // compares it to the principal's org.
        assertThrows(AccessDeniedException.class, () ->
                service.setValue(orgScoped, "LEARNER", 77, "electives", false, null, request));

        verify(appSettingsService, never()).upsert(anyString(), any(), anyString(), anyString());
    }

    @Test
    @DisplayName("an org-scoped super-admin CAN write a college inside their own organization")
    void orgScopedSuperAdminCanActWithinOwnOrg() {
        when(accessControlService.isSuperAdmin(any())).thenReturn(true);
        nodeBelongsTo(OWN_COLLEGE);
        com._42students.lms.model.College own = new com._42students.lms.model.College();
        own.setId(OWN_COLLEGE);
        own.setOrgId(7);
        when(collegeRepository.findById(OWN_COLLEGE)).thenReturn(java.util.Optional.of(own));
        UserPrincipal orgScoped = new UserPrincipal(1, "FACULTY", "ADMIN", 7, null, 0);

        service.setValue(orgScoped, "LEARNER", 77, "electives", false, null, request);

        verify(appSettingsService).upsert(eq("LEARNER"), eq(77), eq("module.electives.enabled"), eq("false"));
    }

    @Test
    @DisplayName("REGRESSION: clearing a value also clears its lock, so no dormant lock can re-arm later")
    void clearingValueAlsoClearsLock() {
        when(accessControlService.isSuperAdmin(any())).thenReturn(true);
        nodeBelongsTo(OWN_COLLEGE);

        service.setValue(globalSuperAdmin(), "DEPARTMENT", 12, "electives", null, null, request);

        // A lock with no value is inert -- but leaving it behind meant an innocuous set at this
        // node months later silently re-armed it, freezing everything beneath with no visible cause.
        verify(appSettingsService).delete(eq("DEPARTMENT"), eq(12), eq("module.electives.enabled"));
        verify(appSettingsService).delete(eq("DEPARTMENT"), eq(12), eq("module.electives.locked"));
    }

    @Test
    @DisplayName("locked learner value cannot be changed or cleared by college admin")
    void collegeAdminCannotMutateExistingSameNodeLock() {
        when(accessControlService.isSuperAdmin(any())).thenReturn(false);
        nodeBelongsTo(OWN_COLLEGE);
        when(appSettingsService.getSettingValue("LEARNER", 77, "module.electives.locked")).thenReturn("true");
        assertThrows(AccessDeniedException.class, () ->
                service.setValue(collegeAdmin(), "LEARNER", 77, "electives", true, null, request));
        assertThrows(AccessDeniedException.class, () ->
                service.setValue(collegeAdmin(), "LEARNER", 77, "electives", null, null, request));
        verify(appSettingsService, never()).upsert(anyString(), any(), anyString(), anyString());
        verify(appSettingsService, never()).delete(anyString(), any(), anyString());
    }

    @Test
    @DisplayName("orphan lock request must fail before any value or lock write")
    void superAdminCannotCreateOrphanLock() {
        when(accessControlService.isSuperAdmin(any())).thenReturn(true);
        nodeBelongsTo(OWN_COLLEGE);
        assertThrows(IllegalArgumentException.class, () ->
                service.setValue(globalSuperAdmin(), "LEARNER", 77, "electives", null, true, request));
        verify(appSettingsService, never()).upsert(anyString(), any(), anyString(), anyString());
        verify(appSettingsService, never()).delete(anyString(), any(), anyString());
    }

    @Test
    @DisplayName("bulk preflight rejects a locked learner before changing any selected learner")
    void collegeAdminBulkCannotOverwriteLockedLearner() {
        when(accessControlService.isSuperAdmin(any())).thenReturn(false);
        when(learnerRepository.findAllById(any())).thenReturn(List.of(learnerIn(77, OWN_COLLEGE), learnerIn(78, OWN_COLLEGE)));
        com._42students.lms.model.AppSetting locked = new com._42students.lms.model.AppSetting();
        locked.setScopeId(78);
        locked.setSettingKey("module.electives.locked");
        locked.setSettingValue("true");
        when(appSettingsService.findLearnerModuleLockRows(any())).thenReturn(List.of(locked));
        assertThrows(AccessDeniedException.class, () ->
                service.setBulkForLearners(collegeAdmin(), "electives", true, List.of(77, 78), request));
        verify(appSettingsService, never()).upsert(anyString(), any(), anyString(), anyString());
        verify(appSettingsService, never()).delete(anyString(), any(), anyString());
    }

    @Test
    @DisplayName("bulk inherit clears both the learner value and its dormant companion lock")
    void superAdminBulkInheritClearsLock() {
        when(accessControlService.isSuperAdmin(any())).thenReturn(true);
        when(learnerRepository.findAllById(any())).thenReturn(List.of(learnerIn(77, OWN_COLLEGE)));
        service.setBulkForLearners(globalSuperAdmin(), "electives", null, List.of(77), request);
        verify(appSettingsService).delete("LEARNER", 77, "module.electives.enabled");
        verify(appSettingsService).delete("LEARNER", 77, "module.electives.locked");
    }


    @Test
    @DisplayName("global super-admin cannot write nonexistent IDs for any of the seven scoped levels")
    void globalSuperAdminRejectsNonexistentScopeIds() {
        when(accessControlService.isSuperAdmin(any())).thenReturn(true);
        for (String level : List.of("ORGANIZATION", "COLLEGE", "DEPARTMENT", "PROGRAM", "BATCH", "CLASS", "LEARNER")) {
            assertThrows(IllegalArgumentException.class, () ->
                    service.setValue(globalSuperAdmin(), level, 999999, "projects", true, null, request));
        }
        verify(appSettingsService, never()).upsert(anyString(), any(), anyString(), anyString());
    }

    @Test
    @DisplayName("global super-admin cannot write a soft-deleted college")
    void globalSuperAdminRejectsSoftDeletedCollege() {
        when(accessControlService.isSuperAdmin(any())).thenReturn(true);
        com._42students.lms.model.College deleted = new com._42students.lms.model.College();
        deleted.setId(OTHER_COLLEGE);
        deleted.setIsDeleted(true);
        when(collegeRepository.findById(OTHER_COLLEGE)).thenReturn(java.util.Optional.of(deleted));
        assertThrows(IllegalArgumentException.class, () ->
                service.setValue(globalSuperAdmin(), "COLLEGE", OTHER_COLLEGE, "electives", true, null, request));
        verify(appSettingsService, never()).upsert(anyString(), any(), anyString(), anyString());
    }

    @Test
    @DisplayName("existing organization ID is writable by global super-admin")
    void globalSuperAdminCanWriteExistingOrganization() {
        when(accessControlService.isSuperAdmin(any())).thenReturn(true);
        com._42students.lms.model.Organization org = new com._42students.lms.model.Organization();
        org.setId(2);
        when(organizationRepository.findById(2)).thenReturn(java.util.Optional.of(org));
        nodeBelongsTo(OWN_COLLEGE);
        service.setValue(globalSuperAdmin(), "ORGANIZATION", 2, "projects", false, null, request);
        verify(appSettingsService).upsert("ORGANIZATION", 2, "module.projects.enabled", "false");
    }

}
