package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.model.AppSetting;
import com._42students.lms.model.College;
import com._42students.lms.model.CollegeBranding;
import com._42students.lms.model.TenantDomain;
import com._42students.lms.repository.CollegeBrandingRepository;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.DepartmentRepository;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.TenantDomainRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AdminAuditLogService;
import com._42students.lms.service.AppSettingsService;
import com._42students.lms.service.ModuleFeatureCatalog;
import com._42students.lms.service.TenantDomainVerificationService;
import com._42students.lms.service.TenantResolutionService;
import com._42students.lms.util.SecurityContextUtil;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com._42students.lms.util.RequestHostUtil;
import java.util.Objects;
import java.util.regex.Pattern;
import java.util.HashMap;

/**
 * Super-admin only: manage tenant domains, branding, and global settings.
 * Keeps all onboarding/config in UI (no code changes needed for new colleges/domains).
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/superadmin/tenant")
public class TenantAdminController {

    private final AccessControlService accessControlService;
    private final SecurityContextUtil securityContextUtil;
    private final ScopeResolutionService scopeResolutionService;
    private final TenantDomainRepository tenantDomainRepository;
    private final CollegeRepository collegeRepository;
    private final CollegeBrandingRepository collegeBrandingRepository;
    private final AppSettingsService appSettingsService;
    private final TenantDomainVerificationService tenantDomainVerificationService;
    private final AdminAuditLogService audit;
    private final TenantResolutionService tenantResolutionService;
    private final DepartmentRepository departmentRepository;
    private final FacultyRepository facultyRepository;
    private final LearnerRepository learnerRepository;

    // Strict host validation (no schemes, wildcards, or paths). Accepts custom domains and subdomains.
    // - total length <= 253, labels <= 63
    // - lowercase letters, digits, hyphen, dot
    // - must contain at least one dot (prevents "college1" accidental local hostnames)
    private static final Pattern HOST_ALLOWED = Pattern.compile("^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$");

    public TenantAdminController(AccessControlService accessControlService,
                                 SecurityContextUtil securityContextUtil,
                                 ScopeResolutionService scopeResolutionService,
                                 TenantDomainRepository tenantDomainRepository,
                                 CollegeRepository collegeRepository,
                                 CollegeBrandingRepository collegeBrandingRepository,
                                 AppSettingsService appSettingsService,
                                 TenantDomainVerificationService tenantDomainVerificationService,
                                 TenantResolutionService tenantResolutionService,
                                 AdminAuditLogService audit,
                                 DepartmentRepository departmentRepository,
                                 FacultyRepository facultyRepository,
                                 LearnerRepository learnerRepository) {
        this.accessControlService = accessControlService;
        this.securityContextUtil = securityContextUtil;
        this.scopeResolutionService = scopeResolutionService;
        this.tenantDomainRepository = tenantDomainRepository;
        this.collegeRepository = collegeRepository;
        this.collegeBrandingRepository = collegeBrandingRepository;
        this.appSettingsService = appSettingsService;
        this.tenantDomainVerificationService = tenantDomainVerificationService;
        this.tenantResolutionService = tenantResolutionService;
        this.audit = audit;
        this.departmentRepository = departmentRepository;
        this.facultyRepository = facultyRepository;
        this.learnerRepository = learnerRepository;
    }

    private UserPrincipal requireSuperAdminPrincipal() {
        UserPrincipal p = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireSuperAdmin(p);
        return p;
    }

    private boolean isGlobalSuperAdmin(UserPrincipal principal) {
        return principal != null && principal.getOrganizationId() == null && principal.getCollegeId() == null;
    }

    private void requireCollegeInScope(UserPrincipal principal, Integer collegeId) {
        if (collegeId == null || collegeId <= 0) {
            throw new IllegalArgumentException("collegeId required");
        }
        if (principal == null) return;
        if (principal.getCollegeId() != null) {
            if (!Objects.equals(principal.getCollegeId(), collegeId)) {
                throw new org.springframework.security.access.AccessDeniedException("Superadmin is college-scoped and cannot access other colleges");
            }
            return;
        }
        if (principal.getOrganizationId() != null) {
            Integer resolved = scopeResolutionService != null ? scopeResolutionService.resolveCollegeToOrganizationId(collegeId) : null;
            if (resolved != null && !Objects.equals(resolved, principal.getOrganizationId())) {
                throw new org.springframework.security.access.AccessDeniedException("Superadmin is org-scoped and cannot access other organizations");
            }
        }
    }

    private void requireOrgInScope(UserPrincipal principal, Integer orgId) {
        if (orgId == null || orgId <= 0) throw new IllegalArgumentException("orgId required");
        if (principal == null) return;
        if (principal.getCollegeId() != null) {
            throw new org.springframework.security.access.AccessDeniedException("Superadmin is college-scoped and cannot access organization settings");
        }
        if (principal.getOrganizationId() != null && !Objects.equals(principal.getOrganizationId(), orgId)) {
            throw new org.springframework.security.access.AccessDeniedException("Superadmin is org-scoped and cannot access other organizations");
        }
    }

    // ---------------- Domains ----------------

    @GetMapping("/domains")
    public ResponseEntity<?> listDomains(@RequestParam(required = false) Integer collegeId) {
        UserPrincipal principal = requireSuperAdminPrincipal();
        if (collegeId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "collegeId required"));
        }
        requireCollegeInScope(principal, collegeId);
        return ResponseEntity.ok(Map.of("domains", tenantDomainRepository.findActiveByCollegeId(collegeId)));
    }

    /**
     * Super-admin: onboarding readiness check for a single college.
     * This is designed to prevent "hidden" production issues where a college is created,
     * but domain login fails due to missing/invalid domain or branding config.
     */
    @GetMapping("/onboarding/readiness/{collegeId}")
    public ResponseEntity<?> onboardingReadiness(@PathVariable Integer collegeId) {
        UserPrincipal principal = requireSuperAdminPrincipal();
        requireCollegeInScope(principal, collegeId);

        College college = collegeRepository.findById(collegeId).orElse(null);
        if (college == null || Boolean.TRUE.equals(college.getIsDeleted())) {
            return ResponseEntity.status(404).body(Map.of("error", "College not found"));
        }

        List<TenantDomain> domains = tenantDomainRepository.findActiveByCollegeId(collegeId);
        long total = domains.stream().filter(d -> d != null && !Boolean.TRUE.equals(d.getIsDeleted())).count();
        long verified = domains.stream().filter(d -> d != null && !Boolean.TRUE.equals(d.getIsDeleted()) && Boolean.TRUE.equals(d.getIsVerified())).count();
        long primary = domains.stream().filter(d -> d != null && !Boolean.TRUE.equals(d.getIsDeleted()) && Boolean.TRUE.equals(d.getIsPrimary())).count();
        boolean hasAnyHost = domains.stream().anyMatch(d -> d != null && !Boolean.TRUE.equals(d.getIsDeleted()) && d.getHost() != null && !d.getHost().trim().isEmpty());
        boolean hasVerifiedPrimary = domains.stream().anyMatch(d -> d != null && !Boolean.TRUE.equals(d.getIsDeleted()) && Boolean.TRUE.equals(d.getIsPrimary()) && Boolean.TRUE.equals(d.getIsVerified()));

        // Branding warnings below are advisory only — a missing logo/background/color doesn't
        // block login, it just means the college's login page falls back to the default look.
        CollegeBranding branding = null;
        try {
            branding = collegeBrandingRepository.findActiveByCollegeId(collegeId).orElse(null);
        } catch (Exception ignored) {}
        String logo = branding != null ? trimOrNull(branding.getLogoUrl()) : null;

        List<String> blockers = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        List<String> recommendedActions = new ArrayList<>();

        // Domain blockers (for domain-based login)
        if (!hasAnyHost) {
            blockers.add("NO_DOMAIN");
            recommendedActions.add("Add at least one domain under Superadmin → Tenant Domains.");
        }
        if (total > 0 && primary == 0) {
            blockers.add("NO_PRIMARY_DOMAIN");
            recommendedActions.add("Mark exactly one domain as Primary for this college.");
        }
        if (primary > 1) {
            blockers.add("MULTIPLE_PRIMARY_DOMAINS");
            recommendedActions.add("Ensure only one domain is Primary (others must be non-primary).");
        }
        // BUGFIX: this used to keep its own copy of "is verification required", computed with a
        // parsing idiom (String.valueOf(possiblyNull).trim()) that silently evaluates to false
        // whenever the env var is simply unset — while TenantResolutionService.isVerifiedDomainRequired
        // (the method that actually gates whether an unverified domain can serve a real login)
        // defaulted to true for the same unset case. In the default deployment the two disagreed:
        // this checklist told a super-admin an unverified primary domain was only a
        // recommendation ("can go live"), while the real gate was silently rejecting it. Delegate
        // to the one canonical source instead of keeping a second copy that can drift out of sync.
        boolean requireVerifiedDomains = tenantResolutionService.isVerifiedDomainRequired();
        if (requireVerifiedDomains && total > 0 && !hasVerifiedPrimary) {
            blockers.add("NO_VERIFIED_PRIMARY_DOMAIN");
            recommendedActions.add("Verify the Primary domain (TXT verification) — required before this address can serve real logins.");
        } else if (total > 0 && !hasVerifiedPrimary && verified > 0) {
            warnings.add("PRIMARY_DOMAIN_NOT_VERIFIED");
            recommendedActions.add("Prefer verifying the Primary domain to avoid future verification breakages.");
        } else if (total > 0 && verified == 0) {
            warnings.add("NO_VERIFIED_DOMAIN");
            recommendedActions.add("Verify at least one domain to make switching + onboarding safer.");
        }

        // Branding warnings (does not block login, but impacts UX)
        // Login background photos are no longer used (the login page has its own design), so they are not checked.
        if (logo == null && (college.getLogo() == null || String.valueOf(college.getLogo()).trim().isEmpty())) {
            warnings.add("MISSING_LOGO");
            recommendedActions.add("Add a logo (college logo or branding logoUrl).");
        }

        // A college can be created and then abandoned — it shows up in the Colleges list looking
        // "done" (name, uniqueId, maybe even a domain) while having zero actual academic setup
        // underneath. Domain/branding checks above don't catch this at all.
        boolean hasAnyDepartment = departmentRepository != null
                && departmentRepository.fetchAllDepartments(collegeId).stream().anyMatch(d -> d != null && !Boolean.TRUE.equals(d.getIsDeleted()));
        boolean hasAnyFaculty = facultyRepository != null
                && facultyRepository.fetchContactsByCollegeId(collegeId).stream().anyMatch(f -> f != null && !Boolean.TRUE.equals(f.getIsDeleted()));
        boolean hasAnyLearner = learnerRepository != null
                && learnerRepository.findLearnersByCollegeIdIncludingViaClass(collegeId).stream().anyMatch(l -> l != null && !Boolean.TRUE.equals(l.getIsDeleted()));
        // BUGFIX: this required ALL THREE to be missing to fire (&&, not "any missing") — so a
        // college with one department created and zero faculty, zero students (still completely
        // unusable — nobody to teach, nobody to learn) never triggered it. That's the more
        // realistic "onboarding stalled partway through" case this check exists to catch, per the
        // comment above; only catching a college that is 100% untouched missed almost every real
        // case of a genuinely abandoned setup.
        if (!(hasAnyDepartment && hasAnyFaculty && hasAnyLearner)) {
            warnings.add("EMPTY_COLLEGE_NO_ACADEMIC_DATA");
            recommendedActions.add("Add departments, faculty, and students — this college is missing at least one.");
        }

        boolean readyForDomainLogin = blockers.isEmpty();
        Map<String, Object> meta = new HashMap<>();
        meta.put("collegeId", college.getId());
        meta.put("collegeName", college.getName());
        meta.put("organizationId", college.getOrgId());
        meta.put("uniqueId", college.getUniqueId());
        meta.put("domainTotal", total);
        meta.put("domainVerified", verified);
        meta.put("domainPrimary", primary);
        // Single canonical flag now (see the comment above requireVerifiedDomains) — the previous
        // "strictDomainVerificationEnabled" was a second, independently-computed flag that only
        // ever affected what this checklist said, never what TenantResolutionService actually
        // enforced at login. Removed rather than kept as a second meaning nothing reads.
        meta.put("requireVerifiedDomains", requireVerifiedDomains);

        return ResponseEntity.ok(Map.of(
                "readyForDomainLogin", readyForDomainLogin,
                "blockers", blockers,
                "warnings", warnings,
                "recommendedActions", recommendedActions,
                "meta", meta
        ));
    }

    /**
     * Super-admin: resolve preview for a given host.
     * This is a zero-network check: it validates/normalizes host and shows what tenant resolution would do.
     *
     * Useful during onboarding when DNS/ingress may be in flux but DB mapping correctness must be confirmed.
     */
    @GetMapping("/onboarding/resolve-preview")
    public ResponseEntity<?> resolvePreview(@RequestParam(required = false) String host) {
        UserPrincipal principal = requireSuperAdminPrincipal();
        if (!isGlobalSuperAdmin(principal)) {
            throw new org.springframework.security.access.AccessDeniedException("Resolve preview is only available for global superadmin");
        }
        String normalized = normalizeHost(host);
        if (normalized == null || normalized.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "host invalid"));
        }
        Optional<College> collegeOpt = tenantResolutionService != null ? tenantResolutionService.resolveCollegeFromHost(normalized) : Optional.empty();
        Integer collegeId = collegeOpt.map(College::getId).orElse(null);
        Integer orgId = collegeOpt.map(College::getOrgId).orElse(null);

        String canonicalHost = null;
        try {
            if (collegeId != null && tenantDomainRepository != null) {
                List<String> primaryHosts = tenantDomainRepository.findVerifiedPrimaryHostsByCollegeId(collegeId);
                if (primaryHosts == null || primaryHosts.isEmpty()) {
                    primaryHosts = tenantDomainRepository.findPrimaryHostsByCollegeId(collegeId);
                }
                if (primaryHosts != null && !primaryHosts.isEmpty()) {
                    canonicalHost = normalizeHost(primaryHosts.get(0));
                }
            }
        } catch (Exception ignored) {}

        boolean shouldRedirect = canonicalHost != null && !canonicalHost.equalsIgnoreCase(normalized);
        // Map.of() throws NPE on a null value — collegeId/organizationId/canonicalHost are all
        // legitimately null for the TENANT_NOT_FOUND case, which is exactly what this endpoint
        // exists to surface, so a HashMap (which tolerates null values) is required here.
        Map<String, Object> preview = new HashMap<>();
        preview.put("inputHost", host);
        preview.put("normalizedHost", normalized);
        preview.put("mode", collegeId != null ? "TENANT" : "TENANT_NOT_FOUND");
        preview.put("collegeId", collegeId);
        preview.put("organizationId", orgId);
        preview.put("canonicalHost", canonicalHost);
        preview.put("shouldRedirectToCanonicalHost", shouldRedirect);
        return ResponseEntity.ok(preview);
    }

    // ---------------- Subdomain (the one address a college has) ----------------

    /** Names that already have their own DNS records or are ours; never allotted to a college. */
    static final java.util.Set<String> RESERVED_SUBDOMAINS = java.util.Set.of(
            "www", "api", "app", "admin", "superadmin", "dev", "development", "staging", "uat", "test", "demo-api",
            "mail", "mailer", "smtp", "alerts", "status", "docs", "help", "support", "blog", "cdn", "static", "assets",
            "v2", "dgi", "emedha", "lms", "lms-backend", "login", "auth", "account", "accounts", "billing");
    private static final Pattern SUBDOMAIN_ALLOWED = Pattern.compile("^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$");

    /** The college's subdomain on our domain (e.g. kluniversity.42lms.com), or none. */
    @GetMapping("/colleges/{collegeId}/subdomain")
    public ResponseEntity<?> getSubdomain(@PathVariable Integer collegeId) {
        UserPrincipal principal = requireSuperAdminPrincipal();
        requireCollegeInScope(principal, collegeId);
        String baseDomain = appSettingsService.getTenantSubdomainBase();
        TenantDomain current = currentSubdomain(collegeId, baseDomain);
        Map<String, Object> body = new HashMap<>();
        body.put("baseDomain", baseDomain);
        body.put("host", current != null ? current.getHost() : null);
        body.put("subdomain", current != null ? current.getHost().substring(0, current.getHost().length() - baseDomain.length() - 1) : null);
        return ResponseEntity.ok(body);
    }

    /**
     * Allot (or change) a college's subdomain: one per college, live immediately (wildcard DNS and certificate).
     * Our own subdomains need no ownership check, so the row is saved verified and primary. Any custom domain the
     * college has outside our domain is left as it is.
     */
    @PutMapping("/colleges/{collegeId}/subdomain")
    @Transactional
    public ResponseEntity<?> allotSubdomain(@PathVariable Integer collegeId, @RequestBody Map<String, Object> body, HttpServletRequest httpRequest) {
        UserPrincipal principal = requireSuperAdminPrincipal();
        requireCollegeInScope(principal, collegeId);
        if (collegeRepository.findById(collegeId).isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "College not found"));
        String baseDomain = appSettingsService.getTenantSubdomainBase();
        String sub = body == null || body.get("subdomain") == null ? "" : String.valueOf(body.get("subdomain")).trim().toLowerCase(java.util.Locale.ROOT);
        if (!SUBDOMAIN_ALLOWED.matcher(sub).matches()) {
            return ResponseEntity.badRequest().body(Map.of("error", "INVALID_SUBDOMAIN",
                    "message", "Use 3 to 30 lowercase letters, numbers or hyphens, starting and ending with a letter or number."));
        }
        if (RESERVED_SUBDOMAINS.contains(sub)) {
            return ResponseEntity.status(409).body(Map.of("error", "SUBDOMAIN_RESERVED", "message", sub + " is reserved. Choose another name."));
        }
        String host = sub + "." + baseDomain;
        TenantDomain taken = tenantDomainRepository.findActiveByHost(host).orElse(null);
        if (taken != null && !Objects.equals(taken.getCollegeId(), collegeId)) {
            return ResponseEntity.status(409).body(Map.of("error", "SUBDOMAIN_TAKEN", "message", host + " is already allotted to another college."));
        }
        TenantDomain current = currentSubdomain(collegeId, baseDomain);
        if (current != null && current.getHost().equalsIgnoreCase(host)) {
            markLive(current);
            tenantDomainRepository.save(current);
            return ResponseEntity.ok(Map.of("host", host, "subdomain", sub, "baseDomain", baseDomain));
        }
        if (current != null) retireDomain(current);
        tenantDomainRepository.clearPrimaryForCollege(collegeId, null);
        TenantDomain d = new TenantDomain();
        d.setCollegeId(collegeId);
        d.setHost(host);
        d.setIsDeleted(false);
        markLive(d);
        tenantDomainRepository.save(d);
        if (audit != null) {
            Map<String, Object> details = new HashMap<>();
            details.put("host", host);
            details.put("previousHost", current != null ? current.getHost() : null);
            audit.log(httpRequest, "TENANT_SUBDOMAIN_ALLOT", "tenant_domain", host, null, collegeId, details);
        }
        return ResponseEntity.ok(Map.of("host", host, "subdomain", sub, "baseDomain", baseDomain));
    }

    @DeleteMapping("/colleges/{collegeId}/subdomain")
    @Transactional
    public ResponseEntity<?> removeSubdomain(@PathVariable Integer collegeId, HttpServletRequest httpRequest) {
        UserPrincipal principal = requireSuperAdminPrincipal();
        requireCollegeInScope(principal, collegeId);
        TenantDomain current = currentSubdomain(collegeId, appSettingsService.getTenantSubdomainBase());
        if (current == null) return ResponseEntity.ok(Map.of("ok", true));
        String host = current.getHost();
        retireDomain(current);
        if (audit != null) audit.log(httpRequest, "TENANT_SUBDOMAIN_REMOVE", "tenant_domain", host, null, collegeId, Map.of("host", host));
        return ResponseEntity.ok(Map.of("ok", true));
    }

    private TenantDomain currentSubdomain(Integer collegeId, String baseDomain) {
        String suffix = "." + baseDomain.toLowerCase(java.util.Locale.ROOT);
        return tenantDomainRepository.findActiveByCollegeId(collegeId).stream()
                .filter(d -> d.getHost() != null && d.getHost().toLowerCase(java.util.Locale.ROOT).endsWith(suffix)
                        && d.getHost().indexOf('.') == d.getHost().length() - suffix.length())
                .sorted((a, b) -> Boolean.compare(Boolean.TRUE.equals(b.getIsPrimary()), Boolean.TRUE.equals(a.getIsPrimary())))
                .findFirst().orElse(null);
    }

    private static void markLive(TenantDomain d) {
        d.setIsPrimary(true);
        d.setIsVerified(true);
        if (d.getVerifiedAt() == null) d.setVerifiedAt(java.time.LocalDateTime.now());
        d.setLastCheckResult("OWN_DOMAIN");
    }

    /** Soft-delete, freeing the host for reuse (the host column is unique across deleted rows too). */
    private void retireDomain(TenantDomain d) {
        String suffix = "~deleted~" + d.getId() + "~" + System.currentTimeMillis();
        String original = d.getHost();
        d.setHost((original.length() > 255 - suffix.length() ? original.substring(0, 255 - suffix.length()) : original) + suffix);
        d.setIsDeleted(true);
        d.setIsPrimary(false);
        tenantDomainRepository.save(d);
    }

    @PostMapping("/domains")
    @Transactional
    public ResponseEntity<?> createDomain(@Valid @RequestBody TenantDomainRequest req, HttpServletRequest httpRequest) {
        UserPrincipal principal = requireSuperAdminPrincipal();
        Integer collegeId = req.getCollegeId();
        if (collegeId == null) return ResponseEntity.badRequest().body(Map.of("error", "collegeId required"));
        requireCollegeInScope(principal, collegeId);
        College college = collegeRepository.findById(collegeId).orElse(null);
        if (college == null) return ResponseEntity.status(404).body(Map.of("error", "College not found"));

        String host = normalizeHost(req.getHost());
        if (host == null || host.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "host required"));

        if (tenantDomainRepository.findActiveByHost(host).isPresent()) {
            return ResponseEntity.status(409).body(Map.of("error", "HOST_ALREADY_EXISTS"));
        }

        // BE-0090: a new address is never verified yet, so under strict verification it can't be made the main address (the
        // college's visitors would be sent to a host that does not resolve to it). Add it, verify it, then make it main.
        if (Boolean.TRUE.equals(req.getIsPrimary()) && tenantResolutionService.isVerifiedDomainRequired()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "DOMAIN_NOT_VERIFIED",
                    "message", "Verify this address before making it the main one."));
        }
        TenantDomain d = new TenantDomain();
        d.setCollegeId(collegeId);
        d.setHost(host);
        d.setIsPrimary(Boolean.TRUE.equals(req.getIsPrimary()));
        d.setIsDeleted(false);
        if (Boolean.TRUE.equals(d.getIsPrimary())) {
            // Enforce "single primary domain per college"
            tenantDomainRepository.clearPrimaryForCollege(collegeId, null);
        }
        TenantDomain saved = tenantDomainRepository.save(d);
        if (audit != null) audit.log(httpRequest, "TENANT_DOMAIN_CREATE", "tenant_domain", String.valueOf(saved.getId()), null, collegeId, Map.of("host", host, "isPrimary", saved.getIsPrimary()));
        return ResponseEntity.ok(Map.of("domain", saved));
    }

    @PutMapping("/domains/{id}")
    @Transactional
    public ResponseEntity<?> updateDomain(@PathVariable Integer id, @Valid @RequestBody TenantDomainRequest req, HttpServletRequest httpRequest) {
        UserPrincipal principal = requireSuperAdminPrincipal();
        TenantDomain d = tenantDomainRepository.findById(id).orElse(null);
        if (d == null || Boolean.TRUE.equals(d.getIsDeleted())) return ResponseEntity.status(404).body(Map.of("error", "Not found"));
        requireCollegeInScope(principal, d.getCollegeId());

        if (req.getHost() != null) {
            String host = normalizeHost(req.getHost());
            if (host == null || host.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "host invalid"));
            Optional<TenantDomain> other = tenantDomainRepository.findActiveByHost(host);
            if (other.isPresent() && other.get().getId() != d.getId()) {
                return ResponseEntity.status(409).body(Map.of("error", "HOST_ALREADY_EXISTS"));
            }
            if (d.getHost() == null || !d.getHost().equalsIgnoreCase(host)) {
                // Host changed: verification token and status must be re-established for the new domain.
                d.setVerificationToken(null);
                d.setIsVerified(false);
                d.setVerifiedAt(null);
            }
            d.setHost(host);
        }
        // Prevent moving a domain between colleges via update.
        if (req.getCollegeId() != null && !Objects.equals(req.getCollegeId(), d.getCollegeId())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "collegeId cannot be changed"));
        }
        // BE-0090: the main address must be a verified one under strict verification: promoting an unverified address, or
        // changing the main address's host (which un-verifies it), used to move the whole college's sign-in to a dead host.
        boolean willBePrimary = req.getIsPrimary() != null ? Boolean.TRUE.equals(req.getIsPrimary()) : Boolean.TRUE.equals(d.getIsPrimary());
        if (willBePrimary && !Boolean.TRUE.equals(d.getIsVerified()) && tenantResolutionService.isVerifiedDomainRequired()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "DOMAIN_NOT_VERIFIED",
                    "message", "Verify this address before making it the main one."));
        }
        if (req.getIsPrimary() != null) {
            d.setIsPrimary(req.getIsPrimary());
            if (Boolean.TRUE.equals(req.getIsPrimary())) {
                tenantDomainRepository.clearPrimaryForCollege(d.getCollegeId(), d.getId());
            }
        }
        TenantDomain saved = tenantDomainRepository.save(d);
        if (audit != null) audit.log(httpRequest, "TENANT_DOMAIN_UPDATE", "tenant_domain", String.valueOf(id), null, saved.getCollegeId(), Map.of("host", saved.getHost(), "isPrimary", saved.getIsPrimary()));
        return ResponseEntity.ok(Map.of("domain", saved));
    }

    @DeleteMapping("/domains/{id}")
    @Transactional
    public ResponseEntity<?> deleteDomain(@PathVariable Integer id, HttpServletRequest httpRequest) {
        UserPrincipal principal = requireSuperAdminPrincipal();
        TenantDomain d = tenantDomainRepository.findById(id).orElse(null);
        if (d == null || Boolean.TRUE.equals(d.getIsDeleted())) return ResponseEntity.status(404).body(Map.of("error", "Not found"));
        requireCollegeInScope(principal, d.getCollegeId());
        String originalHost = d.getHost();
        // BUGFIX: uq_tenant_domain_host is a table-wide unique constraint on `host`, not scoped to
        // is_deleted — unlike findActiveByHost, which IS scoped to active rows. Soft-deleting left
        // the host permanently "reserved": re-adding that exact address later (a typo fixed and
        // retried, a decommissioned college's address reused for a new one) passed the app-level
        // duplicate check (which only looks at active rows) and then failed at the database with a
        // raw unique-constraint violation — degraded by the global handler into a generic "conflicts
        // with an existing record, refresh and try again," which is actively misleading: refreshing
        // does nothing, since the conflict is with a row the admin can't see or remove from the UI.
        // Free the real host on delete by mangling the deleted row's own copy of it; the value is
        // never read again (findActiveByHost/findActiveByCollegeId both filter is_deleted=false), so
        // only this row's own history is affected. The audit log keeps the real address.
        // host is VARCHAR(255); the suffix below is short but a host can legitimately be up to
        // 253 chars (HOST_ALLOWED), so truncate before appending rather than risk a save-time
        // truncation/length error on an already-long host.
        String suffix = "~deleted~" + d.getId() + "~" + System.currentTimeMillis();
        String truncatedHost = originalHost.length() > 255 - suffix.length()
                ? originalHost.substring(0, 255 - suffix.length())
                : originalHost;
        d.setHost(truncatedHost + suffix);
        d.setIsDeleted(true);
        tenantDomainRepository.save(d);
        if (audit != null) audit.log(httpRequest, "TENANT_DOMAIN_DELETE", "tenant_domain", String.valueOf(id), null, d.getCollegeId(), Map.of("host", originalHost));
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/domains/{id}/verification-token")
    @Transactional
    public ResponseEntity<?> ensureVerificationToken(@PathVariable Integer id, HttpServletRequest httpRequest) {
        UserPrincipal principal = requireSuperAdminPrincipal();
        TenantDomain existing = tenantDomainRepository.findById(id).orElse(null);
        if (existing != null) requireCollegeInScope(principal, existing.getCollegeId());
        TenantDomain d = tenantDomainVerificationService.ensureToken(id);
        if (d == null) return ResponseEntity.status(404).body(Map.of("error", "Not found"));
        if (audit != null) audit.log(httpRequest, "TENANT_DOMAIN_TOKEN", "tenant_domain", String.valueOf(id), null, d.getCollegeId(), Map.of("host", d.getHost()));
        return ResponseEntity.ok(Map.of(
                "domain", d,
                "dnsName", "_42lms-verify." + d.getHost(),
                "txtValue", d.getVerificationToken()
        ));
    }

    @PostMapping("/domains/{id}/verify")
    @Transactional
    public ResponseEntity<?> verifyDomain(@PathVariable Integer id, HttpServletRequest httpRequest) {
        UserPrincipal principal = requireSuperAdminPrincipal();
        TenantDomain existing = tenantDomainRepository.findById(id).orElse(null);
        if (existing != null) requireCollegeInScope(principal, existing.getCollegeId());
        boolean ok = tenantDomainVerificationService.verify(id);
        TenantDomain d = tenantDomainRepository.findById(id).orElse(null);
        if (audit != null) audit.log(httpRequest, "TENANT_DOMAIN_VERIFY", "tenant_domain", String.valueOf(id), null, d != null ? d.getCollegeId() : null, Map.of("ok", ok));
        return ResponseEntity.ok(Map.of("ok", ok, "domain", d));
    }

    // ---------------- Branding ----------------

    @GetMapping("/branding/{collegeId}")
    public ResponseEntity<?> getBranding(@PathVariable Integer collegeId) {
        UserPrincipal principal = requireSuperAdminPrincipal();
        requireCollegeInScope(principal, collegeId);
        College college = collegeRepository.findById(collegeId).orElse(null);
        if (college == null) return ResponseEntity.status(404).body(Map.of("error", "College not found"));
        CollegeBranding b = collegeBrandingRepository.findActiveByCollegeId(collegeId).orElse(null);
        Map<String, Object> body = new HashMap<>();
        body.put("branding", b);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/branding/{collegeId}")
    @Transactional
    public ResponseEntity<?> upsertBranding(@PathVariable Integer collegeId, @RequestBody CollegeBrandingRequest req, HttpServletRequest httpRequest) {
        UserPrincipal principal = requireSuperAdminPrincipal();
        requireCollegeInScope(principal, collegeId);
        College college = collegeRepository.findById(collegeId).orElse(null);
        if (college == null) return ResponseEntity.status(404).body(Map.of("error", "College not found"));

        // Checked before the (managed) entity is touched, so a bad value saves nothing.
        String loginMethods = req.getLoginMethods() != null ? trimOrNull(req.getLoginMethods()) : null;
        if (loginMethods != null) loginMethods = loginMethods.toUpperCase();
        if (loginMethods != null && !CollegeBranding.LOGIN_METHODS.contains(loginMethods)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Unknown sign-in methods: " + loginMethods));
        }

        CollegeBranding b = collegeBrandingRepository.findActiveByCollegeId(collegeId).orElseGet(CollegeBranding::new);
        b.setCollegeId(collegeId);
        if (req.getLogoUrl() != null) b.setLogoUrl(trimOrNull(req.getLogoUrl()));
        if (req.getFaviconUrl() != null) b.setFaviconUrl(trimOrNull(req.getFaviconUrl()));
        if (req.getLoginBackgroundUrl() != null) b.setLoginBackgroundUrl(trimOrNull(req.getLoginBackgroundUrl()));
        if (req.getLoginBackgroundUrlMobile() != null) b.setLoginBackgroundUrlMobile(trimOrNull(req.getLoginBackgroundUrlMobile()));
        if (req.getPrimaryColor() != null) b.setPrimaryColor(trimOrNull(req.getPrimaryColor()));
        if (req.getSecondaryColor() != null) b.setSecondaryColor(trimOrNull(req.getSecondaryColor()));
        if (req.getLoginMethods() != null) b.setLoginMethods(loginMethods);
        if (req.getSupportEmail() != null) b.setSupportEmail(trimOrNull(req.getSupportEmail()));
        if (req.getSupportPhone() != null) b.setSupportPhone(trimOrNull(req.getSupportPhone()));
        if (req.getTermsUrl() != null) b.setTermsUrl(trimOrNull(req.getTermsUrl()));
        if (req.getPrivacyUrl() != null) b.setPrivacyUrl(trimOrNull(req.getPrivacyUrl()));
        b.setIsDeleted(false);
        CollegeBranding saved = collegeBrandingRepository.save(b);
        if (audit != null) {
            // HashMap, not Map.of: a college without a logo or colour has nulls here, and Map.of throws on null
            // (that used to fail every branding save for such a college).
            Map<String, Object> details = new HashMap<>();
            details.put("logoUrl", saved.getLogoUrl());
            details.put("primaryColor", saved.getPrimaryColor());
            details.put("loginMethods", saved.getLoginMethods());
            audit.log(httpRequest, "COLLEGE_BRANDING_UPSERT", "college_branding", String.valueOf(saved.getId()), null, collegeId, details);
        }
        return ResponseEntity.ok(Map.of("branding", saved));
    }

    /** Optional-module decisions must pass the dedicated authorization and lock rules. */
    private static void requireDedicatedModuleEndpoint(String key) {
        if (key == null) return;
        String normalized = key.trim();
        if (ModuleFeatureCatalog.settingAndLockKeys().stream()
                .anyMatch(settingKey -> settingKey.equalsIgnoreCase(normalized))) {
            throw new IllegalArgumentException(
                    "Use Feature Controls or Module Access to change Projects/Placements access");
        }
    }

    // ---------------- Settings (GLOBAL only for now) ----------------

    @GetMapping("/settings/global")
    public ResponseEntity<?> getGlobalSettings() {
        UserPrincipal principal = requireSuperAdminPrincipal();
        if (!isGlobalSuperAdmin(principal)) {
            throw new org.springframework.security.access.AccessDeniedException("Global settings require clearing scope");
        }
        return ResponseEntity.ok(Map.of("settings", appSettingsService.getAllForScope("GLOBAL", null)));
    }

    @PutMapping("/settings/global")
    @Transactional
    public ResponseEntity<?> putGlobalSettings(@RequestBody Map<String, Object> body, HttpServletRequest httpRequest) {
        UserPrincipal principal = requireSuperAdminPrincipal();
        if (!isGlobalSuperAdmin(principal)) {
            throw new org.springframework.security.access.AccessDeniedException("Global settings require clearing scope");
        }
        if (body == null || body.isEmpty()) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Empty body"));
        for (String key : body.keySet()) requireDedicatedModuleEndpoint(key);
        for (Map.Entry<String, Object> e : body.entrySet()) {
            String key = e.getKey();
            if (key == null || key.trim().isEmpty()) continue;
            String value = e.getValue() == null ? null : String.valueOf(e.getValue());
            appSettingsService.upsert("GLOBAL", null, key.trim(), value);
        }
        // A copy, not body.keySet(): the json payload column deep-copies through Jackson, which cannot rebuild a
        // LinkedHashMap$LinkedKeySet. The audit insert failed, left a null-id row in the session, and the commit flush then
        // threw - every settings save (global, org, college) answered 500 and rolled back.
        if (audit != null) audit.log(httpRequest, "APP_SETTINGS_GLOBAL_PUT", "app_setting", "GLOBAL", null, null, Map.of("keys", new java.util.ArrayList<>(body.keySet())));
        return ResponseEntity.ok(Map.of("settings", appSettingsService.getAllForScope("GLOBAL", null)));
    }

    /**
     * Removes a global setting so the backend falls back to its built-in default.
     *
     * <p>Previously there was no way to unset a global value, so the console emulated it by
     * writing an empty string. That is not the same thing: AppSettingsService.getString returns
     * Optional.of("") for an empty row, so `.orElse(default)` never fires and the value genuinely
     * becomes empty. For an int setting getInt treats blank as unset and it happens to work; for a
     * string setting like sms.senderId it does not — "removing" it set the DLT sender ID to an
     * empty string and every SMS would be rejected by the operator.
     *
     * <p>The key is matched as {@code {key:.+}} because setting keys contain dots
     * ("otp.maxAttempts"), and without it Spring can truncate the path variable at the last dot
     * and silently delete the wrong key or nothing at all.
     */
    @DeleteMapping("/settings/global/{key:.+}")
    @Transactional
    public ResponseEntity<?> deleteGlobalSetting(@PathVariable String key, HttpServletRequest httpRequest) {
        UserPrincipal principal = requireSuperAdminPrincipal();
        if (!isGlobalSuperAdmin(principal)) {
            throw new org.springframework.security.access.AccessDeniedException("Global settings require clearing scope");
        }
        requireDedicatedModuleEndpoint(key);
        appSettingsService.delete("GLOBAL", null, key);
        if (audit != null) audit.log(httpRequest, "APP_SETTINGS_GLOBAL_DELETE", "app_setting", "GLOBAL", null, null, Map.of("key", key));
        return ResponseEntity.ok(Map.of("settings", appSettingsService.getAllForScope("GLOBAL", null)));
    }

    @GetMapping("/settings/org/{orgId}")
    public ResponseEntity<?> getOrgSettings(@PathVariable Integer orgId) {
        UserPrincipal principal = requireSuperAdminPrincipal();
        requireOrgInScope(principal, orgId);
        return ResponseEntity.ok(Map.of("settings", appSettingsService.getAllForScope("ORG", orgId)));
    }

    @PutMapping("/settings/org/{orgId}")
    @Transactional
    public ResponseEntity<?> putOrgSettings(@PathVariable Integer orgId, @RequestBody Map<String, Object> body, HttpServletRequest httpRequest) {
        UserPrincipal principal = requireSuperAdminPrincipal();
        requireOrgInScope(principal, orgId);
        if (body == null || body.isEmpty()) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Empty body"));
        for (String key : body.keySet()) requireDedicatedModuleEndpoint(key);
        for (Map.Entry<String, Object> e : body.entrySet()) {
            String key = e.getKey();
            if (key == null || key.trim().isEmpty()) continue;
            String value = e.getValue() == null ? null : String.valueOf(e.getValue());
            appSettingsService.upsert("ORG", orgId, key.trim(), value);
        }
        if (audit != null) audit.log(httpRequest, "APP_SETTINGS_ORG_PUT", "app_setting", "ORG:" + orgId, orgId, null, Map.of("keys", new java.util.ArrayList<>(body.keySet())));
        return ResponseEntity.ok(Map.of("settings", appSettingsService.getAllForScope("ORG", orgId)));
    }

    @GetMapping("/settings/college/{collegeId}")
    public ResponseEntity<?> getCollegeSettings(@PathVariable Integer collegeId) {
        UserPrincipal principal = requireSuperAdminPrincipal();
        requireCollegeInScope(principal, collegeId);
        return ResponseEntity.ok(Map.of("settings", appSettingsService.getAllForScope("COLLEGE", collegeId)));
    }

    @PutMapping("/settings/college/{collegeId}")
    @Transactional
    public ResponseEntity<?> putCollegeSettings(@PathVariable Integer collegeId, @RequestBody Map<String, Object> body, HttpServletRequest httpRequest) {
        UserPrincipal principal = requireSuperAdminPrincipal();
        requireCollegeInScope(principal, collegeId);
        if (body == null || body.isEmpty()) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Empty body"));
        for (String key : body.keySet()) requireDedicatedModuleEndpoint(key);
        for (Map.Entry<String, Object> e : body.entrySet()) {
            String key = e.getKey();
            if (key == null || key.trim().isEmpty()) continue;
            String value = e.getValue() == null ? null : String.valueOf(e.getValue());
            appSettingsService.upsert("COLLEGE", collegeId, key.trim(), value);
        }
        if (audit != null) audit.log(httpRequest, "APP_SETTINGS_COLLEGE_PUT", "app_setting", "COLLEGE:" + collegeId, null, collegeId, Map.of("keys", new java.util.ArrayList<>(body.keySet())));
        return ResponseEntity.ok(Map.of("settings", appSettingsService.getAllForScope("COLLEGE", collegeId)));
    }

    @DeleteMapping("/settings/org/{orgId}/{key:.+}")
    @Transactional
    public ResponseEntity<?> deleteOrgSetting(@PathVariable Integer orgId, @PathVariable String key, HttpServletRequest httpRequest) {
        UserPrincipal principal = requireSuperAdminPrincipal();
        requireOrgInScope(principal, orgId);
        requireDedicatedModuleEndpoint(key);
        appSettingsService.delete("ORG", orgId, key);
        if (audit != null) audit.log(httpRequest, "APP_SETTINGS_ORG_DELETE", "app_setting", "ORG:" + orgId, orgId, null, Map.of("key", key));
        return ResponseEntity.ok(Map.of("settings", appSettingsService.getAllForScope("ORG", orgId)));
    }

    @DeleteMapping("/settings/college/{collegeId}/{key:.+}")
    @Transactional
    public ResponseEntity<?> deleteCollegeSetting(@PathVariable Integer collegeId, @PathVariable String key, HttpServletRequest httpRequest) {
        UserPrincipal principal = requireSuperAdminPrincipal();
        requireCollegeInScope(principal, collegeId);
        requireDedicatedModuleEndpoint(key);
        appSettingsService.delete("COLLEGE", collegeId, key);
        if (audit != null) audit.log(httpRequest, "APP_SETTINGS_COLLEGE_DELETE", "app_setting", "COLLEGE:" + collegeId, null, collegeId, Map.of("key", key));
        return ResponseEntity.ok(Map.of("settings", appSettingsService.getAllForScope("COLLEGE", collegeId)));
    }

    private String normalizeHost(String raw) {
        String host = RequestHostUtil.normalizeHostOnly(raw);
        host = host != null ? host.trim().toLowerCase() : null;
        if (host == null || host.isEmpty()) return null;

        // No wildcards or underscores; prevent accidental "*.domain.com" or TXT-style labels.
        if (host.contains("*") || host.contains("_")) return null;
        // No whitespace or path-ish characters should survive normalizeHostOnly, but double guard.
        if (host.contains(" ") || host.contains("/") || host.contains("\\")) return null;
        if (host.length() > 253) return null;
        if (!HOST_ALLOWED.matcher(host).matches()) return null;
        return host;
    }

    private String trimOrNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    @Data
    private static class TenantDomainRequest {
        private Integer collegeId;
        private String host;
        private Boolean isPrimary;
    }

    @Data
    static class CollegeBrandingRequest { // package-private for TenantAdminControllerTest
        private String logoUrl;
        private String faviconUrl;
        private String loginBackgroundUrl;
        private String loginBackgroundUrlMobile;
        private String primaryColor;
        private String secondaryColor;
        private String loginMethods;
        private String supportEmail;
        private String supportPhone;
        private String termsUrl;
        private String privacyUrl;
    }
}

