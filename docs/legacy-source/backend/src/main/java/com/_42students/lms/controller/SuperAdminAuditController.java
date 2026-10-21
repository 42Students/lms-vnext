package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.model.AdminAuditLog;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AdminAuditLogService;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/v1/superadmin/audit")
@lombok.extern.slf4j.Slf4j
public class SuperAdminAuditController {

    private final AccessControlService accessControlService;
    private final SecurityContextUtil securityContextUtil;
    private final AdminAuditLogService audit;
    private final ScopeResolutionService scopeResolutionService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.repository.FacultyRepository facultyRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.repository.LearnerRepository learnerRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.service.AuditTargetNameResolver targetNameResolver;

    /**
     * Part B, "Audit log: human-readable actor names". Rows only store actorUserId/actorUserType,
     * so the screen rendered every entry as "FACULTY:41". Resolves the distinct actor ids on the
     * current page in two batched queries (one per user type) rather than one per row, and returns
     * a {"FACULTY:41": "Asha Rao"} lookup the client renders against. Falls back to the stored
     * contact mobile, then to the raw key, so an actor whose account was since deleted still shows
     * something identifiable rather than a blank.
     */
    private Map<String, String> resolveActorNames(java.util.List<AdminAuditLog> rows) {
        Map<String, String> out = new java.util.HashMap<>();
        if (rows == null || rows.isEmpty()) return out;

        java.util.Set<Integer> facultyIds = new java.util.HashSet<>();
        java.util.Set<Integer> learnerIds = new java.util.HashSet<>();
        for (AdminAuditLog row : rows) {
            if (row.getActorUserId() == null) continue;
            String type = row.getActorUserType() != null ? row.getActorUserType().toUpperCase() : "";
            if ("LEARNER".equals(type)) learnerIds.add(row.getActorUserId());
            else facultyIds.add(row.getActorUserId()); // FACULTY, ADMIN and superadmin all live in faculty
        }

        try {
            if (!facultyIds.isEmpty() && facultyRepository != null) {
                for (com._42students.lms.model.Faculty f : facultyRepository.findAllById(facultyIds)) {
                    out.put("FACULTY:" + f.getId(), displayName(f.getFirstName(), f.getLastName(), f.getContactMobile(), f.getId()));
                }
            }
            if (!learnerIds.isEmpty() && learnerRepository != null) {
                for (com._42students.lms.model.Learner l : learnerRepository.findAllById(learnerIds)) {
                    out.put("LEARNER:" + l.getId(), displayName(l.getFirstName(), l.getLastName(), l.getContactMobile(), l.getId()));
                }
            }
        } catch (Exception e) {
            // A name lookup must never break the audit trail itself.
            log.warn("Audit actor-name resolution failed: {}", e.getMessage());
        }

        // Fill any actor the lookups couldn't resolve from what the row itself already carries.
        for (AdminAuditLog row : rows) {
            if (row.getActorUserId() == null) continue;
            String type = row.getActorUserType() != null ? row.getActorUserType().toUpperCase() : "";
            String key = ("LEARNER".equals(type) ? "LEARNER:" : "FACULTY:") + row.getActorUserId();
            if (!out.containsKey(key)) {
                out.put(key, row.getActorContactMobile() != null && !row.getActorContactMobile().isBlank()
                        ? row.getActorContactMobile()
                        : key);
            }
        }
        return out;
    }

    private String displayName(String first, String last, String mobile, Integer id) {
        String name = ((first != null ? first : "") + " " + (last != null ? last : "")).trim();
        if (!name.isEmpty()) return name;
        if (mobile != null && !mobile.isBlank()) return mobile;
        return "#" + id;
    }

    public SuperAdminAuditController(AccessControlService accessControlService,
                                     SecurityContextUtil securityContextUtil,
                                     AdminAuditLogService audit,
                                     ScopeResolutionService scopeResolutionService) {
        this.accessControlService = accessControlService;
        this.securityContextUtil = securityContextUtil;
        this.audit = audit;
        this.scopeResolutionService = scopeResolutionService;
    }

    @GetMapping
    public ResponseEntity<?> search(@RequestParam(required = false) String actionKey,
                                    @RequestParam(required = false) Integer actorUserId,
                                    @RequestParam(required = false) Integer organizationId,
                                    @RequestParam(required = false) Integer collegeId,
                                    @RequestParam(required = false) String entityId,
                                    @RequestParam(required = false) String entityType,
                                    // Activity-centre category (important / setup / people / teaching /
                                    // projects). When given, actionKey / entityId / entityType are ignored.
                                    @RequestParam(required = false) String category,
                                    // Part B "Audit log: filter by date range". The service already
                                    // had a `since` parameter; this endpoint passed null for it and
                                    // there was no upper bound at all, so neither was reachable.
                                    @RequestParam(required = false)
                                    @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME)
                                    java.time.LocalDateTime since,
                                    @RequestParam(required = false)
                                    @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME)
                                    java.time.LocalDateTime until,
                                    @RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "25") int size) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        boolean isSuperAdmin = accessControlService.isSuperAdmin(principal);
        // Was superadmin-only before (requireSuperAdmin, hard-rejecting any regular college
        // admin) — this endpoint is now also reachable by a plain college admin (FACULTY,
        // facultyType=ADMIN), but ONLY for their own college; effectiveCollegeId below is forced
        // from the principal's own JWT claim for that case, never trusting a client-supplied
        // collegeId, so a college admin can't broaden the search past their own tenant.
        if (!isSuperAdmin) {
            if (principal == null || !"FACULTY".equalsIgnoreCase(principal.getUserType())
                    || !"ADMIN".equalsIgnoreCase(principal.getFacultyType())) {
                throw new org.springframework.security.access.AccessDeniedException("Admin access required");
            }
            if (principal.getCollegeId() == null) {
                throw new org.springframework.security.access.AccessDeniedException("Admin is not assigned to a college");
            }
        }

        Integer effectiveOrgId = organizationId;
        Integer effectiveCollegeId = collegeId;

        if (!isSuperAdmin) {
            effectiveCollegeId = principal.getCollegeId();
            effectiveOrgId = principal.getOrganizationId();
        } else if (principal != null && principal.getCollegeId() != null) {
            effectiveCollegeId = principal.getCollegeId();
            effectiveOrgId = principal.getOrganizationId();
        } else if (principal != null && principal.getOrganizationId() != null) {
            effectiveOrgId = principal.getOrganizationId();
            if (effectiveCollegeId != null) {
                Integer resolvedOrgId = scopeResolutionService.resolveCollegeToOrganizationId(effectiveCollegeId);
                if (resolvedOrgId != null && !Objects.equals(resolvedOrgId, effectiveOrgId)) {
                    throw new org.springframework.security.access.AccessDeniedException("Superadmin is org-scoped and cannot access other organizations");
                }
            }
        } else {
            // Global superadmin only: allow unscoped searches.
            // (UI should still prefer college-scoped searches to avoid noise.)
        }

        // If caller explicitly provides organizationId, ensure it matches the derived effective org scope.
        if (principal != null && principal.getOrganizationId() != null && organizationId != null && !Objects.equals(organizationId, effectiveOrgId)) {
            throw new org.springframework.security.access.AccessDeniedException("Superadmin is scoped and cannot query other organizations");
        }
        // If caller explicitly provides collegeId under an org-scoped principal, ensure it's within org.
        if (principal != null && principal.getOrganizationId() != null && principal.getCollegeId() == null && collegeId != null) {
            Integer resolvedOrgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
            if (resolvedOrgId != null && !Objects.equals(resolvedOrgId, principal.getOrganizationId())) {
                throw new org.springframework.security.access.AccessDeniedException("Superadmin is org-scoped and cannot access other organizations");
            }
        }

        Page<AdminAuditLog> p;
        if (category != null && !category.isBlank()) {
            if (!AdminAuditLogService.CATEGORIES.contains(category)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Unknown activity category: " + category));
            }
            p = audit.searchByCategory(category, actorUserId, effectiveOrgId, effectiveCollegeId, since, until, page, size);
        } else {
            p = audit.search(actionKey, actorUserId, effectiveOrgId, effectiveCollegeId, entityId, entityType, since, until, page, size);
        }
        return ResponseEntity.ok(Map.of(
                "items", p.getContent(),
                "page", p.getNumber(),
                "size", p.getSize(),
                "total", p.getTotalElements(),
                // Part B "Audit log: human-readable actor names". Every row rendered as
                // "FACULTY:41" because only the id was stored. Resolved here in one batched pass
                // per page rather than per row, and returned alongside the rows so the client
                // doesn't need a second lookup.
                "actorNames", resolveActorNames(p.getContent()),
                // What each row is about ("learner:152" -> "Meghana Reddy"); most rows store only an id.
                "targetNames", targetNameResolver != null ? targetNameResolver.resolve(p.getContent()) : Map.of()
        ));
    }
}

