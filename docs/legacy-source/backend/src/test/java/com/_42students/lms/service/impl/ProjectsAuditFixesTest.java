package com._42students.lms.service.impl;

import com._42students.lms.model.ProjectMember;
import com._42students.lms.model.ProjectResource;
import com._42students.lms.model.ProjectTask;
import com._42students.lms.model.ProjectWorkspace;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.ProjectMemberRepository;
import com._42students.lms.repository.ProjectReleaseRepository;
import com._42students.lms.repository.ProjectSprintRepository;
import com._42students.lms.repository.ProjectTaskCommentRepository;
import com._42students.lms.repository.ProjectTaskRepository;
import com._42students.lms.repository.ProjectWorkspaceRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AdminAuditLogService;
import com._42students.lms.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Regressions for the 10-round Projects adversarial audit (docs/audits/projects-module-10-round-adversarial-audit-2026-10-07.md):
 * stale full-array writers (R3), learner/faculty id collisions (R4-01, R5-02, R10-04), release locking (R8-01, R10-03),
 * the Active-mentor invariant (R3-05) and duplicate template keys (R8-05).
 */
@ExtendWith(MockitoExtension.class)
class ProjectsAuditFixesTest {

    @Mock private ProjectWorkspaceRepository projectRepository;
    @Mock private ProjectMemberRepository memberRepository;
    @Mock private ProjectTaskRepository taskRepository;
    @Mock private ProjectTaskCommentRepository taskCommentRepository;
    @Mock private ProjectSprintRepository sprintRepository;
    @Mock private ProjectReleaseRepository releaseRepository;
    @Mock private FacultyRepository facultyRepository;
    @Mock private LearnerRepository learnerRepository;
    @Mock private NotificationService notificationService;
    @Mock private AdminAuditLogService adminAuditLogService;
    @Mock private com._42students.lms.repository.ProjectTemplateRepository projectTemplateRepository;
    @Mock private com._42students.lms.repository.ProjectTemplateVersionRepository projectTemplateVersionRepository;
    @Mock private com._42students.lms.repository.ProjectDeliveryRepository projectDeliveryRepository;
    @Mock private com._42students.lms.repository.ProjectDeliveryEventRepository projectDeliveryEventRepository;
    @Mock private com._42students.lms.repository.ProjectActivityEventRepository projectActivityEventRepository;
    @Mock private com._42students.lms.repository.ProjectMeetingRepository projectMeetingRepository;
    @Mock private com._42students.lms.repository.ProjectMeetingHistoryRepository projectMeetingHistoryRepository;
    @Mock private com._42students.lms.repository.ProjectResourceRepository projectResourceRepository;
    @Mock private com._42students.lms.repository.ProjectResourceAuditRepository projectResourceAuditRepository;
    @Mock private com._42students.lms.repository._ClassRepository classRepository;
    @Mock private org.springframework.beans.factory.ObjectProvider<com._42students.lms.utils.R2StorageUtils> r2StorageUtilsProvider;

    @InjectMocks
    private ProjectWorkspaceServiceImpl service;

    private ProjectWorkspace project;
    private UserPrincipal mentor;

    @BeforeEach
    void setUp() {
        project = new ProjectWorkspace();
        project.setId(11);
        project.setSlug("proj-11");
        project.setTitle("Demo");
        project.setCollegeId(6);
        project.setStatus("IN_PROGRESS");
        mentor = new UserPrincipal(42, "FACULTY", null, 1, 6, 0);
        lenient().when(projectRepository.findActiveById(11)).thenReturn(Optional.of(project));
    }

    private static ProjectMember member(int userId, String type, String role) {
        ProjectMember member = new ProjectMember();
        member.setProjectId(11);
        member.setUserId(userId);
        member.setUserType(type);
        member.setRoleLabel(role);
        member.setMemberStatus("ACTIVE");
        member.setIsDeleted(false);
        return member;
    }

    // ---------------- R3-01/02/04: stale full-array rows ----------------

    @Test
    @DisplayName("a full-array row must carry the version the caller loaded; missing or different is a 409")
    void staleOrMissingRowVersionIsConflict() {
        Map<String, Object> current = new LinkedHashMap<>(Map.of("version", 3));
        assertDoesNotThrow(() -> ReflectionTestUtils.invokeMethod(service, "requireCurrentRowVersion", "task", 3L, current));

        ResponseStatusException stale = assertThrows(ResponseStatusException.class,
                () -> ReflectionTestUtils.invokeMethod(service, "requireCurrentRowVersion", "task", 4L, current));
        assertEquals(HttpStatus.CONFLICT, stale.getStatus());

        ResponseStatusException missing = assertThrows(ResponseStatusException.class,
                () -> ReflectionTestUtils.invokeMethod(service, "requireCurrentRowVersion", "resource", 0L, new LinkedHashMap<>()));
        assertEquals(HttpStatus.CONFLICT, missing.getStatus());
    }

    @Test
    @DisplayName("task sync rejects an older snapshot of a task someone else changed, and writes nothing")
    void taskSyncRejectsStaleSnapshot() {
        ProjectTask stored = new ProjectTask();
        stored.setId(5);
        stored.setProjectId(11);
        stored.setTaskKey("task-a");
        stored.setTitle("Newer title");
        stored.setVersion(7L);
        when(taskRepository.findActiveByProjectId(11)).thenReturn(new ArrayList<>(List.of(stored)));

        Map<String, Object> staleItem = new LinkedHashMap<>();
        staleItem.put("taskKey", "task-a");
        staleItem.put("title", "Old title");
        staleItem.put("version", 6);

        ResponseStatusException conflict = assertThrows(ResponseStatusException.class,
                () -> ReflectionTestUtils.invokeMethod(service, "syncProjectTasks", 11, List.of(staleItem), mentor));
        assertEquals(HttpStatus.CONFLICT, conflict.getStatus());
        assertEquals("Newer title", stored.getTitle());
        verify(taskRepository, never()).save(any(ProjectTask.class));
    }

    @Test
    @DisplayName("section tokens: blank is ignored, a different token is a 409, and order does not change the digest")
    void sectionTokens() {
        assertDoesNotThrow(() -> ReflectionTestUtils.invokeMethod(ProjectWorkspaceServiceImpl.class, "requireToken",
                "resource list", "", (java.util.function.Supplier<String>) () -> "abc"));
        ResponseStatusException conflict = assertThrows(ResponseStatusException.class,
                () -> ReflectionTestUtils.invokeMethod(ProjectWorkspaceServiceImpl.class, "requireToken",
                        "resource list", "old", (java.util.function.Supplier<String>) () -> "new"));
        assertEquals(HttpStatus.CONFLICT, conflict.getStatus());

        String a = ReflectionTestUtils.invokeMethod(ProjectWorkspaceServiceImpl.class, "digestToken", Stream.of("x:1", "y:2"));
        String b = ReflectionTestUtils.invokeMethod(ProjectWorkspaceServiceImpl.class, "digestToken", Stream.of("y:2", "x:1"));
        String c = ReflectionTestUtils.invokeMethod(ProjectWorkspaceServiceImpl.class, "digestToken", Stream.of("x:1", "y:3"));
        assertEquals(a, b);
        assertNotEquals(a, c);
    }

    // ---------------- R4-01 / R5-02 / R10-04: learner and faculty ids are separate sequences ----------------

    @Test
    @DisplayName("learner #42 does not own a resource faculty #42 created; untyped legacy rows are not learner-owned")
    void resourceOwnershipNeedsCreatorType() {
        UserPrincipal learner42 = new UserPrincipal(42, "LEARNER", null, 1, 6, 0);
        ProjectResource byFaculty = new ProjectResource();
        byFaculty.setCreatedBy(42);
        byFaculty.setCreatedByType("FACULTY");
        ProjectResource byLearner = new ProjectResource();
        byLearner.setCreatedBy(42);
        byLearner.setCreatedByType("LEARNER");
        ProjectResource legacy = new ProjectResource();
        legacy.setCreatedBy(42);

        assertFalse((Boolean) ReflectionTestUtils.invokeMethod(ProjectWorkspaceServiceImpl.class, "learnerOwnsResource", byFaculty, learner42));
        assertTrue((Boolean) ReflectionTestUtils.invokeMethod(ProjectWorkspaceServiceImpl.class, "learnerOwnsResource", byLearner, learner42));
        assertFalse((Boolean) ReflectionTestUtils.invokeMethod(ProjectWorkspaceServiceImpl.class, "learnerOwnsResource", legacy, learner42));
    }

    @Test
    @DisplayName("an untyped task assignment is not cleared for faculty #42 while learner #42 is on the project")
    void untypedAssignmentIsAmbiguousOnCollision() {
        ProjectTask untyped = new ProjectTask();
        untyped.setAssigneeId(42);
        ProjectTask typedLearner = new ProjectTask();
        typedLearner.setAssigneeId(42);
        typedLearner.setAssigneeType("LEARNER");
        ProjectTask typedMentor = new ProjectTask();
        typedMentor.setAssigneeId(42);
        typedMentor.setAssigneeType("MENTOR");

        Set<Integer> learnerIds = Set.of(42);
        assertFalse(isAssignedTo(untyped, 42, "FACULTY", learnerIds), "ambiguous: learner #42 exists");
        assertTrue(isAssignedTo(untyped, 42, "FACULTY", Set.of()), "no collision: legacy row is the mentor's");
        assertFalse(isAssignedTo(typedLearner, 42, "FACULTY", learnerIds));
        assertTrue(isAssignedTo(typedMentor, 42, "FACULTY", learnerIds), "any non-learner label is a faculty assignment");
        assertTrue(isAssignedTo(typedLearner, 42, "LEARNER", Set.of()));
    }

    private static boolean isAssignedTo(ProjectTask task, int userId, String type, Set<Integer> otherTypeIds) {
        return (Boolean) ReflectionTestUtils.invokeMethod(ProjectWorkspaceServiceImpl.class, "isAssignedTo", task, userId, type, otherTypeIds);
    }

    // ---------------- R3-05: a reviewer is not "the mentor" ----------------

    @Test
    @DisplayName("a workspace whose only faculty member is a Reviewer cannot become Active")
    void reviewerOnlyWorkspaceCannotBeActive() {
        when(memberRepository.findActiveByProjectId(11)).thenReturn(List.of(member(7, "FACULTY", "Reviewer")));
        assertThrows(IllegalArgumentException.class,
                () -> ReflectionTestUtils.invokeMethod(service, "requireMentorBeforeActive", project));

        when(memberRepository.findActiveByProjectId(11)).thenReturn(List.of(member(7, "FACULTY", "Co-Mentor")));
        assertDoesNotThrow(() -> ReflectionTestUtils.invokeMethod(service, "requireMentorBeforeActive", project));
    }

    // ---------------- R8-01 / R10-03: ship serializes with sprint reopen ----------------

    @Test
    @DisplayName("shipping a release takes the project row lock before it reads the release or its sprints")
    void shipTakesProjectLockFirst() {
        lenient().when(memberRepository.findByProjectAndUserAndType(eq(11), anyInt(), anyString()))
                .thenReturn(Optional.of(member(42, "FACULTY", "Project Mentor")));
        when(releaseRepository.findActiveByProjectIdAndReleaseKey(11, "r1")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> service.shipProjectRelease(mentor, "11", "r1"));

        InOrder order = inOrder(projectRepository, releaseRepository);
        order.verify(projectRepository).findByIdForUpdate(11);
        order.verify(releaseRepository).findActiveByProjectIdAndReleaseKey(11, "r1");
    }

    // ---------------- R8-05: duplicate template keys ----------------

    @Test
    @DisplayName("two template tasks resolving to the same key are rejected with both row numbers")
    void duplicateTemplateKeysRejected() {
        List<Map<String, Object>> rows = new ArrayList<>();
        rows.add(new LinkedHashMap<>(Map.of("taskKey", "setup")));
        rows.add(new LinkedHashMap<>(Map.of("taskKey", "build")));
        rows.add(new LinkedHashMap<>(Map.of("taskKey", "Setup")));
        java.util.function.BiFunction<Map<String, Object>, Integer, String> keyOf = (row, index) -> String.valueOf(row.get("taskKey"));

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> ReflectionTestUtils.invokeMethod(service, "requireUniqueTemplateKeys", rows, keyOf, "Task"));
        assertTrue(error.getMessage().contains("Task 1 and Task 3"), error.getMessage());
        assertDoesNotThrow(() -> ReflectionTestUtils.invokeMethod(service, "requireUniqueTemplateKeys",
                rows.subList(0, 2), keyOf, "Task"));
    }

    // ---------------- prod log 2026-10-06: template files on another tenant prefix ----------------

    @Test
    @DisplayName("a file the attached template carries is accepted whatever tenant uploaded it; other foreign keys are not")
    void attachedTemplateFileIsAcceptedAcrossTenants() {
        project.setOrganizationId(1);
        project.setTemplateId(9);
        com._42students.lms.model.ProjectTemplate template = new com._42students.lms.model.ProjectTemplate();
        template.setId(9);
        template.setResources(List.of(Map.of("title", "Brief", "fileUrl", "https://cdn.example/org-2/college-3/assignments/brief.pdf")));
        when(projectTemplateRepository.findById(9)).thenReturn(Optional.of(template));

        assertDoesNotThrow(() -> ReflectionTestUtils.invokeMethod(service, "requireOwnTenantAssignmentKey",
                project, "org-2/college-3/assignments/brief.pdf"));
        assertThrows(IllegalArgumentException.class, () -> ReflectionTestUtils.invokeMethod(service, "requireOwnTenantAssignmentKey",
                project, "org-2/college-3/assignments/someone-elses.pdf"));
        // A shorter key that is only a suffix of the template path (not a whole segment) does not match.
        assertThrows(IllegalArgumentException.class, () -> ReflectionTestUtils.invokeMethod(service, "requireOwnTenantAssignmentKey",
                project, "ief.pdf"));
    }
}
