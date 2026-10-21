package com._42students.lms.access;

import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.*;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AccessControlService covering plan edge cases:
 * Pass 1: null principal, null ids, super-admin vs others, faculty-with-org/collegeAdmin null org/college.
 * Pass 2: resolution returns null (invalid/missing id) → deny.
 * Pass 3: cross-tenant (different college/org), learner self vs other, require* throws.
 */
class AccessControlServiceTest {

    private ScopeResolutionService scopeResolutionService;
    private FacultyTeachingAssignmentRepository facultyTeachingAssignmentRepository;
    private AccessControlService accessControlService;

    @BeforeEach
    void setUp() {
        scopeResolutionService = mock(ScopeResolutionService.class);
        facultyTeachingAssignmentRepository = mock(FacultyTeachingAssignmentRepository.class);
        when(facultyTeachingAssignmentRepository.findFirstByCourseIdAndClassIdAndIsActive(anyInt(), anyInt(), eq(true)))
                .thenReturn(Optional.empty());
        accessControlService = new AccessControlService(scopeResolutionService, facultyTeachingAssignmentRepository);
    }

    // Super-admin authority is the explicit signed capability, not id 0 (remaining-audit-fixes SA-SYS-003).
    private static UserPrincipal superAdmin() {
        return UserPrincipal.forSuperAdmin();
    }

    private static UserPrincipal collegeAdmin(int collegeId) {
        return new UserPrincipal(10, "FACULTY", "ADMIN", null, collegeId, 0);
    }

    private static UserPrincipal facultyWithOrg(int orgId) {
        return new UserPrincipal(20, "FACULTY", "TEACHER", orgId, null, 0);
    }

    private static UserPrincipal faculty(int collegeId) {
        return new UserPrincipal(30, "FACULTY", "TEACHER", null, collegeId, 0);
    }

    private static UserPrincipal learner(int learnerId, int collegeId) {
        return new UserPrincipal(learnerId, "LEARNER", null, 1, collegeId, 0);
    }

    @Nested
    @DisplayName("isSuperAdmin")
    class IsSuperAdmin {
        @Test
        void nullPrincipal_isNotSuperAdmin() {
            assertFalse(accessControlService.isSuperAdmin(null));
        }

        @Test
        void explicitCapability_isSuperAdmin() {
            assertTrue(accessControlService.isSuperAdmin(superAdmin()));
        }

        @Test
        void idZeroWithoutCapability_isNotSuperAdmin() {
            assertFalse(accessControlService.isSuperAdmin(new UserPrincipal(0, "FACULTY", "ADMIN", null, null, 0)));
        }

        @Test
        void idNonZero_isNotSuperAdmin() {
            assertFalse(accessControlService.isSuperAdmin(collegeAdmin(1)));
        }

        @Test
        void principalWithNullId_isNotSuperAdmin() {
            UserPrincipal p = new UserPrincipal(null, "FACULTY", "ADMIN", null, 1, 0);
            assertFalse(accessControlService.isSuperAdmin(p));
        }
    }

    @Nested
    @DisplayName("Faculty schedule: role-typed self and tenant isolation")
    class FacultyScheduleRoleBoundary {
        @Test
        void learnerIdCollisionWithForeignFacultyMustNotGrantSelf() {
            when(scopeResolutionService.resolveFacultyToCollegeId(42)).thenReturn(8);
            assertFalse(accessControlService.canAccessFacultySchedule(learner(42, 7), 42));
            verify(scopeResolutionService).resolveFacultyToCollegeId(42);
        }

        @Test
        void actualFacultySelfRemainsAllowed() {
            UserPrincipal self = new UserPrincipal(42, "FACULTY", "TEACHER", null, 7, 0);
            assertTrue(accessControlService.canAccessFacultySchedule(self, 42));
        }

        @Test
        void unrelatedFacultyMustRemainInCollege() {
            when(scopeResolutionService.resolveFacultyToCollegeId(42)).thenReturn(8);
            assertFalse(accessControlService.canAccessFacultySchedule(faculty(7), 42));
            assertTrue(accessControlService.canAccessFacultySchedule(faculty(8), 42));
        }
    }

    @Nested
    @DisplayName("canAccessCollege")
    class CanAccessCollege {
        @Test
        void nullPrincipal_deny() {
            assertFalse(accessControlService.canAccessCollege(null, 1));
        }

        @Test
        void superAdmin_allowAnyNonNullCollege() {
            assertTrue(accessControlService.canAccessCollege(superAdmin(), 1));
            assertTrue(accessControlService.canAccessCollege(superAdmin(), 999));
        }

        @Test
        void superAdmin_nullCollegeId_allowed() {
            assertTrue(accessControlService.canAccessCollege(superAdmin(), null));
        }

        @Test
        void collegeAdmin_sameCollege_allowed() {
            assertTrue(accessControlService.canAccessCollege(collegeAdmin(5), 5));
        }

        @Test
        void collegeAdmin_differentCollege_denied() {
            assertFalse(accessControlService.canAccessCollege(collegeAdmin(5), 6));
        }

        @Test
        void collegeAdmin_nullCollegeId_denied() {
            assertFalse(accessControlService.canAccessCollege(collegeAdmin(5), null));
        }

        @Test
        void faculty_sameCollege_allowed() {
            assertTrue(accessControlService.canAccessCollege(faculty(7), 7));
        }

        @Test
        void faculty_differentCollege_denied() {
            assertFalse(accessControlService.canAccessCollege(faculty(7), 8));
        }

        @Test
        void learner_sameCollege_allowed() {
            assertTrue(accessControlService.canAccessCollege(learner(1, 9), 9));
        }

        @Test
        void learner_differentCollege_denied() {
            assertFalse(accessControlService.canAccessCollege(learner(1, 9), 10));
        }

        @Test
        void facultyWithOrgNullCollege_deniedForCollege() {
            assertFalse(accessControlService.canAccessCollege(facultyWithOrg(1), 1));
        }

        @Test
        void principalWithNullCollegeId_nonSuperAdmin_denied() {
            UserPrincipal p = new UserPrincipal(1, "FACULTY", "TEACHER", null, null, 0);
            assertFalse(accessControlService.canAccessCollege(p, 1));
        }
    }

    @Nested
    @DisplayName("canAccessOrganization")
    class CanAccessOrganization {
        @Test
        void nullPrincipal_deny() {
            assertFalse(accessControlService.canAccessOrganization(null, 1));
        }

        @Test
        void superAdmin_allowAnyNonNullOrg() {
            assertTrue(accessControlService.canAccessOrganization(superAdmin(), 1));
        }

        @Test
        void nullOrgId_deny() {
            assertFalse(accessControlService.canAccessOrganization(superAdmin(), null));
        }

        @Test
        void facultyWithOrg_sameOrg_denied() {
            assertFalse(accessControlService.canAccessOrganization(facultyWithOrg(3), 3));
        }

        @Test
        void facultyWithOrg_differentOrg_denied() {
            assertFalse(accessControlService.canAccessOrganization(facultyWithOrg(3), 4));
        }

        @Test
        void collegeAdmin_deniedForOrg_whenResolutionReturnsNull() {
            // When resolveCollegeToOrganizationId is not stubbed or returns null, college admin is denied
            assertFalse(accessControlService.canAccessOrganization(collegeAdmin(1), 1));
        }

        @Test
        void collegeAdmin_allowedForOrg_whenCollegeResolvesToThatOrg() {
            when(scopeResolutionService.resolveCollegeToOrganizationId(1)).thenReturn(1);
            assertTrue(accessControlService.canAccessOrganization(collegeAdmin(1), 1));
        }

        @Test
        void collegeAdmin_deniedForOrg_whenCollegeResolvesToDifferentOrg() {
            when(scopeResolutionService.resolveCollegeToOrganizationId(1)).thenReturn(2);
            assertFalse(accessControlService.canAccessOrganization(collegeAdmin(1), 1));
        }

        @Test
        void facultyWithOrg_nullOrgId_denied() {
            assertFalse(accessControlService.canAccessOrganization(facultyWithOrg(1), null));
        }

        @Test
        void facultyWithOrg_principalNullOrgId_deniedForAnyOrg() {
            UserPrincipal facultyNoOrg = new UserPrincipal(20, "FACULTY", "TEACHER", null, null, 0);
            assertFalse(accessControlService.canAccessOrganization(facultyNoOrg, 1));
        }
    }

    @Nested
    @DisplayName("canAccessLearner")
    class CanAccessLearner {
        @Test
        void nullPrincipal_deny() {
            assertFalse(accessControlService.canAccessLearner(null, 1));
        }

        @Test
        void nullLearnerId_deny() {
            assertFalse(accessControlService.canAccessLearner(learner(1, 1), null));
        }

        @Test
        void superAdmin_allowAny() {
            when(scopeResolutionService.resolveLearnerToCollegeId(anyInt())).thenReturn(1);
            assertTrue(accessControlService.canAccessLearner(superAdmin(), 99));
        }

        @Test
        void learner_self_allowed() {
            assertTrue(accessControlService.canAccessLearner(learner(42, 1), 42));
        }

        @Test
        void learner_other_denied() {
            assertFalse(accessControlService.canAccessLearner(learner(42, 1), 43));
        }

        @Test
        void faculty_canAccessLearnerCollege_allowed() {
            when(scopeResolutionService.resolveLearnerToCollegeId(100)).thenReturn(5);
            assertTrue(accessControlService.canAccessLearner(faculty(5), 100));
        }

        @Test
        void faculty_learnerDifferentCollege_denied() {
            when(scopeResolutionService.resolveLearnerToCollegeId(100)).thenReturn(6);
            assertFalse(accessControlService.canAccessLearner(faculty(5), 100));
        }

        @Test
        void faculty_learnerUnresolved_denied() {
            when(scopeResolutionService.resolveLearnerToCollegeId(100)).thenReturn(null);
            assertFalse(accessControlService.canAccessLearner(faculty(5), 100));
        }

        @Test
        void learner_principalNullId_deniedForSelf() {
            UserPrincipal learnerNullId = new UserPrincipal(null, "LEARNER", null, 1, 1, 0);
            assertFalse(accessControlService.canAccessLearner(learnerNullId, 42));
        }

        @Test
        void facultyWithCollege_canAccessLearnerInSameCollege_allowed() {
            when(scopeResolutionService.resolveLearnerToCollegeId(100)).thenReturn(5);
            UserPrincipal facultyWithCollege = new UserPrincipal(20, "FACULTY", "TEACHER", 1, 5, 0);
            assertTrue(accessControlService.canAccessLearner(facultyWithCollege, 100));
        }
    }

    @Nested
    @DisplayName("canPerformAdminActionForCollege")
    class CanPerformAdminActionForCollege {
        @Test
        void superAdmin_allowAnyNonNullCollege() {
            assertTrue(accessControlService.canPerformAdminActionForCollege(superAdmin(), 1));
        }

        @Test
        void collegeAdmin_sameCollege_allowed() {
            assertTrue(accessControlService.canPerformAdminActionForCollege(collegeAdmin(5), 5));
        }

        @Test
        void collegeAdmin_differentCollege_denied() {
            assertFalse(accessControlService.canPerformAdminActionForCollege(collegeAdmin(5), 6));
        }

        @Test
        void facultyNotAdmin_denied() {
            assertFalse(accessControlService.canPerformAdminActionForCollege(faculty(5), 5));
        }

        @Test
        void nullCollegeId_deniedForCollegeAdmin_globalSuperAdminRetainsOverride() {
            assertFalse(accessControlService.canPerformAdminActionForCollege(collegeAdmin(1), null));
            assertTrue(accessControlService.canPerformAdminActionForCollege(superAdmin(), null));
        }

        @Test
        void nullPrincipal_denied() {
            assertFalse(accessControlService.canPerformAdminActionForCollege(null, 1));
        }
    }

    @Nested
    @DisplayName("canAccessDepartment - Pass 2: resolution null or valid")
    class CanAccessDepartment {
        @Test
        void nullPrincipal_denied() {
            assertFalse(accessControlService.canAccessDepartment(null, 1));
        }

        @Test
        void nullDeptId_denied() {
            assertFalse(accessControlService.canAccessDepartment(collegeAdmin(1), null));
        }

        @Test
        void resolutionReturnsNull_denied() {
            when(scopeResolutionService.resolveDepartmentToCollegeId(999)).thenReturn(null);
            assertFalse(accessControlService.canAccessDepartment(collegeAdmin(1), 999));
        }

        @Test
        void resolutionReturnsCollege_principalCanAccessCollege_allowed() {
            when(scopeResolutionService.resolveDepartmentToCollegeId(1)).thenReturn(5);
            assertTrue(accessControlService.canAccessDepartment(collegeAdmin(5), 1));
        }

        @Test
        void resolutionReturnsCollege_principalDifferentCollege_denied() {
            when(scopeResolutionService.resolveDepartmentToCollegeId(1)).thenReturn(5);
            assertFalse(accessControlService.canAccessDepartment(collegeAdmin(6), 1));
        }
    }

    @Nested
    @DisplayName("canAccessProgram - Pass 2: resolution null or valid")
    class CanAccessProgram {
        @Test
        void nullPrincipal_denied() {
            assertFalse(accessControlService.canAccessProgram((UserPrincipal) null, 1));
            assertFalse(accessControlService.canAccessProgram((UserPrincipal) null, 1L));
        }

        @Test
        void nullProgramId_denied() {
            assertFalse(accessControlService.canAccessProgram(collegeAdmin(1), (Integer) null));
            assertFalse(accessControlService.canAccessProgram(collegeAdmin(1), (Long) null));
        }

        @Test
        void resolutionReturnsNull_denied() {
            when(scopeResolutionService.resolveProgramToCollegeId(999)).thenReturn(null);
            when(scopeResolutionService.resolveProgramToCollegeId(999L)).thenReturn(null);
            assertFalse(accessControlService.canAccessProgram(collegeAdmin(1), 999));
            assertFalse(accessControlService.canAccessProgram(collegeAdmin(1), 999L));
        }

        @Test
        void resolutionReturnsCollege_principalDifferentCollege_denied() {
            when(scopeResolutionService.resolveProgramToCollegeId(1)).thenReturn(6);
            assertFalse(accessControlService.canAccessProgram(collegeAdmin(5), 1));
        }

        @Test
        void resolutionReturnsCollege_principalCanAccess_allowed() {
            when(scopeResolutionService.resolveProgramToCollegeId(1)).thenReturn(5);
            assertTrue(accessControlService.canAccessProgram(collegeAdmin(5), 1));
        }
    }

    @Nested
    @DisplayName("canAccessClass - Pass 2: resolution null or valid")
    class CanAccessClass {
        @Test
        void nullPrincipal_denied() {
            assertFalse(accessControlService.canAccessClass(null, 1));
        }

        @Test
        void nullClassId_denied() {
            assertFalse(accessControlService.canAccessClass(collegeAdmin(1), null));
        }

        @Test
        void resolutionReturnsNull_denied() {
            when(scopeResolutionService.resolveClassToCollegeId(999)).thenReturn(null);
            assertFalse(accessControlService.canAccessClass(collegeAdmin(1), 999));
        }

        @Test
        void resolutionReturnsCollege_principalCanAccess_allowed() {
            when(scopeResolutionService.resolveClassToCollegeId(1)).thenReturn(5);
            assertTrue(accessControlService.canAccessClass(collegeAdmin(5), 1));
        }
    }

    @Nested
    @DisplayName("canAccessBatch - Pass 2: resolution null or valid")
    class CanAccessBatch {
        @Test
        void nullPrincipal_denied() {
            assertFalse(accessControlService.canAccessBatch(null, 1L));
        }

        @Test
        void nullBatchId_denied() {
            assertFalse(accessControlService.canAccessBatch(collegeAdmin(1), null));
        }

        @Test
        void resolutionReturnsNull_denied() {
            when(scopeResolutionService.resolveBatchToCollegeId(999L)).thenReturn(null);
            assertFalse(accessControlService.canAccessBatch(collegeAdmin(1), 999L));
        }

        @Test
        void resolutionReturnsCollege_principalCanAccess_allowed() {
            when(scopeResolutionService.resolveBatchToCollegeId(1L)).thenReturn(5);
            assertTrue(accessControlService.canAccessBatch(collegeAdmin(5), 1L));
        }
    }

    @Nested
    @DisplayName("canAccessCourse current audience")
    class CanAccessCourseCurrentAudience {
        @Test
        void futureSemesterCourseInSameProgramDoesNotGrantAccess() {
            UserPrincipal p = learner(42, 1);
            when(scopeResolutionService.resolveLearnerToClassIds(42)).thenReturn(java.util.List.of(7));
            when(scopeResolutionService.isClassCurrentlyEligibleForCourse(7, 501)).thenReturn(false);

            assertFalse(accessControlService.canAccessCourse(p, 501));
            verify(scopeResolutionService).isClassCurrentlyEligibleForCourse(7, 501);
        }

        @Test
        void liveElectiveBackedAudienceCanGrantCourseAccess() {
            UserPrincipal p = learner(42, 1);
            when(scopeResolutionService.resolveLearnerToClassIds(42)).thenReturn(java.util.List.of(7, 70));
            when(scopeResolutionService.isClassCurrentlyEligibleForCourse(7, 506)).thenReturn(false);
            when(scopeResolutionService.isClassCurrentlyEligibleForCourse(70, 506)).thenReturn(true);

            assertTrue(accessControlService.canAccessCourse(p, 506));
        }

        @Test
        void newTargetGuardFailsClosedWhenClassIsNotCurrentlyEligible() {
            when(scopeResolutionService.isClassCurrentlyEligibleForCourse(7, 501)).thenReturn(false);
            org.springframework.web.server.ResponseStatusException ex = assertThrows(
                    org.springframework.web.server.ResponseStatusException.class,
                    () -> accessControlService.requireCurrentCourseAudienceClass(7, 501));
            assertEquals(org.springframework.http.HttpStatus.BAD_REQUEST, ex.getStatus());
        }
    }

    @Nested
    @DisplayName("require* throw AccessDeniedException")
    class RequireThrows {
        @Test
        void requireAccessCollege_denied_throws() {
            assertThrows(AccessDeniedException.class, () ->
                    accessControlService.requireAccessCollege(collegeAdmin(1), 2));
        }

        @Test
        void requireAccessCollege_allowed_doesNotThrow() {
            assertDoesNotThrow(() ->
                    accessControlService.requireAccessCollege(collegeAdmin(1), 1));
        }

        @Test
        void requireAccessCollege_nullPrincipal_throws() {
            assertThrows(AccessDeniedException.class, () ->
                    accessControlService.requireAccessCollege(null, 1));
        }

        @Test
        void requireSuperAdmin_notSuperAdmin_throws() {
            assertThrows(AccessDeniedException.class, () ->
                    accessControlService.requireSuperAdmin(collegeAdmin(1)));
        }

        @Test
        void requireSuperAdmin_superAdmin_doesNotThrow() {
            assertDoesNotThrow(() ->
                    accessControlService.requireSuperAdmin(superAdmin()));
        }

        @Test
        void requireSuperAdmin_nullPrincipal_throws() {
            assertThrows(AccessDeniedException.class, () ->
                    accessControlService.requireSuperAdmin(null));
        }

        @Test
        void requireAccessOrganization_denied_throws() {
            assertThrows(AccessDeniedException.class, () ->
                    accessControlService.requireAccessOrganization(collegeAdmin(1), 1));
        }

        @Test
        void requireAccessLearner_denied_throws() {
            assertThrows(AccessDeniedException.class, () ->
                    accessControlService.requireAccessLearner(learner(42, 1), 43));
        }

        @Test
        void requireAccessDepartment_resolutionNull_throws() {
            when(scopeResolutionService.resolveDepartmentToCollegeId(999)).thenReturn(null);
            assertThrows(AccessDeniedException.class, () ->
                    accessControlService.requireAccessDepartment(collegeAdmin(1), 999));
        }

        @Test
        void requireAccessProgram_resolutionNull_throws() {
            when(scopeResolutionService.resolveProgramToCollegeId(999)).thenReturn(null);
            assertThrows(AccessDeniedException.class, () ->
                    accessControlService.requireAccessProgram(collegeAdmin(1), 999));
        }

        @Test
        void requireAccessClass_resolutionNull_returns404() {
            when(scopeResolutionService.resolveClassToCollegeId(999)).thenReturn(null);
            org.springframework.web.server.ResponseStatusException failure = assertThrows(
                    org.springframework.web.server.ResponseStatusException.class, () ->
                            accessControlService.requireAccessClass(collegeAdmin(1), 999));
            assertEquals(org.springframework.http.HttpStatus.NOT_FOUND, failure.getStatus());
        }

        @Test
        void requireAccessBatch_resolutionNull_throws() {
            when(scopeResolutionService.resolveBatchToCollegeId(999L)).thenReturn(null);
            assertThrows(AccessDeniedException.class, () ->
                    accessControlService.requireAccessBatch(collegeAdmin(1), 999L));
        }

        @Test
        void requirePerformAdminActionForCollege_denied_throws() {
            assertThrows(AccessDeniedException.class, () ->
                    accessControlService.requirePerformAdminActionForCollege(faculty(5), 5));
        }
    }
}
