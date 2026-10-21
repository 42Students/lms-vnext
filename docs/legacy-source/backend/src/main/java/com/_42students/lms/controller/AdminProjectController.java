package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.projects.AdminProjectCreateDTO;
import com._42students.lms.dto.projects.AdminProjectBulkCreateDTO;
import com._42students.lms.dto.projects.BulkCreateProjectsResultDTO;
import com._42students.lms.dto.projects.AdminProjectTemplateAttachDTO;
import com._42students.lms.dto.projects.AdminProjectMentorAssignDTO;
import com._42students.lms.dto.projects.ProjectReleaseDTO;
import com._42students.lms.dto.projects.AdminProjectLearnerAssignDTO;
import com._42students.lms.dto.projects.AdminProjectReadinessOverrideDTO;
import com._42students.lms.dto.projects.ProjectReadinessDTO;
import com._42students.lms.dto.projects.ProjectWorkspaceDTO;
import com._42students.lms.dto.projects.ProjectWorkspaceUpdateDTO;
import com._42students.lms.dto.projects.AdminProjectBulkMentorReassignDTO;
import com._42students.lms.dto.projects.BulkMentorReassignResultDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.model.Faculty;
import com._42students.lms.model.Learner;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.service.AdminAuditLogService;
import com._42students.lms.service.FeatureFlagService;
import com._42students.lms.service.ProjectWorkspaceService;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.data.domain.Page;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/projects")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
@Slf4j
public class AdminProjectController extends BaseController {

    private final ProjectWorkspaceService projectWorkspaceService;
    private final AccessControlService accessControlService;
    private final SecurityContextUtil securityContextUtil;
    private final AdminAuditLogService auditLogService;
    private final LearnerRepository learnerRepository;
    private final FacultyRepository facultyRepository;

    @Autowired
    private FeatureFlagService featureFlagService;

    // Project teams on groups (docs/groups/PROJECT-TEAMS.md).
    @Autowired(required = false)
    private com._42students.lms.service.projects.ProjectTeamService projectTeamService;

    @Autowired(required = false)
    private com._42students.lms.service.AuditTargetNameResolver targetNameResolver;

    @Autowired(required = false)
    private com._42students.lms.repository.ProjectWorkspaceRepository projectWorkspaceRepository;

    /**
     * Split into teams: one workspace + one PROJECT_TEAM group per team, each created in its own
     * transaction, with a per-team outcome report (a failed team does not undo the others).
     */
    @PostMapping("/teams")
    public ResponseEntity<Response<java.util.Map<String, Object>>> createTeams(
            @RequestBody com._42students.lms.dto.projects.AdminProjectTeamsCreateDTO payload) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            if (payload == null || payload.getCollegeId() == null || payload.getCollegeId() <= 0) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId must be provided", null), HttpStatus.BAD_REQUEST);
            }
            accessControlService.requirePerformAdminActionForCollege(principal, payload.getCollegeId());
            // The target college comes from the body, which the class-level feature check cannot see; gate it here so a
            // college with Projects switched off cannot be written to by a global super-admin (R2-01).
            featureFlagService.requireEnabledForCollege("module.projects.enabled", payload.getCollegeId());
            if (projectTeamService == null) {
                return new ResponseEntity<>(new Response<>("SERVICE_UNAVAILABLE", "Project teams are not available", null), HttpStatus.SERVICE_UNAVAILABLE);
            }
            return ResponseEntity.ok(new Response<>("OK", "Teams processed", projectTeamService.createTeams(principal, payload)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error creating project teams:", e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to create teams", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /** Repairs the learner mirror of a team workspace from its group; returns how many rows changed. */
    @PostMapping("/{projectId}/team/reconcile")
    public ResponseEntity<Response<java.util.Map<String, Object>>> reconcileTeam(
            @org.springframework.web.bind.annotation.PathVariable String projectId,
            @RequestParam Integer collegeId) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            if (collegeId == null || collegeId <= 0) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId must be provided", null), HttpStatus.BAD_REQUEST);
            }
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            if (projectTeamService == null || projectWorkspaceRepository == null) {
                return new ResponseEntity<>(new Response<>("SERVICE_UNAVAILABLE", "Project teams are not available", null), HttpStatus.SERVICE_UNAVAILABLE);
            }
            com._42students.lms.model.ProjectWorkspace workspace = resolveWorkspace(projectId)
                    .filter(w -> java.util.Objects.equals(w.getCollegeId(), collegeId))
                    .orElseThrow(() -> new IllegalArgumentException("Project not found"));
            int changed = projectTeamService.reconcile(workspace);
            return ResponseEntity.ok(new Response<>("OK", changed == 0 ? "Team already in step" : "Team repaired",
                    java.util.Map.of("changed", changed, "teamGroupId", String.valueOf(workspace.getTeamGroupId()))));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error reconciling project team {}:", projectId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to reconcile team", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private java.util.Optional<com._42students.lms.model.ProjectWorkspace> resolveWorkspace(String projectId) {
        if (projectId == null || projectId.isBlank()) return java.util.Optional.empty();
        try {
            return projectWorkspaceRepository.findActiveById(Integer.parseInt(projectId));
        } catch (NumberFormatException ignored) {
            return projectWorkspaceRepository.findActiveBySlug(projectId);
        }
    }

    public AdminProjectController(
            ProjectWorkspaceService projectWorkspaceService,
            AccessControlService accessControlService,
            SecurityContextUtil securityContextUtil,
            AdminAuditLogService auditLogService,
            LearnerRepository learnerRepository,
            FacultyRepository facultyRepository
    ) {
        this.projectWorkspaceService = projectWorkspaceService;
        this.accessControlService = accessControlService;
        this.securityContextUtil = securityContextUtil;
        this.auditLogService = auditLogService;
        this.learnerRepository = learnerRepository;
        this.facultyRepository = facultyRepository;
    }

    @ModelAttribute
    public void guardFeature(HttpServletRequest request) {
        if (featureFlagService != null) {
            featureFlagService.requireEnabled("module.projects.enabled", securityContextUtil.getAuthenticatedUserPrincipal(), request);
        }
    }

    @PostMapping
    public ResponseEntity<Response<ProjectWorkspaceDTO>> createProject(@Valid @RequestBody AdminProjectCreateDTO payload) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            Integer collegeId = payload != null ? payload.getCollegeId() : null;
            if (collegeId == null || collegeId <= 0) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
            }
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.projects.enabled", collegeId);
            return new ResponseEntity<>(new Response<>("OK", "Project created", projectWorkspaceService.createProject(principal, payload)), HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error creating project:", e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to create project", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /** Read-only preview. Creation rechecks the roster and uniqueness under the class lock. */
    @PostMapping("/bulk/preflight")
    public ResponseEntity<Response<Map<String, Object>>> previewBulkCreateProjects(@Valid @RequestBody AdminProjectBulkCreateDTO payload) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            Integer collegeId = payload != null ? payload.getCollegeId() : null;
            if (collegeId == null || collegeId <= 0) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
            }
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.projects.enabled", collegeId);
            return ResponseEntity.ok(new Response<>("OK", "Cohort preflight", projectWorkspaceService.previewBulkCreateProjectsForClass(principal, payload)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error previewing bulk project creation:", e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to preview cohort creation", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/bulk")
    public ResponseEntity<Response<BulkCreateProjectsResultDTO>> bulkCreateProjects(@Valid @RequestBody AdminProjectBulkCreateDTO payload) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            Integer collegeId = payload != null ? payload.getCollegeId() : null;
            if (collegeId == null || collegeId <= 0) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
            }
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.projects.enabled", collegeId);
            return new ResponseEntity<>(new Response<>("OK", "Workspaces created", projectWorkspaceService.bulkCreateProjectsForClass(principal, payload)), HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error bulk creating projects:", e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to bulk create workspaces", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{projectId}")
    public ResponseEntity<Response<ProjectWorkspaceDTO>> updateProject(
            @org.springframework.web.bind.annotation.PathVariable String projectId,
            @RequestParam Integer collegeId,
            @RequestBody ProjectWorkspaceUpdateDTO payload
    ) {
        try {
            if (collegeId == null || collegeId <= 0) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId must be provided", null), HttpStatus.BAD_REQUEST);
            }
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.projects.enabled", collegeId);
            return ResponseEntity.ok(new Response<>("OK", "Project updated", projectWorkspaceService.updateProject(principal, projectId, collegeId, payload)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error updating project {}:", projectId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to update project", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping
    public ResponseEntity<Response<List<ProjectWorkspaceDTO>>> getProjectsByCollege(
            @RequestParam Integer collegeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search
    ) {
        try {
            if (collegeId == null || collegeId <= 0) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
            }
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.projects.enabled", collegeId);
            return ResponseEntity.ok(new Response<>("OK", "Projects retrieved", projectWorkspaceService.getProjectsByCollege(principal, collegeId, status, search)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error fetching projects for college {}:", collegeId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to fetch projects", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Paginated variant of getProjectsByCollege above — that endpoint loads a college's ENTIRE
    // workspace list unbounded, which at 3000-5000 students (workspace count scales with
    // enrollment via bulkCreateProjectsForClass, not a small "team count") means full-table loads
    // on every search keystroke. Kept as a separate endpoint (not a breaking change to the
    // existing one) since other admin pages (reassign-mentor, at-risk, workload) still rely on
    // getting the whole college's list at once for their own in-memory analysis.
    @GetMapping("/page")
    public ResponseEntity<Response<com._42students.lms.dto.response.PageDTO<ProjectWorkspaceDTO>>> getProjectsByCollegePage(
            @RequestParam Integer collegeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String view,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "25") int size
    ) {
        try {
            if (collegeId == null || collegeId <= 0) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
            }
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.projects.enabled", collegeId);
            return ResponseEntity.ok(new Response<>("OK", "Projects retrieved", projectWorkspaceService.getProjectsByCollegePage(principal, collegeId, status, search, view, page, size)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error fetching paged projects for college {}:", collegeId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to fetch projects", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Backs the admin "restore a deleted workspace" view — restoreProject below already existed
    // as a working endpoint, but there was no way for the admin UI to discover WHICH workspaces
    // are recoverable, since the regular list endpoint excludes soft-deleted rows entirely.
    @GetMapping("/deleted")
    public ResponseEntity<Response<com._42students.lms.dto.response.PageDTO<ProjectWorkspaceDTO>>> getDeletedProjectsByCollege(
            @RequestParam Integer collegeId,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "25") int size
    ) {
        try {
            if (collegeId == null || collegeId <= 0) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
            }
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.projects.enabled", collegeId);
            return ResponseEntity.ok(new Response<>("OK", "Deleted projects retrieved", projectWorkspaceService.getDeletedProjectsByCollege(principal, collegeId, page, size)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error fetching deleted projects for college {}:", collegeId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to fetch deleted projects", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<Response<ProjectWorkspaceDTO>> getProjectById(
            @org.springframework.web.bind.annotation.PathVariable String projectId,
            @RequestParam Integer collegeId
    ) {
        try {
            if (collegeId == null || collegeId <= 0) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId must be provided", null), HttpStatus.BAD_REQUEST);
            }
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.projects.enabled", collegeId);
            return ResponseEntity.ok(new Response<>("OK", "Project retrieved", projectWorkspaceService.getProjectByIdForCollege(principal, projectId, collegeId)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error fetching project {}:", projectId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to fetch project", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/{projectId}/mentor")
    public ResponseEntity<Response<ProjectWorkspaceDTO>> assignMentor(
            @RequestBody AdminProjectMentorAssignDTO payload,
            @org.springframework.web.bind.annotation.PathVariable String projectId
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            if (payload == null || payload.getMentorId() == null) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "mentorId must be provided", null), HttpStatus.BAD_REQUEST);
            }
            Integer collegeId = payload.getCollegeId();
            if (collegeId == null || collegeId <= 0) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId must be provided", null), HttpStatus.BAD_REQUEST);
            }
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.projects.enabled", collegeId);
            return ResponseEntity.ok(new Response<>("OK", "Mentor assigned", projectWorkspaceService.assignProjectMentor(principal, projectId, payload)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error assigning mentor for project {}:", projectId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to assign mentor", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Gives a college admin the same Accept/Reject(Request changes)/Lock actions a mentor has on
    // a delivery, directly from the Submissions dashboard — for a submission stuck with no mentor
    // response. Deliberately reuses ProjectWorkspaceUpdateDTO's `delivery` field (same shape the
    // mentor UI already sends: {status, feedback, submitAction, version}) rather than a narrower
    // DTO, so the frontend can share its existing payload-building code with the mentor flow.
    @PutMapping("/{projectId}/delivery/review")
    public ResponseEntity<Response<ProjectWorkspaceDTO>> reviewDelivery(
            @org.springframework.web.bind.annotation.PathVariable String projectId,
            @RequestParam Integer collegeId,
            @RequestBody ProjectWorkspaceUpdateDTO payload,
            javax.servlet.http.HttpServletRequest request
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            if (collegeId == null || collegeId <= 0) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId must be provided", null), HttpStatus.BAD_REQUEST);
            }
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.projects.enabled", collegeId);
            ProjectWorkspaceDTO result = projectWorkspaceService.adminReviewProjectDelivery(principal, projectId, collegeId, payload);
            Object action = payload != null && payload.getDelivery() instanceof java.util.Map
                    ? ((java.util.Map<?, ?>) payload.getDelivery()).get("submitAction") : null;
            // feedback/reviewStatus captured here too — same reasoning as the PROJECT_DELIVERY_UPDATE
            // row: ProjectDelivery.feedback is mutable and gets overwritten by the next review, so
            // the audit trail is the only durable record of what an admin actually told the learner.
            String feedback = result != null && result.getDelivery() != null ? result.getDelivery().getFeedback() : null;
            String reviewStatus = result != null && result.getDelivery() != null ? result.getDelivery().getStatus() : null;
            java.util.Map<String, Object> auditPayload = new java.util.HashMap<>();
            auditPayload.put("action", action != null ? action : "");
            auditPayload.put("feedback", feedback);
            auditPayload.put("status", reviewStatus);
            auditLogService.log(request, "PROJECT_DELIVERY_ADMIN_REVIEW", "project", projectId, null, collegeId,
                    auditPayload);
            return ResponseEntity.ok(new Response<>("OK", "Delivery reviewed", result));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return new ResponseEntity<>(new Response<>("CONFLICT", e.getReason(), null), HttpStatus.CONFLICT);
        } catch (Exception e) {
            log.error("Error reviewing delivery for project {}:", projectId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to review delivery", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Bulk counterpart to assignMentor above — reassigns one mentor across many workspaces in a
    // single request, running each workspace in its own isolated transaction (see
    // ProjectWorkspaceServiceImpl#bulkReassignProjectMentor) so one bad workspace ID doesn't
    // block or roll back the rest of the batch.
    @PostMapping("/reassign-mentor/bulk")
    public ResponseEntity<Response<BulkMentorReassignResultDTO>> bulkReassignMentor(@RequestBody AdminProjectBulkMentorReassignDTO payload) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            Integer collegeId = payload != null ? payload.getCollegeId() : null;
            if (collegeId == null || collegeId <= 0) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
            }
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.projects.enabled", collegeId);
            return ResponseEntity.ok(new Response<>("OK", "Mentor reassignment processed", projectWorkspaceService.bulkReassignProjectMentor(principal, payload)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error bulk reassigning mentor:", e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to reassign mentor", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/{projectId}/template")
    public ResponseEntity<Response<ProjectWorkspaceDTO>> attachTemplate(
            @RequestBody AdminProjectTemplateAttachDTO payload,
            @org.springframework.web.bind.annotation.PathVariable String projectId
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            if (payload == null || payload.getCollegeId() == null || payload.getCollegeId() <= 0) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId must be provided", null), HttpStatus.BAD_REQUEST);
            }
            accessControlService.requirePerformAdminActionForCollege(principal, payload.getCollegeId());
            // The target college comes from the body, which the class-level feature check cannot see; gate it here so a
            // college with Projects switched off cannot be written to by a global super-admin (R2-01).
            featureFlagService.requireEnabledForCollege("module.projects.enabled", payload.getCollegeId());
            return ResponseEntity.ok(new Response<>("OK", "Project template attached", projectWorkspaceService.attachProjectTemplate(principal, projectId, payload)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error attaching template for project {}:", projectId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to attach project template", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/{projectId}/learners")
    public ResponseEntity<Response<ProjectWorkspaceDTO>> assignLearners(
            @Valid @RequestBody AdminProjectLearnerAssignDTO payload,
            @org.springframework.web.bind.annotation.PathVariable String projectId
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            if (payload == null || payload.getCollegeId() == null || payload.getCollegeId() <= 0) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId must be provided", null), HttpStatus.BAD_REQUEST);
            }
            accessControlService.requirePerformAdminActionForCollege(principal, payload.getCollegeId());
            // The target college comes from the body, which the class-level feature check cannot see; gate it here so a
            // college with Projects switched off cannot be written to by a global super-admin (R2-01).
            featureFlagService.requireEnabledForCollege("module.projects.enabled", payload.getCollegeId());
            return ResponseEntity.ok(new Response<>("OK", "Learners assigned", projectWorkspaceService.assignProjectLearners(principal, projectId, payload)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error assigning learners for project {}:", projectId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to assign learners", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/{projectId}/archive")
    public ResponseEntity<Response<ProjectWorkspaceDTO>> archiveProject(
            @org.springframework.web.bind.annotation.PathVariable String projectId,
            @RequestParam Integer collegeId
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            if (collegeId == null || collegeId <= 0) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId must be provided", null), HttpStatus.BAD_REQUEST);
            }
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.projects.enabled", collegeId);
            return ResponseEntity.ok(new Response<>("OK", "Project archived", projectWorkspaceService.archiveProject(principal, projectId, collegeId)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error archiving project {}:", projectId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to archive project", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/{projectId}/delete")
    public ResponseEntity<Response<ProjectWorkspaceDTO>> deleteProject(
            @org.springframework.web.bind.annotation.PathVariable String projectId,
            @RequestParam Integer collegeId
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            if (collegeId == null || collegeId <= 0) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId must be provided", null), HttpStatus.BAD_REQUEST);
            }
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.projects.enabled", collegeId);
            return ResponseEntity.ok(new Response<>("OK", "Project deleted", projectWorkspaceService.deleteProject(principal, projectId, collegeId)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error deleting project {}:", projectId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to delete project", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/{projectId}/restore")
    public ResponseEntity<Response<ProjectWorkspaceDTO>> restoreProject(
            @org.springframework.web.bind.annotation.PathVariable String projectId,
            @RequestParam Integer collegeId
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            if (collegeId == null || collegeId <= 0) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId must be provided", null), HttpStatus.BAD_REQUEST);
            }
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.projects.enabled", collegeId);
            return ResponseEntity.ok(new Response<>("OK", "Project restored", projectWorkspaceService.restoreProject(principal, projectId, collegeId)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error restoring project {}:", projectId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to restore project", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/{projectId}/readiness")
    public ResponseEntity<Response<ProjectReadinessDTO>> getReadiness(
            @org.springframework.web.bind.annotation.PathVariable String projectId,
            @RequestParam Integer collegeId
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            if (collegeId == null || collegeId <= 0) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId must be provided", null), HttpStatus.BAD_REQUEST);
            }
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.projects.enabled", collegeId);
            return ResponseEntity.ok(new Response<>("OK", "Readiness retrieved", projectWorkspaceService.getProjectReadiness(principal, projectId, collegeId)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error fetching readiness for project {}:", projectId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to fetch readiness", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Admin visibility gap: previously the ONLY thing an admin could see about a project's
    // releases was an aggregate "X/Y shipped" count on the readiness endpoint — no titles, no
    // dates, no per-release status, no way to tell WHICH releases shipped or when.
    @GetMapping("/{projectId}/releases")
    public ResponseEntity<Response<java.util.List<ProjectReleaseDTO>>> getReleases(
            @org.springframework.web.bind.annotation.PathVariable String projectId,
            @RequestParam Integer collegeId
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            if (collegeId == null || collegeId <= 0) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId must be provided", null), HttpStatus.BAD_REQUEST);
            }
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.projects.enabled", collegeId);
            return ResponseEntity.ok(new Response<>("OK", "Releases retrieved", projectWorkspaceService.getProjectReleases(principal, projectId, collegeId)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error fetching releases for project {}:", projectId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to fetch releases", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/{projectId}/readiness/override")
    public ResponseEntity<Response<ProjectReadinessDTO>> overrideReadiness(
            @org.springframework.web.bind.annotation.PathVariable String projectId,
            @Valid @RequestBody AdminProjectReadinessOverrideDTO payload
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            if (payload == null || payload.getCollegeId() == null || payload.getCollegeId() <= 0) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId must be provided", null), HttpStatus.BAD_REQUEST);
            }
            accessControlService.requirePerformAdminActionForCollege(principal, payload.getCollegeId());
            // The target college comes from the body, which the class-level feature check cannot see; gate it here so a
            // college with Projects switched off cannot be written to by a global super-admin (R2-01).
            featureFlagService.requireEnabledForCollege("module.projects.enabled", payload.getCollegeId());
            return ResponseEntity.ok(new Response<>("OK", "Readiness override updated", projectWorkspaceService.overrideProjectReadiness(principal, projectId, payload.getCollegeId(), payload.getOverride(), payload.getNote())));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error overriding readiness for project {}:", projectId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to override readiness", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // /{projectId}/delivery/download removed: ProjectDelivery.attachmentUrl is now a plain
    // public URL (same as everywhere else in this app) — the admin Submissions dashboard reads
    // it directly off the project data instead of redirecting through a presigned URL.

    @GetMapping("/audit")
    public ResponseEntity<?> getAuditLog(
            @RequestParam Integer collegeId,
            @RequestParam(required = false) String actionKey,
            @RequestParam(required = false) Integer actorUserId,
            // Lets a workspace/template detail page deep-link to "everything that happened on this
            // entity" (entityId is the slug/key auditProjectAction stamps rows with).
            @RequestParam(required = false) String entityId,
            // Epoch milliseconds, NOT a naive local date-time string. AdminAuditLog.createdAt is
            // written via LocalDateTime.now() (the server JVM's own zone, whatever that is) — a
            // naive string built from the *browser's* local clock would silently misalign the
            // "Today"/"7 days" cutoff by the browser/server zone offset whenever they differ (e.g.
            // admin in IST, server in UTC). An epoch instant is zone-unambiguous; converting it
            // with ZoneId.systemDefault() below re-derives it in the exact same zone the rows were
            // originally stamped in, so the comparison lines up regardless of where either side is.
            @RequestParam(required = false) Long sinceMillis,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            if (collegeId == null || collegeId <= 0) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId must be provided", null), HttpStatus.BAD_REQUEST);
            }
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.projects.enabled", collegeId);
            java.time.LocalDateTime sinceParsed = sinceMillis != null
                    ? java.time.LocalDateTime.ofInstant(java.time.Instant.ofEpochMilli(sinceMillis), java.time.ZoneId.systemDefault())
                    : null;
            // SAA-02/04: super-admin (and only super-admin) also sees PROJECT_TEMPLATE rows,
            // which always carry a null collegeId — see the comment on
            // AdminAuditLogRepository#search for why a plain collegeId match can never surface
            // them, and why this must stay role-gated rather than a blanket loosening of the
            // query (a college-admin's audit feed is deliberately scoped to their own college's
            // activity; template lifecycle events are not that).
            boolean includeGlobalTemplateEvents = accessControlService.isSuperAdmin(principal);
            // CAA-01: this endpoint is specifically "Project audit" — scope every query it runs to
            // the project domain (PROJECT/PROJECT_TEMPLATE/PROJECT_TASK entityType rows) rather
            // than the whole college's admin activity, which this shared table/query also carries
            // for every other module (courses, faculty, learners, quizzes, ...).
            Page<com._42students.lms.model.AdminAuditLog> result = auditLogService.search(
                    actionKey, actorUserId, null, collegeId, entityId, null, sinceParsed, null, page, size, includeGlobalTemplateEvents, true);
            return ResponseEntity.ok(new Response<>("OK", "Audit log retrieved", java.util.Map.of(
                    "items", enrichAuditItemsWithActorNames(result.getContent()),
                    "page", result.getNumber(),
                    "size", result.getSize(),
                    "total", result.getTotalElements()
            )));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error fetching audit log for college {}:", collegeId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to fetch audit log", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // The audit log stores only actorUserId/actorUserType — batch-resolve real names for the
    // current page instead of leaving the raw numeric ID for the admin to decode by hand.
    private List<java.util.Map<String, Object>> enrichAuditItemsWithActorNames(List<com._42students.lms.model.AdminAuditLog> items) {
        java.util.Set<Integer> learnerIds = new java.util.HashSet<>();
        java.util.Set<Integer> facultyIds = new java.util.HashSet<>();
        for (com._42students.lms.model.AdminAuditLog item : items) {
            if (item.getActorUserId() == null) continue;
            String type = String.valueOf(item.getActorUserType());
            if ("LEARNER".equalsIgnoreCase(type)) {
                learnerIds.add(item.getActorUserId());
            } else if ("FACULTY".equalsIgnoreCase(type) || "ADMIN".equalsIgnoreCase(type) || "MENTOR".equalsIgnoreCase(type)) {
                facultyIds.add(item.getActorUserId());
            }
        }
        java.util.Map<Integer, String> names = new java.util.HashMap<>();
        if (!learnerIds.isEmpty()) {
            for (Learner learner : learnerRepository.findAllById(learnerIds)) {
                names.put(learner.getId(), formatActorName(learner.getFirstName(), learner.getLastName()));
            }
        }
        if (!facultyIds.isEmpty()) {
            for (Faculty faculty : facultyRepository.findAllById(facultyIds)) {
                names.put(faculty.getId(), formatActorName(faculty.getFirstName(), faculty.getLastName()));
            }
        }
        // Workspace / template titles, so the change log names them instead of showing slugs.
        java.util.Map<String, String> targetNames = targetNameResolver != null ? targetNameResolver.resolve(items) : java.util.Map.of();
        List<java.util.Map<String, Object>> enriched = new java.util.ArrayList<>();
        for (com._42students.lms.model.AdminAuditLog item : items) {
            java.util.Map<String, Object> row = new java.util.HashMap<>();
            row.put("id", item.getId());
            String entityKey = (item.getEntityType() == null ? "" : item.getEntityType().trim().toLowerCase(java.util.Locale.ROOT)) + ":" + item.getEntityId();
            if (targetNames.get(entityKey) != null) row.put("entityName", targetNames.get(entityKey));
            row.put("actorUserId", item.getActorUserId());
            row.put("actorUserType", item.getActorUserType());
            // Falls back to the actor's phone number only when name resolution fails (e.g. the
            // Faculty/Learner row was later hard-deleted) — acceptable since this endpoint is
            // admin-only and admins already see student/faculty contact numbers elsewhere in the
            // LMS; this is not a new data exposure.
            row.put("actorName", names.getOrDefault(item.getActorUserId(), item.getActorContactMobile()));
            row.put("actionKey", item.getActionKey());
            row.put("entityType", item.getEntityType());
            row.put("entityId", item.getEntityId());
            row.put("organizationId", item.getOrganizationId());
            row.put("collegeId", item.getCollegeId());
            row.put("payloadJson", item.getPayloadJson());
            row.put("createdAt", item.getCreatedAt());
            enriched.add(row);
        }
        return enriched;
    }

    private String formatActorName(String firstName, String lastName) {
        String name = (firstName == null ? "" : firstName.trim()) + " " + (lastName == null ? "" : lastName.trim());
        name = name.trim();
        return name.isEmpty() ? null : name;
    }

    @GetMapping("/{projectId}/resource-audit")
    public ResponseEntity<Response<List<com._42students.lms.model.ProjectResourceAudit>>> getResourceAudit(
            @org.springframework.web.bind.annotation.PathVariable String projectId,
            @RequestParam Integer collegeId
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            if (collegeId == null || collegeId <= 0) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId must be provided", null), HttpStatus.BAD_REQUEST);
            }
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            featureFlagService.requireEnabledForCollege("module.projects.enabled", collegeId);
            return ResponseEntity.ok(new Response<>("OK", "Resource audit retrieved", projectWorkspaceService.getProjectResourceAudit(principal, projectId, collegeId)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error fetching resource audit for project {}:", projectId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to fetch resource audit", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
