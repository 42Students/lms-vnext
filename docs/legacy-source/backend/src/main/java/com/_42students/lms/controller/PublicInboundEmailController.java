package com._42students.lms.controller;

import com._42students.lms.service.tpo.InboundReplyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Where the Cloudflare Email Worker posts a recruiter's reply to our email (13 Oct 2026), under /api/v1/public/**. Only the worker
 * knows INBOUND_EMAIL_SECRET; anything without it gets 404 as if this did not exist.
 */
@RestController
@RequestMapping("/api/v1/public/inbound-email")
public class PublicInboundEmailController {

    private final InboundReplyService inbound;

    public PublicInboundEmailController(InboundReplyService inbound) {
        this.inbound = inbound;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> receive(@RequestHeader(value = "X-Inbound-Secret", required = false) String secret,
                                                       @RequestBody InboundReplyService.Inbound email) {
        if (!inbound.acceptsSecret(secret)) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        return ResponseEntity.ok(Map.of("status", inbound.receive(email)));
    }
}
