package com._42students.lms.controller;

import com._42students.lms.service.tpo.RecruiterInviteService;
import com._42students.lms.service.tpo.RecruiterInviteService.AcceptInput;
import com._42students.lms.service.tpo.RecruiterInviteService.InviteInvalid;
import com._42students.lms.service.tpo.RecruiterInviteService.InviteRejected;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * The public, unauthenticated side of a TPO's recruiter invite link (under /api/v1/public/**, which the
 * security config and the recruiter fence both allow). GET only previews; POST .../accept spends the link.
 * Every unusable link answers the same 404 so the endpoint reveals nothing about which recruiter leads exist.
 * Handled locally so a bad link is a quiet 404, not an unhandled-exception alert.
 */
@RestController
@RequestMapping("/api/v1/public/recruiter-invite")
public class PublicRecruiterInviteController {

    private final RecruiterInviteService inviteService;

    public PublicRecruiterInviteController(RecruiterInviteService inviteService) {
        this.inviteService = inviteService;
    }

    @GetMapping("/{token}")
    public ResponseEntity<Map<String, Object>> preview(@PathVariable String token) {
        return ResponseEntity.ok(inviteService.preview(token));
    }

    public static class SendCodeRequest {
        public String email;
    }

    /** Emails the code that proves the work address; accept needs it (recruiter phase 1, step 4). */
    @PostMapping("/{token}/send-code")
    public ResponseEntity<Map<String, Object>> sendCode(@PathVariable String token, @RequestBody(required = false) SendCodeRequest body) {
        return ResponseEntity.ok(inviteService.sendCode(token, body == null ? null : body.email));
    }

    @PostMapping("/{token}/accept")
    public ResponseEntity<Map<String, Object>> accept(@PathVariable String token, @RequestBody AcceptInput body) {
        return ResponseEntity.ok(inviteService.accept(token, body));
    }

    @PostMapping("/{token}/not-hiring")
    public ResponseEntity<Map<String, Object>> notHiring(@PathVariable String token) {
        inviteService.notHiring(token);
        return ResponseEntity.ok(Map.of("status", "NOT_HIRING"));
    }

    @PostMapping("/{token}/unsubscribe")
    public ResponseEntity<Map<String, Object>> unsubscribe(@PathVariable String token) {
        inviteService.unsubscribe(token);
        return ResponseEntity.ok(Map.of("status", "UNSUBSCRIBED"));
    }

    @ExceptionHandler(InviteInvalid.class)
    public ResponseEntity<Map<String, String>> invalid(InviteInvalid e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "INVITE_INVALID"));
    }

    @ExceptionHandler(InviteRejected.class)
    public ResponseEntity<Map<String, String>> rejected(InviteRejected e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getCode(), "message", e.getMessage()));
    }
}
