package com._42students.lms.service.recruiter;

import com._42students.lms.dto.response.TokenPair;
import com._42students.lms.model.College;
import com._42students.lms.model.RecruiterCollegeAccess;
import com._42students.lms.model.Recruiter;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.RecruiterRepository;
import com._42students.lms.service.company.CompanyDirectoryService;
import com._42students.lms.security.JwtService;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AppSettingsService;
import com._42students.lms.util.RequestHostUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Issues and describes recruiter (industry) sessions: tokens for a selected scope, the user object
 * returned to the frontend, and the recruiter entries of the account switcher. Scope is always
 * re-validated here against {@link RecruiterAccessService}; a college the recruiter no longer has access to
 * silently falls back to Global instead of being honoured. See docs/recruiter-tpo/DESIGN.md.
 */
@Service
public class RecruiterAuthService {

    /** Refresh-token claim carrying the selected college (absent = Global). */
    public static final String REFRESH_CLAIM_COLLEGE = "recruiterCollegeId";

    private final RecruiterAccessService recruiterAccessService;
    private final RecruiterRepository recruiterRepository;
    private final CompanyDirectoryService companyDirectory;
    private final CollegeRepository collegeRepository;

    /** The one college logo (Branding, falling back to the college record). */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.service.CollegeLogoService collegeLogoService;
    private final JwtService jwtService;

    @Autowired(required = false)
    private AppSettingsService appSettingsService;

    @Autowired(required = false)
    private com._42students.lms.service.TenantResolutionService tenantResolutionService;

    public RecruiterAuthService(RecruiterAccessService recruiterAccessService,
                         RecruiterRepository recruiterRepository,
                         CompanyDirectoryService companyDirectory,
                         CollegeRepository collegeRepository,
                         JwtService jwtService) {
        this.recruiterAccessService = recruiterAccessService;
        this.recruiterRepository = recruiterRepository;
        this.companyDirectory = companyDirectory;
        this.collegeRepository = collegeRepository;
        this.jwtService = jwtService;
    }

    @Autowired(required = false)
    private com._42students.lms.repository.TenantDomainRepository tenantDomainRepository;

    @Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private com._42students.lms.service.tpo.RecruiterInviteService recruiterInviteService;

    /**
     * The requested college if the recruiter holds an active grant for it. A request for a college they no longer
     * hold is never swapped for another one (that would silently move them to a college they did not ask
     * for): they fall back to the college-less "hub" session, an account chooser with no data. Only a
     * session that asked for no college at all (an older chooser token) is placed in the one college a
     * recruiter simply belongs to, when there is exactly one.
     */
    public Integer effectiveCollegeId(Recruiter recruiter, Integer requestedCollegeId) {
        if (recruiter == null) return null;
        // One college per session, always (recruiter phase 1): no college asked for means no session scope at all.
        if (requestedCollegeId == null) return null;
        return recruiterAccessService.hasActiveGrant(recruiter.getId(), requestedCollegeId) ? requestedCollegeId : null;
    }

    /** The only college this recruiter can enter, or null when they have none, several, or an invitation waiting. */
    public Integer soleCollegeOf(Recruiter recruiter) {
        if (recruiter == null) return null;
        List<RecruiterCollegeAccess> grants = recruiterAccessService.activeGrants(recruiter.getId());
        if (grants.size() != 1) return null;
        if (hasPendingInvites(recruiter)) return null;
        return grants.get(0).getCollegeId();
    }

    public boolean hasPendingInvites(Recruiter recruiter) {
        if (recruiter == null || recruiterInviteService == null) return false;
        try {
            return !recruiterInviteService.pendingFor(recruiter.getId()).isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    public UserPrincipal principalFor(Recruiter recruiter, Integer collegeId) {
        Integer orgId = collegeId != null ? recruiterAccessService.organizationOf(collegeId) : null;
        return UserPrincipal.forRecruiter(recruiter, orgId, collegeId);
    }

    /** Tokens for an already-validated scope (use {@link #effectiveCollegeId} first). */
    public TokenPair issueTokens(Recruiter recruiter, Integer collegeId) {
        UserPrincipal principal = principalFor(recruiter, collegeId);
        Map<String, Object> refreshClaims = new HashMap<>();
        refreshClaims.put(REFRESH_CLAIM_COLLEGE, collegeId);
        return jwtService.generateTokens(principal, refreshClaims);
    }

    public void recordLogin(Recruiter recruiter) {
        if (recruiter == null) return;
        recruiter.setLastLoginAt(LocalDateTime.now());
        recruiterRepository.save(recruiter);
    }

    /** The user object the frontend stores after login / refresh / switch. */
    public Map<String, Object> authUser(Recruiter recruiter, Integer collegeId) {
        Map<String, Object> user = new HashMap<>();
        user.put("id", recruiter.getId());
        user.put("userType", Recruiter.USER_TYPE);
        user.put("firstName", recruiter.getFirstName());
        user.put("lastName", recruiter.getLastName());
        user.put("contactMobile", recruiter.getContactMobile());
        user.put("contactMail", recruiter.getContactMail());
        user.put("designation", recruiter.getDesignation());
        user.put("companyId", recruiter.getCompanyId());
        user.put("companyName", companyName(recruiter));
        user.put("collegeId", collegeId);
        user.put("organizationId", collegeId != null ? recruiterAccessService.organizationOf(collegeId) : null);
        user.put("collegeName", collegeId != null ? collegeRepository.findById(collegeId).map(College::getName).orElse(null) : null);
        user.put("recruiterScope", collegeId == null ? "GLOBAL" : "COLLEGE");
        return user;
    }

    public String companyName(Recruiter recruiter) {
        return recruiter == null ? null : companyDirectory.nameOf(recruiter.getCompanyId());
    }

    /** Stable switcher key; must match {@link #membershipsForMobile} and the current-key lookup. */
    public static String membershipKey(Integer recruiterId, Integer collegeId) {
        if (recruiterId == null) return null;
        return collegeId == null
                ? "acc:" + Recruiter.USER_TYPE + ":" + recruiterId + ":global"
                : "acc:" + Recruiter.USER_TYPE + ":" + recruiterId + ":college:" + collegeId;
    }

    /**
     * Switcher entries for the recruiter identity owning this mobile: "Global" plus one per active grant.
     * Empty when no usable recruiter exists for the number. recruiter entries point at the host the person is on
     * (42lms.com in production), so switching scope never leaves it; only from a college's own
     * domain do they point at the global host instead.
     */
    public List<Map<String, Object>> membershipsForMobile(String mobile, String fallbackHost) {
        // A phone number never identifies a recruiter (recruiter phase 1, L9): no recruiter accounts by phone.
        return Collections.emptyList();
    }

    /**
     * The accounts a recruiter session may see. A college session sees only its own college: there is no
     * list of the recruiter's other colleges inside a college, and nothing to switch to. Only the
     * college-less hub session (the account chooser on the global domain) lists the colleges, each
     * pointing at that college's own domain, plus the hub entry itself.
     */
    public List<Map<String, Object>> membershipsFor(Recruiter recruiter, Integer sessionCollegeId, String fallbackHost) {
        if (recruiter == null || !recruiter.isUsable()) return Collections.emptyList();
        // No college-less "hub" session and no list of colleges (recruiter phase 1): a session sees its own college only.
        if (sessionCollegeId == null) return Collections.emptyList();
        String globalHostValue = recruiterHost(fallbackHost);
        List<Map<String, Object>> out = new ArrayList<>();

        if (sessionCollegeId == null) {
            Map<String, Object> hub = baseMembership(recruiter, null, globalHostValue);
            String company = companyName(recruiter);
            hub.put("collegeName", "Your colleges");
            // "<title> • <role>": the switcher and login picker split labels on the bullet.
            hub.put("label", "Choose a college • Recruiter" + (company != null ? " (" + company + ")" : ""));
            out.add(hub);
        }

        for (RecruiterCollegeAccess grant : recruiterAccessService.activeGrants(recruiter.getId())) {
            if (sessionCollegeId != null && !sessionCollegeId.equals(grant.getCollegeId())) continue;
            College college = collegeRepository.findById(grant.getCollegeId()).orElse(null);
            if (college == null) continue;
            Map<String, Object> m = baseMembership(recruiter, college.getId(), collegeHost(college.getId(), globalHostValue));
            m.put("tenantKey", college.getUniqueId());
            m.put("collegeName", college.getName());
            m.put("collegeCode", college.getUniqueId());
            m.put("organizationId", college.getOrgId());
            m.put("label", college.getName() + " • Recruiter");
            m.put("logoUrl", com._42students.lms.service.CollegeLogoService.logoOf(collegeLogoService, college));
            out.add(m);
        }
        return out;
    }

    /** The college's own domain (verified primary first), or {@code fallback} when it has none yet. */
    private String collegeHost(Integer collegeId, String fallback) {
        if (collegeId == null || tenantDomainRepository == null) return fallback;
        try {
            List<com._42students.lms.model.TenantDomain> domains = tenantDomainRepository.findActiveByCollegeId(collegeId);
            if (domains == null) return fallback;
            java.util.function.Predicate<com._42students.lms.model.TenantDomain> hasHost =
                    d -> d != null && d.getHost() != null && !d.getHost().trim().isEmpty();
            return domains.stream().filter(hasHost.and(d -> Boolean.TRUE.equals(d.getIsVerified()) && Boolean.TRUE.equals(d.getIsPrimary())))
                    .findFirst()
                    .or(() -> domains.stream().filter(hasHost.and(d -> Boolean.TRUE.equals(d.getIsVerified()))).findFirst())
                    .or(() -> domains.stream().filter(hasHost.and(d -> Boolean.TRUE.equals(d.getIsPrimary()))).findFirst())
                    .or(() -> domains.stream().filter(hasHost).findFirst())
                    .map(d -> d.getHost().trim())
                    .orElse(fallback);
        } catch (Exception e) {
            return fallback;
        }
    }

    private Map<String, Object> baseMembership(Recruiter recruiter, Integer collegeId, String host) {
        Map<String, Object> m = new HashMap<>();
        m.put("key", membershipKey(recruiter.getId(), collegeId));
        m.put("collegeId", collegeId);
        m.put("userType", Recruiter.USER_TYPE);
        m.put("facultyType", null);
        m.put("role", "RECRUITER");
        m.put("userId", recruiter.getId());
        m.put("recruiterScope", collegeId == null ? "GLOBAL" : "COLLEGE");
        m.put("host", host);
        m.put("hostVerified", host != null);
        m.put("hostPrimary", host != null);
        boolean switchable = host != null && !host.trim().isEmpty();
        m.put("switchable", switchable);
        if (!switchable) m.put("switchBlockReason", "DOMAIN_NOT_CONFIGURED");
        return m;
    }

    /**
     * Host for recruiter switcher entries: the UI host of the current request (Origin, else Host) unless
     * that is a college's own domain, in which case the global host. Listing and switching both
     * call this within the same kind of request, so a switch is SAME_HOST whenever it can be.
     */
    private String recruiterHost(String fallbackHost) {
        String current = currentUiHost();
        if (current != null && !isCollegeDomain(current)) return current;
        return globalHost(fallbackHost);
    }

    private String currentUiHost() {
        try {
            org.springframework.web.context.request.RequestAttributes attrs =
                    org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (!(attrs instanceof org.springframework.web.context.request.ServletRequestAttributes)) return null;
            javax.servlet.http.HttpServletRequest request =
                    ((org.springframework.web.context.request.ServletRequestAttributes) attrs).getRequest();
            String origin = request.getHeader("Origin");
            if (origin != null && !origin.trim().isEmpty() && !"null".equalsIgnoreCase(origin.trim())) {
                String authority = java.net.URI.create(origin.trim()).getAuthority();
                if (authority != null && !authority.isBlank()) return authority;
            }
            String host = RequestHostUtil.getEffectiveHostHeader(request);
            return host != null && !host.isBlank() ? host.trim() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private boolean isCollegeDomain(String host) {
        if (tenantResolutionService == null) return false;
        try {
            return tenantResolutionService.resolveCollegeFromHost(host).isPresent();
        } catch (Exception e) {
            return false;
        }
    }

    /** The configured global host (42lms.com in prod); the UI host in local dev. */
    private String globalHost(String fallbackHost) {
        String configured = appSettingsService != null ? appSettingsService.getGlobalHost() : null;
        if (configured == null || configured.trim().isEmpty()) {
            configured = appSettingsService != null ? appSettingsService.getBaseDomain() : null;
        }
        String normalized = RequestHostUtil.normalizeHostOnly(configured);
        if (normalized != null && !normalized.trim().isEmpty()) return normalized;
        return fallbackHost != null && !fallbackHost.trim().isEmpty() ? fallbackHost.trim() : null;
    }
}
