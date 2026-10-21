package com._42students.lms.controller;

import com._42students.lms.dto.bugtracker.*;
import com._42students.lms.service.BugTrackerAttachmentService;
import com._42students.lms.service.BugTrackerService;
import com._42students.lms.service.BugTrackerWorkflowService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/public/bug-tracker")
@Validated
public class PublicBugTrackerController {
    private final BugTrackerService trackerService;
    private final BugTrackerAttachmentService attachmentService;
    private final BugTrackerWorkflowService workflowService;

    public PublicBugTrackerController(BugTrackerService trackerService,
                                      BugTrackerAttachmentService attachmentService,
                                      BugTrackerWorkflowService workflowService) {
        this.trackerService = trackerService;
        this.attachmentService = attachmentService;
        this.workflowService = workflowService;
    }

    @PostMapping("/issues")
    public ResponseEntity<BugReportResponse> createIssue(
            @Valid @RequestBody BugReportCreateRequest request) {
        return ResponseEntity.ok(trackerService.create(request));
    }

    @GetMapping("/issues")
    public ResponseEntity<Page<BugReportResponse>> listIssues(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String environment,
            @RequestParam(required = false) String reporter,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "DESC") String sort) {
        return ResponseEntity.ok(trackerService.search(status, environment, reporter, search, page, size, sort));
    }

    @GetMapping("/issues/{publicId}")
    public ResponseEntity<BugReportResponse> getIssue(@PathVariable String publicId) {
        return ResponseEntity.ok(trackerService.get(publicId));
    }

    // updateStatus/updateWorkflow/retestIssue moved to SuperAdminBugTrackerController --
    // /api/v1/public/** is entirely exempt from JwtAuthenticationFilter (see its shouldNotFilter),
    // so a mutating action here could never actually identify or restrict its caller.

    @GetMapping("/issues/{publicId}/activity")
    public ResponseEntity<List<BugReportActivityResponse>> listActivity(
            @PathVariable String publicId) {
        return ResponseEntity.ok(workflowService.listActivity(publicId));
    }

    @PostMapping("/issues/{publicId}/attachments/presign")
    public ResponseEntity<BugTrackerAttachmentPresignResponse> presignAttachment(
            @PathVariable String publicId,
            @Valid @RequestBody BugTrackerAttachmentPresignRequest request) {
        return ResponseEntity.ok(attachmentService.prepareUpload(publicId, request));
    }

    @PostMapping("/issues/{publicId}/attachments/confirm")
    public ResponseEntity<BugTrackerAttachmentResponse> confirmAttachment(
            @PathVariable String publicId,
            @Valid @RequestBody BugTrackerAttachmentConfirmRequest request) {
        return ResponseEntity.ok(attachmentService.confirmUpload(publicId, request));
    }

    @GetMapping("/issues/{publicId}/attachments")
    public ResponseEntity<List<BugTrackerAttachmentResponse>> listAttachments(
            @PathVariable String publicId) {
        return ResponseEntity.ok(attachmentService.list(publicId));
    }
}
