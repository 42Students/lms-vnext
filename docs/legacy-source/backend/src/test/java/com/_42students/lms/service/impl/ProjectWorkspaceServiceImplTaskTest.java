package com._42students.lms.service.impl;

import com._42students.lms.dto.projects.ProjectTaskDTO;
import com._42students.lms.dto.projects.ProjectTaskCommentDTO;
import com._42students.lms.dto.projects.ProjectTaskCommentUpsertDTO;
import com._42students.lms.dto.projects.ProjectTaskReorderDTO;
import com._42students.lms.dto.projects.ProjectTaskUpsertDTO;
import com._42students.lms.model.ProjectMember;
import com._42students.lms.model.ProjectSprint;
import com._42students.lms.model.ProjectTemplate;
import com._42students.lms.model.Learner;
import com._42students.lms.model.ProjectTaskComment;
import com._42students.lms.model.ProjectTask;
import com._42students.lms.model.ProjectWorkspace;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.ProjectMemberRepository;
import com._42students.lms.repository.ProjectTaskCommentRepository;
import com._42students.lms.repository.ProjectTaskRepository;
import com._42students.lms.repository.ProjectSprintRepository;
import com._42students.lms.repository.ProjectWorkspaceRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AdminAuditLogService;
import com._42students.lms.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectWorkspaceServiceImplTaskTest {

    @Mock private ProjectWorkspaceRepository projectRepository;
    @Mock private ProjectMemberRepository memberRepository;
    @Mock private ProjectTaskRepository taskRepository;
    @Mock private ProjectTaskCommentRepository taskCommentRepository;
    @Mock private ProjectSprintRepository sprintRepository;
    @Mock private FacultyRepository facultyRepository;
    @Mock private LearnerRepository learnerRepository;
    @Mock private NotificationService notificationService;
    @Mock private AdminAuditLogService adminAuditLogService;

    // Constructor deps of ProjectWorkspaceServiceImpl that this test does not exercise, but which
    // must be present or @InjectMocks cannot build the service at all.
    @Mock private com._42students.lms.repository.ProjectTemplateRepository projectTemplateRepository;
    @Mock private com._42students.lms.repository.ProjectTemplateVersionRepository projectTemplateVersionRepository;
    @Mock private com._42students.lms.repository.ProjectDeliveryRepository projectDeliveryRepository;
    @Mock private com._42students.lms.repository.ProjectDeliveryEventRepository projectDeliveryEventRepository;
    @Mock private com._42students.lms.repository.ProjectActivityEventRepository projectActivityEventRepository;
    @Mock private com._42students.lms.repository.ProjectMeetingRepository projectMeetingRepository;
    @Mock private com._42students.lms.repository.ProjectMeetingHistoryRepository projectMeetingHistoryRepository;
    @Mock private com._42students.lms.repository.ProjectReleaseRepository projectReleaseRepository;
    @Mock private com._42students.lms.repository.ProjectResourceRepository projectResourceRepository;
    @Mock private com._42students.lms.repository.ProjectResourceAuditRepository projectResourceAuditRepository;
    @Mock private com._42students.lms.repository._ClassRepository classRepository;
    @Mock private org.springframework.beans.factory.ObjectProvider<com._42students.lms.utils.R2StorageUtils> r2StorageUtilsProvider;

    @InjectMocks
    private ProjectWorkspaceServiceImpl service;

    private final List<ProjectTask> taskStore = new ArrayList<>();
    private ProjectWorkspace project;
    private UserPrincipal faculty;
    private UserPrincipal learner;

    @BeforeEach
    void setUp() {
        taskStore.clear();
        project = new ProjectWorkspace();
        project.setId(11);
        project.setSlug("proj-11-demo");
        project.setTitle("Demo Project");
        project.setCollegeId(6);
        project.setOrganizationId(1);
        project.setClassId(9);
        project.setStatus("IN_PROGRESS");

        faculty = new UserPrincipal(16, "FACULTY", "ADMIN", 1, 6, 0);
        learner = new UserPrincipal(25, "LEARNER", null, 1, 6, 0);

        lenient().when(projectRepository.findActiveById(11)).thenReturn(Optional.of(project));
        lenient().when(projectRepository.findActiveById(999)).thenReturn(Optional.empty());
        lenient().when(memberRepository.existsActiveMembership(eq(11), anyInt(), anyString())).thenReturn(true);
        // requireProjectMemberAccess fetches the actual member row (not the boolean above) so that
        // memberStatus can gate access, so every caller needs a real ACTIVE row to get past it.
        lenient().when(memberRepository.findByProjectAndUserAndType(eq(11), anyInt(), anyString()))
                .thenAnswer(inv -> {
                    com._42students.lms.model.ProjectMember member = new com._42students.lms.model.ProjectMember();
                    member.setProjectId(11);
                    member.setUserId(inv.getArgument(1));
                    member.setUserType(inv.getArgument(2));
                    member.setMemberStatus("ACTIVE");
                    member.setIsDeleted(false);
                    return Optional.of(member);
                });
        lenient().when(memberRepository.findActiveByProjectId(11)).thenReturn(Collections.emptyList());
        lenient().when(sprintRepository.findActiveByProjectId(anyInt())).thenReturn(Collections.emptyList());
        lenient().when(taskRepository.countActiveByProjectId(11)).thenAnswer(inv -> (long) taskStore.size());
        lenient().when(taskRepository.findActiveByProjectId(11)).thenAnswer(inv -> snapshotTasks());
        lenient().when(taskCommentRepository.findActiveByTaskId(eq(11), anyInt())).thenReturn(Collections.emptyList());
        lenient().when(taskRepository.save(any(ProjectTask.class))).thenAnswer(invocation -> {
            ProjectTask task = invocation.getArgument(0);
            if (task.getId() <= 0) {
                task.setId(taskStore.size() + 1);
                taskStore.add(task);
            } else {
                boolean replaced = false;
                for (int i = 0; i < taskStore.size(); i++) {
                    if (taskStore.get(i).getId() == task.getId()) {
                        taskStore.set(i, task);
                        replaced = true;
                        break;
                    }
                }
                if (!replaced) {
                    taskStore.add(task);
                }
            }
            return task;
        });
    }

    @Test
    @DisplayName("project mentor can search learner candidates without class-faculty directory permission")
    void searchProjectMemberCandidates_usesProjectScope() {
        Learner candidate = new Learner();
        candidate.setId(900);
        candidate.setFirstName("New");
        candidate.setLastName("Learner");
        candidate.setUniqueId("L-900");

        when(learnerRepository.searchProjectMemberCandidatesForProject(eq(6), anyInt(), eq("new")))
                .thenReturn(List.of(candidate));

        List<Map<String, Object>> results =
                service.searchProjectMemberCandidates(faculty, "11", "LEARNER", "new", 15);

        assertEquals(1, results.size());
        assertEquals(900, results.get(0).get("id"));
        assertEquals("New", results.get(0).get("firstName"));
        assertEquals("Learner", results.get(0).get("lastName"));
        assertEquals("LEARNER", results.get(0).get("userType"));
        verify(learnerRepository).searchProjectMemberCandidatesForProject(eq(6), anyInt(), eq("new"));
    }

    @Test
    @DisplayName("starting a visible virtual sprint materializes it before validating dates")
    void startSprint_virtualTemplateSprintDoesNotReturnFalse404() {
        project.setTemplateId(44);
        project.setStartDate(null);

        ProjectTemplate template = new ProjectTemplate();
        template.setId(44);
        Map<String, Object> sprintRow = new LinkedHashMap<>();
        sprintRow.put("sprintKey", "sprint-kickoff");
        sprintRow.put("title", "Kickoff");
        sprintRow.put("sprintNumber", 1);
        // V173: a sprint always ships in a release now — this row materializes for the first
        // time in this test (resolveOrMaterializeSprintForLifecycle), so it needs a resolvable
        // releaseKey the same way a real template sprint row would carry one.
        sprintRow.put("releaseKey", "release-mvp");
        template.setSprints(List.of(sprintRow));

        com._42students.lms.model.ProjectRelease release = new com._42students.lms.model.ProjectRelease();
        release.setId(901);
        release.setProjectId(11);
        release.setReleaseKey("release-mvp");
        release.setTitle("MVP");
        when(projectReleaseRepository.findActiveByProjectIdAndReleaseKey(11, "release-mvp"))
                .thenReturn(Optional.of(release));

        when(projectTemplateRepository.findById(44)).thenReturn(Optional.of(template));
        when(projectRepository.findByIdForUpdate(11)).thenReturn(Optional.of(project));
        when(sprintRepository.findActiveByProjectIdAndSprintKey(11, "sprint-kickoff"))
                .thenReturn(Optional.empty());
        when(sprintRepository.findAllByProjectId(11)).thenReturn(Collections.emptyList());
        when(sprintRepository.save(any(ProjectSprint.class))).thenAnswer(invocation -> {
            ProjectSprint sprint = invocation.getArgument(0);
            sprint.setId(77);
            return sprint;
        });

        org.springframework.web.server.ResponseStatusException error = assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> service.startSprint(faculty, "11", "sprint-kickoff")
        );

        assertEquals(org.springframework.http.HttpStatus.BAD_REQUEST, error.getStatus());
        assertTrue(error.getReason().contains("start and end dates"));
        ArgumentCaptor<ProjectSprint> saved = ArgumentCaptor.forClass(ProjectSprint.class);
        verify(sprintRepository).save(saved.capture());
        assertEquals("sprint-kickoff", saved.getValue().getSprintKey());
        assertEquals("PLANNED", saved.getValue().getSprintState());
    }

    // State-machine audit: completing a sprint used to have no undo anywhere in the system. These
    // three tests cover reopenSprint's guards the same way startSprint's single-active-sprint
    // invariant is covered above.

    @Test
    @DisplayName("reopening a sprint that isn't completed is rejected")
    void reopenSprint_rejectsWhenNotCompleted() {
        ProjectSprint sprint = new ProjectSprint();
        sprint.setId(55);
        sprint.setProjectId(11);
        sprint.setSprintKey("sprint-1");
        sprint.setTitle("Sprint 1");
        sprint.setSprintState("ACTIVE");

        when(projectRepository.findByIdForUpdate(11)).thenReturn(Optional.of(project));
        when(sprintRepository.findActiveByProjectIdAndSprintKey(11, "sprint-1")).thenReturn(Optional.of(sprint));

        org.springframework.web.server.ResponseStatusException error = assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> service.reopenSprint(faculty, "11", "sprint-1")
        );

        assertEquals(org.springframework.http.HttpStatus.CONFLICT, error.getStatus());
        assertTrue(error.getReason().contains("completed"));
        verify(sprintRepository, never()).save(any(ProjectSprint.class));
    }

    @Test
    @DisplayName("reopening a completed sprint is rejected when its release has already shipped")
    void reopenSprint_rejectsWhenReleaseAlreadyShipped() {
        ProjectSprint sprint = new ProjectSprint();
        sprint.setId(55);
        sprint.setProjectId(11);
        sprint.setSprintKey("sprint-1");
        sprint.setTitle("Sprint 1");
        sprint.setSprintState("COMPLETED");
        sprint.setReleaseId(901);

        com._42students.lms.model.ProjectRelease release = new com._42students.lms.model.ProjectRelease();
        release.setId(901);
        release.setProjectId(11);
        release.setReleaseKey("release-mvp");
        release.setTitle("MVP");
        release.setStatus("SHIPPED");

        when(projectRepository.findByIdForUpdate(11)).thenReturn(Optional.of(project));
        when(sprintRepository.findActiveByProjectIdAndSprintKey(11, "sprint-1")).thenReturn(Optional.of(sprint));
        when(projectReleaseRepository.findById(901)).thenReturn(Optional.of(release));

        org.springframework.web.server.ResponseStatusException error = assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> service.reopenSprint(faculty, "11", "sprint-1")
        );

        assertEquals(org.springframework.http.HttpStatus.CONFLICT, error.getStatus());
        assertTrue(error.getReason().contains("MVP"));
        assertTrue(error.getReason().contains("un-ship"));
        verify(sprintRepository, never()).save(any(ProjectSprint.class));
    }

    @Test
    @DisplayName("reopening a completed sprint is rejected while another sprint is active")
    void reopenSprint_rejectsWhenAnotherSprintIsActive() {
        ProjectSprint sprint = new ProjectSprint();
        sprint.setId(55);
        sprint.setProjectId(11);
        sprint.setSprintKey("sprint-1");
        sprint.setTitle("Sprint 1");
        sprint.setSprintState("COMPLETED");

        ProjectSprint activeSibling = new ProjectSprint();
        activeSibling.setId(56);
        activeSibling.setProjectId(11);
        activeSibling.setSprintKey("sprint-2");
        activeSibling.setTitle("Sprint 2");
        activeSibling.setSprintState("ACTIVE");

        when(projectRepository.findByIdForUpdate(11)).thenReturn(Optional.of(project));
        when(sprintRepository.findActiveByProjectIdAndSprintKey(11, "sprint-1")).thenReturn(Optional.of(sprint));
        when(sprintRepository.findActiveByProjectId(11)).thenReturn(List.of(sprint, activeSibling));

        org.springframework.web.server.ResponseStatusException error = assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> service.reopenSprint(faculty, "11", "sprint-1")
        );

        assertEquals(org.springframework.http.HttpStatus.CONFLICT, error.getStatus());
        assertTrue(error.getReason().contains("Sprint 2"));
        verify(sprintRepository, never()).save(any(ProjectSprint.class));
    }

    @Test
    @DisplayName("reopening a completed sprint with no other active sprint sets it back to ACTIVE")
    void reopenSprint_succeedsWhenNoOtherSprintIsActive() {
        ProjectSprint sprint = new ProjectSprint();
        sprint.setId(55);
        sprint.setProjectId(11);
        sprint.setSprintKey("sprint-1");
        sprint.setTitle("Sprint 1");
        sprint.setSprintState("COMPLETED");

        when(projectRepository.findByIdForUpdate(11)).thenReturn(Optional.of(project));
        when(sprintRepository.findActiveByProjectIdAndSprintKey(11, "sprint-1")).thenReturn(Optional.of(sprint));
        when(sprintRepository.findActiveByProjectId(11)).thenReturn(List.of(sprint));
        when(sprintRepository.save(any(ProjectSprint.class))).thenAnswer(inv -> inv.getArgument(0));

        service.reopenSprint(faculty, "11", "sprint-1");

        ArgumentCaptor<ProjectSprint> saved = ArgumentCaptor.forClass(ProjectSprint.class);
        verify(sprintRepository).save(saved.capture());
        assertEquals("ACTIVE", saved.getValue().getSprintState());
        assertEquals(16, saved.getValue().getUpdatedBy());
    }

    @Test
    @DisplayName("faculty can create task and task is audited")
    void createTask_auditsAndPersists() {
        ProjectTaskUpsertDTO payload = new ProjectTaskUpsertDTO();
        payload.setTitle("Build wireframe");
        payload.setStatus("To do");
        payload.setPriority("High");
        payload.setDueDate(LocalDate.of(2026, 7, 30));
        payload.setSprintKey("mst-1");
        payload.setAssigneeId(88);
        payload.setAssigneeType("LEARNER");
        payload.setAssigneeName("Akhil Varma");

        List<ProjectTaskDTO> result = service.upsertProjectTask(faculty, "11", payload);

        assertEquals(1, result.size());
        assertEquals("Build wireframe", result.get(0).getTitle());
        assertEquals("TO_DO", result.get(0).getStatus());
        assertEquals("HIGH", result.get(0).getPriority());
        assertEquals(LocalDate.of(2026, 7, 30), result.get(0).getDueDate());
        assertTrue(result.get(0).getComments() == null || result.get(0).getComments().isEmpty());
        verifyNoInteractions(taskCommentRepository);
        verify(adminAuditLogService, atLeastOnce()).log(
                isNull(),
                eq("PROJECT_TASK_CREATE"),
                eq("PROJECT_TASK"),
                eq(result.get(0).getTaskKey()),
                eq(1),
                eq(6),
                anyMap()
        );
    }

    @Test
    @DisplayName("task comments are stored and returned in detail view")
    void addTaskComment_returnsComments() {
        ProjectTask existing = new ProjectTask();
        existing.setId(1);
        existing.setProjectId(11);
        existing.setTaskKey("tsk-11-alpha");
        existing.setTitle("Alpha");
        existing.setTaskStatus("TO_DO");
        existing.setPriority("LOW");
        existing.setSprintKey("mst-1");
        taskStore.add(existing);

        when(taskCommentRepository.findActiveByTaskId(11, 1)).thenReturn(Collections.emptyList());
        when(taskCommentRepository.save(any(ProjectTaskComment.class))).thenAnswer(invocation -> {
            ProjectTaskComment comment = invocation.getArgument(0);
            comment.setId(1);
            return comment;
        });
        when(taskCommentRepository.findActiveByTaskId(11, 1)).thenReturn(List.of(savedComment()));

        ProjectTaskCommentUpsertDTO payload = new ProjectTaskCommentUpsertDTO();
        payload.setMessage("Progress is moving");
        payload.setProgressValue(65);

        List<ProjectTaskCommentDTO> comments = service.addProjectTaskComment(faculty, "11", "1", payload);

        assertEquals(1, comments.size());
        assertEquals("Progress is moving", comments.get(0).getMessage());
        assertEquals(65, comments.get(0).getProgressValue());
    }

    @Test
    @DisplayName("task comments reject invalid progress values")
    void addTaskComment_rejectsInvalidProgress() {
        ProjectTask existing = new ProjectTask();
        existing.setId(1);
        existing.setProjectId(11);
        existing.setTaskKey("tsk-11-alpha");
        existing.setTitle("Alpha");
        existing.setTaskStatus("TO_DO");
        existing.setPriority("LOW");
        existing.setSprintKey("mst-1");
        taskStore.add(existing);

        ProjectTaskCommentUpsertDTO payload = new ProjectTaskCommentUpsertDTO();
        payload.setMessage("Progress is moving");
        payload.setProgressValue(120);

        assertThrows(IllegalArgumentException.class, () -> service.addProjectTaskComment(faculty, "11", "1", payload));
    }

    @Test
    @DisplayName("task updates are validated and audited")
    void updateTask_validatesAndAudits() {
        ProjectTask existing = new ProjectTask();
        existing.setId(1);
        existing.setProjectId(11);
        existing.setTaskKey("tsk-11-alpha");
        existing.setTitle("Alpha");
        existing.setTaskStatus("TO_DO");
        existing.setPriority("LOW");
        existing.setSprintKey("mst-1");
        existing.setVersion(1L);
        taskStore.add(existing);

        ProjectTaskUpsertDTO payload = new ProjectTaskUpsertDTO();
        payload.setTitle("Alpha updated");
        payload.setStatus("in review");
        payload.setPriority("Medium");
        payload.setDueLabel("Tomorrow");
        payload.setSprintKey("mst-1");
        payload.setVersion(1L);

        List<ProjectTaskDTO> result = service.updateProjectTask(faculty, "11", "1", payload);

        assertEquals(1, result.size());
        assertEquals("Alpha updated", result.get(0).getTitle());
        assertEquals("IN_REVIEW", result.get(0).getStatus());
        assertEquals("MEDIUM", result.get(0).getPriority());
        assertEquals("Tomorrow", result.get(0).getDueLabel());
        verify(adminAuditLogService, atLeastOnce()).log(
                isNull(),
                eq("PROJECT_TASK_UPDATE"),
                eq("PROJECT_TASK"),
                eq("tsk-11-alpha"),
                eq(1),
                eq(6),
                anyMap()
        );
    }

    @Test
    @DisplayName("clearAssignee actually clears the assignee, unlike a bare null assigneeId")
    void updateTask_clearAssigneeUnassignsTask() {
        ProjectTask existing = new ProjectTask();
        existing.setId(1);
        existing.setProjectId(11);
        existing.setTaskKey("tsk-11-alpha");
        existing.setTitle("Alpha");
        existing.setTaskStatus("TO_DO");
        existing.setPriority("LOW");
        existing.setAssigneeId(88);
        existing.setAssigneeType("LEARNER");
        existing.setAssigneeName("Akhil Varma");
        existing.setVersion(1L);
        taskStore.add(existing);

        ProjectTaskUpsertDTO payload = new ProjectTaskUpsertDTO();
        payload.setTitle("Alpha");
        payload.setVersion(1L);
        payload.setClearAssignee(true);

        List<ProjectTaskDTO> result = service.updateProjectTask(faculty, "11", "1", payload);

        assertEquals(1, result.size());
        assertNull(result.get(0).getAssigneeId());
        assertNull(result.get(0).getAssigneeType());
        assertNull(result.get(0).getAssigneeName());
    }

    @Test
    @DisplayName("a plain update with no assignee fields leaves the existing assignee untouched")
    void updateTask_withoutAssigneeFieldsLeavesAssigneeUntouched() {
        ProjectTask existing = new ProjectTask();
        existing.setId(1);
        existing.setProjectId(11);
        existing.setTaskKey("tsk-11-alpha");
        existing.setTitle("Alpha");
        existing.setTaskStatus("TO_DO");
        existing.setPriority("LOW");
        existing.setAssigneeId(88);
        existing.setAssigneeType("LEARNER");
        existing.setAssigneeName("Akhil Varma");
        existing.setVersion(1L);
        taskStore.add(existing);

        ProjectTaskUpsertDTO payload = new ProjectTaskUpsertDTO();
        payload.setTitle("Alpha renamed");
        payload.setVersion(1L);

        List<ProjectTaskDTO> result = service.updateProjectTask(faculty, "11", "1", payload);

        assertEquals(1, result.size());
        assertEquals("Alpha renamed", result.get(0).getTitle());
        assertEquals(88, result.get(0).getAssigneeId());
        assertEquals("Akhil Varma", result.get(0).getAssigneeName());
    }

    @Test
    @DisplayName("a learner moving their own task to In Review without a link is rejected")
    void updateTask_learnerMovingToReviewWithoutLinkIsRejected() {
        ProjectTask existing = new ProjectTask();
        existing.setId(1);
        existing.setProjectId(11);
        existing.setTaskKey("tsk-11-alpha");
        existing.setTitle("Alpha");
        existing.setTaskStatus("IN_PROGRESS");
        existing.setPriority("MEDIUM");
        existing.setAssigneeId(25);
        existing.setAssigneeType("LEARNER");
        existing.setAssigneeName("Learner Name");
        existing.setVersion(1L);
        taskStore.add(existing);

        ProjectTaskUpsertDTO payload = new ProjectTaskUpsertDTO();
        payload.setStatus("In Review");
        payload.setVersion(1L);

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> service.updateProjectTask(learner, "11", "1", payload));
        assertTrue(error.getMessage().contains("submitting"));
        assertEquals("IN_PROGRESS", existing.getTaskStatus());
    }

    @Test
    @DisplayName("a learner moving their own task to In Review with a link succeeds and stamps attribution")
    void updateTask_learnerMovingToReviewWithLinkSucceeds() {
        ProjectTask existing = new ProjectTask();
        existing.setId(1);
        existing.setProjectId(11);
        existing.setTaskKey("tsk-11-alpha");
        existing.setTitle("Alpha");
        existing.setTaskStatus("IN_PROGRESS");
        existing.setPriority("MEDIUM");
        existing.setAssigneeId(25);
        existing.setAssigneeType("LEARNER");
        existing.setAssigneeName("Learner Name");
        existing.setVersion(1L);
        taskStore.add(existing);

        ProjectTaskUpsertDTO payload = new ProjectTaskUpsertDTO();
        payload.setStatus("In Review");
        payload.setSubmissionUrl("https://github.com/org/repo/pull/12");
        payload.setVersion(1L);

        List<ProjectTaskDTO> result = service.updateProjectTask(learner, "11", "1", payload);

        assertEquals("IN_REVIEW", result.get(0).getStatus());
        assertEquals("https://github.com/org/repo/pull/12", result.get(0).getSubmissionUrl());
        assertEquals(25, result.get(0).getSubmittedBy());
        assertNotNull(result.get(0).getSubmittedAt());
    }

    @Test
    @DisplayName("a mentor moving a task to In Review directly is not gated on a link")
    void updateTask_mentorMovingToReviewIsNotGated() {
        ProjectTask existing = new ProjectTask();
        existing.setId(1);
        existing.setProjectId(11);
        existing.setTaskKey("tsk-11-alpha");
        existing.setTitle("Alpha");
        existing.setTaskStatus("IN_PROGRESS");
        existing.setPriority("MEDIUM");
        existing.setAssigneeId(88);
        existing.setAssigneeType("LEARNER");
        existing.setVersion(1L);
        taskStore.add(existing);

        ProjectTaskUpsertDTO payload = new ProjectTaskUpsertDTO();
        payload.setStatus("In Review");
        payload.setVersion(1L);

        List<ProjectTaskDTO> result = service.updateProjectTask(faculty, "11", "1", payload);

        assertEquals("IN_REVIEW", result.get(0).getStatus());
        assertNull(result.get(0).getSubmissionUrl());
    }

    @Test
    @DisplayName("resaving a task already In Review with the same link does not re-stamp submittedAt")
    void updateTask_unchangedSubmissionLinkDoesNotRestamp() {
        ProjectTask existing = new ProjectTask();
        existing.setId(1);
        existing.setProjectId(11);
        existing.setTaskKey("tsk-11-alpha");
        existing.setTitle("Alpha");
        existing.setTaskStatus("IN_REVIEW");
        existing.setPriority("MEDIUM");
        existing.setAssigneeId(25);
        existing.setAssigneeType("LEARNER");
        existing.setSubmissionUrl("https://github.com/org/repo/pull/12");
        existing.setSubmittedBy(25);
        java.time.LocalDateTime originalSubmittedAt = java.time.LocalDateTime.of(2026, 1, 1, 9, 0);
        existing.setSubmittedAt(originalSubmittedAt);
        existing.setVersion(1L);
        taskStore.add(existing);

        // A learner may only touch status/blocker/order/submissionUrl -- title/description etc.
        // are restricted, so this resave only touches fields a learner is actually allowed to.
        ProjectTaskUpsertDTO payload = new ProjectTaskUpsertDTO();
        payload.setSubmissionUrl("https://github.com/org/repo/pull/12");
        payload.setVersion(1L);

        List<ProjectTaskDTO> result = service.updateProjectTask(learner, "11", "1", payload);

        assertEquals(originalSubmittedAt, result.get(0).getSubmittedAt());
    }

    @Test
    @DisplayName("a javascript: submission link is rejected (defense in depth against the drop-prompt's client-side check)")
    void updateTask_rejectsNonHttpSubmissionLink() {
        ProjectTask existing = new ProjectTask();
        existing.setId(1);
        existing.setProjectId(11);
        existing.setTaskKey("tsk-11-alpha");
        existing.setTitle("Alpha");
        existing.setTaskStatus("IN_PROGRESS");
        existing.setPriority("MEDIUM");
        existing.setAssigneeId(25);
        existing.setAssigneeType("LEARNER");
        existing.setVersion(1L);
        taskStore.add(existing);

        ProjectTaskUpsertDTO payload = new ProjectTaskUpsertDTO();
        payload.setStatus("In Review");
        payload.setSubmissionUrl("javascript:alert(1)");
        payload.setVersion(1L);

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> service.updateProjectTask(learner, "11", "1", payload));
        assertTrue(error.getMessage().contains("http"));
    }

    @Test
    @DisplayName("task deletion soft deletes the row and audits")
    void removeTask_softDeletesAndAudits() {
        ProjectTask existing = new ProjectTask();
        existing.setId(2);
        existing.setProjectId(11);
        existing.setTaskKey("tsk-11-beta");
        existing.setTitle("Beta");
        existing.setTaskStatus("TO_DO");
        existing.setPriority("LOW");
        existing.setSprintKey("mst-1");
        taskStore.add(existing);

        List<ProjectTaskDTO> result = service.removeProjectTask(faculty, "11", "2");

        assertNotNull(result);
        assertTrue(taskStore.get(0).getIsDeleted());
        verify(adminAuditLogService, atLeastOnce()).log(
                isNull(),
                eq("PROJECT_TASK_DELETE"),
                eq("PROJECT_TASK"),
                eq("tsk-11-beta"),
                eq(1),
                eq(6),
                anyMap()
        );
    }

    @Test
    @DisplayName("task reorder updates sort order")
    void reorderTasks_updatesSortOrder() {
        ProjectTask first = new ProjectTask();
        first.setId(1);
        first.setProjectId(11);
        first.setTaskKey("tsk-11-a");
        first.setTitle("A");
        first.setTaskStatus("TO_DO");
        first.setPriority("LOW");
        first.setSprintKey("mst-1");
        first.setSortOrder(0);
        ProjectTask second = new ProjectTask();
        second.setId(2);
        second.setProjectId(11);
        second.setTaskKey("tsk-11-b");
        second.setTitle("B");
        second.setTaskStatus("TO_DO");
        second.setPriority("LOW");
        second.setSprintKey("mst-1");
        second.setSortOrder(1);
        taskStore.add(first);
        taskStore.add(second);

        ProjectTaskReorderDTO reorderDTO = new ProjectTaskReorderDTO();
        reorderDTO.setOrderedTaskIds(List.of(2, 1));

        List<ProjectTaskDTO> result = service.reorderProjectTasks(faculty, "11", reorderDTO);

        assertEquals(2, result.size());
        assertEquals(0, taskStore.get(1).getSortOrder());
        assertEquals(1, taskStore.get(0).getSortOrder());
        verify(adminAuditLogService, atLeastOnce()).log(
                isNull(),
                eq("PROJECT_TASK_REORDER"),
                eq("PROJECT"),
                any(),
                eq(1),
                eq(6),
                anyMap()
        );
    }

    @Test
    @DisplayName("task reorder rejects duplicate ids")
    void reorderTasks_rejectsDuplicateIds() {
        ProjectTask first = new ProjectTask();
        first.setId(1);
        first.setProjectId(11);
        first.setTaskKey("tsk-11-a");
        first.setTitle("A");
        first.setTaskStatus("TO_DO");
        first.setPriority("LOW");
        taskStore.add(first);

        ProjectTaskReorderDTO reorderDTO = new ProjectTaskReorderDTO();
        reorderDTO.setOrderedTaskIds(List.of(1, 1));

        assertThrows(IllegalArgumentException.class, () -> service.reorderProjectTasks(faculty, "11", reorderDTO));
    }

    @Test
    @DisplayName("learner creating a task is forced to self-assignment and cannot self-mark DONE")
    void learnerWriteIsForcedToSelf() {
        ProjectTask task = new ProjectTask();
        task.setId(1);
        task.setProjectId(11);
        task.setTaskKey("tsk-11-a");
        task.setTitle("A");
        task.setTaskStatus("TO_DO");
        task.setPriority("LOW");
        task.setSprintKey("mst-1");
        taskStore.add(task);

        List<ProjectTaskDTO> readResult = service.getProjectTasks(learner, "11");
        assertEquals(1, readResult.size());

        // Learners may create their own tasks (personal sub-tasks / backlog items), but any
        // assignee fields they submit are overwritten with their own identity, and a learner
        // cannot land a task straight in DONE — it is downgraded to IN_REVIEW for a mentor. That
        // downgrade is itself a move INTO IN_REVIEW, so it's gated on a submission link the same
        // as any other learner-initiated review transition.
        ProjectTaskUpsertDTO payload = new ProjectTaskUpsertDTO();
        payload.setTitle("Self task");
        payload.setSprintKey("mst-1");
        payload.setStatus("DONE");
        payload.setSubmissionUrl("https://github.com/org/repo/pull/7");
        payload.setAssigneeId(999);
        payload.setAssigneeType("FACULTY");
        payload.setAssigneeName("Somebody Else");

        List<ProjectTaskDTO> afterWrite = service.upsertProjectTask(learner, "11", payload);

        ProjectTaskDTO created = afterWrite.stream()
                .filter(t -> "Self task".equals(t.getTitle()))
                .findFirst()
                .orElseThrow();
        assertEquals(learner.getId(), created.getAssigneeId(),
                "a learner's submitted assigneeId must be replaced with their own");
        assertEquals("LEARNER", created.getAssigneeType());
        assertEquals("IN_REVIEW", created.getStatus(),
                "a learner must not be able to mark their own task DONE");
        assertEquals("https://github.com/org/repo/pull/7", created.getSubmissionUrl());
    }

    @Test
    @DisplayName("a learner landing a new self-created task straight in DONE without a link is rejected")
    void learnerCreateStraightToDoneWithoutLinkIsRejected() {
        ProjectTaskUpsertDTO payload = new ProjectTaskUpsertDTO();
        payload.setTitle("Self task");
        payload.setSprintKey("mst-1");
        payload.setStatus("DONE");

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> service.upsertProjectTask(learner, "11", payload));
        assertTrue(error.getMessage().contains("submitting"));
    }

    @Test
    @DisplayName("invalid status or priority is rejected")
    void invalidTaskValuesRejected() {
        ProjectTaskUpsertDTO payload = new ProjectTaskUpsertDTO();
        payload.setTitle("Bad task");
        payload.setStatus("maybe");
        payload.setPriority("urgent");
        payload.setSprintKey("mst-1");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.upsertProjectTask(faculty, "11", payload));

        assertTrue(ex.getMessage().toLowerCase().contains("invalid task"));
        assertTrue(taskStore.isEmpty());
    }

    private List<ProjectTask> snapshotTasks() {
        List<ProjectTask> copy = new ArrayList<>();
        for (ProjectTask task : taskStore) {
            ProjectTask clone = new ProjectTask();
            clone.setId(task.getId());
            clone.setProjectId(task.getProjectId());
            clone.setTaskKey(task.getTaskKey());
            clone.setTitle(task.getTitle());
            clone.setDescription(task.getDescription());
            clone.setTaskStatus(task.getTaskStatus());
            clone.setPriority(task.getPriority());
            clone.setDueDate(task.getDueDate());
            clone.setDueLabel(task.getDueLabel());
            clone.setAssigneeId(task.getAssigneeId());
            clone.setAssigneeType(task.getAssigneeType());
            clone.setAssigneeName(task.getAssigneeName());
            clone.setSubmissionUrl(task.getSubmissionUrl());
            clone.setSubmittedBy(task.getSubmittedBy());
            clone.setSubmittedAt(task.getSubmittedAt());
            clone.setSortOrder(task.getSortOrder());
            clone.setCreatedBy(task.getCreatedBy());
            clone.setUpdatedBy(task.getUpdatedBy());
            clone.setIsDeleted(task.getIsDeleted());
            clone.setVersion(task.getVersion());
            copy.add(clone);
        }
        return copy;
    }

    private ProjectTaskComment savedComment() {
        ProjectTaskComment comment = new ProjectTaskComment();
        comment.setId(1);
        comment.setProjectId(11);
        comment.setProjectTaskId(1);
        comment.setCommenterId(16);
        comment.setCommenterType("FACULTY");
        comment.setCommenterName("Mentor");
        comment.setMessage("Progress is moving");
        comment.setProgressValue(65);
        return comment;
    }
}
