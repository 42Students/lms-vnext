package com._42students.lms.controller;

import com._42students.lms.model.RecruiterCollegeAccess;
import com._42students.lms.model.Recruiter;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AdminAuditLogService;
import com._42students.lms.service.recruiter.RecruiterAdminService;
import com._42students.lms.service.recruiter.RecruiterAdminService.RecruiterAdminException;
import com._42students.lms.service.recruiter.RecruiterAdminService.RecruiterProfileInput;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Super-admin management of recruiter (industry) accounts and the colleges each may enter.
 * Also restricted to ROLE_SUPER_ADMIN in WebSecurityConfig. See docs/recruiter-tpo/DESIGN.md.
 */
@RestController
@RequestMapping("/api/v1/superadmin/recruiters")
public class SuperAdminRecruiterController {

    private final RecruiterAdminService recruiterAdminService;
    private final SecurityContextUtil securityContextUtil;
    private final AdminAuditLogService audit;

    public SuperAdminRecruiterController(RecruiterAdminService recruiterAdminService,
                                  SecurityContextUtil securityContextUtil,
                                  AdminAuditLogService audit) {
        this.recruiterAdminService = recruiterAdminService;
        this.securityContextUtil = securityContextUtil;
        this.audit = audit;
    }

    public static class RecruiterRequest extends RecruiterProfileInput {
        /** Colleges to grant on create (required for a scoped super admin). Ignored on update. */
        public List<Integer> collegeIds;
    }

    public static class GrantRequest {
        public Integer collegeId;
        /** ISO-8601 local date-time, e.g. 2026-12-31T23:59:59; null = no end. */
        public String validUntil;
        public List<String> capabilities;
    }

    public static class ReasonRequest {
        public String reason;
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required = false) String q,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(recruiterAdminService.list(principal(), q, page, size));
    }

    @GetMapping("/companies")
    public ResponseEntity<?> companies() {
        return ResponseEntity.ok(Map.of("items", recruiterAdminService.companies(principal())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Integer id) {
        return ResponseEntity.ok(recruiterAdminService.get(principal(), id));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody RecruiterRequest body, HttpServletRequest request) {
        UserPrincipal principal = principal();
        Recruiter recruiter = recruiterAdminService.createWithColleges(principal, body, body != null ? body.collegeIds : null);
        Map<String, Object> payload = new HashMap<>();
        payload.put("contactMobile", recruiter.getContactMobile());
        payload.put("collegeIds", body != null && body.collegeIds != null ? body.collegeIds : List.of());
        audit.log(request, "RECRUITER_CREATE", "recruiter", String.valueOf(recruiter.getId()), null, null, payload);
        return ResponseEntity.ok(Map.of("hr", viewOf(principal, recruiter.getId())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody RecruiterRequest body, HttpServletRequest request) {
        UserPrincipal principal = principal();
        Recruiter recruiter = recruiterAdminService.update(principal, id, body);
        audit.log(request, "RECRUITER_UPDATE", "recruiter", String.valueOf(recruiter.getId()), null, null, Map.of());
        return ResponseEntity.ok(Map.of("hr", viewOf(principal, recruiter.getId())));
    }

    @PostMapping("/{id}/suspend")
    public ResponseEntity<?> suspend(@PathVariable Integer id, @RequestBody(required = false) ReasonRequest body,
                                     HttpServletRequest request) {
        UserPrincipal principal = principal();
        String reason = body != null ? body.reason : null;
        Recruiter recruiter = recruiterAdminService.suspend(principal, id, reason);
        audit.log(request, "RECRUITER_SUSPEND", "recruiter", String.valueOf(recruiter.getId()), null, null,
                reason != null ? Map.of("reason", reason) : Map.of());
        return ResponseEntity.ok(Map.of("hr", viewOf(principal, recruiter.getId())));
    }

    @PostMapping("/{id}/reactivate")
    public ResponseEntity<?> reactivate(@PathVariable Integer id, HttpServletRequest request) {
        UserPrincipal principal = principal();
        Recruiter recruiter = recruiterAdminService.reactivate(principal, id);
        audit.log(request, "RECRUITER_REACTIVATE", "recruiter", String.valueOf(recruiter.getId()), null, null, Map.of());
        return ResponseEntity.ok(Map.of("hr", viewOf(principal, recruiter.getId())));
    }

    @PostMapping("/{id}/revoke-sessions")
    public ResponseEntity<?> revokeSessions(@PathVariable Integer id, HttpServletRequest request) {
        Recruiter recruiter = recruiterAdminService.revokeSessions(principal(), id);
        audit.log(request, "RECRUITER_REVOKE_SESSIONS", "recruiter", String.valueOf(recruiter.getId()), null, null, Map.of());
        return ResponseEntity.ok(Map.of("message", "All sessions revoked"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id, HttpServletRequest request) {
        Recruiter recruiter = recruiterAdminService.delete(principal(), id);
        audit.log(request, "RECRUITER_DELETE", "recruiter", String.valueOf(recruiter.getId()), null, null, Map.of());
        return ResponseEntity.ok(Map.of("message", "Recruiter deleted"));
    }

    @PostMapping("/{id}/colleges")
    public ResponseEntity<?> grant(@PathVariable Integer id, @RequestBody GrantRequest body, HttpServletRequest request) {
        UserPrincipal principal = principal();
        if (body == null) throw new RecruiterAdminException(400, "BODY_REQUIRED", "Request body is required");
        RecruiterCollegeAccess grant = recruiterAdminService.grant(principal, id, body.collegeId, parseDateTime(body.validUntil),
                body.capabilities);
        Map<String, Object> payload = new HashMap<>();
        payload.put("validUntil", body.validUntil);
        payload.put("capabilities", grant.getCapabilities() != null ? new ArrayList<>(grant.getCapabilities()) : List.of());
        audit.log(request, "RECRUITER_COLLEGE_GRANT", "recruiter", String.valueOf(id), grant.getOrganizationId(), grant.getCollegeId(), payload);
        return ResponseEntity.ok(Map.of("hr", viewOf(principal, id)));
    }

    @DeleteMapping("/{id}/colleges/{collegeId}")
    public ResponseEntity<?> revoke(@PathVariable Integer id, @PathVariable Integer collegeId,
                                    @RequestBody(required = false) ReasonRequest body, HttpServletRequest request) {
        UserPrincipal principal = principal();
        String reason = body != null ? body.reason : null;
        RecruiterCollegeAccess grant = recruiterAdminService.revoke(principal, id, collegeId, reason);
        audit.log(request, "RECRUITER_COLLEGE_REVOKE", "recruiter", String.valueOf(id), grant.getOrganizationId(), grant.getCollegeId(),
                reason != null ? Map.of("reason", reason) : Map.of());
        return ResponseEntity.ok(Map.of("hr", viewOf(principal, id)));
    }

    @ExceptionHandler(RecruiterAdminException.class)
    public ResponseEntity<?> handle(RecruiterAdminException e) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", e.getCode());
        body.put("message", e.getMessage());
        if (e.getDetails() != null) body.putAll(e.getDetails());
        return ResponseEntity.status(e.getStatus()).body(body);
    }

    private Map<String, Object> viewOf(UserPrincipal principal, Integer recruiterId) {
        return recruiterAdminService.get(principal, recruiterId);
    }

    private UserPrincipal principal() {
        return securityContextUtil.getAuthenticatedUserPrincipal();
    }

    private static LocalDateTime parseDateTime(String raw) {
        if (raw == null || raw.trim().isEmpty()) return null;
        try {
            return LocalDateTime.parse(raw.trim());
        } catch (DateTimeParseException e) {
            throw new RecruiterAdminException(400, "INVALID_VALID_UNTIL", "validUntil must be an ISO date-time like 2026-12-31T23:59:59");
        }
    }
}
