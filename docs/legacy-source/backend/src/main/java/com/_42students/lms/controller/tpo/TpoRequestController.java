package com._42students.lms.controller.tpo;

import com._42students.lms.model.tpo.StudentRequest;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.TpoAccessGuard;
import com._42students.lms.service.tpo.TpoRequestService;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** TPO side of the student_request queue: one Home card type for every kind of ask. */
@RestController
@RequestMapping("/api/v1/tpo/requests")
public class TpoRequestController {

    private final TpoRequestService requestService;
    private final SecurityContextUtil securityContextUtil;
    private final TpoAccessGuard guard;

    public TpoRequestController(TpoRequestService requestService, SecurityContextUtil securityContextUtil, TpoAccessGuard guard) {
        this.guard = guard;
        this.requestService = requestService;
        this.securityContextUtil = securityContextUtil;
    }

    @GetMapping("/pending")
    public ResponseEntity<List<StudentRequest>> pending() {
        var p = securityContextUtil.getAuthenticatedUserPrincipal();
        return ResponseEntity.ok(requestService.pendingForCollege(p.getCollegeId()));
    }

    public static class DecideRequest {
        public boolean approve;
        public String reason;
    }

    @PostMapping("/{requestId}/decide")
    public ResponseEntity<StudentRequest> decide(@PathVariable Long requestId, @RequestBody DecideRequest req) {
        guard.requireRequest(securityContextUtil.getAuthenticatedUserPrincipal(), requestId);
        UserPrincipal p = securityContextUtil.getAuthenticatedUserPrincipal();
        return ResponseEntity.ok(requestService.decide(requestId, req.approve, p.getId(), req.reason));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
    }

    /** An already-decided request, or a withdrawal the rules refuse, says why instead of failing with a 500. */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleRefused(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", String.valueOf(e.getMessage())));
    }
}
