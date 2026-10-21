package com._42students.lms.controller;

import com._42students.lms.model.College;
import com._42students.lms.model.CollegeBranding;
import com._42students.lms.repository.CollegeBrandingRepository;
import com._42students.lms.repository.TenantDomainRepository;
import com._42students.lms.service.AppSettingsService;
import com._42students.lms.service.TenantResolutionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com._42students.lms.util.RequestHostUtil;
import com._42students.lms.model.TenantDomain;

@Slf4j
@RestController
@RequestMapping("/api/v1/public")
public class PublicTenantController {

    private final TenantResolutionService tenantResolutionService;
    private final AppSettingsService appSettingsService;
    private final CollegeBrandingRepository collegeBrandingRepository;
    private final TenantDomainRepository tenantDomainRepository;

    public PublicTenantController(TenantResolutionService tenantResolutionService,
                                  AppSettingsService appSettingsService,
                                  CollegeBrandingRepository collegeBrandingRepository,
                                  TenantDomainRepository tenantDomainRepository) {
        this.tenantResolutionService = tenantResolutionService;
        this.appSettingsService = appSettingsService;
        this.collegeBrandingRepository = collegeBrandingRepository;
        this.tenantDomainRepository = tenantDomainRepository;
    }

    @GetMapping("/tenant-bootstrap")
    public ResponseEntity<?> bootstrap(HttpServletRequest request) {
        String host = RequestHostUtil.getEffectiveHostHeader(request);
        String normalizedHost = RequestHostUtil.normalizeHostOnly(host);
        String baseDomain = appSettingsService != null ? appSettingsService.getBaseDomain() : "42lms.com";
        String globalHostRaw = appSettingsService != null ? appSettingsService.getGlobalHost() : "";
        String normalizedGlobalHost = RequestHostUtil.normalizeHostOnly(globalHostRaw);
        if (normalizedGlobalHost == null || normalizedGlobalHost.trim().isEmpty()) {
            // Safety default: if globalHost isn't configured, treat the base domain as the global entrypoint.
            normalizedGlobalHost = RequestHostUtil.normalizeHostOnly(baseDomain);
        }

        // Local/dev hosts should always behave like GLOBAL entrypoints.
        // Otherwise localhost users see TENANT_NOT_FOUND and the frontend logs noisy 404s.
        if (RequestHostUtil.isDevLocalHost(normalizedHost)) {
            return ResponseEntity.ok(Map.of(
                    "mode", "GLOBAL",
                    "globalHost", normalizedGlobalHost != null ? normalizedGlobalHost.trim() : "",
                    "baseDomain", baseDomain
            ));
        }
        if (normalizedHost != null && normalizedGlobalHost != null && !normalizedGlobalHost.trim().isEmpty()
                && normalizedHost.equalsIgnoreCase(normalizedGlobalHost.trim())) {
            // Global entrypoint (e.g. 42lms.com): not a tenant, but return base settings.
            return ResponseEntity.ok(Map.of(
                    "mode", "GLOBAL",
                    "globalHost", normalizedGlobalHost.trim(),
                    "baseDomain", baseDomain
            ));
        }
        Optional<College> collegeOpt = tenantResolutionService.resolveCollegeFromHost(host);
        if (collegeOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of(
                    "error", "TENANT_NOT_FOUND",
                    "message", "This domain is not configured"
            ));
        }
        College college = collegeOpt.get();
        Map<String, Object> tenant = new HashMap<>();
        tenant.put("requestHost", normalizedHost);
        tenant.put("tenantKey", college.getUniqueId());
        tenant.put("collegeId", college.getId());
        tenant.put("organizationId", college.getOrgId());
        tenant.put("collegeName", college.getName());

        // Canonical host handling:
        // - if this college has a primary domain, return it so frontend can redirect away from aliases.
        // This avoids cookie/branding confusion across multiple domains pointing at the same tenant.
        String canonicalHost = null;
        try {
            if (tenantDomainRepository != null && college.getId() > 0) {
                // Prefer verified primary if present; fall back to any primary.
                List<String> primaryHosts = tenantDomainRepository.findVerifiedPrimaryHostsByCollegeId(college.getId());
                if (primaryHosts == null || primaryHosts.isEmpty()) {
                    primaryHosts = tenantDomainRepository.findPrimaryHostsByCollegeId(college.getId());
                }
                if (primaryHosts != null && !primaryHosts.isEmpty()) {
                    String ph = primaryHosts.get(0);
                    String norm = RequestHostUtil.normalizeHostOnly(ph);
                    if (norm != null && !norm.trim().isEmpty()) canonicalHost = norm.trim();
                }
                if (canonicalHost == null) {
                    List<TenantDomain> domains = tenantDomainRepository.findActiveByCollegeId(college.getId());
                    if (domains != null && !domains.isEmpty()) {
                        TenantDomain fallback = domains.stream()
                                .filter(d -> d != null && Boolean.TRUE.equals(d.getIsVerified()) && d.getHost() != null && !d.getHost().trim().isEmpty())
                                .findFirst()
                                .orElse(domains.stream()
                                        .filter(d -> d != null && d.getHost() != null && !d.getHost().trim().isEmpty())
                                        .findFirst()
                                        .orElse(null));
                        if (fallback != null) {
                            String norm = RequestHostUtil.normalizeHostOnly(fallback.getHost());
                            if (norm != null && !norm.trim().isEmpty()) canonicalHost = norm.trim();
                        }
                    }
                }
            }
        } catch (Exception ignored) {}
        if (canonicalHost != null) {
            tenant.put("canonicalHost", canonicalHost);
            if (normalizedHost != null && !normalizedHost.trim().isEmpty() && !canonicalHost.equalsIgnoreCase(normalizedHost.trim())) {
                tenant.put("shouldRedirectToCanonicalHost", true);
            }
        }

        String logoUrl = college.getLogo();
        String faviconUrl = null;
        String loginBackgroundUrl = null;
        String loginBackgroundUrlMobile = null;
        String primaryColor = null;
        String secondaryColor = null;
        String loginMethods = CollegeBranding.LOGIN_METHODS_DEFAULT;
        String supportEmail = null;
        String supportPhone = null;
        String termsUrl = null;
        String privacyUrl = null;
        try {
            CollegeBranding b = collegeBrandingRepository != null
                    ? collegeBrandingRepository.findActiveByCollegeId(college.getId()).orElse(null)
                    : null;
            if (b != null) {
                String override = b.getLogoUrl();
                if (override != null && !override.trim().isEmpty()) logoUrl = override;
                faviconUrl = b.getFaviconUrl();
                loginBackgroundUrl = b.getLoginBackgroundUrl();
                loginBackgroundUrlMobile = b.getLoginBackgroundUrlMobile();
                primaryColor = b.getPrimaryColor();
                secondaryColor = b.getSecondaryColor();
                loginMethods = CollegeBranding.effectiveLoginMethods(b);
                supportEmail = b.getSupportEmail();
                supportPhone = b.getSupportPhone();
                termsUrl = b.getTermsUrl();
                privacyUrl = b.getPrivacyUrl();
            }
        } catch (Exception ignored) {}
        tenant.put("logoUrl", logoUrl);
        tenant.put("faviconUrl", faviconUrl);
        tenant.put("loginBackgroundUrl", loginBackgroundUrl);
        tenant.put("loginBackgroundUrlMobile", loginBackgroundUrlMobile);
        tenant.put("primaryColor", primaryColor);
        tenant.put("secondaryColor", secondaryColor);
        tenant.put("loginMethods", loginMethods);
        tenant.put("supportEmail", supportEmail);
        tenant.put("supportPhone", supportPhone);
        tenant.put("termsUrl", termsUrl);
        tenant.put("privacyUrl", privacyUrl);
        tenant.put("baseDomain", baseDomain);
        tenant.put("mode", "TENANT");
        return ResponseEntity.ok(tenant);
    }
}

