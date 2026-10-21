package com._42students.lms.service;

import com._42students.lms.model.AdminAuditLog;
import com._42students.lms.repository.AdminAuditLogRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class AdminAuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AdminAuditLogService.class);
    private final AdminAuditLogRepository repo;
    private final SecurityContextUtil securityContextUtil;

    public AdminAuditLogService(AdminAuditLogRepository repo, SecurityContextUtil securityContextUtil) {
        this.repo = repo;
        this.securityContextUtil = securityContextUtil;
    }

    public void log(HttpServletRequest request,
                    String actionKey,
                    String entityType,
                    String entityId,
                    Integer organizationId,
                    Integer collegeId,
                    Map<String, Object> payload) {
        try {
            logRequired(request, actionKey, entityType, entityId, organizationId, collegeId, payload);
        } catch (Exception e) {
            log.error("Audit persistence failed for action={} entityType={} entityId={}",
                    actionKey, entityType, entityId, e);
        }
    }

    /** Required audit entry: propagate database errors to roll back critical transactions. */
    public void logRequired(HttpServletRequest request,
                    String actionKey,
                    String entityType,
                    String entityId,
                    Integer organizationId,
                    Integer collegeId,
                    Map<String, Object> payload) {
            UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
            AdminAuditLog a = new AdminAuditLog();
            if (principal != null) {
                a.setActorUserId(principal.getId());
                a.setActorUserType(principal.getUserType());
                if (organizationId == null) organizationId = principal.getOrganizationId();
                if (collegeId == null) collegeId = principal.getCollegeId();
            }
            a.setActionKey(actionKey);
            a.setEntityType(entityType);
            // entity_id is VARCHAR(60) (V61) — a caller passing a slugified key/title (project
            // tasks/sprints derive their key from the title with no length cap) previously
            // overflowed it. Because JPA/Hibernate defers the actual INSERT to the next flush
            // point rather than running it inside repo.save(), that failure surfaced later, on
            // an unrelated statement, as an opaque AssertionFailure outside this try/catch —
            // defeating the "never fail a request due to audit logging" contract this method
            // documents. Truncating here, and flushing immediately below so any remaining SQL
            // error is caught where it's meant to be, restores that contract.
            a.setEntityId(entityId != null && entityId.length() > 60 ? entityId.substring(0, 60) : entityId);
            a.setOrganizationId(organizationId);
            a.setCollegeId(collegeId);
            if (request != null) {
                a.setIpAddress(extractIp(request));
                String ua = request.getHeader("User-Agent");
                a.setUserAgent(ua != null && ua.length() > 512 ? ua.substring(0, 512) : ua);
            }
            a.setPayloadJson(payload != null ? payload : new HashMap<>());
            repo.saveAndFlush(a);
    }

    public Page<AdminAuditLog> search(String actionKey,
                                      Integer actorUserId,
                                      Integer organizationId,
                                      Integer collegeId,
                                      String entityId,
                                      String entityType,
                                      LocalDateTime since,
                                      LocalDateTime until,
                                      int page,
                                      int size) {
        return search(actionKey, actorUserId, organizationId, collegeId, entityId, entityType, since, until, page, size, false);
    }

    // See the comment on AdminAuditLogRepository#search — `includeGlobalTemplateEvents` is the
    // super-admin-only escape hatch that lets template-lifecycle rows (always collegeId-null)
    // through a college-scoped query. Defaults to false via the overload above so every existing
    // caller (ModuleAccessService, and this class's own call sites elsewhere) keeps its current,
    // strictly-scoped behavior unless it explicitly opts in.
    public Page<AdminAuditLog> search(String actionKey,
                                      Integer actorUserId,
                                      Integer organizationId,
                                      Integer collegeId,
                                      String entityId,
                                      String entityType,
                                      LocalDateTime since,
                                      LocalDateTime until,
                                      int page,
                                      int size,
                                      boolean includeGlobalTemplateEvents) {
        return search(actionKey, actorUserId, organizationId, collegeId, entityId, entityType, since, until, page, size, includeGlobalTemplateEvents, false);
    }

    // CAA-01: `projectDomainOnly` restricts the result to PROJECT/PROJECT_TEMPLATE/PROJECT_TASK
    // entityType rows — see the comment on AdminAuditLogRepository#search. Defaults to false via
    // the overloads above so this remains a strictly-opt-in narrowing; only
    // AdminProjectController#getAuditLog ("Project audit") passes true.
    public Page<AdminAuditLog> search(String actionKey,
                                      Integer actorUserId,
                                      Integer organizationId,
                                      Integer collegeId,
                                      String entityId,
                                      String entityType,
                                      LocalDateTime since,
                                      LocalDateTime until,
                                      int page,
                                      int size,
                                      boolean includeGlobalTemplateEvents,
                                      boolean projectDomainOnly) {
        // Daily-check views (the "Today"/"7 days" range chips) fetch a wider page than the
        // default 25 so the summary strip (action count, destructive count, distinct actors) is
        // computed from the real result set rather than just whatever fit on page 1.
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 500));
        return repo.search(actionKey, actorUserId, organizationId, collegeId, entityId, entityType, since, until, includeGlobalTemplateEvents, projectDomainOnly, pageable);
    }

    public static final java.util.Set<String> CATEGORIES = java.util.Set.of("important", "setup", "people", "teaching", "projects");

    /** Category feed (see AdminAuditLogRepository#searchByCategory); an unknown category is rejected. */
    public Page<AdminAuditLog> searchByCategory(String category, Integer actorUserId, Integer organizationId, Integer collegeId,
                                                LocalDateTime since, LocalDateTime until, int page, int size) {
        if (category == null || !CATEGORIES.contains(category)) {
            throw new IllegalArgumentException("Unknown activity category: " + category);
        }
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 500));
        return repo.searchByCategory(category, actorUserId, organizationId, collegeId, since, until, pageable);
    }

    private String extractIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.trim().isEmpty()) {
            // take first IP
            String ip = xff.split(",")[0].trim();
            if (!ip.isEmpty()) return ip;
        }
        String xrip = request.getHeader("X-Real-IP");
        if (xrip != null && !xrip.trim().isEmpty()) return xrip.trim();
        return request.getRemoteAddr();
    }
}

