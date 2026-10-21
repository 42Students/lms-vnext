package com._42students.lms.service;

import com._42students.lms.model.College;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.TenantDomainRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import com._42students.lms.util.RequestHostUtil;

import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
@Slf4j
public class TenantResolutionService {

    private final CollegeRepository collegeRepository;
    private final TenantDomainRepository tenantDomainRepository;
    private final AppSettingsService appSettingsService;

    private static final Pattern IPV4 = Pattern.compile("^\\d{1,3}(?:\\.\\d{1,3}){3}$");

    public TenantResolutionService(CollegeRepository collegeRepository,
                                   TenantDomainRepository tenantDomainRepository,
                                   AppSettingsService appSettingsService) {
        this.collegeRepository = collegeRepository;
        this.tenantDomainRepository = tenantDomainRepository;
        this.appSettingsService = appSettingsService;
    }

    public Optional<com._42students.lms.model.College> resolveCollegeFromHost(String hostHeader) {
        String host = RequestHostUtil.normalizeHostOnly(hostHeader);
        if (host == null || host.isEmpty()) return Optional.empty();

        // localhost / IP-based dev: no tenant inferred
        if (RequestHostUtil.isDevLocalHost(host)) return Optional.empty();
        if (IPV4.matcher(host).matches()) return Optional.empty();
        // IPv6 literal (best-effort): [::1] or raw ::1 shouldn't map to tenant
        if (host.contains(":")) return Optional.empty();

        boolean requireVerified = isVerifiedDomainRequired();

        // 1) Exact match: custom domains / aliases
        try {
            Optional<com._42students.lms.model.TenantDomain> td = tenantDomainRepository.findVerifiedActiveByHost(host);
            if (!requireVerified && td.isEmpty()) td = tenantDomainRepository.findActiveByHost(host);
            if (td.isPresent()) {
                Integer collegeId = td.get().getCollegeId();
                if (collegeId != null) return collegeRepository.findById(collegeId);
            }
        } catch (Exception ignored) {}

        // Unknown host: cannot map
        return Optional.empty();
    }

    /**
     * If enabled (the default), only DNS-verified domains can resolve to a tenant and serve a
     * real login. Fails closed on purpose: an unverified domain is unproven ownership, and the
     * platform would rather a brand-new, not-yet-verified address simply not work than let an
     * unproven one serve real logins.
     *
     * <p>This is the single canonical source for this policy — TenantAdminController's onboarding
     * readiness check (the "Launch checklist" a super-admin sees before handing a college's URL
     * to anyone) calls this exact method rather than keeping its own copy of the logic. The two
     * used to be computed independently with opposite defaults: this method already defaulted to
     * requiring verification, but the checklist's own copy silently defaulted to NOT requiring it
     * (a env-var-read idiom that evaluates "false" whenever the variable is simply unset) — so in
     * the default deployment (no env vars set), the checklist told a super-admin an unverified
     * primary domain was merely a recommendation, safe to launch on, while the real login gate
     * enforced verification the whole time and silently rejected the address. Single source of
     * truth removes the possibility of the two disagreeing again.
     */
    public boolean isVerifiedDomainRequired() {
        String sys = System.getProperty("lms.domain.require.verified");
        if (sys != null && !sys.trim().isEmpty()) {
            return "true".equalsIgnoreCase(sys.trim());
        }
        String env = System.getenv("LMS_REQUIRE_VERIFIED_DOMAINS");
        if (env != null && !env.trim().isEmpty()) {
            return "true".equalsIgnoreCase(env.trim());
        }
        return true;
    }
}

