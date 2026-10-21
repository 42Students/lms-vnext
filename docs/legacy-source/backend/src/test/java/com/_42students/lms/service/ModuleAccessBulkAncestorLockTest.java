package com._42students.lms.service;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.model.Learner;
import com._42students.lms.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Bulk changes must respect exactly the ancestor locks enforced by single-node edits. */
class ModuleAccessBulkAncestorLockTest {
    private final AppSettingsService settings = Mockito.mock(AppSettingsService.class);
    private final ModuleAccessResolver resolver = Mockito.mock(ModuleAccessResolver.class);
    private final AccessControlService access = Mockito.mock(AccessControlService.class);
    private final AdminAuditLogService audit = Mockito.mock(AdminAuditLogService.class);
    private final com._42students.lms.repository.LearnerRepository learners =
            Mockito.mock(com._42students.lms.repository.LearnerRepository.class);
    private final com._42students.lms.repository.CollegeRepository colleges =
            Mockito.mock(com._42students.lms.repository.CollegeRepository.class);
    private final HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
    private final UserPrincipal superAdmin = new UserPrincipal(1, "FACULTY", "ADMIN", null, null, 0);
    private ModuleAccessService service;

    private Learner learner(int id, int classId) {
        Learner learner = new Learner();
        learner.setId(id);
        learner.setCollegeId(5);
        learner.setClassId(classId);
        return learner;
    }

    @BeforeEach
    void setUp() {
        com._42students.lms.model.College existing = new com._42students.lms.model.College();
        existing.setId(5);
        Mockito.lenient().when(colleges.findById(5)).thenReturn(java.util.Optional.of(existing));
        service = new ModuleAccessService(settings, resolver, access, audit,
                Mockito.mock(com._42students.lms.repository.DepartmentRepository.class),
                Mockito.mock(com._42students.lms.repository.NewProgramRepository.class),
                Mockito.mock(com._42students.lms.repository.BatchRepository.class),
                Mockito.mock(com._42students.lms.repository._ClassRepository.class),
                learners,
                colleges,
                Mockito.mock(com._42students.lms.repository.OrganizationRepository.class),
                Mockito.mock(com._42students.lms.repository.FacultyRepository.class));
        when(access.isSuperAdmin(any())).thenReturn(true);
        when(resolver.chainForLearner(any())).thenAnswer(invocation -> {
            Learner learner = invocation.getArgument(0);
            return List.of(
                    new ModuleAccessResolver.ScopeRef("LEARNER", learner.getId()),
                    new ModuleAccessResolver.ScopeRef("CLASS", learner.getClassId()),
                    new ModuleAccessResolver.ScopeRef("COLLEGE", learner.getCollegeId()),
                    new ModuleAccessResolver.ScopeRef("GLOBAL", null));
        });
        when(resolver.fetchRowsForScopes(anyList(), anyList())).thenReturn(List.of());
    }

    private void decision(String module, int lockedClass) {
        when(resolver.resolveAll(anyList(), anyList())).thenAnswer(invocation -> {
            List<ModuleAccessResolver.ScopeRef> chain = invocation.getArgument(0);
            boolean locked = chain.stream().anyMatch(ref ->
                    "CLASS".equals(ref.scopeType) && Integer.valueOf(lockedClass).equals(ref.scopeId));
            return Map.of(module, new ModuleAccessResolver.Resolution(!locked,
                    locked ? "CLASS" : "DEFAULT", locked ? lockedClass : null, locked));
        });
    }

    @Test
    void oneLockedClassRejectsEntireMixedCollegeSelectionBeforeAnyWrite() {
        when(learners.findAllById(any())).thenReturn(List.of(learner(77, 10), learner(78, 20)));
        decision("electives", 20);

        assertThrows(AccessDeniedException.class, () ->
                service.setBulkForLearners(superAdmin, "electives", true, List.of(77, 78), request));

        verify(settings, never()).upsert(anyString(), any(), anyString(), anyString());
        verify(settings, never()).delete(anyString(), any(), anyString());
        verify(audit, never()).logRequired(any(), anyString(), anyString(), any(), any(), any(), any());
        verify(resolver, times(1)).fetchRowsForScopes(anyList(), anyList());
    }

    @Test
    void projectsLockedAncestorRejectsEvenSuperAdminBulkOff() {
        when(learners.findAllById(any())).thenReturn(List.of(learner(77, 20)));
        decision("projects", 20);
        assertThrows(AccessDeniedException.class, () ->
                service.setBulkForLearners(superAdmin, "projects", false, List.of(77), request));
        verify(settings, never()).upsert(anyString(), any(), anyString(), anyString());
    }

    @Test
    void sharedClassUsesSingleHierarchyLookupAndSingleSettingsFetch() {
        when(learners.findAllById(any())).thenReturn(List.of(learner(77, 10), learner(78, 10)));
        decision("electives", 20);
        Map<String, Object> result = service.setBulkForLearners(
                superAdmin, "electives", false, List.of(77, 78), request);
        assertEquals(2, result.get("updated"));
        verify(resolver, times(1)).chainForLearner(any());
        verify(resolver, times(1)).fetchRowsForScopes(anyList(), anyList());
        verify(settings).upsert("LEARNER", 77, "module.electives.enabled", "false");
        verify(settings).upsert("LEARNER", 78, "module.electives.enabled", "false");
    }

    @Test
    void inheritMayClearShadowedLearnerValuesWithoutRearmingAnAncestor() {
        when(learners.findAllById(any())).thenReturn(List.of(learner(77, 20)));
        Map<String, Object> result = service.setBulkForLearners(
                superAdmin, "electives", null, List.of(77), request);
        assertEquals(1, result.get("updated"));
        verify(settings).delete("LEARNER", 77, "module.electives.enabled");
        verify(settings).delete("LEARNER", 77, "module.electives.locked");
        verify(resolver, never()).chainForLearner(any());
        verify(resolver, never()).fetchRowsForScopes(anyList(), anyList());
    }

    @Test
    void missingAncestorResolutionRejectsInsteadOfAssumingUnlocked() {
        when(learners.findAllById(any())).thenReturn(List.of(learner(77, 10)));
        when(resolver.resolveAll(anyList(), anyList())).thenReturn(Map.of());
        assertThrows(AccessDeniedException.class, () ->
                service.setBulkForLearners(superAdmin, "electives", true, List.of(77), request));
        verify(settings, never()).upsert(anyString(), any(), anyString(), anyString());
    }
}
