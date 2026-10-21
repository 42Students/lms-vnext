package com._42students.lms.controller;

import com._42students.lms.dto.request.ModuleAccessBulkRequest;
import com._42students.lms.dto.request.ModuleAccessUpdateRequest;
import com._42students.lms.dto.response.Response;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.ModuleAccessService;
import com._42students.lms.util.SecurityContextUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

/**
 * Hierarchical module access, for both consoles. Serves super-admin and college-admin from the same
 * endpoints — authority differs per level and is enforced in {@link ModuleAccessService}, not here.
 */
@RestController
@RequestMapping("/api/v1/admin/module-access")
@Slf4j
public class ModuleAccessController extends BaseController {

    private final ModuleAccessService moduleAccessService;
    private final SecurityContextUtil securityContextUtil;

    public ModuleAccessController(ModuleAccessService moduleAccessService, SecurityContextUtil securityContextUtil) {
        this.moduleAccessService = moduleAccessService;
        this.securityContextUtil = securityContextUtil;
    }

    /**
     * The whole college — every department, program, batch and class with all three modules already
     * resolved — in one call. Backs the admin grid, so an admin sees where every setting lives
     * instead of drilling a picker to find out.
     */
    @GetMapping("/tree")
    public ResponseEntity<?> getTree(@RequestParam Integer collegeId) {
        try {
            if (collegeId == null || collegeId <= 0) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId is required", null), HttpStatus.BAD_REQUEST);
            }
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Module access tree retrieved",
                    moduleAccessService.getCollegeTree(principal, collegeId)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (ResponseStatusException e) {
            HttpStatus status = e.getStatus();
            String message = e.getReason() != null ? e.getReason() : e.getMessage();
            return new ResponseEntity<>(new Response<>(status.name(), message, null), status);
        } catch (Exception e) {
            log.error("Error reading module access tree for college {}:", collegeId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to read module access tree", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /** What is explicitly set at one node, plus what it currently resolves to. */
    @GetMapping
    public ResponseEntity<?> getNode(@RequestParam String scopeType,
                                     @RequestParam(required = false) Integer scopeId) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Module access retrieved",
                    moduleAccessService.getNode(principal, scopeType, scopeId)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (ResponseStatusException e) {
            HttpStatus status = e.getStatus();
            String message = e.getReason() != null ? e.getReason() : e.getMessage();
            return new ResponseEntity<>(new Response<>(status.name(), message, null), status);
        } catch (Exception e) {
            log.error("Error reading module access for {}:{}", scopeType, scopeId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to read module access", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /** Set one module at one node. A null {@code enabled} clears the override so the node inherits again. */
    @PutMapping
    public ResponseEntity<?> setValue(@RequestBody ModuleAccessUpdateRequest body, HttpServletRequest request) {
        try {
            if (body == null || body.getScopeType() == null || body.getModule() == null) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST",
                        "scopeType and module are required", null), HttpStatus.BAD_REQUEST);
            }
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            Map<String, Object> result = moduleAccessService.setValue(principal, body.getScopeType(), body.getScopeId(),
                    body.getModule(), body.getEnabled(), body.getLocked(), request);
            return ResponseEntity.ok(new Response<>("OK", "Module access updated", result));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (ResponseStatusException e) {
            HttpStatus status = e.getStatus();
            String message = e.getReason() != null ? e.getReason() : e.getMessage();
            return new ResponseEntity<>(new Response<>(status.name(), message, null), status);
        } catch (Exception e) {
            log.error("Error updating module access:", e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to update module access", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /** Bulk-set one module for many selected students — powers the Students-table bulk action. */
    @PutMapping("/bulk")
    public ResponseEntity<?> setBulk(@RequestBody ModuleAccessBulkRequest body, HttpServletRequest request) {
        try {
            if (body == null || body.getModule() == null) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "module is required", null), HttpStatus.BAD_REQUEST);
            }
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            Map<String, Object> result = moduleAccessService.setBulkForLearners(principal, body.getModule(),
                    body.getEnabled(), body.getLearnerIds(), request);
            return ResponseEntity.ok(new Response<>("OK", "Module access updated", result));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (ResponseStatusException e) {
            HttpStatus status = e.getStatus();
            String message = e.getReason() != null ? e.getReason() : e.getMessage();
            return new ResponseEntity<>(new Response<>(status.name(), message, null), status);
        } catch (Exception e) {
            log.error("Error bulk-updating module access:", e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to update module access", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Which students in this college carry their own override.
     *
     * <p>Per-student settings are the narrowest level and always win, so a forgotten one follows a
     * student for years. They are also the one level the grid cannot show. Without this an admin
     * could set a thousand in one bulk action and never find them again.
     */
    @GetMapping("/learner-overrides")
    public ResponseEntity<?> listLearnerOverrides(@RequestParam Integer collegeId) {
        try {
            if (collegeId == null || collegeId <= 0) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId is required", null), HttpStatus.BAD_REQUEST);
            }
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Per-student overrides retrieved",
                    moduleAccessService.listLearnerOverrides(principal, collegeId)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (ResponseStatusException e) {
            HttpStatus status = e.getStatus();
            String message = e.getReason() != null ? e.getReason() : e.getMessage();
            return new ResponseEntity<>(new Response<>(status.name(), message, null), status);
        } catch (Exception e) {
            log.error("Error listing per-student overrides for college {}:", collegeId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to list per-student overrides", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Recent module-access changes for this college.
     *
     * <p>Every change was already audited; nothing read those rows. Since a stored value is
     * overwritten in place, the audit trail is the only record of what it used to be.
     */
    @GetMapping("/history")
    public ResponseEntity<?> history(@RequestParam Integer collegeId,
                                     @RequestParam(required = false, defaultValue = "50") int limit) {
        try {
            if (collegeId == null || collegeId <= 0) {
                return new ResponseEntity<>(new Response<>("BAD_REQUEST", "collegeId is required", null), HttpStatus.BAD_REQUEST);
            }
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Module access history retrieved",
                    moduleAccessService.listHistory(principal, collegeId, limit)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (ResponseStatusException e) {
            HttpStatus status = e.getStatus();
            String message = e.getReason() != null ? e.getReason() : e.getMessage();
            return new ResponseEntity<>(new Response<>(status.name(), message, null), status);
        } catch (Exception e) {
            log.error("Error reading module access history for college {}:", collegeId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to read module access history", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /** "Why can't this student see Placements?" — the resolved answer plus the level that decided it. */
    @GetMapping("/explain")
    public ResponseEntity<?> explain(@RequestParam Integer learnerId) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            return ResponseEntity.ok(new Response<>("OK", "Module access explained",
                    moduleAccessService.explainForLearner(principal, learnerId)));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new Response<>("BAD_REQUEST", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new Response<>("FORBIDDEN", e.getMessage(), null), HttpStatus.FORBIDDEN);
        } catch (ResponseStatusException e) {
            HttpStatus status = e.getStatus();
            String message = e.getReason() != null ? e.getReason() : e.getMessage();
            return new ResponseEntity<>(new Response<>(status.name(), message, null), status);
        } catch (Exception e) {
            log.error("Error explaining module access for learner {}:", learnerId, e);
            return new ResponseEntity<>(new Response<>("INTERNAL_SERVER_ERROR", "Failed to explain module access", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
