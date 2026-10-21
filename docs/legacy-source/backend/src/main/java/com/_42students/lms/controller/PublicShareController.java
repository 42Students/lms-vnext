package com._42students.lms.controller;

import com._42students.lms.service.tpo.TpoShareService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * The company's side of "Share with company" (TPO V1 - Locked.docx §5). No login: the link plus the one-time code is the
 * credential. Every unusable link (unknown, expired, revoked, wrong code) answers the same 404 so nothing leaks.
 */
@RestController
@RequestMapping("/api/v1/public/share")
@RequiredArgsConstructor
public class PublicShareController {

    private final TpoShareService share;

    private static ResponseEntity<Map<String, String>> invalid() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("code", "SHARE_INVALID", "message", "This link is not valid any more."));
    }

    @GetMapping("/{token}")
    public ResponseEntity<?> info(@PathVariable String token) {
        try { return ResponseEntity.ok(share.publicInfo(token)); } catch (IllegalArgumentException e) { return invalid(); }
    }

    @PostMapping("/{token}/open")
    public ResponseEntity<?> open(@PathVariable String token, @RequestBody Map<String, String> body) {
        try { return ResponseEntity.ok(share.publicOpen(token, body.get("code"))); } catch (IllegalArgumentException e) { return invalid(); }
    }

    @PostMapping("/{token}/send-code")
    public ResponseEntity<?> sendCode(@PathVariable String token) {
        try { return ResponseEntity.ok(Map.of("status", share.sendCode(token))); } catch (IllegalArgumentException e) { return invalid(); }
    }

    /** All shared resumes as a ZIP (ROLL_Name.pdf). The code travels in the body so it never lands in a URL or a log. */
    @PostMapping("/{token}/resumes")
    public ResponseEntity<?> resumes(@PathVariable String token, @RequestBody Map<String, String> body) {
        try {
            java.io.ByteArrayOutputStream buf = new java.io.ByteArrayOutputStream();
            share.writeResumeZip(token, body.get("code"), buf);
            return ResponseEntity.ok().header("Content-Disposition", "attachment; filename=\"resumes.zip\"").contentType(MediaType.parseMediaType("application/zip")).body(buf.toByteArray());
        } catch (IllegalArgumentException e) { return invalid(); }
        catch (java.io.IOException e) { return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("code", "ZIP_FAILED", "message", "Could not build the ZIP.")); }
    }

    @PostMapping("/{token}/downloaded")
    public ResponseEntity<?> downloaded(@PathVariable String token, @RequestBody Map<String, String> body) {
        try { share.publicLogDownload(token, body.get("code"), body.get("kind")); return ResponseEntity.ok(Map.of("ok", true)); }
        catch (IllegalArgumentException e) { return invalid(); }
    }
}
