package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.projects.AdminProjectTemplateUpsertDTO;
import com._42students.lms.dto.projects.AdminProjectCreateDTO;
import com._42students.lms.dto.projects.ProjectTemplateDTO;
import com._42students.lms.dto.projects.ProjectTemplateVersionDTO;
import com._42students.lms.dto.projects.ProjectWorkspaceDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.FeatureFlagService;
import com._42students.lms.service.ProjectWorkspaceService;
import com._42students.lms.util.SecurityContextUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/project-templates")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
@Slf4j
public class AdminProjectTemplateController extends BaseController {

    private final ProjectWorkspaceService projectWorkspaceService;
    private final AccessControlService accessControlService;
    private final SecurityContextUtil securityContextUtil;

    @Autowired
    private FeatureFlagService featureFlagService;

    public AdminProjectTemplateController(
            ProjectWorkspaceService projectWorkspaceService,
            AccessControlService accessControlService,
            SecurityContextUtil securityContextUtil
    ) {
        this.projectWorkspaceService = projectWorkspaceService;
        this.accessControlService = accessControlService;
        this.securityContextUtil = securityContextUtil;
    }

    @ModelAttribute
    public void guardFeature(HttpServletRequest request) {
        if (featureFlagService != null) {
            featureFlagService.requireEnabled("module.projects.enabled", securityContextUtil.getAuthenticatedUserPrincipal(), request);
        }
    }

    @GetMapping
    public ResponseEntity<Response<List<ProjectTemplateDTO>>> getProjectTemplates(
            @RequestParam(required = false) Integer collegeId,
            @RequestParam(required = false) String lifecycleStatus,
            @RequestParam(required = false) String search
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            // Templates are a global catalog now (V136__project_template_global.sql) — super-admin
            // (the only one who edits them) doesn't need a college selected in the header just to
            // browse/manage them. College-admin still passes their own collegeId, which
            // requirePerformAdminActionForCollege checks like any other admin action.
            if (!accessControlService.isSuperAdmin(principal)) {
                if (collegeId == null || collegeId <= 0) {
                    return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
                }
                accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            }
            return ResponseEntity.ok(new Response<>("OK", "Project templates retrieved", projectWorkspaceService.getProjectTemplates(principal, collegeId, lifecycleStatus, search)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error fetching project templates for college {}:", collegeId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to fetch project templates", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/{templateId}")
    public ResponseEntity<Response<ProjectTemplateDTO>> getProjectTemplate(
            @PathVariable Integer templateId,
            @RequestParam(required = false) Integer collegeId
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            // See getProjectTemplates — super-admin doesn't need a college selected just to view
            // a global template; college-admin still passes and is checked against their own.
            if (!accessControlService.isSuperAdmin(principal)) {
                if (collegeId == null || collegeId <= 0) {
                    return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
                }
                accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            }
            return ResponseEntity.ok(new Response<>("OK", "Project template retrieved", projectWorkspaceService.getProjectTemplate(principal, collegeId, templateId)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error fetching project template {}:", templateId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to fetch project template", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/{templateId}/preview")
    public ResponseEntity<Response<ProjectTemplateDTO>> previewProjectTemplate(
            @PathVariable Integer templateId,
            @RequestParam(required = false) Integer collegeId
    ) {
        return getProjectTemplate(templateId, collegeId);
    }

    @GetMapping("/{templateId}/versions/page")
    public ResponseEntity<Response<com._42students.lms.dto.response.PageDTO<ProjectTemplateVersionDTO>>> getProjectTemplateVersionsPage(
            @PathVariable Integer templateId,
            @RequestParam(required = false) Integer collegeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Project template versions retrieved", projectWorkspaceService.getProjectTemplateVersionsPage(principal, collegeId, templateId, page, size)));
        } catch (IllegalArgumentException e) { return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST); }
        catch (org.springframework.security.access.AccessDeniedException e) { return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN); }
    }

    @GetMapping("/{templateId}/colleges")
    public ResponseEntity<Response<List<Integer>>> getProjectTemplateColleges(@PathVariable Integer templateId) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Template college assignments retrieved", projectWorkspaceService.getAssignedCollegeIdsForProjectTemplate(principal, templateId)));
        } catch (IllegalArgumentException e) { return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST); }
        catch (org.springframework.security.access.AccessDeniedException e) { return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN); }
    }

    @PutMapping("/{templateId}/colleges")
    public ResponseEntity<Response<java.util.Map<String,Object>>> bulkSetProjectTemplateColleges(@PathVariable Integer templateId, @RequestBody java.util.Map<String,Object> payload) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            Object raw = payload == null ? null : payload.get("collegeIds");
            List<Integer> ids = new java.util.ArrayList<>();
            if (raw instanceof java.util.Collection) for (Object value : (java.util.Collection<?>) raw) ids.add(Integer.valueOf(String.valueOf(value)));
            // Optional compare-and-set: the set the admin last read (R7-02).
            Object rawExpected = payload == null ? null : payload.get("expectedCollegeIds");
            List<Integer> expected = null;
            if (rawExpected instanceof java.util.Collection) {
                expected = new java.util.ArrayList<>();
                for (Object value : (java.util.Collection<?>) rawExpected) expected.add(Integer.valueOf(String.valueOf(value)));
            }
            return ResponseEntity.ok(new Response<>("OK", "Template college assignments updated", projectWorkspaceService.bulkSetProjectTemplateColleges(principal, templateId, ids, expected)));
        } catch (IllegalArgumentException e) { return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST); }
        catch (org.springframework.security.access.AccessDeniedException e) { return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN); }
    }

    @GetMapping("/{templateId}/versions")
    public ResponseEntity<Response<List<ProjectTemplateVersionDTO>>> getProjectTemplateVersions(
            @PathVariable Integer templateId,
            @RequestParam(required = false) Integer collegeId
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            // Version/rollback history is an editing concern — gated to super-admin inside the
            // service (requirePerformAdminActionForCollege no longer applies: templates have no
            // college for a scoped super-admin's collegeId to be checked against).
            return ResponseEntity.ok(new Response<>("OK", "Project template versions retrieved", projectWorkspaceService.getProjectTemplateVersions(principal, collegeId, templateId)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error fetching project template versions for {}:", templateId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to fetch project template versions", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Project templates are a single platform-wide catalog now (see V136__project_template_global
    // .sql) — the ~10 industrial projects super-admin hands to every college, not something each
    // college builds for itself. Only super-admin may create/edit/publish/archive/duplicate/
    // rollback one; college-admin keeps read + "use this template to create a workspace" only.
    @PostMapping
    public ResponseEntity<Response<ProjectTemplateDTO>> createProjectTemplate(@RequestBody AdminProjectTemplateUpsertDTO payload) {
        try {
            if (payload == null) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "Template payload is required", null), HttpStatus.BAD_REQUEST);
            }
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            accessControlService.requireSuperAdmin(principal);
            return new ResponseEntity<>(new Response<>("OK", "Project template created", projectWorkspaceService.createProjectTemplate(principal, payload)), HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error creating project template:", e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to create project template", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{templateId}")
    public ResponseEntity<Response<ProjectTemplateDTO>> updateProjectTemplate(
            @PathVariable Integer templateId,
            @RequestParam(required = false) Integer collegeId,
            @RequestBody AdminProjectTemplateUpsertDTO payload
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            accessControlService.requireSuperAdmin(principal);
            return ResponseEntity.ok(new Response<>("OK", "Project template updated", projectWorkspaceService.updateProjectTemplate(principal, templateId, collegeId, payload)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error updating project template {}:", templateId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to update project template", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/{templateId}/duplicate")
    public ResponseEntity<Response<ProjectTemplateDTO>> duplicateProjectTemplate(
            @PathVariable Integer templateId,
            @RequestParam(required = false) Integer collegeId,
            @RequestBody(required = false) AdminProjectTemplateUpsertDTO payload
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            accessControlService.requireSuperAdmin(principal);
            return new ResponseEntity<>(new Response<>("OK", "Project template duplicated", projectWorkspaceService.duplicateProjectTemplate(principal, templateId, collegeId, payload)), HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error duplicating project template {}:", templateId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to duplicate project template", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/{templateId}/projects")
    public ResponseEntity<Response<ProjectWorkspaceDTO>> createProjectFromTemplate(
            @PathVariable Integer templateId,
            @RequestBody AdminProjectCreateDTO payload
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
            // Body-scoped target college: the class-level feature check cannot see it (R2-01).
            featureFlagService.requireEnabledForCollege("module.projects.enabled", payload.getCollegeId());
            return new ResponseEntity<>(new Response<>("OK", "Project created from template", projectWorkspaceService.createProjectFromTemplate(principal, templateId, payload)), HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error creating project from template {}:", templateId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to create project from template", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // POST /migrate/workspaces ("Migrate legacy workspaces") removed entirely — it backfilled a
    // templateId onto workspaces created before the template system existed, by generating a new
    // DRAFT template from each one's current content. It shipped with zero frontend callers, the
    // superadmin UI later built for it was judged not the right thing to have sitting behind one
    // click, and it is gone: this controller method, ProjectWorkspaceService#
    // migrateProjectWorkspacesFromCurrentState / #migrateSingleProjectWorkspace, the two request/
    // report DTOs, and the frontend button + modal on templates/index.js.

    @DeleteMapping("/{templateId}")
    public ResponseEntity<Response<ProjectTemplateDTO>> archiveProjectTemplate(
            @PathVariable Integer templateId,
            @RequestParam(required = false) Integer collegeId
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            accessControlService.requireSuperAdmin(principal);
            return ResponseEntity.ok(new Response<>("OK", "Project template archived", projectWorkspaceService.archiveProjectTemplate(principal, templateId, collegeId)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error archiving project template {}:", templateId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to archive project template", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Opt-in per-college template visibility (V140__project_template_college_assignment.sql).
    @PostMapping("/{templateId}/colleges/{collegeId}")
    public ResponseEntity<Response<Void>> assignProjectTemplateToCollege(
            @PathVariable Integer templateId,
            @PathVariable Integer collegeId
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            accessControlService.requireSuperAdmin(principal);
            projectWorkspaceService.assignProjectTemplateToCollege(principal, templateId, collegeId);
            return ResponseEntity.ok(new Response<>("OK", "Template assigned to college", null));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error assigning project template {} to college {}:", templateId, collegeId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to assign project template to college", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/{templateId}/colleges/{collegeId}")
    public ResponseEntity<Response<Void>> unassignProjectTemplateFromCollege(
            @PathVariable Integer templateId,
            @PathVariable Integer collegeId
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            accessControlService.requireSuperAdmin(principal);
            projectWorkspaceService.unassignProjectTemplateFromCollege(principal, templateId, collegeId);
            return ResponseEntity.ok(new Response<>("OK", "Template unassigned from college", null));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error unassigning project template {} from college {}:", templateId, collegeId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to unassign project template from college", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/colleges/{collegeId}")
    public ResponseEntity<Response<List<Integer>>> getAssignedProjectTemplateIdsForCollege(@PathVariable Integer collegeId) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            accessControlService.requireSuperAdmin(principal);
            return ResponseEntity.ok(new Response<>("OK", "Assigned template ids retrieved", projectWorkspaceService.getAssignedProjectTemplateIdsForCollege(principal, collegeId)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error fetching assigned project template ids for college {}:", collegeId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to fetch assigned project template ids", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/{templateId}/publish")
    public ResponseEntity<Response<ProjectTemplateDTO>> publishProjectTemplate(
            @PathVariable Integer templateId,
            @RequestParam(required = false) Integer collegeId
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            accessControlService.requireSuperAdmin(principal);
            return ResponseEntity.ok(new Response<>("OK", "Project template published", projectWorkspaceService.publishProjectTemplate(principal, templateId, collegeId)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error publishing project template {}:", templateId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to publish project template", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/{templateId}/unpublish")
    public ResponseEntity<Response<ProjectTemplateDTO>> unpublishProjectTemplate(
            @PathVariable Integer templateId,
            @RequestParam(required = false) Integer collegeId
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            accessControlService.requireSuperAdmin(principal);
            return ResponseEntity.ok(new Response<>("OK", "Project template unpublished", projectWorkspaceService.unpublishProjectTemplate(principal, templateId, collegeId)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error unpublishing project template {}:", templateId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to unpublish project template", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Blast radius of a rollback, read before confirming one.
     *
     * <p>The rollback itself already records affectedWorkspaceCount in the audit trail, but that
     * only tells you what you changed after you have changed it. Workspaces resolve their
     * never-materialized ("virtual") sections from the currently attached template on every read,
     * so a rollback rewrites what every attached cohort sees — the admin fixing a typo deserves
     * to know that before pressing the button, not afterwards.
     */
    @GetMapping("/{templateId}/impact")
    public ResponseEntity<Response<java.util.Map<String, Object>>> getProjectTemplateImpact(
            @PathVariable Integer templateId,
            @RequestParam(required = false) Integer collegeId
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            // Deciding whether to roll back is an editing concern, and only super-admin edits
            // templates now.
            accessControlService.requireSuperAdmin(principal);
            return ResponseEntity.ok(new Response<>("OK", "Project template impact",
                    projectWorkspaceService.getProjectTemplateImpact(principal, templateId, collegeId)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error reading project template impact {}:", templateId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to read project template impact", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/{templateId}/versions/{versionId}/rollback")
    public ResponseEntity<Response<ProjectTemplateDTO>> rollbackProjectTemplateVersion(
            @PathVariable Integer templateId,
            @PathVariable Integer versionId,
            @RequestParam(required = false) Integer collegeId,
            @RequestParam(required = false) Integer expectedTemplateVersion
    ) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) {
                return new ResponseEntity<>(new Response<>("UNAUTHORIZED", "Authentication required", null), HttpStatus.UNAUTHORIZED);
            }
            accessControlService.requireSuperAdmin(principal);
            return ResponseEntity.ok(new Response<>("OK", "Project template rolled back", projectWorkspaceService.rollbackProjectTemplateVersion(principal, templateId, collegeId, versionId, expectedTemplateVersion)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            log.error("Error rolling back project template {}:", templateId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to roll back project template", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
