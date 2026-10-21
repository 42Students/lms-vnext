package com._42students.lms.service;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.repository.*;
import com._42students.lms.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

/** All seven module-management operations deny non-superadmins before accessing persistence. */
class ModuleAccessSuperAdminOnlyTest {
    private final AppSettingsService settings = mock(AppSettingsService.class);
    private final ModuleAccessResolver resolver = mock(ModuleAccessResolver.class);
    private final AccessControlService access = mock(AccessControlService.class);
    private final AdminAuditLogService audit = mock(AdminAuditLogService.class);
    private final DepartmentRepository departments = mock(DepartmentRepository.class);
    private final NewProgramRepository programs = mock(NewProgramRepository.class);
    private final BatchRepository batches = mock(BatchRepository.class);
    private final _ClassRepository classes = mock(_ClassRepository.class);
    private final LearnerRepository learners = mock(LearnerRepository.class);
    private final CollegeRepository colleges = mock(CollegeRepository.class);
    private final OrganizationRepository organizations = mock(OrganizationRepository.class);
    private final FacultyRepository faculty = mock(FacultyRepository.class);
    private final HttpServletRequest request = mock(HttpServletRequest.class);
    private ModuleAccessService service;

    @BeforeEach
    void setUp() {
        service = new ModuleAccessService(settings, resolver, access, audit, departments,
                programs, batches, classes, learners, colleges, organizations, faculty);
    }

    private void assertDeniedBeforeDataAccess(UserPrincipal principal) {
        assertThrows(AccessDeniedException.class, () -> service.getCollegeTree(principal, 5));
        assertThrows(AccessDeniedException.class, () -> service.getNode(principal, "COLLEGE", 5));
        assertThrows(AccessDeniedException.class, () -> service.listLearnerOverrides(principal, 5));
        assertThrows(AccessDeniedException.class, () -> service.listHistory(principal, 5, 10));
        assertThrows(AccessDeniedException.class, () -> service.explainForLearner(principal, 77));
        assertThrows(AccessDeniedException.class, () ->
                service.setValue(principal, "LEARNER", 77, "projects", true, null, request));
        assertThrows(AccessDeniedException.class, () ->
                service.setBulkForLearners(principal, "electives", true, List.of(77), request));
        verifyNoInteractions(settings, resolver, audit, departments, programs, batches, classes,
                learners, colleges, organizations, faculty);
    }

    @Test
    void collegeAdminCannotManageModulesEvenWithinOwnCollege() {
        assertDeniedBeforeDataAccess(new UserPrincipal(11, "FACULTY", "ADMIN", null, 5, 0));
    }

    @Test
    void ordinaryFacultyCannotManageModules() {
        assertDeniedBeforeDataAccess(new UserPrincipal(12, "FACULTY", "TEACHER", null, 5, 0));
    }

    @Test
    void learnerCannotManageModules() {
        assertDeniedBeforeDataAccess(new UserPrincipal(77, "LEARNER", null, null, 5, 0));
    }

    @Test
    void absentPrincipalCannotManageModules() {
        assertDeniedBeforeDataAccess(null);
    }

    @Test
    void invalidArgumentsNeverDiscloseValidationDetailsToUnauthorizedUsers() {
        UserPrincipal admin = new UserPrincipal(11, "FACULTY", "ADMIN", null, 5, 0);
        assertThrows(AccessDeniedException.class, () -> service.getNode(admin, null, null));
        assertThrows(AccessDeniedException.class, () ->
                service.setValue(admin, null, null, "invalid-module", true, null, request));
        assertThrows(AccessDeniedException.class, () ->
                service.setBulkForLearners(admin, "invalid-module", true, null, request));
        verifyNoInteractions(settings, resolver, audit, departments, programs, batches, classes,
                learners, colleges, organizations, faculty);
    }
}
