package com._42students.lms.service.impl;

import com._42students.lms.dto.projects.AdminProjectCreateDTO;
import com._42students.lms.dto.projects.AdminProjectTemplateAttachDTO;
import com._42students.lms.dto.projects.AdminProjectTemplateUpsertDTO;
import com._42students.lms.dto.projects.ProjectTemplateDTO;
import com._42students.lms.dto.projects.ProjectWorkspaceDTO;
import com._42students.lms.dto.projects.ProjectDeliveryEventDTO;
import com._42students.lms.model.Faculty;
import com._42students.lms.model.Learner;
import com._42students.lms.model.ProjectDelivery;
import com._42students.lms.model.ProjectDeliveryEvent;
import com._42students.lms.model.ProjectTemplate;
import com._42students.lms.model.ProjectTemplateVersion;
import com._42students.lms.model.ProjectWorkspace;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.ProjectActivityEventRepository;
import com._42students.lms.repository.ProjectDeliveryEventRepository;
import com._42students.lms.repository.ProjectDeliveryRepository;
import com._42students.lms.repository.ProjectMemberRepository;
import com._42students.lms.repository.ProjectMeetingHistoryRepository;
import com._42students.lms.repository.ProjectMeetingRepository;
import com._42students.lms.repository.ProjectSprintRepository;
import com._42students.lms.repository.ProjectResourceAuditRepository;
import com._42students.lms.repository.ProjectResourceRepository;
import com._42students.lms.repository.ProjectTaskCommentRepository;
import com._42students.lms.repository.ProjectTaskRepository;
import com._42students.lms.repository.ProjectTemplateRepository;
import com._42students.lms.repository.ProjectTemplateVersionRepository;
import com._42students.lms.repository.ProjectWorkspaceRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AdminAuditLogService;
import com._42students.lms.service.NotificationService;
import com._42students.lms.utils.R2StorageUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectWorkspaceServiceImplTemplateScopeTest {

    @Mock private ProjectWorkspaceRepository projectRepository;
    @Mock private ProjectMemberRepository memberRepository;
    @Mock private ProjectTemplateRepository projectTemplateRepository;
    @Mock private ProjectTemplateVersionRepository projectTemplateVersionRepository;
    @Mock private ProjectDeliveryRepository deliveryRepository;
    @Mock private ProjectDeliveryEventRepository deliveryEventRepository;
    @Mock private ProjectActivityEventRepository activityEventRepository;
    @Mock private ProjectMeetingRepository meetingRepository;
    @Mock private ProjectMeetingHistoryRepository meetingHistoryRepository;
    @Mock private ProjectSprintRepository sprintRepository;
    @Mock private ProjectTaskRepository taskRepository;
    @Mock private ProjectTaskCommentRepository taskCommentRepository;
    @Mock private FacultyRepository facultyRepository;
    @Mock private LearnerRepository learnerRepository;
    @Mock private ProjectResourceRepository resourceRepository;
    @Mock private ProjectResourceAuditRepository resourceAuditRepository;
    @Mock private R2StorageUtils r2StorageUtils;
    @Mock private NotificationService notificationService;
    @Mock private AdminAuditLogService adminAuditLogService;
    // Constructor dependencies added after this test was written. Without them Mockito cannot
    // build ProjectWorkspaceServiceImpl at all and every test in the class errors with
    // "Cannot instantiate @InjectMocks field" — which is how all 17 were failing.
    // releaseRepository arrived with V119 (project releases); classRepository and the R2
    // ObjectProvider were added alongside it.
    @Mock private com._42students.lms.repository.ProjectReleaseRepository releaseRepository;
    @Mock private com._42students.lms.repository._ClassRepository classRepository;
    @Mock private org.springframework.beans.factory.ObjectProvider<R2StorageUtils> r2StorageUtilsProvider;
    // Same story again, two more deps later: projectTemplateCollegeRepository came with V140
    // (templates are opt-in per college) and collegeRepository with the fix that derives a new
    // workspace's organizationId from its college. Missing here, @InjectMocks leaves both null
    // and the per-college check NPEs before any assertion in this class is reached.
    @Mock private com._42students.lms.repository.ProjectTemplateCollegeRepository projectTemplateCollegeRepository;
    @Mock private com._42students.lms.repository.CollegeRepository collegeRepository;

    @InjectMocks
    private ProjectWorkspaceServiceImpl service;

    private final AtomicReference<ProjectWorkspace> savedProject = new AtomicReference<>();
    private final AtomicReference<ProjectTemplate> savedTemplate = new AtomicReference<>();
    private final AtomicReference<List<ProjectTemplateVersion>> savedTemplateVersions = new AtomicReference<>(Collections.emptyList());
    private UserPrincipal admin;
    private UserPrincipal superAdmin;
    private ProjectTemplate template;

    /**
     * Version history for a template, newest first — shared by both
     * findByTemplateIdOrderByVersionDesc overloads (unpaged, and the bounded paged variant that
     * getProjectTemplateVersions actually calls).
     */
    private List<ProjectTemplateVersion> versionsForTemplate(Integer templateId) {
        if (templateId == null || savedTemplateVersions.get() == null) {
            return Collections.emptyList();
        }
        return savedTemplateVersions.get().stream()
                .filter(version -> java.util.Objects.equals(version.getTemplateId(), templateId))
                .sorted((a, b) -> Integer.compare(
                        b.getTemplateVersion() != null ? b.getTemplateVersion() : 0,
                        a.getTemplateVersion() != null ? a.getTemplateVersion() : 0))
                .collect(java.util.stream.Collectors.toList());
    }

    @BeforeEach
    void setUp() {
        // Templates became opt-in per college (V140): createProjectInternal and
        // attachProjectTemplate both refuse a non-super-admin whose college has not been assigned
        // the template. This class tests template *scoping* rules, not that gate, so the
        // assignment is granted for every lookup — otherwise the gate denies first and the
        // behaviour under test is never reached.
        lenient().when(projectTemplateCollegeRepository.existsByTemplateIdAndCollegeId(anyInt(), anyInt()))
                .thenReturn(true);
        admin = new UserPrincipal(16, "FACULTY", "ADMIN", 1, 6, 0);
        // Templates are super-admin-only to edit/duplicate/view version history now
        // (V136__project_template_global.sql) — id 0 is the super-admin convention
        // (AccessControlService.isSuperAdmin).
        superAdmin = new UserPrincipal(0, "FACULTY", "ADMIN", null, null, 0);
        // Several bulk operations (createSingleBulkClassProject, reassignSingleProjectMentorBulkItem)
        // delegate each item to a self-proxied REQUIRES_NEW method; outside a real Spring context
        // there is no proxy, so wire the field to the instance itself (a direct call, no
        // propagation semantics in this test).
        org.springframework.test.util.ReflectionTestUtils.setField(service, "self", service);

        lenient().when(memberRepository.findActiveByProjectId(anyInt())).thenReturn(Collections.emptyList());
        lenient().when(memberRepository.existsActiveMembership(anyInt(), anyInt(), anyString())).thenReturn(true);
        lenient().when(taskRepository.findActiveByProjectId(anyInt())).thenReturn(Collections.emptyList());
        lenient().when(taskRepository.countActiveByProjectId(anyInt())).thenReturn(0L);
        lenient().when(sprintRepository.findActiveByProjectId(anyInt())).thenReturn(Collections.emptyList());
        lenient().when(resourceRepository.findActiveByProjectIdOrderByResourceOrderAscIdAsc(anyInt())).thenReturn(Collections.emptyList());
        lenient().when(resourceAuditRepository.findRecentByProjectId(anyInt(), any())).thenReturn(Collections.emptyList());
        lenient().when(meetingRepository.findActiveByProjectId(anyInt())).thenReturn(Collections.emptyList());
        lenient().when(meetingHistoryRepository.findRecentByProjectId(anyInt(), any())).thenReturn(Collections.emptyList());
        lenient().when(deliveryRepository.findActiveByProjectId(anyInt())).thenReturn(Optional.empty());
        lenient().when(projectRepository.findActiveById(anyInt())).thenAnswer(invocation -> {
            Integer id = invocation.getArgument(0);
            ProjectWorkspace current = savedProject.get();
            return current != null && current.getId() == id
                    ? Optional.of(current)
                    : Optional.empty();
        });
        lenient().when(projectRepository.findActiveByCollegeId(anyInt())).thenAnswer(invocation -> {
            Integer collegeId = invocation.getArgument(0);
            ProjectWorkspace current = savedProject.get();
            if (current != null && java.util.Objects.equals(current.getCollegeId(), collegeId) && !Boolean.TRUE.equals(current.getIsDeleted())) {
                return Collections.singletonList(current);
            }
            return Collections.emptyList();
        });
        lenient().when(projectRepository.save(any(ProjectWorkspace.class))).thenAnswer(invocation -> {
            ProjectWorkspace project = invocation.getArgument(0);
            if (project.getId() <= 0) {
                project.setId(101);
            }
            savedProject.set(project);
            return project;
        });
        lenient().when(projectTemplateRepository.save(any(ProjectTemplate.class))).thenAnswer(invocation -> {
            ProjectTemplate saved = invocation.getArgument(0);
            if (saved.getId() <= 0) {
                saved.setId(500);
            }
            savedTemplate.set(saved);
            return saved;
        });
        lenient().when(projectTemplateVersionRepository.save(any(ProjectTemplateVersion.class))).thenAnswer(invocation -> {
            ProjectTemplateVersion saved = invocation.getArgument(0);
            if (saved.getId() <= 0) {
                saved.setId(900 + savedTemplateVersions.get().size());
            }
            List<ProjectTemplateVersion> current = new java.util.ArrayList<>(savedTemplateVersions.get());
            current.add(saved);
            savedTemplateVersions.set(current);
            return saved;
        });
        // getProjectTemplateVersions calls the PAGED overload
        // findByTemplateIdOrderByVersionDesc(templateId, PageRequest.of(0, 50)) — a bounded
        // variant added so a heavily-edited template cannot return unbounded history. Only the
        // unpaged overload was stubbed, so version listing always came back empty.
        lenient().when(projectTemplateVersionRepository.findByTemplateIdOrderByVersionDesc(anyInt(), any()))
                .thenAnswer(invocation -> versionsForTemplate(invocation.getArgument(0)));
        lenient().when(projectTemplateVersionRepository.findByTemplateIdOrderByVersionDesc(anyInt()))
                .thenAnswer(invocation -> versionsForTemplate(invocation.getArgument(0)));

        template = new ProjectTemplate();
        template.setId(55);
        template.setSlug("campus-event-coordination");
        template.setCollegeId(6);
        template.setOrganizationId(1);
        template.setTitle("Campus Event Coordination");
        template.setCourseLabel("Projects / Campus Event Coordination");
        template.setSummary("Reusable template summary");
        template.setStatus("IN_PROGRESS");
        template.setPhase("Planning");
        // "deliverables" must be a non-empty collection: publishProjectTemplate and
        // applyTemplatePayload both call hasNonEmptyDeliverables(overview) and refuse to publish
        // without one. That guard was added after this test was written, so the old
        // {"about": "template"} overview made every publish path fail with
        // "Add at least one deliverable before publishing this template".
        LinkedHashMap<String, Object> overview = new LinkedHashMap<>();
        overview.put("about", "template");
        overview.put("deliverables", Collections.singletonList("Template deliverable"));
        template.setOverview(overview);
        template.setSprints(Collections.singletonList(new LinkedHashMap<>(Collections.singletonMap("title", "Template sprint"))));
        template.setTasks(Collections.singletonList(new LinkedHashMap<>(Collections.singletonMap("title", "Template task"))));
        template.setResources(Collections.singletonList(new LinkedHashMap<>(Collections.singletonMap("title", "Template resource"))));
        template.setDelivery(Collections.singletonList(new LinkedHashMap<>(Collections.singletonMap("title", "Template delivery"))));
        template.setMeetings(Collections.singletonList(new LinkedHashMap<>(Collections.singletonMap("title", "Template meeting"))));
        template.setActivity(Collections.singletonList(new LinkedHashMap<>(Collections.singletonMap("title", "Template activity"))));
        // Attaching a template to a workspace (on create or via attachProjectTemplate) requires it
        // to be PUBLISHED — defence-in-depth added after this test was written, so an unfinished
        // draft can't be pushed onto a live workspace. The shared fixture never set a lifecycle
        // status, so every attach-path test failed with "This template is not published yet".
        template.setLifecycleStatus("PUBLISHED");
        // Production mixes findById and findActiveById across call sites (getProjectTemplate,
        // updateProjectTemplate, rollback and publish deliberately use findById so an ARCHIVED
        // template can still be read and un-archived). Stub both, or those paths see "not found".
        lenient().when(projectTemplateRepository.findActiveById(55)).thenReturn(Optional.of(template));
        lenient().when(projectTemplateRepository.findById(55)).thenReturn(Optional.of(template));
        savedTemplateVersions.set(Collections.emptyList());
    }

    @Test
    @DisplayName("project creation can use a published template regardless of college (templates are global)")
    void createProject_allowsTemplateFromAnyCollege() {
        // Templates are a single platform-wide catalog now (V136__project_template_global.sql) —
        // this replaces the old cross-college rejection test, which tested behavior this system
        // no longer has.
        AdminProjectCreateDTO payload = new AdminProjectCreateDTO();
        payload.setTitle("Campus Event Coordination");
        payload.setCollegeId(7);
        payload.setTemplateId(55);

        ProjectWorkspaceDTO dto = service.createProject(admin, payload);

        assertEquals(55, dto.getTemplateId());
    }

    @Test
    @DisplayName("project creation copies template defaults when the college matches")
    void createProject_appliesMatchingCollegeTemplateDefaults() {
        AdminProjectCreateDTO payload = new AdminProjectCreateDTO();
        payload.setTitle("Student Project Studio");
        payload.setCollegeId(6);
        payload.setTemplateId(55);

        ProjectWorkspaceDTO dto = service.createProject(admin, payload);

        assertEquals(55, dto.getTemplateId());
        assertEquals("Student Project Studio", dto.getTitle());
        assertEquals("Projects / Campus Event Coordination", dto.getCourse());
        assertEquals(1, dto.getTemplateVersion());
        // PUBLISHED, not DRAFT: a template can only be attached to a workspace once published
        // (defence-in-depth added after this test was written, so an unfinished draft can't be
        // pushed onto a live workspace). The old DRAFT expectation encoded pre-hardening
        // behaviour and could never pass against current production code.
        assertEquals("PUBLISHED", dto.getLifecycleStatus());
        assertEquals("template", ((java.util.Map<?, ?>) dto.getOverview()).get("about"));
        assertTrue(dto.getDelivery() == null);
        assertTrue(dto.getMeetingsList() == null || ((java.util.Collection<?>) dto.getMeetingsList()).isEmpty());
        assertTrue(dto.getActivity() == null || dto.getActivity().isEmpty());
        assertEquals(6, savedProject.get().getCollegeId());
        assertEquals(55, savedProject.get().getTemplateId());
        assertEquals("campus-event-coordination", dto.getTemplateSlug());
        assertEquals("Campus Event Coordination", dto.getTemplateTitle());
        assertTrue(Boolean.TRUE.equals(dto.getTemplateBound()));
    }

    @Test
    @DisplayName("project creation rejects a mentor from a different college")
    void createProject_rejectsCrossCollegeMentor() {
        Faculty mentor = new Faculty();
        mentor.setId(71);
        mentor.setCollegeId(7);
        mentor.setFirstName("Cross");
        mentor.setLastName("Mentor");
        // Production resolves the mentor via findByIdAndNotDeleted, not findById. With only the
        // findById stub the lookup returned empty and the test failed on "Mentor not found"
        // (IllegalArgumentException) before ever reaching the cross-college AccessDeniedException
        // it is actually asserting.
        when(facultyRepository.findByIdAndNotDeleted(71)).thenReturn(Optional.of(mentor));

        AdminProjectCreateDTO payload = new AdminProjectCreateDTO();
        payload.setTitle("Cross Mentor Project");
        payload.setCollegeId(6);
        // createProjectInternal now requires a template ("A project template is required to
        // create a workspace"), added after this test was written. Without it the call failed
        // on that IllegalArgumentException before reaching the cross-college check under test.
        payload.setTemplateId(55);
        payload.setMentorId(71);

        assertThrows(AccessDeniedException.class, () -> service.createProject(admin, payload));
    }

    @Test
    @DisplayName("project creation rejects a learner from a different college")
    void createProject_rejectsCrossCollegeLearner() {
        Learner learner = new Learner();
        learner.setId(82);
        learner.setCollegeId(8);
        learner.setFirstName("Cross");
        learner.setLastName("Learner");
        // Production resolves the learner via findByIdAndNotDeleted, not findById — see the
        // matching note on the mentor test above.
        when(learnerRepository.findByIdAndNotDeleted(82)).thenReturn(Optional.of(learner));

        AdminProjectCreateDTO payload = new AdminProjectCreateDTO();
        payload.setTitle("Cross Learner Project");
        payload.setCollegeId(6);
        // createProjectInternal now requires a template ("A project template is required to
        // create a workspace"), added after this test was written. Without it the call failed
        // on that IllegalArgumentException before reaching the cross-college check under test.
        payload.setTemplateId(55);
        payload.setLearnerIds(Collections.singletonList(82));

        assertThrows(AccessDeniedException.class, () -> service.createProject(admin, payload));
    }

    @Test
    @DisplayName("resolved project read merges template overview with project overrides")
    void getMyProject_returnsResolvedOverviewAndTemplateMetadata() {
        ProjectWorkspace seeded = new ProjectWorkspace();
        seeded.setId(303);
        seeded.setSlug("proj-303-demo");
        seeded.setTitle("Project 303");
        seeded.setCollegeId(6);
        seeded.setOrganizationId(1);
        seeded.setStatus("IN_PROGRESS");
        seeded.setTemplateId(55);
        seeded.setOverview(new LinkedHashMap<>(java.util.Map.of(
                "about", "instance",
                "focus", "notifications",
                "nested", new LinkedHashMap<>(java.util.Map.of("owner", "mentor"))
        )));
        savedProject.set(seeded);
        when(projectRepository.findActiveBySlug("proj-303-demo")).thenReturn(Optional.of(seeded));

        ProjectWorkspaceDTO dto = service.getMyProject(admin, "proj-303-demo");

        assertEquals("campus-event-coordination", dto.getTemplateSlug());
        assertEquals("Campus Event Coordination", dto.getTemplateTitle());
        assertTrue(Boolean.TRUE.equals(dto.getTemplateBound()));
        java.util.Map<?, ?> resolvedOverview = (java.util.Map<?, ?>) dto.getResolvedOverview();
        assertEquals("instance", resolvedOverview.get("about"));
        assertEquals("notifications", resolvedOverview.get("focus"));
        assertTrue(resolvedOverview.get("nested") instanceof java.util.Map);
        assertEquals("mentor", ((java.util.Map<?, ?>) resolvedOverview.get("nested")).get("owner"));
    }

    @Test
    @DisplayName("template defaults do not leak into instance-only sections")
    void createProject_doesNotApplyTemplateToSpecificSections() {
        AdminProjectCreateDTO payload = new AdminProjectCreateDTO();
        payload.setTitle("Specific Sections Check");
        payload.setCollegeId(6);
        payload.setTemplateId(55);

        ProjectWorkspaceDTO dto = service.createProject(admin, payload);

        assertTrue(dto.getDelivery() == null);
        assertTrue(dto.getMeetingsList() == null || ((java.util.Collection<?>) dto.getMeetingsList()).isEmpty());
        assertTrue(dto.getActivity() == null || dto.getActivity().isEmpty());
        assertTrue(dto.getResolvedDelivery() == null);
        assertTrue(dto.getResolvedMeetingsList() == null || ((java.util.Collection<?>) dto.getResolvedMeetingsList()).isEmpty());
        assertTrue(dto.getResolvedActivity() == null || dto.getResolvedActivity().isEmpty());
    }

    @Test
    @DisplayName("project updates keep normalized sections out of the workspace JSON snapshots")
    void updateProject_doesNotPersistLegacySectionSnapshots() {
        ProjectWorkspace seeded = new ProjectWorkspace();
        seeded.setId(404);
        seeded.setSlug("proj-404-demo");
        seeded.setTitle("Project 404");
        seeded.setCollegeId(6);
        seeded.setOrganizationId(1);
        seeded.setStatus("IN_PROGRESS");
        savedProject.set(seeded);
        when(projectRepository.findActiveBySlug("proj-404-demo")).thenReturn(Optional.of(seeded));

        // V173: a sprint always ships in a release now — this update materializes a brand-new
        // sprint row, so it needs a resolvable releaseKey the same way a real save would.
        com._42students.lms.model.ProjectRelease release = new com._42students.lms.model.ProjectRelease();
        release.setId(9001);
        release.setProjectId(404);
        release.setReleaseKey("release-mvp");
        release.setTitle("MVP");
        when(releaseRepository.findActiveByProjectIdAndReleaseKey(404, "release-mvp"))
                .thenReturn(Optional.of(release));

        com._42students.lms.dto.projects.ProjectWorkspaceUpdateDTO update = new com._42students.lms.dto.projects.ProjectWorkspaceUpdateDTO();
        update.setTasks(Collections.singletonList(new LinkedHashMap<>(Collections.singletonMap("title", "Task from update"))));
        LinkedHashMap<String, Object> sprintFromUpdate = new LinkedHashMap<>();
        sprintFromUpdate.put("title", "Sprint from update");
        sprintFromUpdate.put("releaseKey", "release-mvp");
        update.setSprints(Collections.singletonList(sprintFromUpdate));
        update.setResources(Collections.singletonList(new LinkedHashMap<>(Collections.singletonMap("title", "Resource from update"))));
        // meetingDate is now unconditionally required — a meeting with no date is not
        // schedulable, so it can neither be conflict-checked nor synced to a calendar.
        LinkedHashMap<String, Object> meetingFromUpdate = new LinkedHashMap<>();
        meetingFromUpdate.put("title", "Meeting from update");
        meetingFromUpdate.put("meetingDate", "2026-09-10");
        update.setMeetingsList(Collections.singletonList(meetingFromUpdate));

        // Tasks/sprints/resources/meetings are normalized into their own tables now
        // (no more JSON snapshot columns on ProjectWorkspace), so this update should
        // simply succeed without touching any legacy snapshot state.
        ProjectWorkspaceDTO dto = service.updateProject(admin, "proj-404-demo", 6, update);

        assertEquals("Project 404", dto.getTitle());
        assertEquals(404, savedProject.get().getId());
    }

    @Test
    @DisplayName("delivery history keeps event and delivery identifiers")
    void getProjectDeliveryHistory_includesIdentifiers() {
        ProjectWorkspace seeded = new ProjectWorkspace();
        seeded.setId(505);
        seeded.setSlug("proj-505-demo");
        seeded.setTitle("Project 505");
        seeded.setCollegeId(6);
        seeded.setOrganizationId(1);
        savedProject.set(seeded);
        when(projectRepository.findActiveBySlug("proj-505-demo")).thenReturn(Optional.of(seeded));

        ProjectDelivery delivery = new ProjectDelivery();
        delivery.setId(77);
        delivery.setProjectId(505);
        when(deliveryRepository.findActiveByProjectId(505)).thenReturn(Optional.of(delivery));

        ProjectDeliveryEvent event = new ProjectDeliveryEvent();
        event.setId(991);
        event.setProjectId(505);
        event.setDeliveryId(77);
        event.setAction("SUBMIT");
        event.setStatus("Submitted");
        event.setActorId(16);
        event.setActorName("Meera Nair");
        event.setActorType("FACULTY");
        event.setRevisionCount(2);
        event.setNotes("Submitted for review");
        event.setAttachmentUrl("https://example.test/file");
        event.setFeedback("Looks good");
        event.setCreatedAt(java.time.LocalDateTime.of(2026, 8, 5, 10, 30));
        when(deliveryEventRepository.findActiveByDeliveryId(505, 77)).thenReturn(List.of(event));

        List<ProjectDeliveryEventDTO> history = service.getProjectDeliveryHistory(admin, "proj-505-demo");

        assertEquals(1, history.size());
        assertEquals(991, history.get(0).getId());
        assertEquals(505, history.get(0).getProjectId());
        assertEquals(77, history.get(0).getDeliveryId());
        assertEquals("SUBMIT", history.get(0).getAction());
        assertEquals("Submitted", history.get(0).getStatus());
        assertEquals("Meera Nair", history.get(0).getActorName());
        assertFalse(history.get(0).getCreatedAt().isBlank());
    }

    @Test
    @DisplayName("delivery submission accepts normalized summary and submissionLink fields")
    void updateProjectSubmission_usesNormalizedFields() {
        ProjectWorkspace seeded = new ProjectWorkspace();
        seeded.setId(606);
        seeded.setSlug("proj-606-demo");
        seeded.setTitle("Project 606");
        seeded.setCollegeId(6);
        seeded.setOrganizationId(1);
        savedProject.set(seeded);
        when(projectRepository.findActiveBySlug("proj-606-demo")).thenReturn(Optional.of(seeded));
        // Stateful: the service saves the delivery and then re-reads it to build the response DTO.
        // With findActiveByProjectId hardwired to Optional.empty() that re-read returned nothing,
        // so dto.getDelivery() was null and every assertion below NPE'd.
        AtomicReference<ProjectDelivery> savedDelivery = new AtomicReference<>();
        when(deliveryRepository.findActiveByProjectId(606))
                .thenAnswer(invocation -> Optional.ofNullable(savedDelivery.get()));
        when(deliveryRepository.save(any(ProjectDelivery.class))).thenAnswer(invocation -> {
            ProjectDelivery saved = invocation.getArgument(0);
            if (saved.getId() <= 0) {
                saved.setId(88);
            }
            savedDelivery.set(saved);
            return saved;
        });

        // Delivery changes on the member path need a Mentor/Co-Mentor membership row (mentor audit M-02), not just
        // "some active membership".
        com._42students.lms.model.ProjectMember mentorRow = new com._42students.lms.model.ProjectMember();
        mentorRow.setRoleLabel("Project Mentor");
        mentorRow.setMemberStatus("ACTIVE");
        mentorRow.setIsDeleted(false);
        when(memberRepository.findByProjectAndUserAndType(606, 16, "FACULTY")).thenReturn(Optional.of(mentorRow));

        com._42students.lms.dto.projects.ProjectWorkspaceUpdateDTO payload = new com._42students.lms.dto.projects.ProjectWorkspaceUpdateDTO();
        java.util.Map<String, Object> delivery = new java.util.LinkedHashMap<>();
        delivery.put("summary", "Final report and notes");
        delivery.put("submissionLink", "https://example.test/final");
        delivery.put("status", "Submitted");
        payload.setDelivery(delivery);

        ProjectWorkspaceDTO dto = service.updateProjectSubmission(admin, "proj-606-demo", payload);

        assertEquals("Final report and notes", dto.getDelivery().getSummary());
        assertEquals("https://example.test/final", dto.getDelivery().getSubmissionLink());
        // "Draft", not "Submitted": delivery status is SERVER-DERIVED from the delivery action
        // (submitAction/action/deliveryAction/mode), never from a client-supplied "status"
        // field — otherwise a learner could mark their own delivery Submitted while bypassing
        // the readiness gate. This payload carries no action, so a plain draft save is correct.
        assertEquals("Draft", dto.getDelivery().getStatus());
    }

    @Test
    @DisplayName("existing project can be attached to a matching college template")
    void attachProjectTemplate_appliesTemplateToExistingProject() {
        ProjectWorkspace seeded = new ProjectWorkspace();
        seeded.setId(202);
        seeded.setSlug("proj-202-demo");
        seeded.setTitle("Project 202");
        seeded.setCollegeId(6);
        seeded.setOrganizationId(1);
        seeded.setStatus("IN_PROGRESS");
        savedProject.set(seeded);
        when(projectRepository.findActiveBySlug("proj-202-demo")).thenReturn(Optional.of(seeded));

        AdminProjectTemplateAttachDTO payload = new AdminProjectTemplateAttachDTO();
        payload.setCollegeId(6);
        payload.setTemplateId(55);
        payload.setReapplyDefaults(true);

        ProjectWorkspaceDTO dto = service.attachProjectTemplate(admin, "proj-202-demo", payload);

        assertEquals(55, dto.getTemplateId());
        assertEquals("campus-event-coordination", dto.getTemplateSlug());
        assertEquals("Campus Event Coordination", dto.getTemplateTitle());
        assertTrue(Boolean.TRUE.equals(dto.getTemplateBound()));
        assertEquals(55, savedProject.get().getTemplateId());
    }

    @Test
    @DisplayName("template updates increment version and can publish lifecycle state")
    void updateTemplate_incrementsVersionAndLifecycle() {
        ProjectTemplate existing = new ProjectTemplate();
        existing.setId(56);
        existing.setSlug("campus-event-coordination-v1");
        existing.setCollegeId(6);
        existing.setOrganizationId(1);
        existing.setTitle("Campus Event Coordination");
        existing.setCourseLabel("Projects / Campus Event Coordination");
        existing.setSummary("Reusable template summary");
        existing.setStatus("IN_PROGRESS");
        existing.setPhase("Planning");
        existing.setTemplateVersion(2);
        existing.setLifecycleStatus("DRAFT");
        // These tests transition the template to PUBLISHED, and publishing now requires a
        // non-empty "deliverables" collection on the overview (hasNonEmptyDeliverables), plus at
        // least one sprint or task (hasNonEmptySprintsOrTasks, 3.2).
        LinkedHashMap<String, Object> existingOverview = new LinkedHashMap<>();
        existingOverview.put("about", "existing");
        existingOverview.put("deliverables", Collections.singletonList("Existing deliverable"));
        existing.setOverview(existingOverview);
        existing.setSprints(Collections.singletonList(new LinkedHashMap<>(Collections.singletonMap("title", "Existing sprint"))));
        // Read through findById in production; lenient so the unused findActiveById stub does
        // not trip Mockito strict-stub checking.
        lenient().when(projectTemplateRepository.findActiveById(56)).thenReturn(Optional.of(existing));
        // Production reads templates through findById on the update/rollback/publish paths
        // (so an ARCHIVED template can still be read and un-archived); stub both.
        lenient().when(projectTemplateRepository.findById(56)).thenReturn(Optional.of(existing));

        AdminProjectTemplateUpsertDTO payload = new AdminProjectTemplateUpsertDTO();
        payload.setTitle("Campus Event Coordination v2");
        payload.setCollegeId(6);
        payload.setLifecycleStatus("PUBLISHED");

        // Templates are super-admin-only to edit now (V136__project_template_global.sql).
        ProjectTemplateDTO dto = service.updateProjectTemplate(superAdmin, 56, 6, payload);

        assertEquals(3, dto.getTemplateVersion());
        assertEquals("PUBLISHED", dto.getLifecycleStatus());
        assertTrue(dto.getPublishedAt() != null);
    }

    @Test
    @DisplayName("template versions are recorded and retrievable in reverse chronological order")
    void templateVersions_areRecordedAndListed() {
        ProjectTemplate existing = new ProjectTemplate();
        existing.setId(59);
        existing.setSlug("campus-event-coordination-v1");
        existing.setCollegeId(6);
        existing.setOrganizationId(1);
        existing.setTitle("Campus Event Coordination");
        existing.setCourseLabel("Projects / Campus Event Coordination");
        existing.setSummary("Reusable template summary");
        existing.setStatus("IN_PROGRESS");
        existing.setPhase("Planning");
        existing.setTemplateVersion(1);
        existing.setLifecycleStatus("DRAFT");
        // These tests transition the template to PUBLISHED, and publishing now requires a
        // non-empty "deliverables" collection on the overview (hasNonEmptyDeliverables), plus at
        // least one sprint or task (hasNonEmptySprintsOrTasks, 3.2).
        LinkedHashMap<String, Object> existingOverview = new LinkedHashMap<>();
        existingOverview.put("about", "existing");
        existingOverview.put("deliverables", Collections.singletonList("Existing deliverable"));
        existing.setOverview(existingOverview);
        existing.setSprints(Collections.singletonList(new LinkedHashMap<>(Collections.singletonMap("title", "Existing sprint"))));
        // Read through findById in production; lenient so the unused findActiveById stub does
        // not trip Mockito strict-stub checking.
        lenient().when(projectTemplateRepository.findActiveById(59)).thenReturn(Optional.of(existing));
        // Production reads templates through findById on the update/rollback/publish paths
        // (so an ARCHIVED template can still be read and un-archived); stub both.
        lenient().when(projectTemplateRepository.findById(59)).thenReturn(Optional.of(existing));

        AdminProjectTemplateUpsertDTO payload = new AdminProjectTemplateUpsertDTO();
        payload.setTitle("Campus Event Coordination");
        payload.setCollegeId(6);
        payload.setLifecycleStatus("PUBLISHED");

        // Templates are super-admin-only to edit/view version history now
        // (V136__project_template_global.sql).
        service.updateProjectTemplate(superAdmin, 59, 6, payload);

        List<com._42students.lms.dto.projects.ProjectTemplateVersionDTO> versions = service.getProjectTemplateVersions(superAdmin, 6, 59);

        assertFalse(versions.isEmpty());
        assertEquals(59, versions.get(0).getTemplateId());
        assertEquals(2, versions.get(0).getTemplateVersion());
        assertEquals("UPDATE", versions.get(0).getActionType());
        assertEquals("PUBLISHED", versions.get(0).getLifecycleStatus());
    }

    @Test
    @DisplayName("template duplication creates a new draft version with copied content")
    void duplicateTemplate_createsDraftCopy() {
        ProjectTemplate existing = new ProjectTemplate();
        existing.setId(57);
        existing.setSlug("campus-event-coordination-v1");
        existing.setCollegeId(6);
        existing.setOrganizationId(1);
        existing.setTitle("Campus Event Coordination");
        existing.setCourseLabel("Projects / Campus Event Coordination");
        existing.setSummary("Reusable template summary");
        existing.setStatus("IN_PROGRESS");
        existing.setPhase("Planning");
        existing.setTemplateVersion(3);
        existing.setLifecycleStatus("PUBLISHED");
        existing.setPublishedAt(java.time.LocalDateTime.now().minusDays(1));
        existing.setOverview(new LinkedHashMap<>(Collections.singletonMap("about", "source")));
        existing.setSprints(Collections.singletonList(new LinkedHashMap<>(Collections.singletonMap("title", "Sprint A"))));
        // Read through findById in production; keep this lenient so the unused
        // findActiveById stub does not trip Mockito strict-stub checking.
        lenient().when(projectTemplateRepository.findActiveById(57)).thenReturn(Optional.of(existing));
        // Production reads templates through findById on the update/rollback/publish paths
        // (so an ARCHIVED template can still be read and un-archived); stub both.
        lenient().when(projectTemplateRepository.findById(57)).thenReturn(Optional.of(existing));

        // Templates are super-admin-only to duplicate now (V136__project_template_global.sql).
        ProjectTemplateDTO dto = service.duplicateProjectTemplate(superAdmin, 57, 6, null);

        assertEquals(4, dto.getTemplateVersion());
        assertEquals("DRAFT", dto.getLifecycleStatus());
        assertTrue(dto.getPublishedAt() == null);
        assertTrue(dto.getArchivedAt() == null);
        assertEquals("source", ((java.util.Map<?, ?>) dto.getOverview()).get("about"));
        assertEquals("Sprint A", ((java.util.List<java.util.Map<String, Object>>) dto.getSprints()).get(0).get("title"));
        assertTrue(dto.getSlug().contains("campus-event-coordination-v1-copy-v4"));
    }

    @Test
    @DisplayName("template preview returns the same college-scoped template payload")
    void previewTemplate_returnsTemplatePayload() {
        ProjectTemplate preview = new ProjectTemplate();
        preview.setId(58);
        preview.setSlug("campus-event-coordination");
        preview.setCollegeId(6);
        preview.setOrganizationId(1);
        preview.setTitle("Campus Event Coordination");
        preview.setCourseLabel("Projects / Campus Event Coordination");
        preview.setSummary("Reusable template summary");
        preview.setStatus("IN_PROGRESS");
        preview.setTemplateVersion(2);
        preview.setLifecycleStatus("PUBLISHED");
        preview.setPublishedAt(java.time.LocalDateTime.now().minusHours(2));
        // Read through findById in production; keep this lenient so the unused
        // findActiveById stub does not trip Mockito strict-stub checking.
        lenient().when(projectTemplateRepository.findActiveById(58)).thenReturn(Optional.of(preview));
        // Production reads templates through findById on the update/rollback/publish paths
        // (so an ARCHIVED template can still be read and un-archived); stub both.
        lenient().when(projectTemplateRepository.findById(58)).thenReturn(Optional.of(preview));

        ProjectTemplateDTO dto = service.getProjectTemplate(admin, 6, 58);

        assertEquals(58, dto.getId());
        assertEquals(2, dto.getTemplateVersion());
        assertEquals("PUBLISHED", dto.getLifecycleStatus());
        assertTrue(dto.getPublishedAt() != null);
    }

    @Test
    @DisplayName("projects can be created from a specific template through the explicit template flow")
    void createProjectFromTemplate_usesTemplateAsSource() {
        AdminProjectCreateDTO payload = new AdminProjectCreateDTO();
        payload.setTitle("Student Project Studio");
        payload.setCollegeId(6);

        ProjectWorkspaceDTO dto = service.createProjectFromTemplate(admin, 55, payload);

        assertEquals(55, dto.getTemplateId());
        assertEquals("campus-event-coordination", dto.getTemplateSlug());
        assertEquals("Campus Event Coordination", dto.getTemplateTitle());
        assertTrue(Boolean.TRUE.equals(dto.getTemplateBound()));
        assertEquals("Student Project Studio", dto.getTitle());
    }

    // migrateProjectWorkspacesFromCurrentState_seedsTemplateAndBackfillsLink removed along with
    // the "Migrate legacy workspaces" feature it tested.

    @Test
    @DisplayName("a college-admin (not super-admin) cannot update a project template")
    void updateTemplate_rejectsNonSuperAdmin() {
        // Templates are super-admin-only to edit now (V136__project_template_global.sql) — this
        // replaces the old "can't move a template to another college" test, which tested a
        // collegeId cross-check that no longer exists now that templates have no college at all.
        AdminProjectTemplateUpsertDTO payload = new AdminProjectTemplateUpsertDTO();
        payload.setTitle("Campus Event Coordination v2");

        assertThrows(AccessDeniedException.class, () -> service.updateProjectTemplate(admin, 55, 6, payload));
    }

    @Test
    @DisplayName("a payload's stale collegeId is ignored when a super-admin updates a template")
    void updateTemplate_ignoresStaleCollegeIdField() {
        AdminProjectTemplateUpsertDTO payload = new AdminProjectTemplateUpsertDTO();
        payload.setTitle("Campus Event Coordination v2");
        payload.setCollegeId(7);
        payload.setLifecycleStatus("DRAFT");

        ProjectTemplateDTO dto = service.updateProjectTemplate(superAdmin, 55, 6, payload);

        assertEquals("Campus Event Coordination v2", dto.getTitle());
        // applyTemplatePayload no longer reads or writes collegeId at all — whatever the entity
        // already had (6, from the shared fixture) is left exactly as-is, not moved to the
        // payload's stale 7.
        assertEquals(6, dto.getCollegeId());
    }
}
