package com._42students.lms.controller;

import com._42students.lms.dto.tpo.DriveForm;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.recruiter.RecruiterPlanDriveService;
import com._42students.lms.util.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Plan a drive and list drives from the recruiter's one college. A recruiter session belongs to exactly one
 * college (recruiter V2), so a drive is always planned for the session's college: whatever college ids a
 * client sends are ignored, and a drive's other-college copies are never shown. Sending one drive to
 * several colleges at once is paused; the service still supports it, this surface does not expose it.
 * Under /api/v1/recruiter/**, so the recruiter fence lets it through (and rejects a college-less session).
 */
@RestController
@RequestMapping("/api/v1/recruiter")
@RequiredArgsConstructor
public class RecruiterPlanDriveController {

    private final RecruiterPlanDriveService planDriveService;
    private final SecurityContextUtil securityContextUtil;

    private UserPrincipal principal() {
        return securityContextUtil.getAuthenticatedUserPrincipal();
    }

    private Integer college() {
        UserPrincipal p = principal();
        if (p == null || p.getCollegeId() == null) throw new AccessDeniedException("A college must be selected");
        return p.getCollegeId();
    }

    public static class PlanDriveRequest {
        public DriveForm form;
        /** Ignored: kept so older clients that still send it keep working. */
        public List<Integer> collegeIds;
    }

    @PostMapping("/plan-drive")
    public ResponseEntity<Map<String, Object>> planDrive(@RequestBody PlanDriveRequest req) {
        if (req == null || req.form == null) throw new IllegalArgumentException("A drive form is required");
        return ResponseEntity.status(HttpStatus.CREATED).body(planDriveService.planDrive(principal(), req.form, List.of(college())));
    }

    @GetMapping("/drive-groups")
    public ResponseEntity<List<Map<String, Object>>> myDriveGroups() {
        return ResponseEntity.ok(planDriveService.myDriveGroupsIn(principal().getId(), college()));
    }

    @GetMapping("/drive-groups/{groupId}")
    public ResponseEntity<Map<String, Object>> driveGroupDetail(@PathVariable Long groupId) {
        return ResponseEntity.ok(planDriveService.driveGroupDetailIn(principal().getId(), groupId, college()));
    }

    /** Paused: a drive is not extended to another college from inside one college's workspace. */
    @PostMapping("/drive-groups/{groupId}/add-college")
    public ResponseEntity<Map<String, String>> addCollege(@PathVariable Long groupId) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "DRIVE_GROUPS_PAUSED"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleConflict(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
    }
}
