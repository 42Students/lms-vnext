package com._42students.lms.search.learners;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CollegeAdminLearnerDirectoryBoundaryTest {
    private LearnerSearchController controller;
    private LearnerSearchCache cache;
    private SecurityContextUtil security;
    private AccessControlService access;
    private UserPrincipal admin;

    private LearnerSearchDTO learner(int id, int college, int org, int program, int clazz, String name) {
        LearnerSearchDTO dto = new LearnerSearchDTO();
        dto.setId(id);
        dto.setCollegeId(college);
        dto.setOrganizationId(org);
        dto.setProgramId(program);
        dto.setClassId(clazz);
        dto.setFirstName(name);
        dto.setRollNumber("ROLL-" + id);
        dto.setContactMail("private@example.com");
        return dto;
    }

    @BeforeEach
    void setup() {
        controller = new LearnerSearchController();
        cache = mock(LearnerSearchCache.class);
        security = mock(SecurityContextUtil.class);
        access = mock(AccessControlService.class);
        admin = new UserPrincipal(8, "ADMIN", null, 2, 9, 0);
        ReflectionTestUtils.setField(controller, "learnerSearchCache", cache);
        ReflectionTestUtils.setField(controller, "securityContextUtil", security);
        ReflectionTestUtils.setField(controller, "accessControlService", access);
        ReflectionTestUtils.setField(controller, "facultyTeachingAssignmentRepository", mock(FacultyTeachingAssignmentRepository.class));
        when(security.getAuthenticatedUserPrincipal()).thenReturn(admin);
    }

    @Test
    void queryFiltersBeforeLimitRatherThanDiscardingMatchesAfterFirstPage() {
        when(cache.getAllItems()).thenReturn(List.of(
                learner(1, 9, 2, 3, 4, "Alice"),
                learner(2, 9, 2, 3, 4, "Needle")));
        var result = controller.search("needle", 1, 9, null, null);
        assertEquals(1, result.getBody().getData().size());
        assertEquals(2, result.getBody().getData().get(0).getId());
    }

    @Test
    void combinedFiltersCannotBeBypassedByChoosingCollegeFirst() {
        when(cache.getAllItems()).thenReturn(List.of(
                learner(1, 9, 2, 3, 4, "Alice"),
                learner(2, 9, 2, 4, 5, "Bob"),
                learner(3, 10, 2, 3, 4, "Carol")));
        var result = controller.search("", 20, 9, 3, 4);
        assertEquals(1, result.getBody().getData().size());
        assertEquals(1, result.getBody().getData().get(0).getId());
    }

    @Test
    void popularFiltersTenantBeforeApplyingLimit() {
        LearnerSearchDTO outsider = learner(1, 10, 3, 3, 4, "Outsider");
        LearnerSearchDTO local = learner(2, 9, 2, 3, 4, "Local");
        when(cache.getAllItems()).thenReturn(List.of(outsider, local));
        when(cache.size()).thenReturn(2);
        when(cache.getPopular(2)).thenReturn(List.of(outsider, local));
        var result = controller.getPopular(1, null);
        assertEquals(1, result.getBody().getData().size());
        assertEquals(2, result.getBody().getData().get(0).getId());
    }

    @Test
    void popularHonorsRequestedCollegeBeforeApplyingLimit() {
        UserPrincipal global = new UserPrincipal(0, "FACULTY", "SUPER_ADMIN", null, null, null);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(global);
        when(access.isSuperAdmin(global)).thenReturn(true);
        LearnerSearchDTO firstCollege = learner(1, 10, 3, 3, 4, "First");
        LearnerSearchDTO secondCollege = learner(2, 9, 2, 3, 4, "Second");
        when(cache.getAllItems()).thenReturn(List.of(firstCollege, secondCollege));
        when(cache.size()).thenReturn(2);
        when(cache.getPopular(2)).thenReturn(List.of(firstCollege, secondCollege));

        var result = controller.getPopular(1, 9);

        assertEquals(1, result.getBody().getData().size());
        assertEquals(2, result.getBody().getData().get(0).getId());
        verify(access).requireAccessCollege(global, 9);
    }

    @Test
    void learnerCannotEnumeratePeerDirectory() {
        when(security.getAuthenticatedUserPrincipal()).thenReturn(new UserPrincipal(8, "LEARNER", null, 2, 9, 0));
        assertThrows(AccessDeniedException.class, () -> controller.search("", 15, 9, null, null));
        verify(cache, never()).getAllItems();
    }

    @Test
    void adminCannotQueryAnotherCollegeEvenIfSearchAccessMockPermitsFilter() {
        when(cache.getAllItems()).thenReturn(List.of(learner(1, 10, 2, 3, 4, "Outsider")));
        var result = controller.search("", 15, 10, null, null);
        assertTrue(result.getBody().getData().isEmpty());
    }

    @Test
    void classDirectoryDoesNotRevealContactDetailsToAssignedFaculty() {
        UserPrincipal faculty = new UserPrincipal(16, "FACULTY", "LECTURER", 2, 9, 0);
        var assignments = mock(FacultyTeachingAssignmentRepository.class);
        com._42students.lms.model.FacultyTeachingAssignment assignment = new com._42students.lms.model.FacultyTeachingAssignment();
        assignment.setClassId(4);
        when(assignments.findByFacultyIdAndIsActive(16, true)).thenReturn(List.of(assignment));
        ReflectionTestUtils.setField(controller, "facultyTeachingAssignmentRepository", assignments);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(faculty);
        when(cache.getAllItems()).thenReturn(List.of(learner(1, 9, 2, 3, 4, "Alice")));
        var result = controller.getByClass(4, 5);
        assertEquals(1, result.getBody().getData().size());
        assertNull(result.getBody().getData().get(0).getContactMail());
    }
}
