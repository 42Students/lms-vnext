package com._42students.lms.auditfindings;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** /tracker/audit-findings: super admins only, like the logs page. Findings can hold security details: never cached. */
@RestController
@RequestMapping("/api/v1/superadmin/audit-findings")
public class SuperAdminAuditFindingsController {

    private final AuditFindingService findings;
    private final AuditFindingSyncService sync;
    private final SecurityContextUtil securityContextUtil;
    private final AccessControlService accessControlService;

    public SuperAdminAuditFindingsController(AuditFindingService findings, AuditFindingSyncService sync,
                                             SecurityContextUtil securityContextUtil, AccessControlService accessControlService) {
        this.findings = findings;
        this.sync = sync;
        this.securityContextUtil = securityContextUtil;
        this.accessControlService = accessControlService;
    }

    public record StatusChange(String status, String note, String duplicateOf) {}
    public record SeverityChange(String severity, String note) {}
    public record AssigneeChange(String assignee) {}
    public record Comment(String note) {}
    public record CommitLink(String repo, String sha) {}

    @GetMapping
    public ResponseEntity<Map<String, Object>> list(@RequestParam(required = false) String status,
                                                    @RequestParam(required = false) String severity,
                                                    @RequestParam(required = false) String area,
                                                    @RequestParam(required = false) String kind,
                                                    @RequestParam(required = false) String q,
                                                    @RequestParam(required = false) String view,
                                                    @RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "50") int size) {
        actor();
        return noStore(findings.list(new AuditFindingService.Filter(status, severity, area, kind, q, view, page, size)));
    }

    @GetMapping("/sync")
    public ResponseEntity<Map<String, Object>> syncStatus() {
        actor();
        return noStore(sync.status());
    }

    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> syncNow() {
        actor();
        AuditFindingSyncService.SyncResult r = sync.sync();
        Map<String, Object> out = new java.util.LinkedHashMap<>(sync.status());
        out.put("ran", r.ran());
        out.put("message", r.message());
        return noStore(out);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> detail(@PathVariable String id) {
        actor();
        return noStore(findings.detail(id));
    }

    @PostMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> status(@PathVariable String id, @RequestBody StatusChange body) {
        return noStore(findings.setStatus(id, body.status(), body.note(), body.duplicateOf(), actor()));
    }

    @PostMapping("/{id}/severity")
    public ResponseEntity<Map<String, Object>> severity(@PathVariable String id, @RequestBody SeverityChange body) {
        return noStore(findings.setSeverity(id, body.severity(), body.note(), actor()));
    }

    @PostMapping("/{id}/assignee")
    public ResponseEntity<Map<String, Object>> assignee(@PathVariable String id, @RequestBody AssigneeChange body) {
        return noStore(findings.setAssignee(id, body.assignee(), actor()));
    }

    @PostMapping("/{id}/comment")
    public ResponseEntity<Map<String, Object>> comment(@PathVariable String id, @RequestBody Comment body) {
        return noStore(findings.comment(id, body.note(), actor()));
    }

    @PostMapping("/{id}/commit")
    public ResponseEntity<Map<String, Object>> commit(@PathVariable String id, @RequestBody CommitLink body) {
        return noStore(findings.addCommit(id, body.repo(), body.sha(), actor()));
    }

    /** The super admin acting: who the history records. */
    private String actor() {
        UserPrincipal p = securityContextUtil.getAuthenticatedUserPrincipal();
        if (!accessControlService.isSuperAdmin(p)) throw new AccessDeniedException("Super Admin access required");
        return p.getImpersonatorId() != null ? "super admin (impersonating)" : "super admin";
    }

    private static <T> ResponseEntity<T> noStore(T body) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(body);
    }
}
