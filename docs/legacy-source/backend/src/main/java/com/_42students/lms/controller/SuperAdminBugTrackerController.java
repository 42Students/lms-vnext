package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.bugtracker.BugReportResponse;
import com._42students.lms.dto.bugtracker.BugReportRetestRequest;
import com._42students.lms.dto.bugtracker.BugReportStatusRequest;
import com._42students.lms.dto.bugtracker.BugReportWorkflowRequest;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.BugTrackerService;
import com._42students.lms.service.BugTrackerWorkflowService;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

/**
 * Mutating bug-tracker actions (status/workflow/retest) -- deliberately NOT under
 * /api/v1/public/bug-tracker, unlike reporting and browsing issues. That path is entirely exempt
 * from JwtAuthenticationFilter (see its shouldNotFilter), so nothing there can ever identify a
 * caller even if they hold a valid session -- these three actions previously lived there with zero
 * protection: anyone who knew or guessed a publicId could close, reopen, or fabricate a retest
 * result for any bug report, or overwrite its engineering fields (root cause, fix notes, commit
 * SHAs, production-verified flag). Moved here so JwtAuthenticationFilter actually runs and a real
 * super-admin check can happen.
 */
@RestController
@RequestMapping("/api/v1/superadmin/bug-tracker")
@Validated
public class SuperAdminBugTrackerController {
    private final BugTrackerService trackerService;
    private final BugTrackerWorkflowService workflowService;
    private final SecurityContextUtil securityContextUtil;
    private final AccessControlService accessControlService;

    public SuperAdminBugTrackerController(BugTrackerService trackerService,
                                          BugTrackerWorkflowService workflowService,
                                          SecurityContextUtil securityContextUtil,
                                          AccessControlService accessControlService) {
        this.trackerService = trackerService;
        this.workflowService = workflowService;
        this.securityContextUtil = securityContextUtil;
        this.accessControlService = accessControlService;
    }

    @PatchMapping("/issues/{publicId}/status")
    public ResponseEntity<BugReportResponse> updateStatus(
            @PathVariable String publicId,
            @Valid @RequestBody BugReportStatusRequest request) {
        requireSuperAdmin();
        workflowService.updateStatus(publicId, request.getStatus());
        return ResponseEntity.ok(trackerService.get(publicId));
    }

    @PatchMapping("/issues/{publicId}/workflow")
    public ResponseEntity<BugReportResponse> updateWorkflow(
            @PathVariable String publicId,
            @Valid @RequestBody BugReportWorkflowRequest request) {
        requireSuperAdmin();
        workflowService.updateWorkflow(publicId, request);
        return ResponseEntity.ok(trackerService.get(publicId));
    }

    @PostMapping("/issues/{publicId}/retest")
    public ResponseEntity<BugReportResponse> retestIssue(
            @PathVariable String publicId,
            @Valid @RequestBody BugReportRetestRequest request) {
        requireSuperAdmin();
        workflowService.retest(publicId, request);
        return ResponseEntity.ok(trackerService.get(publicId));
    }

    private void requireSuperAdmin() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (!accessControlService.isSuperAdmin(principal)) {
            throw new AccessDeniedException("Super Admin access required");
        }
    }
}
