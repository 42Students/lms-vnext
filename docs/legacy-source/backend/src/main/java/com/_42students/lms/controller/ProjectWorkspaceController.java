package com._42students.lms.controller;

import com._42students.lms.dto.projects.ProjectWorkspaceDTO;
import com._42students.lms.dto.projects.ProjectMemberDTO;
import com._42students.lms.dto.projects.ProjectMemberUpsertDTO;
import com._42students.lms.dto.projects.ProjectMemberUpdateDTO;
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
import com._42students.lms.dto.projects.ProjectWorkspaceUpdateDTO;
import com._42students.lms.dto.response.PageDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.FeatureFlagService;
import com._42students.lms.service.ProjectWorkspaceService;
import com._42students.lms.util.SecurityContextUtil;
import com._42students.lms.utils.R2StorageUtils;
import com.amazonaws.services.s3.model.S3Object;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.MediaType;
import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/v1/projects")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class ProjectWorkspaceController extends BaseController {

    private final ProjectWorkspaceService projectWorkspaceService;
    private final SecurityContextUtil securityContextUtil;

    @Autowired
    private FeatureFlagService featureFlagService;

    @Autowired(required = false)
    private R2StorageUtils r2StorageUtils;

    public ProjectWorkspaceController(ProjectWorkspaceService projectWorkspaceService, SecurityContextUtil securityContextUtil) {
        this.projectWorkspaceService = projectWorkspaceService;
        this.securityContextUtil = securityContextUtil;
    }

    @ModelAttribute
    public void guardFeature(HttpServletRequest request) {
        if (featureFlagService != null) {
            featureFlagService.requireEnabled("module.projects.enabled", securityContextUtil.getAuthenticatedUserPrincipal(), request);
        }
    }

    @GetMapping("/me")
    public ResponseEntity<Response<List<ProjectWorkspaceDTO>>> getMyProjects() {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Projects retrieved", projectWorkspaceService.getMyProjects(principal)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        }
    }

    @GetMapping("/me/page")
    public ResponseEntity<Response<com._42students.lms.dto.response.PageDTO<ProjectWorkspaceDTO>>> getMyProjectsPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String attention) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Projects retrieved", projectWorkspaceService.getMyProjectsPage(principal, page, size, status, search, attention)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<Response<ProjectWorkspaceDTO>> getMyProject(@PathVariable String projectId) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Project retrieved", projectWorkspaceService.getMyProject(principal, projectId)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("NOT_FOUND", e.getMessage(), null), HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{projectId}")
    public ResponseEntity<Response<ProjectWorkspaceDTO>> updateMyProject(
            @PathVariable String projectId,
            @RequestBody ProjectWorkspaceUpdateDTO payload
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Project updated", projectWorkspaceService.updateMyProject(principal, projectId, payload)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return saveFailure(e);
        }
    }

    @PutMapping("/{projectId}/overview")
    public ResponseEntity<Response<ProjectWorkspaceDTO>> updateOverview(
            @PathVariable String projectId,
            @RequestBody ProjectWorkspaceUpdateDTO payload
    ) {
        return updateSection(projectId, payload);
    }

    @PutMapping("/{projectId}/sprints")
    public ResponseEntity<Response<ProjectWorkspaceDTO>> updateSprints(
            @PathVariable String projectId,
            @RequestBody ProjectWorkspaceUpdateDTO payload
    ) {
        return updateSection(projectId, payload);
    }

    // Sprint lifecycle: deliberately separate from the generic /sprints bulk-save above — see
    // the comment on ProjectWorkspaceServiceImpl.startSprint for why sprintState only ever
    // changes through these three endpoints (start/complete/reopen).
    @PostMapping("/{projectId}/sprints/{sprintKey}/start")
    public ResponseEntity<Response<ProjectWorkspaceDTO>> startSprint(
            @PathVariable String projectId,
            @PathVariable String sprintKey
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Sprint started", projectWorkspaceService.startSprint(principal, projectId, sprintKey)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/{projectId}/sprints/{sprintKey}/complete")
    public ResponseEntity<Response<ProjectWorkspaceDTO>> completeSprint(
            @PathVariable String projectId,
            @PathVariable String sprintKey
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Sprint completed", projectWorkspaceService.completeSprint(principal, projectId, sprintKey)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    // State-machine audit finding: completing a sprint had no undo anywhere in the system, unlike
    // a release's ship/un-ship. This is that escape hatch for a mistaken "Complete sprint" click —
    // see ProjectWorkspaceServiceImpl.reopenSprint for the exact guards (COMPLETED-only, no other
    // sprint currently ACTIVE).
    @PostMapping("/{projectId}/sprints/{sprintKey}/reopen")
    public ResponseEntity<Response<ProjectWorkspaceDTO>> reopenSprint(
            @PathVariable String projectId,
            @PathVariable String sprintKey
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Sprint reopened", projectWorkspaceService.reopenSprint(principal, projectId, sprintKey)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    // V119 Release entity — see ProjectWorkspaceServiceImpl's "V119 Release entity" section.
    @GetMapping("/{projectId}/releases")
    public ResponseEntity<Response<java.util.List<ProjectReleaseDTO>>> getProjectReleases(
            @PathVariable String projectId
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Releases retrieved", projectWorkspaceService.getProjectReleases(principal, projectId)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/{projectId}/releases")
    public ResponseEntity<Response<java.util.List<ProjectReleaseDTO>>> createProjectRelease(
            @PathVariable String projectId,
            @RequestBody ProjectReleaseUpsertDTO payload
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Release created", projectWorkspaceService.createProjectRelease(principal, projectId, payload)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{projectId}/releases/{releaseKey}")
    public ResponseEntity<Response<java.util.List<ProjectReleaseDTO>>> updateProjectRelease(
            @PathVariable String projectId,
            @PathVariable String releaseKey,
            @RequestBody ProjectReleaseUpsertDTO payload
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Release updated", projectWorkspaceService.updateProjectRelease(principal, projectId, releaseKey, payload)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{projectId}/releases/{releaseKey}")
    public ResponseEntity<Response<java.util.List<ProjectReleaseDTO>>> removeProjectRelease(
            @PathVariable String projectId,
            @PathVariable String releaseKey
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Release removed", projectWorkspaceService.removeProjectRelease(principal, projectId, releaseKey)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/{projectId}/releases/{releaseKey}/ship")
    public ResponseEntity<Response<java.util.List<ProjectReleaseDTO>>> shipProjectRelease(
            @PathVariable String projectId,
            @PathVariable String releaseKey
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Release shipped", projectWorkspaceService.shipProjectRelease(principal, projectId, releaseKey)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/{projectId}/releases/{releaseKey}/unship")
    public ResponseEntity<Response<java.util.List<ProjectReleaseDTO>>> unshipProjectRelease(
            @PathVariable String projectId,
            @PathVariable String releaseKey
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Release un-shipped", projectWorkspaceService.unshipProjectRelease(principal, projectId, releaseKey)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{projectId}/tasks")
    public ResponseEntity<Response<ProjectWorkspaceDTO>> updateTasks(
            @PathVariable String projectId,
            @RequestBody ProjectWorkspaceUpdateDTO payload
    ) {
        return updateSection(projectId, payload);
    }

    @PutMapping("/{projectId}/resources")
    public ResponseEntity<Response<ProjectWorkspaceDTO>> updateResources(
            @PathVariable String projectId,
            @RequestBody ProjectWorkspaceUpdateDTO payload
    ) {
        return updateSection(projectId, payload);
    }

    @GetMapping("/{projectId}/resources/{resourceKey}/download")
    public ResponseEntity<?> downloadProjectResource(
            @PathVariable String projectId,
            @PathVariable String resourceKey
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (r2StorageUtils == null) {
                return new ResponseEntity<>(new Response<>("SERVICE_UNAVAILABLE", "File storage is unavailable", null), HttpStatus.SERVICE_UNAVAILABLE);
            }
            String key = projectWorkspaceService.resolveProjectResourceDownloadKey(principal, projectId, resourceKey);
            S3Object object = r2StorageUtils.downloadFile(key);
            String contentType = object.getObjectMetadata() != null ? object.getObjectMetadata().getContentType() : null;
            long contentLength = object.getObjectMetadata() != null ? object.getObjectMetadata().getContentLength() : -1L;
            String fileName = key.substring(key.lastIndexOf('/') + 1);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentDisposition(ContentDisposition.inline().filename(fileName).build());
            if (contentType != null && !contentType.isBlank()) {
                try { headers.setContentType(MediaType.parseMediaType(contentType)); } catch (Exception ignored) { }
            }
            if (contentLength >= 0) headers.setContentLength(contentLength);
            headers.setCacheControl("private, no-store, max-age=0");
            return new ResponseEntity<>(new InputStreamResource(object.getObjectContent()), headers, HttpStatus.OK);
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("NOT_FOUND", e.getMessage(), null), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to open resource file", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{projectId}/delivery")
    public ResponseEntity<Response<ProjectWorkspaceDTO>> updateDelivery(
            @PathVariable String projectId,
            @RequestBody ProjectWorkspaceUpdateDTO payload
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Project updated", projectWorkspaceService.updateProjectDelivery(principal, projectId, payload)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/{projectId}/delivery")
    public ResponseEntity<Response<ProjectDeliveryDTO>> getDelivery(@PathVariable String projectId) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Project delivery retrieved", projectWorkspaceService.getProjectDelivery(principal, projectId)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("NOT_FOUND", e.getMessage(), null), HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/{projectId}/submission")
    public ResponseEntity<Response<ProjectDeliveryDTO>> getSubmission(@PathVariable String projectId) {
        return getDelivery(projectId);
    }

    @PutMapping("/{projectId}/submission")
    public ResponseEntity<Response<ProjectWorkspaceDTO>> updateSubmission(
            @PathVariable String projectId,
            @RequestBody ProjectWorkspaceUpdateDTO payload
    ) {
        return updateDelivery(projectId, payload);
    }

    @GetMapping("/{projectId}/submission/history")
    public ResponseEntity<Response<List<ProjectDeliveryEventDTO>>> getSubmissionHistory(@PathVariable String projectId) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Project submission history retrieved", projectWorkspaceService.getProjectSubmissionHistory(principal, projectId)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("NOT_FOUND", e.getMessage(), null), HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/{projectId}/submission/review")
    public ResponseEntity<Response<ProjectWorkspaceDTO>> reviewSubmission(
            @PathVariable String projectId,
            @RequestBody ProjectWorkspaceUpdateDTO payload
    ) {
        return updateDelivery(projectId, payload);
    }

    @GetMapping("/{projectId}/readiness")
    public ResponseEntity<Response<ProjectReadinessDTO>> getReadiness(@PathVariable String projectId) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Project readiness retrieved", projectWorkspaceService.getProjectReadiness(principal, projectId)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("NOT_FOUND", e.getMessage(), null), HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/{projectId}/delivery/history")
    public ResponseEntity<Response<List<ProjectDeliveryEventDTO>>> getDeliveryHistory(@PathVariable String projectId) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Project delivery history retrieved", projectWorkspaceService.getProjectDeliveryHistory(principal, projectId)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("NOT_FOUND", e.getMessage(), null), HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/{projectId}/activity")
    public ResponseEntity<Response<List<ProjectActivityDTO>>> getActivity(@PathVariable String projectId) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Project activity retrieved", projectWorkspaceService.getProjectActivityFeed(principal, projectId)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("NOT_FOUND", e.getMessage(), null), HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/{projectId}/activity/feed")
    public ResponseEntity<Response<ProjectActivityFeedDTO>> getActivityFeed(
            @PathVariable String projectId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer page,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer size,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String eventType,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String sourceTab,
            // #11: plain date (no time) from the frontend's date-range picker -- fromDate is taken
            // at the start of that day and toDate at the end of it, so a single day selected as
            // both endpoints still returns everything that happened that day rather than nothing.
            // Audit fix: every other LocalDate/LocalDateTime @RequestParam in this codebase
            // (AdminJobController, JobController) explicitly annotates @DateTimeFormat rather than
            // relying on Spring Boot's default ISO registration -- matching that here rather than
            // being the one endpoint that assumes the default is in effect.
            @org.springframework.web.bind.annotation.RequestParam(required = false)
            @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE)
            java.time.LocalDate fromDate,
            @org.springframework.web.bind.annotation.RequestParam(required = false)
            @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE)
            java.time.LocalDate toDate
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            java.time.LocalDateTime from = fromDate != null ? fromDate.atStartOfDay() : null;
            java.time.LocalDateTime to = toDate != null ? toDate.atTime(23, 59, 59) : null;
            return ResponseEntity.ok(new Response<>("OK", "Project activity feed retrieved", projectWorkspaceService.getProjectActivityFeedPaged(principal, projectId, page, size, eventType, sourceTab, from, to)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("NOT_FOUND", e.getMessage(), null), HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{projectId}/meetings")
    public ResponseEntity<Response<ProjectWorkspaceDTO>> updateMeetings(
            @PathVariable String projectId,
            @RequestBody ProjectWorkspaceUpdateDTO payload
    ) {
        return updateSection(projectId, payload);
    }

    @GetMapping("/{projectId}/meetings")
    public ResponseEntity<Response<List<ProjectMeetingDTO>>> getMeetings(@PathVariable String projectId) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Project meetings retrieved", projectWorkspaceService.getProjectMeetings(principal, projectId)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("NOT_FOUND", e.getMessage(), null), HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/{projectId}/meetings/{meetingKey}/withdraw")
    public ResponseEntity<Response<List<ProjectMeetingDTO>>> withdrawMeetingRequest(
            @PathVariable String projectId,
            @PathVariable String meetingKey
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Meeting request withdrawn",
                    projectWorkspaceService.withdrawProjectMeetingRequest(principal, projectId, meetingKey)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            boolean missing = e.getMessage() != null && e.getMessage().toLowerCase(java.util.Locale.ROOT).contains("not found");
            return new ResponseEntity<>(new Response<>(missing ? "NOT_FOUND" : "BAD_REQUEST", e.getMessage(), null),
                    missing ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/{projectId}/meetings/request")
    public ResponseEntity<Response<List<ProjectMeetingDTO>>> requestMeeting(
            @PathVariable String projectId,
            @RequestBody Map<String, Object> payload
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Meeting requested", projectWorkspaceService.requestProjectMeeting(principal, projectId, payload)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/{projectId}/tasks/items")
    public ResponseEntity<Response<List<ProjectTaskDTO>>> getProjectTasks(
            @PathVariable String projectId,
            @RequestParam(required = false) String lane,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String assigneeId,
            @RequestParam(required = false) String sprintScope
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Project tasks retrieved", projectWorkspaceService.getProjectTasks(principal, projectId, lane, priority, assigneeId, sprintScope)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("NOT_FOUND", e.getMessage(), null), HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/{projectId}/tasks/items/{taskId}/comments")
    public ResponseEntity<Response<List<ProjectTaskCommentDTO>>> getProjectTaskComments(
            @PathVariable String projectId,
            @PathVariable String taskId
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Project task comments retrieved", projectWorkspaceService.getProjectTaskComments(principal, projectId, taskId)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("NOT_FOUND", e.getMessage(), null), HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/{projectId}/tasks/items")
    public ResponseEntity<Response<List<ProjectTaskDTO>>> addProjectTask(
            @PathVariable String projectId,
            @RequestBody ProjectTaskUpsertDTO payload
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Project tasks updated", projectWorkspaceService.upsertProjectTask(principal, projectId, payload)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{projectId}/tasks/items/{taskId}")
    public ResponseEntity<Response<List<ProjectTaskDTO>>> updateProjectTask(
            @PathVariable String projectId,
            @PathVariable String taskId,
            @RequestBody ProjectTaskUpsertDTO payload
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Project tasks updated", projectWorkspaceService.updateProjectTask(principal, projectId, taskId, payload)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            // A refusal with no message reached the mentor as a bare "Request failed with status 400"
            // and left nothing in the logs; keep the cause so the next one can be traced.
            if (e.getMessage() == null || e.getMessage().isBlank()) {
                org.slf4j.LoggerFactory.getLogger(ProjectWorkspaceController.class)
                        .warn("Task update {} on {} refused without a message", taskId, projectId, e);
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "This task could not be updated. Refresh the page and try again.", null), HttpStatus.BAD_REQUEST);
            }
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{projectId}/tasks/items/{taskId}")
    public ResponseEntity<Response<List<ProjectTaskDTO>>> removeProjectTask(
            @PathVariable String projectId,
            @PathVariable String taskId
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Project tasks updated", projectWorkspaceService.removeProjectTask(principal, projectId, taskId)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (IllegalStateException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{projectId}/tasks/reorder")
    public ResponseEntity<Response<List<ProjectTaskDTO>>> reorderProjectTasks(
            @PathVariable String projectId,
            @RequestBody ProjectTaskReorderDTO payload
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Project tasks reordered", projectWorkspaceService.reorderProjectTasks(principal, projectId, payload)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/{projectId}/tasks/items/{taskId}/comments")
    public ResponseEntity<Response<List<ProjectTaskCommentDTO>>> addProjectTaskComment(
            @PathVariable String projectId,
            @PathVariable String taskId,
            @Valid @RequestBody ProjectTaskCommentUpsertDTO payload
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Project task comment added", projectWorkspaceService.addProjectTaskComment(principal, projectId, taskId, payload)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/{projectId}/member-candidates")
    public ResponseEntity<Response<List<Map<String, Object>>>> searchProjectMemberCandidates(
            @PathVariable String projectId,
            @RequestParam(defaultValue = "LEARNER") String userType,
            @RequestParam(defaultValue = "") String query,
            @RequestParam(defaultValue = "15") Integer limit
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>(
                    "OK",
                    "Project member candidates retrieved",
                    projectWorkspaceService.searchProjectMemberCandidates(principal, projectId, userType, query, limit)
            ));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/{projectId}/members")
    public ResponseEntity<Response<List<ProjectMemberDTO>>> addProjectMember(
            @PathVariable String projectId,
            @Valid @RequestBody ProjectMemberUpsertDTO payload
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Project members updated", projectWorkspaceService.addProjectMember(principal, projectId, payload)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{projectId}/members/{memberId}")
    public ResponseEntity<Response<List<ProjectMemberDTO>>> updateProjectMember(
            @PathVariable String projectId,
            @PathVariable Integer memberId,
            @Valid @RequestBody ProjectMemberUpdateDTO payload
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Project members updated", projectWorkspaceService.updateProjectMember(principal, projectId, memberId, payload)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/{projectId}/members/{memberId}/remove")
    public ResponseEntity<Response<List<ProjectMemberDTO>>> removeProjectMember(
            @PathVariable String projectId,
            @PathVariable Integer memberId
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Project members updated", projectWorkspaceService.removeProjectMember(principal, projectId, memberId)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    private ResponseEntity<Response<ProjectWorkspaceDTO>> updateSection(String projectId, ProjectWorkspaceUpdateDTO payload) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Project updated", projectWorkspaceService.updateMyProject(principal, projectId, payload)));
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return saveFailure(e);
        }
    }

    /**
     * A save's IllegalArgumentException is a 404 only when something it names no longer exists ("Project not found",
     * "Release not found"). Everything else is bad input (row limits, dates, fields) and must reach the editor as a 400,
     * not as "this item is no longer available" (Projects audit R9-03).
     */
    private ResponseEntity<Response<ProjectWorkspaceDTO>> saveFailure(IllegalArgumentException e) {
        String message = e.getMessage();
        boolean missing = message != null && message.toLowerCase(java.util.Locale.ROOT).contains("not found");
        return missing
                ? new ResponseEntity<>(new Response<>("NOT_FOUND", message, null), HttpStatus.NOT_FOUND)
                : new ResponseEntity<>(new Response<>("BAD_REQUEST", message, null), HttpStatus.BAD_REQUEST);
    }
}
