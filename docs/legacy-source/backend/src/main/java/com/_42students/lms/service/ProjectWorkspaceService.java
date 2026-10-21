package com._42students.lms.service;

import com._42students.lms.dto.projects.AdminProjectCreateDTO;
import com._42students.lms.dto.projects.AdminProjectBulkCreateDTO;
import com._42students.lms.dto.projects.BulkCreateProjectsResultDTO;
import com._42students.lms.dto.projects.AdminProjectMentorAssignDTO;
import com._42students.lms.dto.projects.AdminProjectLearnerAssignDTO;
import com._42students.lms.dto.projects.AdminProjectTemplateAttachDTO;
import com._42students.lms.dto.projects.ProjectTaskDTO;
import com._42students.lms.dto.projects.ProjectTaskCommentDTO;
import com._42students.lms.dto.projects.ProjectTaskCommentUpsertDTO;
import com._42students.lms.dto.projects.ProjectTaskReorderDTO;
import com._42students.lms.dto.projects.ProjectTaskUpsertDTO;
import com._42students.lms.dto.projects.ProjectDeliveryDTO;
import com._42students.lms.dto.projects.ProjectDeliveryEventDTO;
import com._42students.lms.dto.projects.ProjectActivityDTO;
import com._42students.lms.dto.projects.ProjectActivityFeedDTO;
import com._42students.lms.dto.projects.ProjectMeetingDTO;
import com._42students.lms.dto.projects.ProjectReadinessDTO;
import com._42students.lms.dto.projects.ProjectReleaseDTO;
import com._42students.lms.dto.projects.ProjectReleaseUpsertDTO;
import com._42students.lms.dto.projects.ProjectWorkspaceDTO;
import com._42students.lms.dto.projects.ProjectTemplateDTO;
import com._42students.lms.dto.projects.ProjectTemplateVersionDTO;
import com._42students.lms.dto.projects.AdminProjectTemplateUpsertDTO;
import com._42students.lms.dto.projects.ProjectMemberDTO;
import com._42students.lms.dto.projects.ProjectMemberUpsertDTO;
import com._42students.lms.dto.projects.ProjectMemberUpdateDTO;
import com._42students.lms.dto.projects.ProjectWorkspaceUpdateDTO;
import com._42students.lms.dto.projects.AdminProjectBulkMentorReassignDTO;
import com._42students.lms.dto.projects.BulkMentorReassignResultDTO;
import com._42students.lms.dto.projects.MentorReassignOutcomeDTO;
import com._42students.lms.dto.response.PageDTO;
import com._42students.lms.model.Faculty;
import com._42students.lms.security.UserPrincipal;

import java.util.Map;
import java.util.List;

public interface ProjectWorkspaceService {
    List<ProjectTemplateDTO> getProjectTemplates(UserPrincipal principal, Integer collegeId, String lifecycleStatus, String search);
    ProjectTemplateDTO getProjectTemplate(UserPrincipal principal, Integer collegeId, Integer templateId);
    ProjectTemplateDTO createProjectTemplate(UserPrincipal principal, AdminProjectTemplateUpsertDTO payload);
    ProjectTemplateDTO updateProjectTemplate(UserPrincipal principal, Integer templateId, Integer collegeId, AdminProjectTemplateUpsertDTO payload);
    ProjectTemplateDTO duplicateProjectTemplate(UserPrincipal principal, Integer templateId, Integer collegeId, AdminProjectTemplateUpsertDTO payload);
    ProjectTemplateDTO archiveProjectTemplate(UserPrincipal principal, Integer templateId, Integer collegeId);
    ProjectTemplateDTO publishProjectTemplate(UserPrincipal principal, Integer templateId, Integer collegeId);
    ProjectTemplateDTO unpublishProjectTemplate(UserPrincipal principal, Integer templateId, Integer collegeId);
    ProjectTemplateDTO rollbackProjectTemplateVersion(UserPrincipal principal, Integer templateId, Integer collegeId, Integer versionId);

    /** As above; when expectedTemplateVersion is given, a template saved since the admin compared versions is a 409 (R7-04). */
    default ProjectTemplateDTO rollbackProjectTemplateVersion(UserPrincipal principal, Integer templateId, Integer collegeId, Integer versionId, Integer expectedTemplateVersion) {
        return rollbackProjectTemplateVersion(principal, templateId, collegeId, versionId);
    }

    /** Opt-in per-college template visibility — see V140__project_template_college_assignment.sql. */
    void assignProjectTemplateToCollege(UserPrincipal principal, Integer templateId, Integer collegeId);
    void unassignProjectTemplateFromCollege(UserPrincipal principal, Integer templateId, Integer collegeId);
    List<Integer> getAssignedProjectTemplateIdsForCollege(UserPrincipal principal, Integer collegeId);
    List<Integer> getAssignedCollegeIdsForProjectTemplate(UserPrincipal principal, Integer templateId);
    Map<String, Object> bulkSetProjectTemplateColleges(UserPrincipal principal, Integer templateId, List<Integer> collegeIds);

    /**
     * As above, compare-and-set: when expectedCollegeIds (the set the admin last read) is given and the current set differs,
     * the change is rejected (409) instead of silently removing another admin's assignments (R7-02).
     */
    default Map<String, Object> bulkSetProjectTemplateColleges(UserPrincipal principal, Integer templateId, List<Integer> collegeIds, List<Integer> expectedCollegeIds) {
        return bulkSetProjectTemplateColleges(principal, templateId, collegeIds);
    }

    /** Blast radius of a template change: how many live workspaces are attached, and which. */
    java.util.Map<String, Object> getProjectTemplateImpact(UserPrincipal principal, Integer templateId, Integer collegeId);
    List<ProjectTemplateVersionDTO> getProjectTemplateVersions(UserPrincipal principal, Integer collegeId, Integer templateId);
    PageDTO<ProjectTemplateVersionDTO> getProjectTemplateVersionsPage(UserPrincipal principal, Integer collegeId, Integer templateId, int page, int size);
    ProjectWorkspaceDTO createProjectFromTemplate(UserPrincipal principal, Integer templateId, AdminProjectCreateDTO payload);
    ProjectWorkspaceDTO attachProjectTemplate(UserPrincipal principal, String projectId, AdminProjectTemplateAttachDTO payload);
    ProjectWorkspaceDTO createProject(UserPrincipal principal, AdminProjectCreateDTO payload);
    Map<String, Object> previewBulkCreateProjectsForClass(UserPrincipal principal, AdminProjectBulkCreateDTO payload);
    BulkCreateProjectsResultDTO bulkCreateProjectsForClass(UserPrincipal principal, AdminProjectBulkCreateDTO payload);
    ProjectWorkspaceDTO createSingleBulkClassProject(UserPrincipal principal, AdminProjectCreateDTO payload);
    ProjectWorkspaceDTO updateProject(UserPrincipal principal, String projectId, Integer collegeId, ProjectWorkspaceUpdateDTO payload);
    List<ProjectWorkspaceDTO> getMyProjects(UserPrincipal principal);
    PageDTO<ProjectWorkspaceDTO> getMyProjectsPage(UserPrincipal principal, int page, int size, String status, String search, String attention);
    ProjectWorkspaceDTO getMyProject(UserPrincipal principal, String projectId);
    String resolveProjectResourceDownloadKey(UserPrincipal principal, String projectId, String resourceKey);
    ProjectDeliveryDTO getProjectDelivery(UserPrincipal principal, String projectId);
    List<ProjectDeliveryEventDTO> getProjectDeliveryHistory(UserPrincipal principal, String projectId);
    ProjectReadinessDTO getProjectReadiness(UserPrincipal principal, String projectId);
    ProjectReadinessDTO getProjectReadiness(UserPrincipal principal, String projectId, Integer collegeId);
    ProjectReadinessDTO overrideProjectReadiness(UserPrincipal principal, String projectId, Integer collegeId, Boolean override, String note);
    List<com._42students.lms.model.ProjectResourceAudit> getProjectResourceAudit(UserPrincipal principal, String projectId, Integer collegeId);
    ProjectWorkspaceDTO updateMyProject(UserPrincipal principal, String projectId, ProjectWorkspaceUpdateDTO payload);

    // Mentor-only. Rejects if another sprint on this project is already ACTIVE.
    ProjectWorkspaceDTO startSprint(UserPrincipal principal, String projectId, String sprintKey);

    // Mentor-only. Marks the sprint COMPLETED and returns every incomplete linked task to the
    // product backlog (sprintKey cleared, carriedOverFromSprintKey stamped). No partial
    // credit — see the method body in ProjectWorkspaceServiceImpl for why.
    ProjectWorkspaceDTO completeSprint(UserPrincipal principal, String projectId, String sprintKey);

    // Mentor-only. The one escape hatch for a mistaken "Complete sprint" click (state-machine
    // audit finding: completion had no undo anywhere, unlike a release's ship/un-ship). Only a
    // COMPLETED sprint can be reopened, and only when no other sprint on the project is currently
    // ACTIVE (preserves the single-active-sprint invariant the same way startSprint does), and
    // only when the sprint's release hasn't already shipped (un-ship first — otherwise a release
    // could keep reading "Shipped" while a sprint behind that claim is active again).
    // Deliberately does NOT try to pull carried-over tasks back from the backlog — reversing that
    // automatically is its own source of bugs; a mentor re-sprints anything that belongs back in
    // manually, the same way they'd plan it for any other sprint.
    ProjectWorkspaceDTO reopenSprint(UserPrincipal principal, String projectId, String sprintKey);

    // Real Release entity (V119) — a release groups sprints and has its own PLANNED/IN_PROGRESS/
    // SHIPPED lifecycle. Any project member (mentor or learner) can list; only mentors can
    // create/update/delete/ship.
    List<ProjectReleaseDTO> getProjectReleases(UserPrincipal principal, String projectId);

    // Admin overload — collegeId-checked instead of membership-checked (an admin is never a
    // project member). See the readiness endpoint's identical pattern.
    List<ProjectReleaseDTO> getProjectReleases(UserPrincipal principal, String projectId, Integer collegeId);
    List<ProjectReleaseDTO> createProjectRelease(UserPrincipal principal, String projectId, ProjectReleaseUpsertDTO payload);
    List<ProjectReleaseDTO> updateProjectRelease(UserPrincipal principal, String projectId, String releaseKey, ProjectReleaseUpsertDTO payload);
    List<ProjectReleaseDTO> removeProjectRelease(UserPrincipal principal, String projectId, String releaseKey);

    // Mentor-only. Rejects unless every sprint currently linked to this release is COMPLETED —
    // see ProjectWorkspaceServiceImpl#shipProjectRelease for the exact gate.
    List<ProjectReleaseDTO> shipProjectRelease(UserPrincipal principal, String projectId, String releaseKey);

    // Mentor-only. Reverts a mistaken ship back to a live PLANNED/IN_PROGRESS state (derived
    // from the release's actual linked sprints) — see ProjectWorkspaceServiceImpl for why this
    // doesn't need its own separate "un-shipped" status.
    List<ProjectReleaseDTO> unshipProjectRelease(UserPrincipal principal, String projectId, String releaseKey);
    ProjectWorkspaceDTO updateProjectDelivery(UserPrincipal principal, String projectId, ProjectWorkspaceUpdateDTO payload);
    ProjectWorkspaceDTO adminReviewProjectDelivery(UserPrincipal principal, String projectId, Integer collegeId, ProjectWorkspaceUpdateDTO payload);
    ProjectWorkspaceDTO updateProjectSubmission(UserPrincipal principal, String projectId, ProjectWorkspaceUpdateDTO payload);
    List<ProjectDeliveryEventDTO> getProjectSubmissionHistory(UserPrincipal principal, String projectId);
    List<ProjectWorkspaceDTO> getProjectsByCollege(UserPrincipal principal, Integer collegeId);
    List<ProjectWorkspaceDTO> getProjectsByCollege(UserPrincipal principal, Integer collegeId, String status, String search);
    com._42students.lms.dto.response.PageDTO<ProjectWorkspaceDTO> getProjectsByCollegePage(UserPrincipal principal, Integer collegeId, String status, String search, String view, int page, int size);
    com._42students.lms.dto.response.PageDTO<ProjectWorkspaceDTO> getDeletedProjectsByCollege(UserPrincipal principal, Integer collegeId, int page, int size);
    ProjectWorkspaceDTO getProjectByIdForCollege(UserPrincipal principal, String projectId, Integer collegeId);
    List<ProjectActivityDTO> getProjectActivityFeed(UserPrincipal principal, String projectId);
    ProjectActivityFeedDTO getProjectActivityFeedPaged(UserPrincipal principal, String projectId, Integer page, Integer size, String eventType, String sourceTab, java.time.LocalDateTime fromDate, java.time.LocalDateTime toDate);
    List<ProjectMeetingDTO> getProjectMeetings(UserPrincipal principal, String projectId);
    List<ProjectMeetingDTO> requestProjectMeeting(UserPrincipal principal, String projectId, Map<String, Object> payload);

    /** The requester withdraws their own meeting request while it is still REQUESTED (Projects audit R4-03). */
    List<ProjectMeetingDTO> withdrawProjectMeetingRequest(UserPrincipal principal, String projectId, String meetingKey);
    ProjectWorkspaceDTO assignProjectMentor(UserPrincipal principal, String projectId, AdminProjectMentorAssignDTO payload);
    BulkMentorReassignResultDTO bulkReassignProjectMentor(UserPrincipal principal, AdminProjectBulkMentorReassignDTO payload);
    MentorReassignOutcomeDTO reassignSingleProjectMentorBulkItem(UserPrincipal principal, String projectId, Integer collegeId, Faculty mentor, String roleLabel);
    ProjectWorkspaceDTO assignProjectLearners(UserPrincipal principal, String projectId, AdminProjectLearnerAssignDTO payload);
    ProjectWorkspaceDTO archiveProject(UserPrincipal principal, String projectId, Integer collegeId);
    ProjectWorkspaceDTO deleteProject(UserPrincipal principal, String projectId, Integer collegeId);
    ProjectWorkspaceDTO restoreProject(UserPrincipal principal, String projectId, Integer collegeId);
    List<Map<String, Object>> searchProjectMemberCandidates(UserPrincipal principal, String projectId, String userType, String query, Integer limit);
    List<ProjectMemberDTO> addProjectMember(UserPrincipal principal, String projectId, ProjectMemberUpsertDTO payload);
    List<ProjectMemberDTO> updateProjectMember(UserPrincipal principal, String projectId, Integer memberId, ProjectMemberUpdateDTO payload);
    List<ProjectMemberDTO> removeProjectMember(UserPrincipal principal, String projectId, Integer memberId);
    List<ProjectTaskDTO> getProjectTasks(UserPrincipal principal, String projectId);
    List<ProjectTaskDTO> getProjectTasks(UserPrincipal principal, String projectId, String lane, String priority, String assigneeId);

    // sprintScope: "active" scopes to the current ACTIVE sprint + backlog (the Board tab's
    // default); null/"all" is unscoped (full history — what the Sprints tab's velocity math
    // needs). See ProjectWorkspaceServiceImpl for the full rationale.
    List<ProjectTaskDTO> getProjectTasks(UserPrincipal principal, String projectId, String lane, String priority, String assigneeId, String sprintScope);
    List<ProjectTaskDTO> upsertProjectTask(UserPrincipal principal, String projectId, ProjectTaskUpsertDTO payload);
    List<ProjectTaskDTO> updateProjectTask(UserPrincipal principal, String projectId, String taskId, ProjectTaskUpsertDTO payload);
    List<ProjectTaskDTO> removeProjectTask(UserPrincipal principal, String projectId, String taskId);
    List<ProjectTaskDTO> reorderProjectTasks(UserPrincipal principal, String projectId, ProjectTaskReorderDTO payload);
    List<ProjectTaskCommentDTO> getProjectTaskComments(UserPrincipal principal, String projectId, String taskId);
    List<ProjectTaskCommentDTO> addProjectTaskComment(UserPrincipal principal, String projectId, String taskId, ProjectTaskCommentUpsertDTO payload);
}
