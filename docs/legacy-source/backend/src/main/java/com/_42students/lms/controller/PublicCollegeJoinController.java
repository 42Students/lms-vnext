package com._42students.lms.controller;

import com._42students.lms.security.RateLimitingService;
import com._42students.lms.service.tpo.CollegePublicLinkService;
import com._42students.lms.service.tpo.CompanyJoinService.JoinProblem;
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
 * The public side of a college's public link for recruiters (phase 2, N5 a), under /api/v1/public/**. GET previews (and counts
 * an open); send-code proves the business email; join creates or finds the account and gives it this college. A dead link is a quiet 404.
 */
@RestController
@RequestMapping("/api/v1/public/college-join")
public class PublicCollegeJoinController {

    /** Per visitor, per hour: codes cost an email each, and a join tries a code (audit 13 Oct 2026, L3). */
    static final int CODES_PER_IP_PER_HOUR = 20;
    static final int JOINS_PER_IP_PER_HOUR = 30;

    private final CollegePublicLinkService links;
    private final RateLimitingService rateLimits;

    public PublicCollegeJoinController(CollegePublicLinkService links, RateLimitingService rateLimits) {
        this.links = links;
        this.rateLimits = rateLimits;
    }

    private void limit(String what, int max, javax.servlet.http.HttpServletRequest http) {
        String key = "collegeJoin:" + what + ":" + RateLimitingService.getClientIp(http);
        if (rateLimits.isRateLimited(key, max, 3600)) throw new JoinProblem("TOO_MANY_TRIES", "Too many tries from this network. Please try again in an hour.");
        rateLimits.recordAttempt(key, max, 3600);
    }

    public static class SendCodeRequest {
        public String email;
    }

    @GetMapping("/{token}")
    public ResponseEntity<Map<String, Object>> preview(@PathVariable String token) {
        return ResponseEntity.ok(links.preview(token));
    }

    @PostMapping("/{token}/send-code")
    public ResponseEntity<Map<String, Object>> sendCode(@PathVariable String token, @RequestBody(required = false) SendCodeRequest body,
                                                        javax.servlet.http.HttpServletRequest http) {
        limit("code", CODES_PER_IP_PER_HOUR, http);
        return ResponseEntity.ok(links.sendCode(token, body == null ? null : body.email));
    }

    @PostMapping("/{token}/join")
    public ResponseEntity<Map<String, Object>> join(@PathVariable String token, @RequestBody CollegePublicLinkService.JoinInput body,
                                                    javax.servlet.http.HttpServletRequest http) {
        limit("join", JOINS_PER_IP_PER_HOUR, http);
        return ResponseEntity.ok(links.join(token, body));
    }

    @ExceptionHandler(JoinProblem.class)
    public ResponseEntity<Map<String, String>> problem(JoinProblem e) {
        if ("LINK_INVALID".equals(e.getCode())) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "LINK_INVALID"));
        return ResponseEntity.badRequest().body(Map.of("error", e.getCode(), "message", e.getMessage()));
    }
}
