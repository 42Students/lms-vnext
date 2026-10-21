package com._42students.lms.controller;

import com._42students.lms.service.tpo.CompanyJoinService;
import com._42students.lms.service.tpo.CompanyJoinService.JoinInput;
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
 * The public side of a college's company join link (recruiter phase 1, N5 b), under /api/v1/public/**. GET previews (and counts
 * an open); send-code proves the work email; join creates or finds the account and gives it this college. A dead link is a quiet 404.
 */
@RestController
@RequestMapping("/api/v1/public/company-join")
public class PublicCompanyJoinController {

    private final CompanyJoinService joinService;

    public PublicCompanyJoinController(CompanyJoinService joinService) {
        this.joinService = joinService;
    }

    @GetMapping("/{token}")
    public ResponseEntity<Map<String, Object>> preview(@PathVariable String token) {
        return ResponseEntity.ok(joinService.preview(token));
    }

    public static class SendCodeRequest {
        public String email;
    }

    @PostMapping("/{token}/send-code")
    public ResponseEntity<Map<String, Object>> sendCode(@PathVariable String token, @RequestBody(required = false) SendCodeRequest body) {
        return ResponseEntity.ok(joinService.sendCode(token, body == null ? null : body.email));
    }

    @PostMapping("/{token}/join")
    public ResponseEntity<Map<String, Object>> join(@PathVariable String token, @RequestBody JoinInput body) {
        return ResponseEntity.ok(joinService.join(token, body));
    }

    @ExceptionHandler(JoinProblem.class)
    public ResponseEntity<Map<String, String>> problem(JoinProblem e) {
        if ("LINK_INVALID".equals(e.getCode())) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "LINK_INVALID"));
        return ResponseEntity.badRequest().body(Map.of("error", e.getCode(), "message", e.getMessage()));
    }
}
