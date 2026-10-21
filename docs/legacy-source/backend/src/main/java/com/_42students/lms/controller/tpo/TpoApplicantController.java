package com._42students.lms.controller.tpo;

import com._42students.lms.model.JobApplication;
import com._42students.lms.dto.tpo.StudentSummaryDTO;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.TpoAccessGuard;
import com._42students.lms.service.tpo.TpoApplicantService;
import com._42students.lms.service.tpo.TpoDriveAddService;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tpo/drives/{jobId}/applicants")
public class TpoApplicantController {

    private final TpoApplicantService applicantService;
    private final com._42students.lms.service.tpo.TpoAuditService audit;
    private final SecurityContextUtil securityContextUtil;
    private final TpoAccessGuard guard;
    private final TpoDriveAddService driveAddService;

    public TpoApplicantController(TpoApplicantService applicantService, SecurityContextUtil securityContextUtil, TpoAccessGuard guard, TpoDriveAddService driveAddService,
                                  com._42students.lms.service.tpo.TpoAuditService audit) {
        this.audit = audit;
        this.guard = guard;
        this.driveAddService = driveAddService;
        this.applicantService = applicantService;
        this.securityContextUtil = securityContextUtil;
    }

    private UserPrincipal principal() {
        return securityContextUtil.getAuthenticatedUserPrincipal();
    }

    @GetMapping
    public ResponseEntity<List<JobApplication>> list(@PathVariable Integer jobId) {
        guard.requireJob(principal(), jobId);
        return ResponseEntity.ok(applicantService.applicants(jobId));
    }

    @GetMapping("/not-applied")
    public ResponseEntity<List<StudentSummaryDTO>> notApplied(@PathVariable Integer jobId) {
        guard.requireJob(principal(), jobId);
        return ResponseEntity.ok(applicantService.notApplied(jobId).stream().map(StudentSummaryDTO::new).toList());
    }

    @PostMapping("/remind-not-applied")
    public ResponseEntity<Map<String, Object>> remindNotApplied(@PathVariable Integer jobId) {
        guard.requireJob(principal(), jobId);
        return ResponseEntity.ok(Map.of("reminded", applicantService.remindNotApplied(jobId)));
    }

    @PostMapping("/apply-on-behalf/{learnerId}")
    public ResponseEntity<Map<String, Object>> applyOnBehalf(@PathVariable Integer jobId, @PathVariable Integer learnerId) {
        guard.requireJobWritable(principal(), jobId);
        guard.requireLearner(principal(), learnerId);
        Map<String, Object> result = driveAddService.add(jobId, principal().getCollegeId(), List.of(learnerId), false, null, principal().getId());
        if (((Number) result.get("added")).intValue() == 0) {
            Map<?, ?> row = (Map<?, ?>) ((List<?>) result.get("results")).get(0);
            throw new IllegalArgumentException(String.valueOf(row.get("message")));
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    public static class AddStudentsRequest {
        public List<Integer> learnerIds;
        public boolean includeIneligible;
        public String reason;
    }

    /** Put chosen students on this drive. Each is checked on their own; the answer says who was added and why anyone was not. */
    @PostMapping("/add-students")
    public ResponseEntity<Map<String, Object>> addStudents(@PathVariable Integer jobId, @RequestBody AddStudentsRequest req) {
        guard.requireJobWritable(principal(), jobId);
        if (req.learnerIds != null) for (Integer id : req.learnerIds) if (id != null) guard.requireLearner(principal(), id);
        return ResponseEntity.ok(driveAddService.add(jobId, principal().getCollegeId(), req.learnerIds, req.includeIneligible, req.reason, principal().getId()));
    }

    public static class BulkRequest {
        public List<Integer> applicationIds;
        public String newStatus;
        public String internalReason;
    }

    @PostMapping("/bulk-move")
    public ResponseEntity<Map<String, Object>> bulkMove(@PathVariable Integer jobId, @RequestBody BulkRequest req) {
        guard.requireApplicationsInJob(principal(), jobId, req.applicationIds);
        var r = applicantService.bulkMove(req.applicationIds, req.newStatus, principal().getId());
        // On the drive's activity: who moved how many to which stage (single moves from the board used to leave no trace).
        if (r.moved() > 0) audit.log(principal().getCollegeId(), "TPO", principal().getId(), "APPLICANTS_MOVED", "DRIVE", jobId.longValue(), r.moved() + (r.moved() == 1 ? " student" : " students") + " moved to " + com._42students.lms.service.tpo.ApplicationTransitionService.stageWord(req.newStatus));
        return ResponseEntity.ok(r.toMap());
    }

    @PostMapping("/bulk-reject")
    public ResponseEntity<Map<String, Object>> bulkReject(@PathVariable Integer jobId, @RequestBody BulkRequest req) {
        guard.requireApplicationsInJob(principal(), jobId, req.applicationIds);
        var r = applicantService.bulkReject(req.applicationIds, principal().getId(), req.internalReason);
        if (r.moved() > 0) audit.log(principal().getCollegeId(), "TPO", principal().getId(), "APPLICANTS_NOT_SELECTED", "DRIVE", jobId.longValue(),
                r.moved() + (r.moved() == 1 ? " student" : " students") + (req.internalReason == null || req.internalReason.isBlank() ? "" : ": " + req.internalReason.trim()));
        return ResponseEntity.ok(r.toMap());
    }

    @PostMapping("/undo/{undoGroupId}")
    public ResponseEntity<Map<String, Object>> undo(@PathVariable Integer jobId, @PathVariable String undoGroupId) {
        guard.requireJob(principal(), jobId);
        int restored = applicantService.undo(jobId, undoGroupId, principal().getId());
        if (restored < 0) return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Too late to undo: the students have already been told"));
        if (restored > 0) audit.log(principal().getCollegeId(), "TPO", principal().getId(), "APPLICANTS_MOVE_UNDONE", "DRIVE", jobId.longValue(), restored + (restored == 1 ? " student" : " students") + " put back");
        return ResponseEntity.ok(Map.of("restored", restored));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
    }

    /** A move the rules refuse (e.g. to a stage only offers or results set) says why instead of failing with a 500. */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleRefused(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", String.valueOf(e.getMessage())));
    }
}
