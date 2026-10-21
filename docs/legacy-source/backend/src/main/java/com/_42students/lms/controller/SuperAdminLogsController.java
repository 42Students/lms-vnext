package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.GcpLogDetailRequest;
import com._42students.lms.dto.request.GcpLogExportRequest;
import com._42students.lms.dto.request.GcpLogQueryRequest;
import com._42students.lms.dto.request.LogContextRequest;
import com._42students.lms.dto.request.LogMuteRequest;
import com._42students.lms.dto.request.LogStatusRequest;
import com._42students.lms.service.impl.LogContextService;
import com._42students.lms.service.impl.LogDigestService;
import org.springframework.beans.factory.annotation.Autowired;
import com._42students.lms.dto.response.GcpLogEntryResponse;
import com._42students.lms.dto.response.GcpLogSearchResponse;
import com._42students.lms.dto.response.LogAlertStatusResponse;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.GcpCloudLoggingService;
import com._42students.lms.service.impl.LogAlertAdminService;
import com._42students.lms.util.SecurityContextUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/v1/superadmin/logs")
public class SuperAdminLogsController {
    private final GcpCloudLoggingService loggingService;
    private final SecurityContextUtil securityContextUtil;
    private final AccessControlService accessControlService;
    private final LogAlertAdminService logAlertAdminService;
    private final ObjectMapper objectMapper;

    @Autowired private LogContextService logContextService;
    @Autowired private LogDigestService logDigestService;

    public SuperAdminLogsController(GcpCloudLoggingService loggingService,
                                    SecurityContextUtil securityContextUtil,
                                    AccessControlService accessControlService,
                                    LogAlertAdminService logAlertAdminService,
                                    ObjectMapper objectMapper) {
        this.loggingService = loggingService;
        this.securityContextUtil = securityContextUtil;
        this.accessControlService = accessControlService;
        this.logAlertAdminService = logAlertAdminService;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/query")
    public ResponseEntity<GcpLogSearchResponse> query(@RequestBody(required = false) GcpLogQueryRequest request) {
        requireSuperAdmin();
        return noStore(loggingService.search(request));
    }

    @PostMapping("/detail")
    public ResponseEntity<GcpLogEntryResponse> detail(@Valid @RequestBody GcpLogDetailRequest request) {
        requireSuperAdmin();
        return noStore(loggingService.detail(request));
    }

    /** "What's new since I last looked" state, persisted server-side, plus a deploy-time proxy. */
    @GetMapping("/status")
    public ResponseEntity<LogAlertStatusResponse> status() {
        requireSuperAdmin();
        return noStore(LogAlertStatusResponse.builder()
                .lastViewedAt(logAlertAdminService.getLastViewedAt())
                .backendStartedAt(logAlertAdminService.getBackendStartedAt())
                .build());
    }

    /** Called once the admin has actually seen the current entries -- resets the "what's new" marker. */
    @PostMapping("/mark-viewed")
    public ResponseEntity<Void> markViewed() {
        requireSuperAdmin();
        logAlertAdminService.markViewedNow();
        return noStore(null);
    }

    /** Sends a canned Telegram message so the alerting pipeline can be verified without waiting for a real error. */
    @PostMapping("/test-alert")
    public ResponseEntity<?> testAlert() {
        requireSuperAdmin();
        LogAlertAdminService.TestAlertResult result = logAlertAdminService.sendTestAlert();
        return noStore(java.util.Map.of("configured", result.configured, "delivered", result.delivered));
    }

    /** Every tracked error signature for an environment -- the "known errors" list, with blast radius where known. */
    @GetMapping("/known-errors")
    public ResponseEntity<?> knownErrors(@RequestParam(defaultValue = "PRODUCTION") String environment) {
        requireSuperAdmin();
        return noStore(logAlertAdminService.listKnownErrors(environment));
    }

    /** Mutes (or unmutes) the error signature a given message/path normalizes to, for a known-noise entry. */
    @PostMapping("/mute")
    public ResponseEntity<?> mute(@RequestBody LogMuteRequest request) {
        requireSuperAdmin();
        if (request == null || request.getEnvironment() == null) {
            return ResponseEntity.badRequest().body("environment is required");
        }
        boolean found = logAlertAdminService.setMuted(
                request.getEnvironment(), request.getMessage(), request.getHttpPath(), request.isMuted());
        return found ? noStore(null) : ResponseEntity.status(404).build();
    }

    /**
     * Downloads every log entry matching the given filters across an explicit time range as
     * newline-delimited JSON (one entry per line) -- unlike /query, which only ever looks back a
     * fixed preset duration from "now" for the live view. Bounded server-side (see
     * GcpCloudLoggingService#export); a final line with "_meta": true reports whether the range
     * had more entries than the cap, so a truncated download is never silently incomplete.
     */
    @PostMapping("/export")
    public ResponseEntity<byte[]> export(@RequestBody GcpLogExportRequest request) {
        requireSuperAdmin();
        GcpCloudLoggingService.ExportResult result = loggingService.export(request);

        StringBuilder body = new StringBuilder();
        for (GcpLogEntryResponse entry : result.entries) {
            appendJsonLine(body, entry);
        }
        appendJsonLine(body, java.util.Map.of(
                "_meta", true,
                "environment", result.environment,
                "since", result.since.toString(),
                "until", result.until.toString(),
                "count", result.entries.size(),
                "truncated", result.truncated));

        byte[] bytes = body.toString().getBytes(StandardCharsets.UTF_8);
        String filename = "lms-logs_" + result.environment + "_"
                + DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'").format(result.since.atZone(java.time.ZoneOffset.UTC))
                + "_to_"
                + DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'").format(result.until.atZone(java.time.ZoneOffset.UTC))
                + ".ndjson";

        HttpHeaders headers = new HttpHeaders();
        headers.setCacheControl(CacheControl.noStore());
        headers.setContentDisposition(
                org.springframework.http.ContentDisposition.attachment().filename(filename, StandardCharsets.UTF_8).build());
        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("application/x-ndjson"))
                .body(bytes);
    }

    private void appendJsonLine(StringBuilder body, Object value) {
        try {
            body.append(objectMapper.writeValueAsString(value)).append('\n');
        } catch (Exception e) {
            body.append("{\"_meta\":true,\"error\":\"a log line could not be serialized\"}\n");
        }
    }

    /** Mutes (or unmutes) a known-errors row directly by signature id -- see LogAlertAdminService#setMutedById. */
    @PostMapping("/known-errors/{id}/mute")
    public ResponseEntity<?> muteById(@PathVariable Long id, @RequestBody java.util.Map<String, Object> body) {
        requireSuperAdmin();
        boolean muted = body != null && Boolean.TRUE.equals(body.get("muted"));
        Object reason = body == null ? null : body.get("reason");
        boolean found = logAlertAdminService.setMutedById(id, muted, reason == null ? null : String.valueOf(reason));
        return found ? noStore(null) : ResponseEntity.status(404).build();
    }

    /** Records the triage decision for a tracked error: open, fixed in a commit, or expected. */
    @PostMapping("/known-errors/{id}/status")
    public ResponseEntity<?> setStatus(@PathVariable Long id, @RequestBody LogStatusRequest request) {
        requireSuperAdmin();
        if (request == null) return ResponseEntity.badRequest().body("status is required");
        try {
            var updated = logAlertAdminService.setStatus(
                    id, request.getStatus(), request.getCommit(), request.getNote(), request.getIssuePublicId());
            return updated.isPresent() ? noStore(updated.get()) : ResponseEntity.status(404).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** Links a tracker issue to a tracked error; leaves its status untouched. */
    @PostMapping("/known-errors/{id}/issue")
    public ResponseEntity<?> linkIssue(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        requireSuperAdmin();
        var updated = logAlertAdminService.linkIssue(id, body == null ? null : body.get("issuePublicId"));
        return updated.isPresent() ? noStore(updated.get()) : ResponseEntity.status(404).build();
    }

    /** Names, class and college for the ids that appear on log lines. */
    @PostMapping("/context")
    public ResponseEntity<?> context(@RequestBody(required = false) LogContextRequest request) {
        requireSuperAdmin();
        return noStore(logContextService.resolve(request));
    }

    /** Rollouts in the last N days, read from the startup lines each pod writes. */
    @GetMapping("/deploys")
    public ResponseEntity<?> deploys(@RequestParam(defaultValue = "PRODUCTION") String environment,
                                     @RequestParam(defaultValue = "7") int days) {
        requireSuperAdmin();
        return noStore(loggingService.deployMarkers(environment, days));
    }

    /** Error volume 10 minutes before vs after a deploy. */
    @PostMapping("/deploys/health")
    public ResponseEntity<?> deployHealth(@RequestBody java.util.Map<String, String> body) {
        requireSuperAdmin();
        String at = body == null ? null : body.get("at");
        if (at == null) return ResponseEntity.badRequest().body("at is required");
        try {
            return noStore(loggingService.deployHealth(body.get("environment"), java.time.Instant.parse(at)));
        } catch (java.time.format.DateTimeParseException e) {
            return ResponseEntity.badRequest().body("at must be an ISO-8601 instant");
        }
    }

    /** New error types and regressions over the last N hours (default 24). */
    @GetMapping("/digest")
    public ResponseEntity<?> digest(@RequestParam(defaultValue = "24") int hours) {
        requireSuperAdmin();
        int bounded = Math.min(24 * 14, Math.max(1, hours));
        return noStore(logDigestService.build(java.time.Duration.ofHours(bounded)));
    }

    /** Sends the digest to Telegram right now. */
    @PostMapping("/digest/send")
    public ResponseEntity<?> sendDigest() {
        requireSuperAdmin();
        return noStore(java.util.Map.of("delivered", logDigestService.sendNow()));
    }

    private void requireSuperAdmin() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (!accessControlService.isSuperAdmin(principal)) {
            throw new AccessDeniedException("Super Admin access required");
        }
    }

    private <T> ResponseEntity<T> noStore(T body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setCacheControl(CacheControl.noStore());
        headers.setPragma("no-cache");
        return ResponseEntity.ok().headers(headers).body(body);
    }
}
