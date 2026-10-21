package com._42students.lms.controller.tpo;

import com._42students.lms.model.tpo.RoundResult;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.TpoAccessGuard;
import com._42students.lms.service.tpo.TpoResultsService;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tpo/rounds")
public class TpoResultsController {

    private final TpoResultsService resultsService;
    private final SecurityContextUtil securityContextUtil;
    private final TpoAccessGuard guard;
    private final com._42students.lms.service.tpo.TpoAuditService audit;

    public TpoResultsController(TpoResultsService resultsService, SecurityContextUtil securityContextUtil, TpoAccessGuard guard,
                                com._42students.lms.service.tpo.TpoAuditService audit) {
        this.audit = audit;
        this.guard = guard;
        this.resultsService = resultsService;
        this.securityContextUtil = securityContextUtil;
    }

    private UserPrincipal principal() {
        return securityContextUtil.getAuthenticatedUserPrincipal();
    }

    public static class StageRequest {
        public Integer applicationId;
        public String outcome; // PASS|FAIL|ABSENT|HOLD
        public Integer waitlistRank;
        public Double score;
        public String reasonCategory;
        public String comment;
        public String source; // recruiter|PANELIST|DRIVE_DAY|EXCEL|TPO
    }

    @PostMapping("/{roundId}/results")
    public ResponseEntity<RoundResult> stage(@PathVariable Long roundId, @RequestBody StageRequest req) {
        UserPrincipal p = principal();
        guard.requireApplicationInRoundJob(p, roundId, req.applicationId);
        RoundResult r = resultsService.stage(roundId, req.applicationId, req.outcome, req.waitlistRank,
                req.score, req.reasonCategory, req.comment,
                req.source == null ? "TPO" : req.source, "FACULTY", p.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(r);
    }

    @GetMapping("/{roundId}/results/pending")
    public ResponseEntity<List<RoundResult>> pending(@PathVariable Long roundId) {
        guard.requireRound(principal(), roundId);
        return ResponseEntity.ok(resultsService.pending(roundId));
    }

    @PostMapping("/{roundId}/results/apply")
    public ResponseEntity<Map<String, Object>> apply(@PathVariable Long roundId, @RequestParam(defaultValue = "true") boolean notify) {
        guard.requireRoundWritable(principal(), roundId);
        // { applied, skipped: [{ applicationId, reason }] }: a result that could not be applied stays waiting and is reported.
        Map<String, Object> out = resultsService.applyRound(roundId, principal().getId(), notify);
        // Applying a round's results moves students: it goes on the drive's activity like any other move.
        Integer jobId = guard.jobIdOfRound(roundId);
        if (jobId != null) audit.log(principal().getCollegeId(), "TPO", principal().getId(), "ROUND_RESULTS_APPLIED", "DRIVE", jobId.longValue(),
                "round " + roundId + ": " + out.get("applied") + " applied" + (out.get("skipped") instanceof java.util.List<?> sk && !sk.isEmpty() ? ", " + sk.size() + " left waiting" : ""));
        return ResponseEntity.accepted().body(out);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
    }
}
