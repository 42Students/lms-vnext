package com._42students.lms.projects;

import com._42students.lms.dto.projects.AdminProjectCreateDTO;
import com._42students.lms.dto.projects.AdminProjectMentorAssignDTO;
import com._42students.lms.dto.projects.AdminProjectTemplateUpsertDTO;
import com._42students.lms.dto.projects.ProjectMeetingDTO;
import com._42students.lms.dto.projects.ProjectMemberDTO;
import com._42students.lms.dto.projects.ProjectTaskCommentDTO;
import com._42students.lms.dto.projects.ProjectTaskCommentUpsertDTO;
import com._42students.lms.dto.projects.ProjectTaskDTO;
import com._42students.lms.dto.projects.ProjectTaskUpsertDTO;
import com._42students.lms.dto.projects.ProjectWorkspaceDTO;
import com._42students.lms.dto.projects.ProjectWorkspaceUpdateDTO;
import com._42students.lms.model.Faculty;
import com._42students.lms.model.Learner;
import com._42students.lms.model.ProjectDelivery;
import com._42students.lms.model.ProjectMeeting;
import com._42students.lms.model.ProjectMember;
import com._42students.lms.model.ProjectSprint;
import com._42students.lms.model.ProjectResource;
import com._42students.lms.model.ProjectTask;
import com._42students.lms.model.ProjectTaskComment;
import com._42students.lms.model.ProjectTemplate;
import com._42students.lms.model.ProjectWorkspace;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.ProjectActivityEventRepository;
import com._42students.lms.repository.ProjectDeliveryEventRepository;
import com._42students.lms.repository.ProjectDeliveryRepository;
import com._42students.lms.repository.ProjectMeetingHistoryRepository;
import com._42students.lms.repository.ProjectTemplateCollegeRepository;
import com._42students.lms.repository.ProjectMeetingRepository;
import com._42students.lms.repository.ProjectMemberRepository;
import com._42students.lms.repository.ProjectSprintRepository;
import com._42students.lms.repository.ProjectResourceAuditRepository;
import com._42students.lms.repository.ProjectResourceRepository;
import com._42students.lms.repository.ProjectTaskCommentRepository;
import com._42students.lms.repository.ProjectTaskRepository;
import com._42students.lms.repository.ProjectTemplateRepository;
import com._42students.lms.repository.ProjectTemplateVersionRepository;
import com._42students.lms.repository.ProjectWorkspaceRepository;
import com._42students.lms.repository._ClassRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AdminAuditLogService;
import com._42students.lms.service.NotificationService;
import com._42students.lms.service.impl.ProjectWorkspaceServiceImpl;
import com._42students.lms.utils.R2StorageUtils;
import org.springframework.security.access.AccessDeniedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * Proves workspace isolation when the SAME {@link ProjectTemplate} is attached to two different
 * {@link ProjectWorkspace}s (different classes, different mentors) and both are worked on in
 * parallel. Every mutation path below (tasks, sprints, resources, delivery, mentor
 * assignment/removal, archive/delete) must scope every repository call to the workspace it was
 * invoked for, and must never leak a read/write into the sibling workspace's rows — even though
 * both workspaces materialize their content from the identical template JSON (same taskKey,
 * sprintKey, resourceKey strings).
 *
 * <p>All repository mocks below are stateful (backed by per-projectId maps), not just
 * argument-matched stubs, so a bug that accidentally queried/saved against the wrong projectId
 * would actually surface real cross-workspace data corruption in these tests, not just silently
 * return an empty list.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Same template attached to two parallel workspaces stays isolated per workspace")
class TemplateWorkspaceIsolationTest {

    @Mock private ProjectWorkspaceRepository projectRepository;
    @Mock private ProjectMemberRepository memberRepository;
    @Mock private ProjectTemplateRepository projectTemplateRepository;
    @Mock private ProjectTemplateVersionRepository projectTemplateVersionRepository;
    @Mock private ProjectTemplateCollegeRepository projectTemplateCollegeRepository;
    @Mock private CollegeRepository collegeRepository;
    @Mock private ProjectDeliveryRepository deliveryRepository;
    @Mock private ProjectDeliveryEventRepository deliveryEventRepository;
    @Mock private ProjectActivityEventRepository activityEventRepository;
    @Mock private ProjectMeetingRepository meetingRepository;
    @Mock private ProjectMeetingHistoryRepository meetingHistoryRepository;
    @Mock private ProjectSprintRepository sprintRepository;
    @Mock private com._42students.lms.repository.ProjectReleaseRepository releaseRepository;
    @Mock private ProjectTaskRepository taskRepository;
    @Mock private ProjectTaskCommentRepository taskCommentRepository;
    @Mock private FacultyRepository facultyRepository;
    @Mock private LearnerRepository learnerRepository;
    @Mock private ProjectResourceRepository resourceRepository;
    @Mock private ProjectResourceAuditRepository resourceAuditRepository;
    @Mock private _ClassRepository classRepository;
    @Mock private R2StorageUtils r2StorageUtils;
    @Mock private org.springframework.beans.factory.ObjectProvider<R2StorageUtils> r2StorageUtilsProvider;
    @Mock private NotificationService notificationService;
    @Mock private AdminAuditLogService adminAuditLogService;

    private ProjectWorkspaceServiceImpl service;

    // ---- Stateful, per-projectId-scoped in-memory repository backing stores ----
    private final Map<Integer, ProjectWorkspace> projectStore = new LinkedHashMap<>();
    private final Map<Integer, List<ProjectMember>> memberStore = new LinkedHashMap<>();
    private final Map<Integer, List<ProjectTask>> taskStore = new LinkedHashMap<>();
    private final Map<Integer, List<ProjectSprint>> sprintStore = new LinkedHashMap<>();
    private final Map<Integer, List<ProjectResource>> resourceStore = new LinkedHashMap<>();
    private final Map<Integer, List<ProjectMeeting>> meetingStore = new LinkedHashMap<>();
    private final Map<Integer, ProjectDelivery> deliveryStore = new LinkedHashMap<>();
    // Keyed by taskId (not projectId) — findActiveByTaskId(projectId, taskId) is a two-key lookup
    // in production (`WHERE project_id = ? AND project_task_id = ?`); the stub below re-checks the
    // comment's own recorded projectId against whatever pid the caller queried with, so a service
    // bug that resolved the wrong task across workspaces would actually surface as a failing
    // assertion here instead of silently returning the "right" comments by taskId luck alone.
    private final Map<Integer, List<ProjectTaskComment>> commentStore = new LinkedHashMap<>();
    private final AtomicInteger memberIdSeq = new AtomicInteger(1);
    private final AtomicInteger taskIdSeq = new AtomicInteger(1);
    private final AtomicInteger sprintIdSeq = new AtomicInteger(1);
    private final AtomicInteger resourceIdSeq = new AtomicInteger(1);
    private final AtomicInteger deliveryIdSeq = new AtomicInteger(1);
    private final AtomicInteger commentIdSeq = new AtomicInteger(1);
    private final AtomicInteger meetingIdSeq = new AtomicInteger(1);

    private UserPrincipal admin;
    private UserPrincipal superAdmin;
    private UserPrincipal mentorA;
    private UserPrincipal mentorB;
    private ProjectTemplate template;

    private static final int WORKSPACE_A_ID = 100;
    private static final int WORKSPACE_B_ID = 200;
    private static final int WORKSPACE_C_ID = 300;
    private static final int CLASS_A_ID = 10;
    private static final int CLASS_B_ID = 20;
    private static final int CLASS_C_ID = 30;
    private static final int MENTOR_A_ID = 50;
    private static final int MENTOR_B_ID = 60;
    private static final int MENTOR_C_ID = 80;
    private static final int TEMPLATE_ID = 1;

    private <T> List<T> bucket(Map<Integer, List<T>> store, Integer projectId) {
        return store.computeIfAbsent(projectId, id -> new ArrayList<>());
    }

    @BeforeEach
    void setUp() {
        // ProjectWorkspaceServiceImpl's constructor takes ObjectProvider<R2StorageUtils>, not
        // R2StorageUtils directly, since the real bean is @Conditional on R2 config being
        // present.
        lenient().when(r2StorageUtilsProvider.getIfAvailable()).thenReturn(r2StorageUtils);
        // Templates became opt-in per college (V140): createProjectInternal now refuses a
        // non-super-admin whose college has not been assigned the template. These tests are about
        // workspace isolation, not that gate, so the assignment is granted for every lookup —
        // without it every createWorkspace() here dies on "template is not available to your
        // college" before reaching the behaviour under test.
        lenient().when(projectTemplateCollegeRepository.existsByTemplateIdAndCollegeId(anyInt(), anyInt()))
                .thenReturn(true);
        service = new ProjectWorkspaceServiceImpl(
                projectRepository, memberRepository, projectTemplateRepository, projectTemplateVersionRepository,
                projectTemplateCollegeRepository, collegeRepository,
                deliveryRepository, deliveryEventRepository, activityEventRepository, meetingRepository,
                meetingHistoryRepository, sprintRepository, releaseRepository, taskRepository, taskCommentRepository,
                facultyRepository, learnerRepository, resourceRepository, resourceAuditRepository,
                classRepository, r2StorageUtilsProvider,
                notificationService, adminAuditLogService
        );
        ReflectionTestUtils.setField(service, "self", service);

        admin = new UserPrincipal(16, "FACULTY", "ADMIN", 1, 6, 0);
        // id 0 is the super-admin convention (AccessControlService.isSuperAdmin) — used for the
        // template-editing test below, since templates are super-admin-only to edit now.
        superAdmin = new UserPrincipal(0, "FACULTY", "ADMIN", null, null, 0);
        mentorA = new UserPrincipal(MENTOR_A_ID, "FACULTY", "MENTOR", 1, 6, 0);
        mentorB = new UserPrincipal(MENTOR_B_ID, "FACULTY", "MENTOR", 1, 6, 0);

        // ---- One template, shared by both workspaces ----
        template = new ProjectTemplate();
        template.setId(TEMPLATE_ID);
        template.setSlug("shared-template");
        template.setCollegeId(6);
        template.setOrganizationId(1);
        template.setTitle("Shared Cohort Template");
        template.setCourseLabel("Projects / Shared Cohort Template");
        template.setSummary("Reusable across both classes");
        template.setStatus("IN_PROGRESS");
        template.setPhase("Planning");
        template.setLifecycleStatus("PUBLISHED");
        template.setTemplateVersion(1);
        template.setOverview(new LinkedHashMap<>());

        Map<String, Object> taskRow = new LinkedHashMap<>();
        taskRow.put("taskKey", "kickoff-review");
        taskRow.put("title", "Kickoff Review");
        taskRow.put("status", "To do");
        taskRow.put("priority", "Medium");
        // Bug-fix regression coverage: materializeTaskFromTemplate silently dropped these four
        // fields entirely (never set on the materialized ProjectTask), even though a still-virtual
        // task's read path reads every one of them from this same row. "BUG" (not "STORY", the
        // fallback default) deliberately makes the bug's silent-fallback failure mode visible if
        // it ever regresses -- a wrong default passing by coincidence is exactly what this guards.
        taskRow.put("estimatePoints", 5);
        taskRow.put("taskType", "BUG");
        taskRow.put("acceptanceCriteria", "Kickoff call completed and notes shared with the team");
        taskRow.put("approach", "Schedule the call, walk through the brief, confirm scope");
        template.setTasks(Collections.singletonList(taskRow));

        Map<String, Object> sprintRow = new LinkedHashMap<>();
        sprintRow.put("sprintKey", "phase-one");
        sprintRow.put("title", "Phase One");
        sprintRow.put("status", "Upcoming");
        template.setSprints(Collections.singletonList(sprintRow));

        Map<String, Object> resourceRow = new LinkedHashMap<>();
        resourceRow.put("resourceKey", "brief-doc");
        resourceRow.put("title", "Project Brief");
        template.setResources(Collections.singletonList(resourceRow));

        // ---- Faculty / learner lookups ----
        Faculty facultyA = new Faculty();
        facultyA.setId(MENTOR_A_ID);
        facultyA.setCollegeId(6);
        facultyA.setFirstName("Mentor");
        facultyA.setLastName("Alpha");
        Faculty facultyB = new Faculty();
        facultyB.setId(MENTOR_B_ID);
        facultyB.setCollegeId(6);
        facultyB.setFirstName("Mentor");
        facultyB.setLastName("Bravo");
        lenient().when(facultyRepository.findByIdAndNotDeleted(MENTOR_A_ID)).thenReturn(Optional.of(facultyA));
        lenient().when(facultyRepository.findByIdAndNotDeleted(MENTOR_B_ID)).thenReturn(Optional.of(facultyB));

        Learner learnerA = new Learner();
        learnerA.setId(70);
        learnerA.setCollegeId(6);
        learnerA.setFirstName("Learner");
        learnerA.setLastName("Alpha");
        lenient().when(learnerRepository.findByIdAndNotDeleted(70)).thenReturn(Optional.of(learnerA));

        Faculty facultyC = new Faculty();
        facultyC.setId(MENTOR_C_ID);
        facultyC.setCollegeId(6);
        facultyC.setFirstName("Mentor");
        facultyC.setLastName("Charlie");
        lenient().when(facultyRepository.findByIdAndNotDeleted(MENTOR_C_ID)).thenReturn(Optional.of(facultyC));

        lenient().when(classRepository.existsByIdAndCollegeId(CLASS_A_ID, 6)).thenReturn(true);
        lenient().when(classRepository.existsByIdAndCollegeId(CLASS_B_ID, 6)).thenReturn(true);
        lenient().when(classRepository.existsByIdAndCollegeId(CLASS_C_ID, 6)).thenReturn(true);

        // ---- Template lookups (production code mixes findById/findActiveById across call sites) ----
        lenient().when(projectTemplateRepository.findById(TEMPLATE_ID)).thenReturn(Optional.of(template));
        lenient().when(projectTemplateRepository.findActiveById(TEMPLATE_ID)).thenReturn(Optional.of(template));
        lenient().when(projectTemplateRepository.save(any(ProjectTemplate.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(projectTemplateRepository.findActiveBySlug(any())).thenReturn(Optional.empty());
        lenient().when(projectTemplateVersionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(projectTemplateVersionRepository.findByTemplateIdOrderByVersionDesc(anyInt())).thenReturn(Collections.emptyList());

        // ---- ProjectWorkspace: id assigned deterministically from classId (10 -> 100, 20 -> 200, 30 -> 300) ----
        lenient().when(projectRepository.save(any(ProjectWorkspace.class))).thenAnswer(inv -> {
            ProjectWorkspace p = inv.getArgument(0);
            if (p.getId() <= 0) {
                Integer classId = p.getClassId();
                int id = (classId != null && classId == CLASS_B_ID)
                        ? WORKSPACE_B_ID
                        : (classId != null && classId == CLASS_C_ID) ? WORKSPACE_C_ID : WORKSPACE_A_ID;
                p.setId(id);
            }
            projectStore.put(p.getId(), p);
            return p;
        });
        lenient().when(projectRepository.findActiveById(anyInt())).thenAnswer(inv -> {
            Integer id = inv.getArgument(0);
            ProjectWorkspace p = projectStore.get(id);
            return (p != null && !Boolean.TRUE.equals(p.getIsDeleted())) ? Optional.of(p) : Optional.empty();
        });
        lenient().when(projectRepository.findActiveBySlug(any())).thenAnswer(inv -> {
            String slug = inv.getArgument(0);
            return projectStore.values().stream()
                    .filter(p -> slug.equals(p.getSlug()) && !Boolean.TRUE.equals(p.getIsDeleted()))
                    .findFirst();
        });

        // ---- ProjectMember ----
        lenient().when(memberRepository.save(any(ProjectMember.class))).thenAnswer(inv -> {
            ProjectMember m = inv.getArgument(0);
            if (m.getId() <= 0) {
                m.setId(memberIdSeq.getAndIncrement());
            }
            List<ProjectMember> list = bucket(memberStore, m.getProjectId());
            list.removeIf(existing -> existing.getId() == m.getId());
            list.add(m);
            return m;
        });
        lenient().when(memberRepository.findActiveByProjectId(anyInt())).thenAnswer(inv -> {
            Integer pid = inv.getArgument(0);
            List<ProjectMember> result = new ArrayList<>();
            for (ProjectMember m : bucket(memberStore, pid)) {
                if (!Boolean.TRUE.equals(m.getIsDeleted())) result.add(m);
            }
            return result;
        });
        lenient().when(memberRepository.findByProjectAndUserAndType(anyInt(), anyInt(), any())).thenAnswer(inv -> {
            Integer pid = inv.getArgument(0);
            Integer uid = inv.getArgument(1);
            String type = inv.getArgument(2);
            return bucket(memberStore, pid).stream()
                    .filter(m -> m.getUserId().equals(uid) && type.equalsIgnoreCase(m.getUserType()))
                    .findFirst();
        });
        lenient().when(memberRepository.existsActiveMembership(anyInt(), anyInt(), any())).thenAnswer(inv -> {
            Integer pid = inv.getArgument(0);
            Integer uid = inv.getArgument(1);
            String type = inv.getArgument(2);
            return bucket(memberStore, pid).stream()
                    .anyMatch(m -> m.getUserId().equals(uid) && type.equalsIgnoreCase(m.getUserType()) && !Boolean.TRUE.equals(m.getIsDeleted()));
        });
        lenient().when(memberRepository.findById(any())).thenAnswer(inv -> {
            Integer id = inv.getArgument(0);
            return memberStore.values().stream().flatMap(List::stream)
                    .filter(m -> m.getId() == id).findFirst();
        });
        lenient().when(memberRepository.findInactiveByProjectId(anyInt())).thenReturn(Collections.emptyList());
        lenient().when(memberRepository.findActiveByProjectIdIn(any())).thenReturn(Collections.emptyList());

        // ---- ProjectTask ----
        lenient().when(taskRepository.save(any(ProjectTask.class))).thenAnswer(inv -> {
            ProjectTask t = inv.getArgument(0);
            if (t.getId() <= 0) {
                t.setId(taskIdSeq.getAndIncrement());
                t.setVersion(0L);
            }
            List<ProjectTask> list = bucket(taskStore, t.getProjectId());
            list.removeIf(existing -> existing.getId() == t.getId());
            list.add(t);
            return t;
        });
        lenient().when(taskRepository.findActiveByProjectId(anyInt())).thenAnswer(inv -> {
            Integer pid = inv.getArgument(0);
            List<ProjectTask> result = new ArrayList<>();
            for (ProjectTask t : bucket(taskStore, pid)) {
                if (!Boolean.TRUE.equals(t.getIsDeleted())) result.add(t);
            }
            return result;
        });
        lenient().when(taskRepository.findAllByProjectId(anyInt())).thenAnswer(inv -> new ArrayList<>(bucket(taskStore, inv.getArgument(0))));
        lenient().when(taskRepository.countActiveByProjectId(anyInt())).thenAnswer(inv -> {
            Integer pid = inv.getArgument(0);
            return bucket(taskStore, pid).stream().filter(t -> !Boolean.TRUE.equals(t.getIsDeleted())).count();
        });

        // ---- ProjectSprint ----
        lenient().when(sprintRepository.save(any(ProjectSprint.class))).thenAnswer(inv -> {
            ProjectSprint m = inv.getArgument(0);
            if (m.getId() <= 0) {
                m.setId(sprintIdSeq.getAndIncrement());
            }
            List<ProjectSprint> list = bucket(sprintStore, m.getProjectId());
            list.removeIf(existing -> existing.getId() == m.getId());
            list.add(m);
            return m;
        });
        lenient().when(sprintRepository.findActiveByProjectId(anyInt())).thenAnswer(inv -> {
            Integer pid = inv.getArgument(0);
            List<ProjectSprint> result = new ArrayList<>();
            for (ProjectSprint m : bucket(sprintStore, pid)) {
                if (!Boolean.TRUE.equals(m.getIsDeleted())) result.add(m);
            }
            return result;
        });
        lenient().when(sprintRepository.findAllByProjectId(anyInt())).thenAnswer(inv -> new ArrayList<>(bucket(sprintStore, inv.getArgument(0))));
        // V119: no release fixtures in this isolation test — an empty list is exactly right,
        // since loadProjectSprints only needs releaseRepository to resolve a releaseId to a
        // key/title, and none of these workspaces link a sprint to a release.
        lenient().when(releaseRepository.findActiveByProjectId(anyInt())).thenReturn(new ArrayList<>());

        // ---- ProjectResource ----
        lenient().when(resourceRepository.save(any(ProjectResource.class))).thenAnswer(inv -> {
            ProjectResource r = inv.getArgument(0);
            if (r.getId() <= 0) {
                r.setId(resourceIdSeq.getAndIncrement());
            }
            List<ProjectResource> list = bucket(resourceStore, r.getProjectId());
            list.removeIf(existing -> existing.getId() == r.getId());
            list.add(r);
            return r;
        });
        lenient().when(resourceRepository.findActiveByProjectIdOrderByResourceOrderAscIdAsc(anyInt())).thenAnswer(inv -> {
            Integer pid = inv.getArgument(0);
            List<ProjectResource> result = new ArrayList<>();
            for (ProjectResource r : bucket(resourceStore, pid)) {
                if (!Boolean.TRUE.equals(r.getIsDeleted())) result.add(r);
            }
            return result;
        });
        lenient().when(resourceRepository.findAllByProjectId(anyInt())).thenAnswer(inv -> new ArrayList<>(bucket(resourceStore, inv.getArgument(0))));
        lenient().when(resourceRepository.findById(any())).thenAnswer(inv -> {
            Integer id = inv.getArgument(0);
            return resourceStore.values().stream().flatMap(List::stream)
                    .filter(r -> r.getId() == id).findFirst();
        });
        lenient().when(resourceAuditRepository.findRecentByProjectId(anyInt(), any())).thenReturn(Collections.emptyList());
        lenient().when(resourceAuditRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // ---- ProjectMeeting ----
        lenient().when(meetingRepository.save(any(ProjectMeeting.class))).thenAnswer(inv -> {
            ProjectMeeting m = inv.getArgument(0);
            if (m.getId() <= 0) {
                // A per-project-scoped counter here would let both workspaces' first meeting land
                // on id=1 — real meeting ids are a single global auto-increment sequence, so any
                // cross-workspace-id test built on this store needs ids that never collide, same
                // as task/sprint/resource ids above.
                m.setId(meetingIdSeq.getAndIncrement());
            }
            List<ProjectMeeting> list = bucket(meetingStore, m.getProjectId());
            list.removeIf(existing -> existing.getId() == m.getId());
            list.add(m);
            return m;
        });
        lenient().when(meetingRepository.findByProjectIdAndMeetingKey(anyInt(), any())).thenAnswer(inv -> {
            Integer pid = inv.getArgument(0);
            String key = inv.getArgument(1);
            return bucket(meetingStore, pid).stream().filter(m -> key.equals(m.getMeetingKey())).findFirst();
        });
        lenient().when(meetingRepository.findActiveByProjectId(anyInt())).thenAnswer(inv -> {
            Integer pid = inv.getArgument(0);
            List<ProjectMeeting> result = new ArrayList<>();
            for (ProjectMeeting m : bucket(meetingStore, pid)) {
                if (!Boolean.TRUE.equals(m.getIsDeleted())) result.add(m);
            }
            return result;
        });
        lenient().when(meetingRepository.findInactiveByProjectId(anyInt())).thenReturn(Collections.emptyList());
        lenient().when(meetingHistoryRepository.findRecentByProjectId(anyInt(), any())).thenReturn(Collections.emptyList());

        // ---- ProjectDelivery ----
        lenient().when(deliveryRepository.save(any(ProjectDelivery.class))).thenAnswer(inv -> {
            ProjectDelivery d = inv.getArgument(0);
            if (d.getId() <= 0) {
                d.setId(deliveryIdSeq.getAndIncrement());
                d.setVersion(0L);
            }
            deliveryStore.put(d.getProjectId(), d);
            return d;
        });
        lenient().when(deliveryRepository.findActiveByProjectId(anyInt())).thenAnswer(inv -> {
            Integer pid = inv.getArgument(0);
            return Optional.ofNullable(deliveryStore.get(pid));
        });
        lenient().when(deliveryEventRepository.findActiveByDeliveryId(anyInt(), anyInt())).thenReturn(Collections.emptyList());

        lenient().when(activityEventRepository.findRecentByProjectId(anyInt(), any())).thenReturn(Collections.emptyList());

        // ---- ProjectTaskComment ----
        lenient().when(taskCommentRepository.save(any(ProjectTaskComment.class))).thenAnswer(inv -> {
            ProjectTaskComment c = inv.getArgument(0);
            if (c.getId() <= 0) {
                c.setId(commentIdSeq.getAndIncrement());
            }
            List<ProjectTaskComment> list = bucket(commentStore, c.getProjectTaskId());
            list.removeIf(existing -> existing.getId() == c.getId());
            list.add(c);
            return c;
        });
        lenient().when(taskCommentRepository.findActiveByTaskId(anyInt(), anyInt())).thenAnswer(inv -> {
            Integer pid = inv.getArgument(0);
            Integer tid = inv.getArgument(1);
            List<ProjectTaskComment> result = new ArrayList<>();
            for (ProjectTaskComment c : bucket(commentStore, tid)) {
                if (pid.equals(c.getProjectId())) result.add(c);
            }
            return result;
        });
    }

    private ProjectWorkspaceDTO createWorkspace(String title, int classId, int mentorId) {
        AdminProjectCreateDTO payload = new AdminProjectCreateDTO();
        payload.setTitle(title);
        payload.setCollegeId(6);
        payload.setClassId(classId);
        payload.setTemplateId(TEMPLATE_ID);
        payload.setMentorId(mentorId);
        return service.createProject(admin, payload);
    }

    private void createBothWorkspaces() {
        createWorkspace("Workspace A", CLASS_A_ID, MENTOR_A_ID);
        createWorkspace("Workspace B", CLASS_B_ID, MENTOR_B_ID);
    }

    // Task materialization (persisting a real ProjectTask row from a template's virtual task) only
    // happens on a WRITE-side touch (resolveOrMaterializeProjectTask, used by updateProjectTask /
    // addProjectTaskComment) - plain reads (getProjectTasks) merge the template's virtual rows into
    // the response DTO without ever persisting them. This helper forces a real materialized row by
    // resending the template's own default values as a same-content update.
    private void materializeTask(UserPrincipal principal, int projectId, String title, String status, String priority) {
        ProjectTaskUpsertDTO payload = new ProjectTaskUpsertDTO();
        payload.setTitle(title);
        payload.setStatus(status);
        payload.setPriority(priority);
        service.updateProjectTask(principal, String.valueOf(projectId), "kickoff-review", payload);
    }

    // ------------------------------------------------------------------
    // 1. Setup sanity: both workspaces bound to the same template, different mentors/classes
    // ------------------------------------------------------------------
    @Test
    @DisplayName("both workspaces are created from the same template with different mentors and classes")
    void bothWorkspaces_createdFromSameTemplate_withDifferentMentorsAndClasses() {
        ProjectWorkspaceDTO a = createWorkspace("Workspace A", CLASS_A_ID, MENTOR_A_ID);
        ProjectWorkspaceDTO b = createWorkspace("Workspace B", CLASS_B_ID, MENTOR_B_ID);

        assertEquals(WORKSPACE_A_ID, a.getNumericId());
        assertEquals(WORKSPACE_B_ID, b.getNumericId());
        assertEquals(TEMPLATE_ID, a.getTemplateId());
        assertEquals(TEMPLATE_ID, b.getTemplateId());
        assertEquals("Mentor Alpha", a.getMentor());
        assertEquals("Mentor Bravo", b.getMentor());
        assertNotEquals(a.getNumericId(), b.getNumericId());
    }

    // ------------------------------------------------------------------
    // 2. Completing/updating a task in workspace A never touches workspace B
    // ------------------------------------------------------------------
    @Test
    @DisplayName("updating a task in workspace A never touches workspace B's task repository rows")
    void updatingTaskInWorkspaceA_neverTouchesWorkspaceB() {
        createBothWorkspaces();
        // Touch B's copy of the same template task first so a row scoped to projectId=200 exists.
        service.getProjectTasks(mentorB, String.valueOf(WORKSPACE_B_ID));

        ProjectTaskUpsertDTO payload = new ProjectTaskUpsertDTO();
        payload.setTitle("Kickoff Review - Done");
        payload.setStatus("done");
        payload.setPriority("High");

        List<ProjectTaskDTO> resultA = service.updateProjectTask(mentorA, String.valueOf(WORKSPACE_A_ID), "kickoff-review", payload);

        assertEquals(1, resultA.size());
        assertEquals("DONE", resultA.get(0).getStatus());
        assertEquals("Kickoff Review - Done", resultA.get(0).getTitle());

        // B's materialized row must be untouched: still the original template values.
        List<ProjectTaskDTO> resultB = service.getProjectTasks(mentorB, String.valueOf(WORKSPACE_B_ID));
        assertEquals(1, resultB.size());
        assertEquals("Kickoff Review", resultB.get(0).getTitle());
        assertNotEquals("DONE", resultB.get(0).getStatus());

        verify(taskRepository, never()).save(org.mockito.ArgumentMatchers.argThat(
                t -> t != null && t.getProjectId() != null && t.getProjectId() == WORKSPACE_B_ID
                        && "DONE".equals(t.getTaskStatus())));
    }

    // ------------------------------------------------------------------
    // 3. Materialized tasks are distinct entities per workspace, from the same template
    // ------------------------------------------------------------------
    @Test
    @DisplayName("materialized tasks are independent ProjectTask rows per workspace even from the same template")
    void materializedTasks_areDistinctEntitiesPerWorkspace_evenFromSameTemplate() {
        createBothWorkspaces();

        List<ProjectTaskDTO> tasksA = service.getProjectTasks(mentorA, String.valueOf(WORKSPACE_A_ID));
        assertEquals(1, tasksA.size());
        assertEquals("kickoff-review", tasksA.get(0).getTaskKey());
        // getProjectTasks is a read-only merge of the template's virtual row with any DB row - it
        // does not persist anything, so nothing is materialized into project_task yet.
        assertTrue(taskStore.getOrDefault(WORKSPACE_A_ID, Collections.emptyList()).isEmpty());
        assertTrue(taskStore.getOrDefault(WORKSPACE_B_ID, Collections.emptyList()).isEmpty());

        // First real materialization: A gets its own edited row.
        materializeTask(mentorA, WORKSPACE_A_ID, "Kickoff Review - workspace A only", "in review", "Low");

        assertEquals(1, taskStore.get(WORKSPACE_A_ID).size());
        assertTrue(taskStore.getOrDefault(WORKSPACE_B_ID, Collections.emptyList()).isEmpty());

        // B materializes its own copy independently, untouched by A's edit above.
        materializeTask(mentorB, WORKSPACE_B_ID, "Kickoff Review", "To do", "Medium");

        List<ProjectTaskDTO> tasksB = service.getProjectTasks(mentorB, String.valueOf(WORKSPACE_B_ID));
        assertEquals(1, tasksB.size());
        assertEquals("kickoff-review", tasksB.get(0).getTaskKey());
        // Same taskKey, but B's title/status are still template defaults — a wholly separate row.
        assertEquals("Kickoff Review", tasksB.get(0).getTitle());
        assertNotEquals("Kickoff Review - workspace A only", tasksB.get(0).getTitle());

        // Confirm at the entity level: two rows exist, different ids, different projectIds.
        assertEquals(2, taskStore.values().stream().mapToInt(List::size).sum());
        ProjectTask savedA = taskStore.get(WORKSPACE_A_ID).get(0);
        ProjectTask savedB = taskStore.get(WORKSPACE_B_ID).get(0);
        assertNotEquals(savedA.getId(), savedB.getId());
        assertEquals(WORKSPACE_A_ID, (int) savedA.getProjectId());
        assertEquals(WORKSPACE_B_ID, (int) savedB.getProjectId());
    }

    // ------------------------------------------------------------------
    // 3b. Bug fix: materialization must carry estimatePoints/taskType/acceptanceCriteria/approach
    // forward from the template, not silently drop them
    // ------------------------------------------------------------------
    @Test
    @DisplayName("materializing a task carries estimatePoints, taskType, acceptanceCriteria, and approach from the template")
    void materializingTask_carriesEstimateTypeAndGuidanceFromTemplate() {
        createWorkspace("Workspace A", CLASS_A_ID, MENTOR_A_ID);

        // Edit only title/status/priority -- the same partial-field payload a routine status
        // change would send. The four fields under test are never part of this payload, so if
        // they survive, it can only be because materialization itself carried them from the
        // template, not because this update happened to resend them.
        materializeTask(mentorA, WORKSPACE_A_ID, "Kickoff Review", "in progress", "Medium");

        ProjectTask saved = taskStore.get(WORKSPACE_A_ID).get(0);
        assertEquals(5, saved.getEstimatePoints());
        assertEquals("BUG", saved.getTaskType());
        assertEquals("Kickoff call completed and notes shared with the team", saved.getAcceptanceCriteria());
        assertEquals("Schedule the call, walk through the brief, confirm scope", saved.getApproach());

        List<ProjectTaskDTO> tasksA = service.getProjectTasks(mentorA, String.valueOf(WORKSPACE_A_ID));
        assertEquals(5, tasksA.get(0).getEstimatePoints());
        assertEquals("BUG", tasksA.get(0).getTaskType());
    }

    // ------------------------------------------------------------------
    // 4. Reassigning workspace A's mentor never affects workspace B's mentor/member state
    // ------------------------------------------------------------------
    @Test
    @DisplayName("reassigning workspace A's mentor never touches workspace B's member repository state")
    void reassigningMentorInWorkspaceA_neverTouchesWorkspaceB() {
        createBothWorkspaces();
        // Both workspaces' own initial mentor-assignment saves happened during setup above; only
        // interactions from the reassignment call itself (below) are relevant to this assertion.
        clearInvocations(memberRepository);

        AdminProjectMentorAssignDTO payload = new AdminProjectMentorAssignDTO();
        payload.setCollegeId(6);
        payload.setMentorId(MENTOR_B_ID); // reuse facultyB's id as A's new mentor, distinct person from B's own mentor row
        service.assignProjectMentor(admin, String.valueOf(WORKSPACE_A_ID), payload);

        // B's own active FACULTY member (mentorB on project 200) must remain exactly as created.
        List<ProjectMemberDTO> membersB = memberRepository.findActiveByProjectId(WORKSPACE_B_ID).stream()
                .map(m -> {
                    ProjectMemberDTO dto = new ProjectMemberDTO();
                    dto.setId(m.getId());
                    dto.setUserId(m.getUserId());
                    dto.setName(m.getDisplayName());
                    dto.setRole(m.getRoleLabel());
                    dto.setStatus(m.getMemberStatus());
                    dto.setUserType(m.getUserType());
                    return dto;
                })
                .toList();
        assertEquals(1, membersB.size());
        assertEquals(MENTOR_B_ID, membersB.get(0).getUserId());
        assertEquals("ACTIVE", membersB.get(0).getStatus());

        verify(memberRepository, never()).save(org.mockito.ArgumentMatchers.argThat(
                m -> m != null && m.getProjectId() != null && m.getProjectId() == WORKSPACE_B_ID));
    }

    // ------------------------------------------------------------------
    // 5. Sprint isolation
    // ------------------------------------------------------------------
    @Test
    @DisplayName("updating a sprint in workspace A never touches workspace B's sprint repository rows")
    void updatingSprintInWorkspaceA_neverTouchesWorkspaceB() {
        createBothWorkspaces();
        // Isolate the assertion to exactly the mutation call below - setup already legitimately
        // read/wrote both workspaces' member rows.
        clearInvocations(sprintRepository);

        // V173: a sprint always ships in a release now -- this test's "phase-one" sprint is
        // touched here for the first time (materializing from the template row), so the payload
        // has to resolve a real release the same way a genuine mentor/admin save would.
        com._42students.lms.model.ProjectRelease release = new com._42students.lms.model.ProjectRelease();
        release.setId(9001);
        release.setProjectId(WORKSPACE_A_ID);
        release.setReleaseKey("release-mvp");
        release.setTitle("MVP");
        lenient().when(releaseRepository.findActiveByProjectIdAndReleaseKey(WORKSPACE_A_ID, "release-mvp"))
                .thenReturn(Optional.of(release));

        Map<String, Object> sprintUpdate = new LinkedHashMap<>();
        sprintUpdate.put("sprintKey", "phase-one");
        sprintUpdate.put("title", "Phase One - Complete");
        sprintUpdate.put("status", "done");
        sprintUpdate.put("releaseKey", "release-mvp");

        ProjectWorkspaceUpdateDTO payload = new ProjectWorkspaceUpdateDTO();
        payload.setSprints(Collections.singletonList(sprintUpdate));

        service.updateProject(admin, String.valueOf(WORKSPACE_A_ID), 6, payload);

        assertEquals(1, sprintStore.getOrDefault(WORKSPACE_A_ID, Collections.emptyList()).size());
        assertEquals("Phase One - Complete", sprintStore.get(WORKSPACE_A_ID).get(0).getTitle());

        verify(sprintRepository, never()).findActiveByProjectId(WORKSPACE_B_ID);
        verify(sprintRepository, never()).save(org.mockito.ArgumentMatchers.argThat(
                m -> m != null && m.getProjectId() != null && m.getProjectId() == WORKSPACE_B_ID
                        && "Phase One - Complete".equals(m.getTitle())));
    }

    // ------------------------------------------------------------------
    // 6. Resource isolation, materialized from the same template resource entry
    // ------------------------------------------------------------------
    // Removed: this test drove first-touch resource materialization via
    // resolveProjectResourceDownloadUrl, which no longer exists — resources and delivery
    // attachments now store plain public R2 URLs at upload/sync time instead of being resolved
    // (and materialized) on access. materializeResourceFromTemplate/rehostMaterializedResourceFile
    // (and the rehostMaterializedResourceFileAfterCommit interface method) had zero remaining
    // callers once that path was removed and have since been deleted from
    // ProjectWorkspaceServiceImpl — resource materialization now only happens via
    // syncProjectResources (applyResourcePayload), same as the task/sprint merge paths tested
    // elsewhere in this file.

    // ------------------------------------------------------------------
    // 7. Delivery/submission isolation (learner draft save on A)
    // ------------------------------------------------------------------
    @Test
    @DisplayName("a learner draft save on workspace A's delivery never touches workspace B's delivery record")
    void learnerSubmissionInWorkspaceA_neverTouchesWorkspaceBDelivery() {
        createBothWorkspaces();
        // Add learnerA to workspace A so they hold active membership required by updateProjectSubmission.
        service.addProjectMember(mentorA, String.valueOf(WORKSPACE_A_ID),
                memberPayload(70, "LEARNER", "Learner Alpha"));
        UserPrincipal learnerA = new UserPrincipal(70, "LEARNER", null, 1, 6, 0);

        // Pre-seed an existing delivery on B, so B's row is present before A's mutation and can be
        // asserted as untouched afterward.
        ProjectDelivery deliveryB = new ProjectDelivery();
        deliveryB.setProjectId(WORKSPACE_B_ID);
        deliveryB.setStatus("Draft");
        deliveryB.setSummary("B's own original draft");
        deliveryRepository.save(deliveryB);

        Map<String, Object> deliveryPayload = new LinkedHashMap<>();
        deliveryPayload.put("action", "SAVE_DRAFT");
        deliveryPayload.put("summary", "A's learner draft");

        ProjectWorkspaceUpdateDTO payload = new ProjectWorkspaceUpdateDTO();
        payload.setDelivery(deliveryPayload);

        service.updateProjectSubmission(learnerA, String.valueOf(WORKSPACE_A_ID), payload);

        assertEquals("A's learner draft", deliveryStore.get(WORKSPACE_A_ID).getSummary());
        assertEquals("B's own original draft", deliveryStore.get(WORKSPACE_B_ID).getSummary());

        verify(deliveryRepository, never()).save(org.mockito.ArgumentMatchers.argThat(
                d -> d != null && d.getProjectId() != null && d.getProjectId() == WORKSPACE_B_ID
                        && "A's learner draft".equals(d.getSummary())));
    }

    // ------------------------------------------------------------------
    // 8. Delivery/submission isolation (mentor review action on A)
    // ------------------------------------------------------------------
    @Test
    @DisplayName("a mentor review action on workspace A's delivery never touches workspace B's delivery record")
    void mentorReviewActionInWorkspaceA_neverTouchesWorkspaceBDelivery() {
        createBothWorkspaces();

        ProjectDelivery deliveryA = new ProjectDelivery();
        deliveryA.setProjectId(WORKSPACE_A_ID);
        deliveryA.setStatus("Submitted");
        deliveryA.setSummary("A submission awaiting review");
        deliveryRepository.save(deliveryA);

        ProjectDelivery deliveryB = new ProjectDelivery();
        deliveryB.setProjectId(WORKSPACE_B_ID);
        deliveryB.setStatus("Submitted");
        deliveryB.setSummary("B submission awaiting review");
        deliveryRepository.save(deliveryB);

        Map<String, Object> reviewPayload = new LinkedHashMap<>();
        reviewPayload.put("action", "REQUEST_CHANGES");
        reviewPayload.put("feedback", "Please revise section 2");
        reviewPayload.put("version", deliveryA.getVersion());

        ProjectWorkspaceUpdateDTO payload = new ProjectWorkspaceUpdateDTO();
        payload.setDelivery(reviewPayload);

        service.updateProjectDelivery(mentorA, String.valueOf(WORKSPACE_A_ID), payload);

        assertEquals("changes requested", deliveryStore.get(WORKSPACE_A_ID).getStatus().toLowerCase(java.util.Locale.ROOT));
        assertEquals("Submitted", deliveryStore.get(WORKSPACE_B_ID).getStatus());
        assertEquals("B submission awaiting review", deliveryStore.get(WORKSPACE_B_ID).getSummary());

        verify(deliveryRepository, never()).save(org.mockito.ArgumentMatchers.argThat(
                d -> d != null && d.getProjectId() != null && d.getProjectId() == WORKSPACE_B_ID
                        && "Changes Requested".equals(d.getStatus())));
    }

    // ------------------------------------------------------------------
    // 9. Concurrent materialization from the same template: no shared mutable state bleed
    // ------------------------------------------------------------------
    @Test
    @DisplayName("creating both workspaces from the same template never cross-references the sibling's projectId")
    void concurrentCreationOfBothWorkspaces_fromSameTemplate_noSharedStateBleed() {
        // Note: ProjectWorkspaceServiceImpl holds no mutable static/module-level fields (verified
        // by inspection — its only `static` members are `static final` constants), so per-call
        // materialization state can only ever live in local variables scoped to that one call.
        // This test proves that structurally: create A, then create B, then materialize each
        // workspace's task from the identical template, and assert every single taskRepository/
        // memberRepository save during A's flow was scoped to 100 and every save during B's flow
        // was scoped to 200 - never mixed.
        createWorkspace("Workspace A", CLASS_A_ID, MENTOR_A_ID);
        materializeTask(mentorA, WORKSPACE_A_ID, "Kickoff Review", "To do", "Medium");

        createWorkspace("Workspace B", CLASS_B_ID, MENTOR_B_ID);
        materializeTask(mentorB, WORKSPACE_B_ID, "Kickoff Review", "To do", "Medium");

        // Every ProjectMember ever saved is scoped to exactly one of the two known workspace ids.
        for (List<ProjectMember> members : memberStore.values()) {
            for (ProjectMember m : members) {
                assertTrue(m.getProjectId() == WORKSPACE_A_ID || m.getProjectId() == WORKSPACE_B_ID);
            }
        }
        assertEquals(1, memberStore.get(WORKSPACE_A_ID).size());
        assertEquals(1, memberStore.get(WORKSPACE_B_ID).size());
        assertEquals(MENTOR_A_ID, memberStore.get(WORKSPACE_A_ID).get(0).getUserId());
        assertEquals(MENTOR_B_ID, memberStore.get(WORKSPACE_B_ID).get(0).getUserId());

        // Every materialized ProjectTask is scoped to exactly one workspace, one row each.
        assertEquals(1, taskStore.get(WORKSPACE_A_ID).size());
        assertEquals(1, taskStore.get(WORKSPACE_B_ID).size());
        assertNotEquals(taskStore.get(WORKSPACE_A_ID).get(0).getId(), taskStore.get(WORKSPACE_B_ID).get(0).getId());

        verify(taskRepository, never()).save(org.mockito.ArgumentMatchers.argThat(
                t -> t != null && t.getProjectId() != null
                        && t.getProjectId() != WORKSPACE_A_ID && t.getProjectId() != WORKSPACE_B_ID));
    }

    // ------------------------------------------------------------------
    // 10. Task key collision safety: identical taskKey in both workspaces never cross-resolves
    // ------------------------------------------------------------------
    @Test
    @DisplayName("the same taskKey materialized in both workspaces never resolves across projectId boundaries")
    void sameTaskKeyInBothWorkspaces_resolvesToProjectScopedRowNotSiblings() {
        createBothWorkspaces();

        // Materialize the SAME taskKey ("kickoff-review") independently in both workspaces.
        materializeTask(mentorA, WORKSPACE_A_ID, "Kickoff Review", "To do", "Medium");
        materializeTask(mentorB, WORKSPACE_B_ID, "Kickoff Review", "To do", "Medium");

        ProjectTask taskA = taskStore.get(WORKSPACE_A_ID).get(0);
        ProjectTask taskB = taskStore.get(WORKSPACE_B_ID).get(0);
        assertEquals("kickoff-review", taskA.getTaskKey());
        assertEquals("kickoff-review", taskB.getTaskKey());
        assertNotEquals(taskA.getId(), taskB.getId());

        // Mutate A's row via the taskKey (not the numeric id) - the classic ambiguous lookup path.
        ProjectTaskUpsertDTO payload = new ProjectTaskUpsertDTO();
        payload.setTitle("Only A should change");
        payload.setStatus("in review");
        payload.setPriority("High");
        payload.setVersion(taskA.getVersion());
        service.updateProjectTask(mentorA, String.valueOf(WORKSPACE_A_ID), "kickoff-review", payload);

        // Re-fetch by numeric id too, to rule out resolveOrMaterializeProjectTask's numeric-id branch
        // resolving into the wrong workspace's row for the same raw id/key coincidence.
        List<ProjectTaskDTO> byKeyA = service.updateProjectTask(mentorA, String.valueOf(WORKSPACE_A_ID), String.valueOf(taskA.getId()), payload);
        assertEquals(1, byKeyA.size());
        assertEquals(WORKSPACE_A_ID, taskStore.get(WORKSPACE_A_ID).get(0).getProjectId().intValue());

        // B's row, same taskKey, must be completely unaffected.
        ProjectTask stillB = taskStore.get(WORKSPACE_B_ID).get(0);
        assertEquals("Kickoff Review", stillB.getTitle());
        assertEquals("TO_DO", stillB.getTaskStatus());
        assertEquals(taskB.getId(), stillB.getId());

        // The taskId namespace is NOT projectId-prefixed (it's a single global sequence: taskA.id=1,
        // taskB.id=2) - proving the lookup is genuinely projectId-scoped, not just "lucky" because the
        // ids never collided. resolveOrMaterializeProjectTask('200', taskA's numeric id) must never
        // resolve to A's row.
        List<ProjectTaskDTO> lookupBWithAsId = service.getProjectTasks(mentorB, String.valueOf(WORKSPACE_B_ID));
        assertEquals(1, lookupBWithAsId.size());
        assertNotEquals(taskA.getId(), lookupBWithAsId.get(0).getId() == null ? -1 : lookupBWithAsId.get(0).getId().intValue());

        verify(taskRepository, never()).save(org.mockito.ArgumentMatchers.argThat(
                t -> t != null && t.getProjectId() != null && t.getProjectId() == WORKSPACE_B_ID
                        && "Only A should change".equals(t.getTitle())));
    }

    // ------------------------------------------------------------------
    // 11. Mentor removal on A: business rules block removing the sole mentor, and even that
    //     rejected attempt never touches B's mentor membership.
    // ------------------------------------------------------------------
    @Test
    @DisplayName("attempting to remove workspace A's sole mentor is rejected, and never touches workspace B's mentor row")
    void removingMentorFromWorkspaceA_neverOrphansOrTouchesWorkspaceBMentor() {
        createBothWorkspaces();
        ProjectMember mentorMemberA = memberRepository.findByProjectAndUserAndType(WORKSPACE_A_ID, MENTOR_A_ID, "FACULTY").orElseThrow();
        clearInvocations(memberRepository);

        // removeProjectMember's own invariant (mirrors assignProjectMentor: never leave a project
        // with zero active mentors) rejects removing the ONLY mentor - there is no standalone
        // "remove the mentor" path independent of reassignment in this codebase. That guard itself
        // is scoped per-project (memberRepository.findActiveByProjectId(A's id) only), which is
        // exactly the isolation property this test proves even on the rejected path.
        assertThrows(IllegalArgumentException.class, () ->
                service.removeProjectMember(mentorA, String.valueOf(WORKSPACE_A_ID), mentorMemberA.getId()));

        // Workspace A's mentor is still active and untouched.
        assertTrue(memberRepository.existsActiveMembership(WORKSPACE_A_ID, MENTOR_A_ID, "FACULTY"));
        // Workspace B's mentor membership was never read or written during A's rejected removal.
        assertTrue(memberRepository.existsActiveMembership(WORKSPACE_B_ID, MENTOR_B_ID, "FACULTY"));
        verify(memberRepository, never()).save(org.mockito.ArgumentMatchers.argThat(
                m -> m != null && m.getProjectId() != null && m.getProjectId() == WORKSPACE_B_ID));
    }

    @Test
    @DisplayName("REGRESSION: an INACTIVE mentor does not count towards the sole-mentor guard")
    void inactiveMentorDoesNotSatisfyTheSoleMentorGuard() {
        createBothWorkspaces();

        // A second mentor exists on workspace A, but is INACTIVE — requireProjectReadAccess refuses
        // them outright, so they cannot open the project at all.
        ProjectMember inactiveSecondMentor = new ProjectMember();
        inactiveSecondMentor.setId(90210);
        inactiveSecondMentor.setProjectId(WORKSPACE_A_ID);
        inactiveSecondMentor.setUserId(MENTOR_A_ID + 500);
        inactiveSecondMentor.setUserType("FACULTY");
        inactiveSecondMentor.setRoleLabel("Project Mentor");
        inactiveSecondMentor.setMemberStatus("INACTIVE");
        inactiveSecondMentor.setIsDeleted(false);
        bucket(memberStore, WORKSPACE_A_ID).add(inactiveSecondMentor);

        ProjectMember mentorMemberA = memberRepository
                .findByProjectAndUserAndType(WORKSPACE_A_ID, MENTOR_A_ID, "FACULTY").orElseThrow();

        // The guard counted members via findActiveByProjectId, which filters only on isDeleted and
        // therefore returned the INACTIVE mentor too. Two "mentors" were seen, the <= 1 test failed,
        // and removing the one mentor who could actually reach the project was allowed — leaving the
        // workspace ACTIVE with nobody able to open it, precisely the outcome this guard exists to
        // prevent (and which its own comment describes).
        assertThrows(IllegalArgumentException.class, () ->
                service.removeProjectMember(mentorA, String.valueOf(WORKSPACE_A_ID), mentorMemberA.getId()));

        assertTrue(memberRepository.existsActiveMembership(WORKSPACE_A_ID, MENTOR_A_ID, "FACULTY"));
    }

    @Test
    @DisplayName("REGRESSION: an INACTIVE mentor does not let the sole active mentor be deactivated")
    void inactiveMentorDoesNotAllowDeactivatingTheLastActiveMentor() {
        createBothWorkspaces();

        ProjectMember inactiveSecondMentor = new ProjectMember();
        inactiveSecondMentor.setId(90211);
        inactiveSecondMentor.setProjectId(WORKSPACE_A_ID);
        inactiveSecondMentor.setUserId(MENTOR_A_ID + 501);
        inactiveSecondMentor.setUserType("FACULTY");
        inactiveSecondMentor.setRoleLabel("Project Mentor");
        inactiveSecondMentor.setMemberStatus("INACTIVE");
        inactiveSecondMentor.setIsDeleted(false);
        bucket(memberStore, WORKSPACE_A_ID).add(inactiveSecondMentor);

        ProjectMember mentorMemberA = memberRepository
                .findByProjectAndUserAndType(WORKSPACE_A_ID, MENTOR_A_ID, "FACULTY").orElseThrow();

        // Same root cause through updateProjectMember rather than removeProjectMember: setting the
        // last reachable mentor to INACTIVE is functionally removal (the comment on
        // wasSolePrimaryMentor says so explicitly), so it must be refused for the same reason.
        com._42students.lms.dto.projects.ProjectMemberUpdateDTO deactivate =
                new com._42students.lms.dto.projects.ProjectMemberUpdateDTO();
        deactivate.setMemberStatus("INACTIVE");

        assertThrows(IllegalArgumentException.class, () ->
                service.updateProjectMember(mentorA, String.valueOf(WORKSPACE_A_ID), mentorMemberA.getId(), deactivate));
    }

    // ------------------------------------------------------------------
    // 12. Template mutation after materialization is a one-time copy, not a live reference
    // ------------------------------------------------------------------
    @Test
    @DisplayName("editing the shared template after materialization never re-saves either workspace's tasks or sprints")
    void templateEditAfterMaterialization_neverTriggersSavesOnEitherWorkspacesTasksOrSprints() {
        createBothWorkspaces();
        // Materialize both workspaces' copies of the template's task before editing the template.
        materializeTask(mentorA, WORKSPACE_A_ID, "Kickoff Review", "To do", "Medium");
        materializeTask(mentorB, WORKSPACE_B_ID, "Kickoff Review", "To do", "Medium");
        assertEquals(1, taskStore.get(WORKSPACE_A_ID).size());
        assertEquals(1, taskStore.get(WORKSPACE_B_ID).size());

        clearInvocations(taskRepository, sprintRepository);

        AdminProjectTemplateUpsertDTO templatePayload = new AdminProjectTemplateUpsertDTO();
        templatePayload.setTitle("Shared Cohort Template - Renamed");
        templatePayload.setLifecycleStatus("PUBLISHED");

        // Templates are super-admin-only to edit now (V136__project_template_global.sql) — the
        // college-admin principal used everywhere else in this test would be rejected here.
        service.updateProjectTemplate(superAdmin, TEMPLATE_ID, 6, templatePayload);

        assertEquals("Shared Cohort Template - Renamed", template.getTitle());
        // Materialization is a one-time copy: editing the template must never touch either
        // workspace's already-materialized task/sprint rows.
        verify(taskRepository, never()).save(any());
        verify(sprintRepository, never()).save(any());
        // Already-materialized rows in both workspaces keep their original, un-renamed titles.
        assertEquals("Kickoff Review", taskStore.get(WORKSPACE_A_ID).get(0).getTitle());
        assertEquals("Kickoff Review", taskStore.get(WORKSPACE_B_ID).get(0).getTitle());
    }

    // ------------------------------------------------------------------
    // 13. Archiving/deleting workspace A never cascades into workspace B
    // ------------------------------------------------------------------
    @Test
    @DisplayName("deleting workspace A never cascades any repository call scoped to workspace B")
    void archivingOrDeletingWorkspaceA_neverCascadesToWorkspaceB() {
        createBothWorkspaces();
        materializeTask(mentorA, WORKSPACE_A_ID, "Kickoff Review", "To do", "Medium");
        materializeTask(mentorB, WORKSPACE_B_ID, "Kickoff Review", "To do", "Medium");
        assertEquals(1, taskStore.get(WORKSPACE_A_ID).size());
        assertEquals(1, taskStore.get(WORKSPACE_B_ID).size());
        // Isolate the assertions below to exactly the delete call - workspace creation/materialization
        // above already legitimately read both workspaces' own rows.
        clearInvocations(taskRepository, memberRepository, meetingRepository);

        service.deleteProject(admin, String.valueOf(WORKSPACE_A_ID), 6);

        // A's cascade: member/task/meeting rows soft-deleted and task key retired.
        assertTrue(projectStore.get(WORKSPACE_A_ID).getIsDeleted());
        assertTrue(taskStore.get(WORKSPACE_A_ID).get(0).getIsDeleted());
        assertTrue(memberRepository.findActiveByProjectId(WORKSPACE_A_ID).isEmpty());

        // B is completely unaffected: still active, mentor still active, task still active/untouched.
        assertTrue(!Boolean.TRUE.equals(projectStore.get(WORKSPACE_B_ID).getIsDeleted()));
        assertTrue(memberRepository.existsActiveMembership(WORKSPACE_B_ID, MENTOR_B_ID, "FACULTY"));
        assertEquals(1, taskRepository.findActiveByProjectId(WORKSPACE_B_ID).size());
        assertTrue(!Boolean.TRUE.equals(taskStore.get(WORKSPACE_B_ID).get(0).getIsDeleted()));

        verify(taskRepository, never()).save(org.mockito.ArgumentMatchers.argThat(
                t -> t != null && t.getProjectId() != null && t.getProjectId() == WORKSPACE_B_ID && Boolean.TRUE.equals(t.getIsDeleted())));
        verify(memberRepository, never()).save(org.mockito.ArgumentMatchers.argThat(
                m -> m != null && m.getProjectId() != null && m.getProjectId() == WORKSPACE_B_ID && Boolean.TRUE.equals(m.getIsDeleted())));
        verify(meetingRepository, never()).findActiveByProjectId(WORKSPACE_B_ID);
    }

    // ------------------------------------------------------------------
    // 14. Task comment isolation, on the identical materialized taskKey in both workspaces
    // ------------------------------------------------------------------
    @Test
    @DisplayName("a comment posted on workspace A's task never appears in workspace B's comment list, even on the same taskKey")
    void taskCommentInWorkspaceA_neverAppearsInWorkspaceBCommentList() {
        createBothWorkspaces();
        materializeTask(mentorA, WORKSPACE_A_ID, "Kickoff Review", "To do", "Medium");
        materializeTask(mentorB, WORKSPACE_B_ID, "Kickoff Review", "To do", "Medium");

        // getProjectTaskComments only resolves a real numeric task id (see its source: it never
        // falls back to a taskKey lookup the way updateProjectTask/addProjectTaskComment do) — use
        // each workspace's own materialized row id, not the shared "kickoff-review" key string.
        int taskIdA = taskStore.get(WORKSPACE_A_ID).get(0).getId();
        int taskIdB = taskStore.get(WORKSPACE_B_ID).get(0).getId();

        ProjectTaskCommentUpsertDTO commentPayload = new ProjectTaskCommentUpsertDTO();
        commentPayload.setMessage("A-only progress note");
        commentPayload.setCommentType("NOTE");
        service.addProjectTaskComment(mentorA, String.valueOf(WORKSPACE_A_ID), "kickoff-review", commentPayload);

        List<ProjectTaskCommentDTO> commentsA = service.getProjectTaskComments(mentorA, String.valueOf(WORKSPACE_A_ID), String.valueOf(taskIdA));
        assertEquals(1, commentsA.size());
        assertEquals("A-only progress note", commentsA.get(0).getMessage());

        // B's copy of the identical taskKey must show zero comments — the message above was never
        // meant to reach it, and the two "kickoff-review" rows are entirely separate DB entities.
        List<ProjectTaskCommentDTO> commentsB = service.getProjectTaskComments(mentorB, String.valueOf(WORKSPACE_B_ID), String.valueOf(taskIdB));
        assertTrue(commentsB.isEmpty());

        // IDOR check: supplying A's real numeric task id while operating in B's own project
        // context must resolve to nothing (findProjectTask scopes by projectId first), not
        // silently surface A's comment.
        List<ProjectTaskCommentDTO> crossLookup = service.getProjectTaskComments(mentorB, String.valueOf(WORKSPACE_B_ID), String.valueOf(taskIdA));
        assertTrue(crossLookup.isEmpty());

        verify(taskCommentRepository, never()).save(org.mockito.ArgumentMatchers.argThat(
                c -> c != null && c.getProjectId() != null && c.getProjectId() == WORKSPACE_B_ID));
    }

    // ------------------------------------------------------------------
    // 15. Meeting isolation, including an identical meetingKey materialized independently in both
    // ------------------------------------------------------------------
    @Test
    @DisplayName("a meeting scheduled in workspace A never appears in workspace B's meeting list, even with the same meetingKey")
    void meetingInWorkspaceA_neverAppearsInWorkspaceBMeetingList() {
        createBothWorkspaces();

        ProjectMeeting meetingA = new ProjectMeeting();
        meetingA.setProjectId(WORKSPACE_A_ID);
        meetingA.setMeetingKey("standup-1");
        meetingA.setTitle("Workspace A standup");
        meetingA.setMeetingStatus("SCHEDULED");
        meetingRepository.save(meetingA);

        // Same meetingKey string, independent workspace, independent row.
        ProjectMeeting meetingB = new ProjectMeeting();
        meetingB.setProjectId(WORKSPACE_B_ID);
        meetingB.setMeetingKey("standup-1");
        meetingB.setTitle("Workspace B standup");
        meetingB.setMeetingStatus("SCHEDULED");
        meetingRepository.save(meetingB);

        List<ProjectMeetingDTO> meetingsA = service.getProjectMeetings(mentorA, String.valueOf(WORKSPACE_A_ID));
        assertEquals(1, meetingsA.size());
        assertEquals("Workspace A standup", meetingsA.get(0).getTitle());

        List<ProjectMeetingDTO> meetingsB = service.getProjectMeetings(mentorB, String.valueOf(WORKSPACE_B_ID));
        assertEquals(1, meetingsB.size());
        assertEquals("Workspace B standup", meetingsB.get(0).getTitle());

        assertNotEquals(meetingA.getId(), meetingB.getId());
    }

    // ------------------------------------------------------------------
    // 16. Real IDOR: supplying workspace B's actual numeric task id while operating in workspace
    //     A's context must never resolve to/mutate B's row.
    // ------------------------------------------------------------------
    @Test
    @DisplayName("workspace B's real numeric task id, submitted while acting on workspace A, never resolves to B's row")
    void crossWorkspaceNumericTaskId_neverResolvesToSiblingsRow() {
        createBothWorkspaces();
        materializeTask(mentorA, WORKSPACE_A_ID, "Kickoff Review", "To do", "Medium");
        materializeTask(mentorB, WORKSPACE_B_ID, "Kickoff Review", "To do", "Medium");
        ProjectTask taskB = taskStore.get(WORKSPACE_B_ID).get(0);
        String originalTitleB = taskB.getTitle();

        ProjectTaskUpsertDTO payload = new ProjectTaskUpsertDTO();
        payload.setTitle("Hijacked via cross-workspace id");
        payload.setStatus("Blocked");
        payload.setPriority("High");
        payload.setBlockerReason("attempted cross-workspace mutation");

        // mentorA, acting on WORKSPACE_A_ID, submits B's real numeric task id as the target.
        // findProjectTask scopes the numeric-id lookup through
        // taskRepository.findActiveByProjectId(WORKSPACE_A_ID) first, so B's id is simply "not
        // found" there — resolveOrMaterializeProjectTask then falls through to treating the raw id
        // string as a taskKey, which also doesn't match anything materialized OR any template row
        // (the template only knows "kickoff-review"), so it correctly rejects the request outright
        // instead of silently resolving to B's row OR quietly materializing an unrelated task.
        assertThrows(IllegalArgumentException.class, () ->
                service.updateProjectTask(mentorA, String.valueOf(WORKSPACE_A_ID), String.valueOf(taskB.getId()), payload));

        // B's row: completely untouched, still its original title, still active.
        ProjectTask stillB = taskStore.get(WORKSPACE_B_ID).stream().filter(t -> t.getId() == taskB.getId()).findFirst().orElseThrow();
        assertEquals(originalTitleB, stillB.getTitle());
        assertNotEquals("Hijacked via cross-workspace id", stillB.getTitle());
        assertEquals(WORKSPACE_B_ID, stillB.getProjectId().intValue());
        // Nothing new was materialized under A either — the request was rejected outright.
        assertTrue(taskStore.getOrDefault(WORKSPACE_A_ID, Collections.emptyList()).stream()
                .noneMatch(t -> "Hijacked via cross-workspace id".equals(t.getTitle())));

        verify(taskRepository, never()).save(org.mockito.ArgumentMatchers.argThat(
                t -> t != null && "Hijacked via cross-workspace id".equals(t.getTitle())));
    }

    // ------------------------------------------------------------------
    // 17. Templates are a single platform-wide catalog (V136__project_template_global.sql) — a
    //     published template is usable by ANY college's workspace, not just the college that
    //     (nominally) created it. This replaces the old per-college-template rejection test:
    //     that check was removed because it is no longer the behavior this system has.
    // ------------------------------------------------------------------
    @Test
    @DisplayName("a published template is usable to create a workspace under a college other than its own")
    void globalTemplate_isUsableForWorkspaceCreationUnderAnyCollege() {
        AdminProjectCreateDTO payload = new AdminProjectCreateDTO();
        payload.setTitle("Cross-college use of a global template");
        payload.setCollegeId(7);
        payload.setClassId(CLASS_A_ID);
        payload.setTemplateId(TEMPLATE_ID);
        lenient().when(classRepository.existsByIdAndCollegeId(CLASS_A_ID, 7)).thenReturn(true);

        ProjectWorkspaceDTO created = service.createProject(admin, payload);

        assertNotEquals(null, created);
        assertTrue(projectStore.containsKey(WORKSPACE_A_ID));
    }

    // ------------------------------------------------------------------
    // 18. An unpublished/archived template blocks NEW workspace creation, but every workspace
    //     already created from it while it was published keeps working normally.
    // ------------------------------------------------------------------
    @Test
    @DisplayName("archiving the shared template blocks new workspace creation but leaves existing workspaces fully functional")
    void archivingSharedTemplate_blocksNewCreation_existingWorkspacesUnaffected() {
        createBothWorkspaces();
        materializeTask(mentorA, WORKSPACE_A_ID, "Kickoff Review", "To do", "Medium");

        template.setLifecycleStatus("ARCHIVED");

        AdminProjectCreateDTO thirdWorkspace = new AdminProjectCreateDTO();
        thirdWorkspace.setTitle("Workspace C - should fail");
        thirdWorkspace.setCollegeId(6);
        thirdWorkspace.setClassId(CLASS_A_ID);
        thirdWorkspace.setTemplateId(TEMPLATE_ID);
        assertThrows(IllegalArgumentException.class, () -> service.createProject(admin, thirdWorkspace));

        // Existing workspaces A and B are completely unaffected by the template's archival - they
        // already copied what they needed at creation time and don't re-check lifecycleStatus.
        List<ProjectTaskDTO> tasksA = service.getProjectTasks(mentorA, String.valueOf(WORKSPACE_A_ID));
        assertEquals(1, tasksA.size());
        assertEquals("Kickoff Review", tasksA.get(0).getTitle());
        List<ProjectTaskDTO> tasksB = service.getProjectTasks(mentorB, String.valueOf(WORKSPACE_B_ID));
        assertEquals(1, tasksB.size());
        assertEquals(2, projectStore.size());
    }

    // ------------------------------------------------------------------
    // 19. Ambiguous assigneeId exploit: the SAME numeric id legitimately belongs to both an
    //     active LEARNER and an active FACULTY member of the SAME workspace (Learner/Faculty ids
    //     come from independent sequences, so this is a real, reachable collision — not
    //     contrived). An untyped assigneeId (the normal case; the standard task-save flow never
    //     sends assigneeType) must be refused as ambiguous, never silently resolved in the
    //     requester's favor.
    // ------------------------------------------------------------------
    @Test
    @DisplayName("an assigneeId that matches both an active learner and an active faculty member in the same workspace is refused, not guessed")
    void ambiguousAssigneeId_matchingBothLearnerAndFacultyInSameWorkspace_refusesMutationAccess() {
        createBothWorkspaces();
        // Reuse mentorA's OWN numeric id (50) as the collision, rather than adding a second active
        // FACULTY row (the generic add-member path deliberately rejects a second mentor — "This
        // project already has a mentor"). mentorA is already an active FACULTY member of workspace
        // A from creation; adding a LEARNER with that same numeric id is enough to create the exact
        // ambiguity (id 50 in the Learner table and id 50 in the Faculty table are two entirely
        // different people, since the two tables have independent id sequences).
        int collidingId = MENTOR_A_ID;
        Learner learnerCollider = new Learner();
        learnerCollider.setId(collidingId);
        learnerCollider.setCollegeId(6);
        learnerCollider.setFirstName("Collider");
        learnerCollider.setLastName("Learner");
        lenient().when(learnerRepository.findByIdAndNotDeleted(collidingId)).thenReturn(Optional.of(learnerCollider));

        service.addProjectMember(mentorA, String.valueOf(WORKSPACE_A_ID), memberPayload(collidingId, "LEARNER", "Collider Learner"));

        materializeTask(mentorA, WORKSPACE_A_ID, "Kickoff Review", "To do", "Medium");
        ProjectTask task = taskStore.get(WORKSPACE_A_ID).get(0);
        task.setAssigneeId(collidingId);
        task.setAssigneeType(null);

        UserPrincipal colliderAsLearner = new UserPrincipal(collidingId, "LEARNER", null, 1, 6, 0);

        ProjectTaskUpsertDTO payload = new ProjectTaskUpsertDTO();
        payload.setTitle("Mutated by ambiguous identity");
        payload.setStatus("In Review");
        payload.setPriority("High");
        payload.setVersion(task.getVersion());
        // If isLearnerAssignee assumed "untyped -> learner" without also checking for the faculty
        // collision, this "learner" would incorrectly pass the ownership check and gain full
        // task-mutation rights.
        assertThrows(AccessDeniedException.class, () ->
                service.updateProjectTask(colliderAsLearner, String.valueOf(WORKSPACE_A_ID), String.valueOf(task.getId()), payload));

        assertNotEquals("Mutated by ambiguous identity", taskStore.get(WORKSPACE_A_ID).get(0).getTitle());
    }

    // ------------------------------------------------------------------
    // 20. Assigning workspace A's task to someone who only has membership in workspace B (the
    //     sibling on the same template) is rejected outright.
    // ------------------------------------------------------------------
    @Test
    @DisplayName("assigning workspace A's task to someone who is only a member of workspace B is rejected")
    void assigningTaskToNonMemberFromSiblingWorkspace_isRejected() {
        createBothWorkspaces();
        materializeTask(mentorA, WORKSPACE_A_ID, "Kickoff Review", "To do", "Medium");
        ProjectTask taskA = taskStore.get(WORKSPACE_A_ID).get(0);

        ProjectTaskUpsertDTO payload = new ProjectTaskUpsertDTO();
        payload.setTitle(taskA.getTitle());
        payload.setStatus("To do");
        payload.setPriority("Medium");
        payload.setAssigneeId(MENTOR_B_ID); // active FACULTY member of workspace B only, not A
        payload.setVersion(taskA.getVersion());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.updateProjectTask(mentorA, String.valueOf(WORKSPACE_A_ID), String.valueOf(taskA.getId()), payload));
        assertTrue(ex.getMessage().toLowerCase().contains("active member"));

        Integer stillAssignee = taskStore.get(WORKSPACE_A_ID).get(0).getAssigneeId();
        assertNotEquals(Integer.valueOf(MENTOR_B_ID), stillAssignee);
    }

    // ------------------------------------------------------------------
    // 21. Reordering workspace A's tasks with workspace B's real task id mixed into the same
    //     request is rejected outright - not silently dropped, not partially applied.
    // ------------------------------------------------------------------
    @Test
    @DisplayName("reordering workspace A's tasks with workspace B's task id mixed in is rejected outright")
    void reorderWithSiblingWorkspaceTaskIdMixedIn_isRejected() {
        createBothWorkspaces();
        materializeTask(mentorA, WORKSPACE_A_ID, "Kickoff Review", "To do", "Medium");
        materializeTask(mentorB, WORKSPACE_B_ID, "Kickoff Review", "To do", "Medium");
        ProjectTask taskA = taskStore.get(WORKSPACE_A_ID).get(0);
        ProjectTask taskB = taskStore.get(WORKSPACE_B_ID).get(0);

        com._42students.lms.dto.projects.ProjectTaskReorderDTO reorderPayload = new com._42students.lms.dto.projects.ProjectTaskReorderDTO();
        reorderPayload.setOrderedTaskIds(List.of(taskA.getId(), taskB.getId()));

        // orderedTaskIds is validated against taskRepository.findActiveByProjectId(WORKSPACE_A_ID)
        // only - taskB's id isn't in that set, so the whole request is rejected rather than
        // silently reordering just taskA or (worse) touching taskB's sortOrder.
        assertThrows(IllegalArgumentException.class, () ->
                service.reorderProjectTasks(mentorA, String.valueOf(WORKSPACE_A_ID), reorderPayload));

        verify(taskRepository, never()).save(org.mockito.ArgumentMatchers.argThat(
                t -> t != null && t.getId() == taskB.getId() && t.getProjectId() != WORKSPACE_B_ID));
    }

    // ------------------------------------------------------------------
    // 22. A THIRD workspace from the same template stays isolated from both existing siblings -
    //     proves isolation generalizes past a single pairwise A/B comparison (a bug scoped as
    //     "not equal to the one other workspace I know about" would still pass a 2-workspace test
    //     but leak with three or more).
    // ------------------------------------------------------------------
    @Test
    @DisplayName("a third workspace from the same template stays isolated from both existing siblings")
    void thirdWorkspaceFromSameTemplate_staysIsolatedFromBothSiblings() {
        createBothWorkspaces();
        materializeTask(mentorA, WORKSPACE_A_ID, "Kickoff Review", "To do", "Medium");
        materializeTask(mentorB, WORKSPACE_B_ID, "Kickoff Review", "To do", "Medium");

        UserPrincipal mentorC = new UserPrincipal(MENTOR_C_ID, "FACULTY", "MENTOR", 1, 6, 0);
        createWorkspace("Workspace C", CLASS_C_ID, MENTOR_C_ID);
        // "In review", not "Blocked" - the latter now requires a non-blank blockerReason
        // (applyTaskPayload), which this simplified helper doesn't set.
        materializeTask(mentorC, WORKSPACE_C_ID, "Kickoff Review - C only", "In review", "Low");

        assertEquals(3, projectStore.size());
        assertEquals(1, taskStore.get(WORKSPACE_A_ID).size());
        assertEquals(1, taskStore.get(WORKSPACE_B_ID).size());
        assertEquals(1, taskStore.get(WORKSPACE_C_ID).size());

        // All three materialized rows share the same taskKey but are three distinct entities.
        int idA = taskStore.get(WORKSPACE_A_ID).get(0).getId();
        int idB = taskStore.get(WORKSPACE_B_ID).get(0).getId();
        int idC = taskStore.get(WORKSPACE_C_ID).get(0).getId();
        assertTrue(idA != idB && idB != idC && idA != idC);

        // Each workspace, read independently, sees exactly and only its own content.
        List<ProjectTaskDTO> tasksA = service.getProjectTasks(mentorA, String.valueOf(WORKSPACE_A_ID));
        List<ProjectTaskDTO> tasksB = service.getProjectTasks(mentorB, String.valueOf(WORKSPACE_B_ID));
        List<ProjectTaskDTO> tasksC = service.getProjectTasks(mentorC, String.valueOf(WORKSPACE_C_ID));
        assertEquals(1, tasksA.size());
        assertEquals(1, tasksB.size());
        assertEquals(1, tasksC.size());
        assertEquals("Kickoff Review", tasksA.get(0).getTitle());
        assertEquals("Kickoff Review", tasksB.get(0).getTitle());
        assertEquals("Kickoff Review - C only", tasksC.get(0).getTitle());
        assertEquals("IN_REVIEW", tasksC.get(0).getStatus());
        assertNotEquals("IN_REVIEW", tasksA.get(0).getStatus());
        assertNotEquals("IN_REVIEW", tasksB.get(0).getStatus());

        // C's own mentor membership never touched A's or B's member rows.
        assertEquals(1, memberStore.get(WORKSPACE_A_ID).size());
        assertEquals(1, memberStore.get(WORKSPACE_B_ID).size());
        assertEquals(1, memberStore.get(WORKSPACE_C_ID).size());
        assertEquals(MENTOR_C_ID, memberStore.get(WORKSPACE_C_ID).get(0).getUserId());
    }

    // 24. A faculty-created task must not become learner-deletable when both identity tables
    // allocate the same numeric primary key.
    @Test
    @DisplayName("colliding learner and faculty ids do not authorize deletion of faculty-authored tasks")
    void creatorTypeCollisionDoesNotAuthorizeLearnerDelete() {
        createBothWorkspaces();
        ProjectTaskUpsertDTO payload = new ProjectTaskUpsertDTO();
        payload.setTitle("Faculty authored task");
        service.upsertProjectTask(mentorA, String.valueOf(WORKSPACE_A_ID), payload);
        ProjectTask authored = taskStore.get(WORKSPACE_A_ID).stream()
                .filter(task -> "Faculty authored task".equals(task.getTitle()))
                .findFirst().orElseThrow();
        assertEquals("FACULTY", authored.getCreatedByType());
        ProjectMember learnerWithCollidingId = new ProjectMember();
        learnerWithCollidingId.setProjectId(WORKSPACE_A_ID);
        learnerWithCollidingId.setUserId(MENTOR_A_ID);
        learnerWithCollidingId.setUserType("LEARNER");
        learnerWithCollidingId.setMemberStatus("ACTIVE");
        memberStore.get(WORKSPACE_A_ID).add(learnerWithCollidingId);
        UserPrincipal collidingLearner = new UserPrincipal(MENTOR_A_ID, "LEARNER", null, 1, 6, 0);
        assertThrows(AccessDeniedException.class, () ->
                service.removeProjectTask(collidingLearner, String.valueOf(WORKSPACE_A_ID), String.valueOf(authored.getId())));
        assertTrue(taskStore.get(WORKSPACE_A_ID).stream().anyMatch(task -> !Boolean.TRUE.equals(task.getIsDeleted())
                && task.getId() == authored.getId()));
    }

    // 25. Membership is not active merely because its row has not been soft-deleted.
    @Test
    @DisplayName("inactive primary mentor cannot read project detail")
    void inactiveMentorCannotReadProjectDetail() {
        createBothWorkspaces();
        ProjectMember member = memberStore.get(WORKSPACE_A_ID).stream()
                .filter(row -> "FACULTY".equals(row.getUserType())).findFirst().orElseThrow();
        member.setMemberStatus("INACTIVE");
        assertThrows(AccessDeniedException.class, () ->
                service.getMyProject(mentorA, String.valueOf(WORKSPACE_A_ID)));
    }

    // 26. Mandatory expected versions reject stale clients before they can overwrite a row.
    @Test
    @DisplayName("persisted task cannot be updated without an expected version")
    void persistedTaskUpdateRequiresExpectedVersion() {
        createBothWorkspaces();
        ProjectTaskUpsertDTO create = new ProjectTaskUpsertDTO();
        create.setTitle("Persisted manual task");
        service.upsertProjectTask(mentorA, String.valueOf(WORKSPACE_A_ID), create);
        ProjectTask task = taskStore.get(WORKSPACE_A_ID).stream()
                .filter(row -> "Persisted manual task".equals(row.getTitle())).findFirst().orElseThrow();
        ProjectTaskUpsertDTO stale = new ProjectTaskUpsertDTO();
        stale.setTitle("Unauthorized versionless overwrite");
        org.springframework.web.server.ResponseStatusException ex = assertThrows(
                org.springframework.web.server.ResponseStatusException.class, () ->
                service.updateProjectTask(mentorA, String.valueOf(WORKSPACE_A_ID), String.valueOf(task.getId()), stale));
        assertEquals(org.springframework.http.HttpStatus.PRECONDITION_REQUIRED, ex.getStatus());
        assertEquals("Persisted manual task", task.getTitle());
    }

    // 27. Client-supplied sizes cannot make /me/page load an unbounded project list.
    @Test
    @DisplayName("member projects pagination clamps negative page and unbounded size")
    void memberProjectsPaginationCapsPageSize() {
        lenient().when(projectRepository.findAccessibleByUserPaged(
                org.mockito.ArgumentMatchers.eq(MENTOR_A_ID),
                org.mockito.ArgumentMatchers.eq("FACULTY"),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(Collections.emptyList()));
        com._42students.lms.dto.response.PageDTO<ProjectWorkspaceDTO> result =
                service.getMyProjectsPage(mentorA, -12, 50_000, null, null, null);
        assertEquals(0, result.getPageNumber());
        assertEquals(50, result.getPageSize());
        assertEquals(0, result.getTotalRecords());
        verify(projectRepository).findAccessibleByUserPaged(
                org.mockito.ArgumentMatchers.eq(MENTOR_A_ID),
                org.mockito.ArgumentMatchers.eq("FACULTY"),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.eq(org.springframework.data.domain.PageRequest.of(0, 50)));
    }

    private com._42students.lms.dto.projects.ProjectMemberUpsertDTO memberPayload(int userId, String userType, String displayName) {
        com._42students.lms.dto.projects.ProjectMemberUpsertDTO dto = new com._42students.lms.dto.projects.ProjectMemberUpsertDTO();
        dto.setUserId(userId);
        dto.setUserType(userType);
        dto.setDisplayName(displayName);
        return dto;
    }

    // Projects audit wave 1: authorization, malformed sync, mentor invariant, uploader integrity.
    @Test
    void reviewerMayReadButCannotUpdateWorkspaceThroughDirectApi() {
        createWorkspace("Workspace A", CLASS_A_ID, MENTOR_A_ID);
        ProjectMember reviewer = new ProjectMember();
        reviewer.setProjectId(WORKSPACE_A_ID);
        reviewer.setUserId(90);
        reviewer.setUserType("FACULTY");
        reviewer.setRoleLabel("Reviewer");
        reviewer.setMemberStatus("ACTIVE");
        memberRepository.save(reviewer);
        UserPrincipal reviewerPrincipal = new UserPrincipal(90, "FACULTY", "MENTOR", 1, 6, 0);
        assertEquals("Workspace A", service.getMyProject(reviewerPrincipal, String.valueOf(WORKSPACE_A_ID)).getTitle());
        ProjectWorkspaceUpdateDTO payload = new ProjectWorkspaceUpdateDTO();
        payload.setTitle("Unauthorized rewrite");
        assertThrows(AccessDeniedException.class,
                () -> service.updateMyProject(reviewerPrincipal, String.valueOf(WORKSPACE_A_ID), payload));
        assertEquals("Workspace A", projectStore.get(WORKSPACE_A_ID).getTitle());
    }

    @Test
    void coMentorMayUpdateWorkspaceThroughDirectApi() {
        createWorkspace("Workspace A", CLASS_A_ID, MENTOR_A_ID);
        ProjectMember coMentor = new ProjectMember();
        coMentor.setProjectId(WORKSPACE_A_ID);
        coMentor.setUserId(90);
        coMentor.setUserType("FACULTY");
        coMentor.setRoleLabel("Co-Mentor");
        coMentor.setMemberStatus("ACTIVE");
        memberRepository.save(coMentor);
        ProjectWorkspaceUpdateDTO payload = new ProjectWorkspaceUpdateDTO();
        payload.setTitle("Co-mentor edit");
        service.updateMyProject(new UserPrincipal(90, "FACULTY", "MENTOR", 1, 6, 0),
                String.valueOf(WORKSPACE_A_ID), payload);
        assertEquals("Co-mentor edit", projectStore.get(WORKSPACE_A_ID).getTitle());
    }

    @Test
    void malformedResourceArrayCannotDeleteExistingResources() {
        createWorkspace("Workspace A", CLASS_A_ID, MENTOR_A_ID);
        ProjectResource existing = new ProjectResource();
        existing.setProjectId(WORKSPACE_A_ID);
        existing.setResourceKey("mentor-file");
        existing.setTitle("Mentor file");
        existing.setCreatedBy(MENTOR_A_ID);
        resourceRepository.save(existing);
        ProjectWorkspaceUpdateDTO payload = new ProjectWorkspaceUpdateDTO();
        payload.setResources("not an array");
        assertThrows(IllegalArgumentException.class,
                () -> service.updateMyProject(mentorA, String.valueOf(WORKSPACE_A_ID), payload));
        assertEquals(false, existing.getIsDeleted());
    }

    @Test
    void malformedSprintAndMeetingArraysAreRejected() {
        createWorkspace("Workspace A", CLASS_A_ID, MENTOR_A_ID);
        ProjectWorkspaceUpdateDTO sprints = new ProjectWorkspaceUpdateDTO();
        sprints.setSprints("not an array");
        assertThrows(IllegalArgumentException.class,
                () -> service.updateMyProject(mentorA, String.valueOf(WORKSPACE_A_ID), sprints));
        ProjectWorkspaceUpdateDTO meetings = new ProjectWorkspaceUpdateDTO();
        meetings.setMeetingsList("not an array");
        assertThrows(IllegalArgumentException.class,
                () -> service.updateMyProject(mentorA, String.valueOf(WORKSPACE_A_ID), meetings));
    }

    @Test
    void reassignmentCannotDemoteOnlyPrimaryMentorThroughCustomLabel() {
        createWorkspace("Workspace A", CLASS_A_ID, MENTOR_A_ID);
        AdminProjectMentorAssignDTO payload = new AdminProjectMentorAssignDTO();
        payload.setCollegeId(6);
        payload.setMentorId(MENTOR_B_ID);
        payload.setRoleLabel("Reviewer");
        assertThrows(IllegalArgumentException.class,
                () -> service.assignProjectMentor(admin, String.valueOf(WORKSPACE_A_ID), payload));
        assertTrue(memberRepository.existsActiveMembership(WORKSPACE_A_ID, MENTOR_A_ID, "FACULTY"));
    }

    @Test
    void resourceReorderPreservesItsOriginalUploader() {
        createWorkspace("Workspace A", CLASS_A_ID, MENTOR_A_ID);
        ProjectResource resource = new ProjectResource();
        resource.setProjectId(WORKSPACE_A_ID);
        resource.setResourceKey("mentor-file");
        resource.setTitle("Mentor file");
        resource.setCreatedBy(90);
        resource.setUploadedByUserId(90);
        resource.setUploadedByName("Original uploader");
        resourceRepository.save(resource);
        ProjectWorkspaceUpdateDTO payload = new ProjectWorkspaceUpdateDTO();
        // A full-array save resends the version it loaded (stale rows are rejected, Projects audit R3-02).
        long loadedVersion = resource.getVersion() == null ? 0L : resource.getVersion();
        payload.setResources(List.of(Map.of("resourceKey", "mentor-file", "title", "Mentor file", "version", loadedVersion)));
        service.updateMyProject(mentorA, String.valueOf(WORKSPACE_A_ID), payload);
        assertEquals(90, resource.getUploadedByUserId());
        assertEquals("Original uploader", resource.getUploadedByName());
    }

    // Projects audit wave 2: sprint state, readiness, and virtual carry-over.
    private ProjectSprint wave2PersistSprint(String state) {
        ProjectSprint sprint = new ProjectSprint();
        sprint.setProjectId(WORKSPACE_A_ID);
        sprint.setSprintKey("phase-one");
        sprint.setTitle("Phase One");
        sprint.setSprintState(state);
        sprintRepository.save(sprint);
        lenient().when(sprintRepository.findActiveByProjectIdAndSprintKey(WORKSPACE_A_ID, "phase-one"))
                .thenReturn(Optional.of(sprint));
        return sprint;
    }

    private void wave2TaskInSprint(String status) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("taskKey", "kickoff-review");
        row.put("title", "Kickoff Review");
        row.put("status", status);
        row.put("priority", "Medium");
        row.put("sprintKey", "phase-one");
        template.setTasks(List.of(row));
    }

    @Test
    void plannedSprintCannotBeCompletedWithoutStarting() {
        wave2TaskInSprint("To do");
        createWorkspace("Workspace A", CLASS_A_ID, MENTOR_A_ID);
        ProjectSprint sprint = wave2PersistSprint("PLANNED");
        org.springframework.web.server.ResponseStatusException error = assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> service.completeSprint(mentorA, String.valueOf(WORKSPACE_A_ID), "phase-one"));
        assertEquals(org.springframework.http.HttpStatus.CONFLICT, error.getStatus());
        assertEquals("PLANNED", sprint.getSprintState());
        assertTrue(taskStore.getOrDefault(WORKSPACE_A_ID, Collections.emptyList()).isEmpty());
    }

    @Test
    void activeSprintWithAllTasksDoneStillBlocksSubmissionUntilMentorCompletesIt() {
        wave2TaskInSprint("Done");
        createWorkspace("Workspace A", CLASS_A_ID, MENTOR_A_ID);
        ProjectSprint sprint = wave2PersistSprint("ACTIVE");
        com._42students.lms.dto.projects.ProjectReadinessDTO before =
                service.getProjectReadiness(mentorA, String.valueOf(WORKSPACE_A_ID));
        assertEquals(false, before.getReadyForSubmission());
        assertEquals(0, before.getCompletedSprints());
        sprint.setSprintState("COMPLETED");
        com._42students.lms.dto.projects.ProjectReadinessDTO after =
                service.getProjectReadiness(mentorA, String.valueOf(WORKSPACE_A_ID));
        assertEquals(true, after.getReadyForSubmission());
        assertEquals(1, after.getCompletedSprints());
    }

    @Test
    void completingActiveSprintCarriesUntouchedVirtualTaskToBacklog() {
        wave2TaskInSprint("To do");
        createWorkspace("Workspace A", CLASS_A_ID, MENTOR_A_ID);
        ProjectSprint sprint = wave2PersistSprint("ACTIVE");
        assertTrue(taskStore.getOrDefault(WORKSPACE_A_ID, Collections.emptyList()).isEmpty());
        service.completeSprint(mentorA, String.valueOf(WORKSPACE_A_ID), "phase-one");
        assertEquals("COMPLETED", sprint.getSprintState());
        ProjectTask persisted = taskStore.get(WORKSPACE_A_ID).stream()
                .filter(row -> "kickoff-review".equals(row.getTaskKey())).findFirst().orElseThrow();
        assertEquals(null, persisted.getSprintKey());
        assertEquals("phase-one", persisted.getCarriedOverFromSprintKey());
        ProjectTaskDTO visible = service.getProjectTasks(mentorA, String.valueOf(WORKSPACE_A_ID)).stream()
                .filter(row -> "kickoff-review".equals(row.getTaskKey())).findFirst().orElseThrow();
        assertEquals(null, visible.getSprintKey());
    }

    @Test
    void completingActiveSprintDoesNotCarryCompletedVirtualTask() {
        wave2TaskInSprint("Done");
        createWorkspace("Workspace A", CLASS_A_ID, MENTOR_A_ID);
        wave2PersistSprint("ACTIVE");
        service.completeSprint(mentorA, String.valueOf(WORKSPACE_A_ID), "phase-one");
        assertTrue(taskStore.getOrDefault(WORKSPACE_A_ID, Collections.emptyList()).isEmpty());
        ProjectTaskDTO visible = service.getProjectTasks(mentorA, String.valueOf(WORKSPACE_A_ID)).get(0);
        assertEquals("phase-one", visible.getSprintKey());
    }

    // Projects audit wave 3: meeting zone, release recreation, task key comments.
    @Test
    void invalidMeetingTimezoneRejectsBeforeAnyMeetingIsSaved() {
        createWorkspace("Workspace A", CLASS_A_ID, MENTOR_A_ID);
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("title", "Timezone validation");
        request.put("meetingDate", "2026-09-25");
        request.put("startTime", "10:00");
        request.put("endTime", "10:30");
        request.put("timezone", "Not/AReal_Time_Zone");
        assertThrows(IllegalArgumentException.class,
                () -> service.requestProjectMeeting(mentorA, String.valueOf(WORKSPACE_A_ID), request));
        assertTrue(meetingStore.getOrDefault(WORKSPACE_A_ID, Collections.emptyList()).isEmpty());
    }

    @Test
    void firstVirtualTaskCommentCanBeReadUsingItsTaskKey() {
        createWorkspace("Workspace A", CLASS_A_ID, MENTOR_A_ID);
        ProjectTaskCommentUpsertDTO comment = new ProjectTaskCommentUpsertDTO();
        comment.setMessage("First comment on virtual task");
        service.addProjectTaskComment(mentorA, String.valueOf(WORKSPACE_A_ID), "kickoff-review", comment);
        List<ProjectTaskCommentDTO> retrieved = service.getProjectTaskComments(
                mentorA, String.valueOf(WORKSPACE_A_ID), "kickoff-review");
        assertEquals(1, retrieved.size());
        assertEquals("First comment on virtual task", retrieved.get(0).getMessage());
    }

    @Test
    void deletedReleaseKeyIsPreservedAndNewSameTitleReleaseUsesUniqueSuffix() {
        createWorkspace("Workspace A", CLASS_A_ID, MENTOR_A_ID);
        com._42students.lms.model.ProjectRelease deleted = new com._42students.lms.model.ProjectRelease();
        deleted.setProjectId(WORKSPACE_A_ID);
        deleted.setReleaseKey("release-mvp");
        deleted.setTitle("MVP");
        deleted.setStatus("SHIPPED");
        deleted.setIsDeleted(true);
        lenient().when(releaseRepository.findByProjectIdAndReleaseKey(WORKSPACE_A_ID, "release-mvp"))
                .thenReturn(Optional.of(deleted));
        lenient().when(releaseRepository.findByProjectIdAndReleaseKey(WORKSPACE_A_ID, "release-mvp-2"))
                .thenReturn(Optional.empty());
        lenient().when(releaseRepository.save(any(com._42students.lms.model.ProjectRelease.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        com._42students.lms.dto.projects.ProjectReleaseUpsertDTO input =
                new com._42students.lms.dto.projects.ProjectReleaseUpsertDTO();
        input.setTitle("MVP");
        service.createProjectRelease(mentorA, String.valueOf(WORKSPACE_A_ID), input);
        verify(releaseRepository).save(org.mockito.ArgumentMatchers.argThat(release ->
                "release-mvp-2".equals(release.getReleaseKey()) && !Boolean.TRUE.equals(release.getIsDeleted())));
        assertEquals("SHIPPED", deleted.getStatus());
        assertEquals(true, deleted.getIsDeleted());
    }

    // V173: removeProjectRelease used to unlink every linked sprint on delete (release_id = null)
    // -- release_id is NOT NULL now, so that would fail as a raw DataIntegrityViolationException.
    // Blocked instead; these two tests are the regression net for that fix.
    @Test
    void removingAReleaseWithLinkedSprintsIsBlockedInsteadOfOrphaningThem() {
        createWorkspace("Workspace A", CLASS_A_ID, MENTOR_A_ID);
        com._42students.lms.model.ProjectRelease release = new com._42students.lms.model.ProjectRelease();
        release.setId(501);
        release.setProjectId(WORKSPACE_A_ID);
        release.setReleaseKey("release-mvp");
        release.setTitle("MVP");
        release.setStatus("PLANNED");
        lenient().when(releaseRepository.findActiveByProjectIdAndReleaseKey(WORKSPACE_A_ID, "release-mvp"))
                .thenReturn(Optional.of(release));
        ProjectSprint linked = wave2PersistSprint("PLANNED");
        linked.setReleaseId(501);

        org.springframework.web.server.ResponseStatusException error = assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> service.removeProjectRelease(mentorA, String.valueOf(WORKSPACE_A_ID), "release-mvp")
        );
        assertEquals(org.springframework.http.HttpStatus.CONFLICT, error.getStatus());
        assertTrue(error.getReason().contains("still linked"));
        assertEquals(false, Boolean.TRUE.equals(release.getIsDeleted()));
        assertEquals(501, linked.getReleaseId());
    }

    @Test
    void removingAReleaseWithNoLinkedSprintsStillSucceeds() {
        createWorkspace("Workspace A", CLASS_A_ID, MENTOR_A_ID);
        com._42students.lms.model.ProjectRelease release = new com._42students.lms.model.ProjectRelease();
        release.setId(502);
        release.setProjectId(WORKSPACE_A_ID);
        release.setReleaseKey("release-empty");
        release.setTitle("Empty release");
        release.setStatus("PLANNED");
        lenient().when(releaseRepository.findActiveByProjectIdAndReleaseKey(WORKSPACE_A_ID, "release-empty"))
                .thenReturn(Optional.of(release));
        lenient().when(releaseRepository.save(any(com._42students.lms.model.ProjectRelease.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        service.removeProjectRelease(mentorA, String.valueOf(WORKSPACE_A_ID), "release-empty");
        assertEquals(true, release.getIsDeleted());
    }
}
