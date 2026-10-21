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

/** A student raising a request: withdrawal, offer extension, absence dispute, etc. */
@RestController
@RequestMapping("/api/v1/learner/requests")
public class LearnerRequestController {

    private final TpoRequestService requestService;
    private final SecurityContextUtil securityContextUtil;
    private final TpoAccessGuard guard;

    public LearnerRequestController(TpoRequestService requestService, SecurityContextUtil securityContextUtil, TpoAccessGuard guard) {
        this.guard = guard;
        this.requestService = requestService;
        this.securityContextUtil = securityContextUtil;
    }

    private static final java.util.Set<String> ALLOWED_TYPES = java.util.Set.of("WITHDRAWAL", "OFFER_EXTENSION",
            "REGISTRATION_CHANGE", "ABSENCE_DISPUTE", "CORRECTION", "EXTERNAL_OFFER", "PAP");

    public static class CreateRequest {
        public String type; // WITHDRAWAL|OFFER_EXTENSION|REGISTRATION_CHANGE|ABSENCE_DISPUTE|CORRECTION|EXTERNAL_OFFER|PAP
        public Integer jobId;
        public Integer applicationId;
        public Object payload;
        public String reason;
    }

    @PostMapping
    public ResponseEntity<StudentRequest> create(@RequestBody CreateRequest req) {
        UserPrincipal p = securityContextUtil.getAuthenticatedUserPrincipal();
        if (req.type == null || !ALLOWED_TYPES.contains(req.type)) {
            return ResponseEntity.badRequest().build();
        }
        if (req.applicationId != null) guard.requireOwnApplication(p.getId(), req.applicationId);
        if (req.jobId != null) guard.requireJobVisibleToLearner(p, req.jobId);
        StudentRequest r = requestService.create(p.getId(), req.type, req.jobId, req.applicationId, req.payload, req.reason);
        return ResponseEntity.status(HttpStatus.CREATED).body(r);
    }

    @GetMapping("/mine")
    public ResponseEntity<List<StudentRequest>> mine() {
        UserPrincipal p = securityContextUtil.getAuthenticatedUserPrincipal();
        return ResponseEntity.ok(requestService.forLearner(p.getId()));
    }

    // Refusals go through TpoExceptionAdvice: "Not found" stays 404, a refused request is 400 with its sentence (every one was a 404).
}
