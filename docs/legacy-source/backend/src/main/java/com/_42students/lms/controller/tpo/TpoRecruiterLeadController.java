package com._42students.lms.controller.tpo;

import com._42students.lms.model.tpo.FollowUp;
import com._42students.lms.model.tpo.RecruiterLead;
import com._42students.lms.model.tpo.RecruiterLeadActivity;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.TpoAccessGuard;
import com._42students.lms.service.tpo.TpoRecruiterLeadService;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tpo/recruiter-leads")
public class TpoRecruiterLeadController {

    private final TpoRecruiterLeadService recruiterLeadService;
    private final SecurityContextUtil securityContextUtil;
    private final TpoAccessGuard guard;

    public TpoRecruiterLeadController(TpoRecruiterLeadService recruiterLeadService, SecurityContextUtil securityContextUtil, TpoAccessGuard guard) {
        this.guard = guard;
        this.recruiterLeadService = recruiterLeadService;
        this.securityContextUtil = securityContextUtil;
    }

    private UserPrincipal principal() {
        return securityContextUtil.getAuthenticatedUserPrincipal();
    }

    @GetMapping
    public ResponseEntity<List<RecruiterLead>> board() {
        return ResponseEntity.ok(recruiterLeadService.board(principal().getCollegeId()));
    }

    public static class AddRecruiterLeadRequest {
        public String name;
        /** Email or phone (older clients send just this). */
        public String emailOrPhone;
        /** Optional second contact: the phone when emailOrPhone is an email, or the email when it is a phone. */
        public String otherContact;
        public String designation;
        public String companyName;
        /** Where they were found (a code or label from TpoRecruiterLeadService.SOURCES); optional. */
        public String source;
    }

    @PostMapping
    public ResponseEntity<RecruiterLead> add(@RequestBody AddRecruiterLeadRequest req) {
        UserPrincipal p = principal();
        RecruiterLead existing = recruiterLeadService.findExisting(p.getCollegeId(), req.emailOrPhone);
        if (existing != null) return ResponseEntity.status(HttpStatus.CONFLICT).body(existing);
        if (req.otherContact != null && !req.otherContact.isBlank()) {
            RecruiterLead other = recruiterLeadService.findExisting(p.getCollegeId(), req.otherContact);
            if (other != null) return ResponseEntity.status(HttpStatus.CONFLICT).body(other);
        }
        RecruiterLead recruiterLead = recruiterLeadService.addRecruiterLead(p.getCollegeId(), req.name, req.emailOrPhone, req.companyName, p.getId(), req.source);
        recruiterLead = recruiterLeadService.addDetails(recruiterLead, req.otherContact, req.designation);
        return ResponseEntity.status(HttpStatus.CREATED).body(recruiterLead);
    }

    public static class UpdateRecruiterLeadRequest {
        public String name;
        public String designation;
        public String email;
        public String phone;
        public String companyName;
        /** Where they were found; blank goes back to Added by hand / Imported. Left out (older clients): unchanged. */
        public String source;
        @com.fasterxml.jackson.annotation.JsonIgnore
        public boolean sourceSent;
        @com.fasterxml.jackson.annotation.JsonSetter("source")
        public void setSource(String v) { this.source = v; this.sourceSent = true; }
    }

    /** Edit a recruiter lead's contact details from the recruiter lead page. */
    @PutMapping("/{recruiterLeadId}")
    public ResponseEntity<RecruiterLead> update(@PathVariable Long recruiterLeadId, @RequestBody UpdateRecruiterLeadRequest req) {
        guard.requireRecruiterLead(principal(), recruiterLeadId);
        return ResponseEntity.ok(recruiterLeadService.updateDetails(recruiterLeadId, req.name, req.designation, req.email, req.phone, req.companyName, req.source, req.sourceSent));
    }

    @GetMapping("/check")
    public ResponseEntity<RecruiterLead> check(@RequestParam String emailOrPhone) {
        RecruiterLead existing = recruiterLeadService.findExisting(principal().getCollegeId(), emailOrPhone);
        return existing == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(existing);
    }

    public static class ActivityRequest {
        public String type;
        public String outcome;
        public String note;
    }

    /** What a TPO can log by hand. SYSTEM is written by the app; WhatsApp is not offered (no permission to use it yet). */
    static final java.util.Set<String> LOGGABLE_ACTIVITY = java.util.Set.of("CALL", "EMAIL", "MEETING", "NOTE");

    @PostMapping("/{recruiterLeadId}/activity")
    public ResponseEntity<RecruiterLeadActivity> logActivity(@PathVariable Long recruiterLeadId, @RequestBody ActivityRequest req) {
        guard.requireRecruiterLead(principal(), recruiterLeadId);
        if (req == null || req.type == null || !LOGGABLE_ACTIVITY.contains(req.type.trim().toUpperCase())) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "Log a call, email, meeting or note");
        }
        req.type = req.type.trim().toUpperCase();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(recruiterLeadService.logActivity(recruiterLeadId, req.type, req.outcome, req.note, principal().getId()));
    }

    public static class FollowUpRequest {
        public LocalDateTime dueAt;
        public String note;
    }

    @PostMapping("/{recruiterLeadId}/follow-ups")
    public ResponseEntity<FollowUp> addFollowUp(@PathVariable Long recruiterLeadId, @RequestBody FollowUpRequest req) {
        guard.requireRecruiterLead(principal(), recruiterLeadId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(recruiterLeadService.addFollowUp(recruiterLeadId, req.dueAt, principal().getId(), req.note));
    }

    @PostMapping("/follow-ups/{followUpId}/done")
    public ResponseEntity<Void> markDone(@PathVariable Long followUpId) {
        guard.requireFollowUp(principal(), followUpId);
        recruiterLeadService.markFollowUpDone(followUpId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/follow-ups/{followUpId}/move")
    public ResponseEntity<FollowUp> move(@PathVariable Long followUpId, @RequestBody FollowUpRequest req) {
        guard.requireFollowUp(principal(), followUpId);
        if (req.dueAt == null) throw new IllegalArgumentException("Choose a date");
        return ResponseEntity.ok(recruiterLeadService.moveFollowUp(followUpId, req.dueAt));
    }

    @GetMapping("/follow-ups/due")
    public ResponseEntity<List<FollowUp>> due() {
        return ResponseEntity.ok(recruiterLeadService.dueFollowUps(LocalDateTime.now(), principal().getCollegeId()));
    }

    public static class NotNowRequest {
        public String reason;
        public LocalDate revisitDate;
    }

    @PostMapping("/{recruiterLeadId}/not-now")
    public ResponseEntity<Void> notNow(@PathVariable Long recruiterLeadId, @RequestBody NotNowRequest req) {
        guard.requireRecruiterLead(principal(), recruiterLeadId);
        recruiterLeadService.markNotNow(recruiterLeadId, req.reason, req.revisitDate);
        return ResponseEntity.noContent().build();
    }

    public static class InviteRequest { public boolean sendEmail; public String note; }

    @PostMapping("/{recruiterLeadId}/invite")
    public ResponseEntity<Map<String, Object>> invite(@PathVariable Long recruiterLeadId, @RequestBody(required = false) InviteRequest body, javax.servlet.http.HttpServletRequest http) {
        guard.requireRecruiterLead(principal(), recruiterLeadId);
        // The email's link points at the site the TPO is on; CORS already limits Origin to our own sites.
        return ResponseEntity.ok(recruiterLeadService.invite(recruiterLeadId, body != null && body.sendEmail, body == null ? null : body.note, http.getHeader("Origin")));
    }
}
