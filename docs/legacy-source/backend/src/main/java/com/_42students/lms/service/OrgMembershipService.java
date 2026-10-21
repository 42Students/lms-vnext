package com._42students.lms.service;

import com._42students.lms.model.College;
import com._42students.lms.model.Faculty;
import com._42students.lms.model.Learner;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.OrganizationRepository;
import com._42students.lms.repository.TenantDomainRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.repository.RecruiterRepository;
import com._42students.lms.service.recruiter.RecruiterAuthService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@Slf4j
public class OrgMembershipService {

    private final CollegeRepository collegeRepository;
    private final LearnerRepository learnerRepository;
    private final FacultyRepository facultyRepository;
    private final OrganizationRepository organizationRepository;
    private final AppSettingsService appSettingsService;
    private final TenantDomainRepository tenantDomainRepository;

    /** The one college logo (Branding, falling back to the college record). */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.service.CollegeLogoService collegeLogoService;

    // recruiter (industry) identities are not faculty/learner rows; they add their own switcher entries.
    // Optional so existing tests that construct this service by hand keep compiling.
    @Autowired(required = false)
    private RecruiterRepository recruiterRepository;

    @Autowired(required = false)
    private RecruiterAuthService recruiterAuthService;

    public OrgMembershipService(CollegeRepository collegeRepository,
                                LearnerRepository learnerRepository,
                                FacultyRepository facultyRepository,
                                OrganizationRepository organizationRepository,
                                AppSettingsService appSettingsService,
                                TenantDomainRepository tenantDomainRepository) {
        this.collegeRepository = collegeRepository;
        this.learnerRepository = learnerRepository;
        this.facultyRepository = facultyRepository;
        this.organizationRepository = organizationRepository;
        this.appSettingsService = appSettingsService;
        this.tenantDomainRepository = tenantDomainRepository;
    }

    public List<Map<String, Object>> listMemberships(UserPrincipal principal) {
        return listMemberships(principal, null);
    }

    /**
     * @param fallbackHost UI host (e.g. localhost:3000) to use when a college has no configured domain,
     *                     but only if domain enforcement is disabled.
     */
    public List<Map<String, Object>> listMemberships(UserPrincipal principal, String fallbackHost) {
        if (principal == null) return Collections.emptyList();
        List<Map<String, Object>> memberships = new ArrayList<>();

        // Super-admin (id 0) has no concrete college membership list.
        if (principal.getId() != null && principal.getId() == 0) {
            return Collections.emptyList();
        }

        // A recruiter session is scoped to one college (recruiter V2): inside a college it lists only that college,
        // never the recruiter's other colleges or their other roles. Only the college-less hub
        // session (the chooser on the global domain) lists the colleges to enter.
        if (principal.isRecruiter()) {
            if (recruiterAuthService == null || recruiterRepository == null || principal.getId() == null) return Collections.emptyList();
            return recruiterRepository.findActiveById(principal.getId())
                    .map(recruiter -> recruiterAuthService.membershipsFor(recruiter, principal.getCollegeId(), fallbackHost))
                    .orElse(Collections.emptyList());
        }

        // Memberships are derived purely from actual accounts in the system that share the same mobile.
        // If a user has an account in multiple colleges/orgs,
        // they will be switchable because they are real accounts.
        String mobile = resolvePrincipalMobile(principal);
        if (mobile != null && !mobile.trim().isEmpty()) {
            String digits = mobile.trim();

            // Include *all* accounts for this mobile (learner + faculty), even across roles.
            // This enables switching between roles for the same phone (common in testing/UAT).
            Map<Integer, College> collegeCache = new HashMap<>();

            for (Learner l : learnerRepository.findAllByContactMobileAndNotDeleted(digits)) {
                if (l == null || l.getCollegeId() == null || l.getId() <= 0) continue;
                College college = collegeCache.computeIfAbsent(l.getCollegeId(), (cid) -> collegeRepository.findById(cid).orElse(null));
                if (college == null) continue;
                memberships.add(collegeMembership(college, l.getId(), "LEARNER", null, fallbackHost));
            }
            for (Faculty f : facultyRepository.findAllByContactMobileAndNotDeleted(digits)) {
                if (f == null || f.getCollegeId() == null || f.getId() <= 0) continue;
                College college = collegeCache.computeIfAbsent(f.getCollegeId(), (cid) -> collegeRepository.findById(cid).orElse(null));
                if (college == null) continue;
                memberships.add(collegeMembership(college, f.getId(), "FACULTY", f.getFacultyType(), fallbackHost));
            }
        } else if (principal.getCollegeId() != null && !principal.isRecruiter()) {
            // Fallback: at least include current college from token if mobile can't be resolved.
            Integer targetUserId = principal.getId();
            if (targetUserId != null) {
                collegeRepository.findById(principal.getCollegeId()).ifPresent(college -> memberships.add(
                        collegeMembership(college, targetUserId, principal.getUserType(), principal.getFacultyType(), fallbackHost)
                ));
            }
        }

        // recruiter identity owning the same mobile: one entry per active college grant. The college-less
        // hub entry is not offered to a non-recruiter session.
        if (recruiterAuthService != null && mobile != null && !mobile.trim().isEmpty()) {
            recruiterAuthService.membershipsForMobile(mobile.trim(), fallbackHost).stream()
                    .filter(m -> m.get("collegeId") != null)
                    .forEach(memberships::add);
        }

        // De-dupe by key (unique per account)
        Set<String> seen = new HashSet<>();
        List<Map<String, Object>> deduped = new ArrayList<>();
        for (Map<String, Object> m : memberships) {
            String k = String.valueOf(m.get("key"));
            if (k != null && seen.add(k)) deduped.add(m);
        }
        return deduped;
    }

    public Optional<Map<String, Object>> resolveTarget(UserPrincipal principal, String targetKey) {
        if (targetKey == null || targetKey.trim().isEmpty()) return Optional.empty();
        String key = targetKey.trim();
        for (Map<String, Object> m : listMemberships(principal)) {
            Object mk = m.get("key");
            if (mk != null && key.equalsIgnoreCase(String.valueOf(mk))) return Optional.of(m);
        }
        // Backward compat: older membership keys didn't include facultyType segment.
        // If a user switched before this change, their client may still send the old key.
        if (key.toLowerCase(Locale.ROOT).startsWith("acc:") && key.toLowerCase(Locale.ROOT).contains(":facultytype:")) {
            String legacy = key.replaceAll("(?i):facultytype:[^:]+", "");
            for (Map<String, Object> m : listMemberships(principal)) {
                Object mk = m.get("key");
                if (mk != null && legacy.equalsIgnoreCase(String.valueOf(mk))) return Optional.of(m);
            }
        }
        // Legacy: allow switching by college uniqueId only if it resolves uniquely.
        Map<String, Object> only = null;
        for (Map<String, Object> m : listMemberships(principal)) {
            Object tenantKey = m.get("tenantKey");
            if (tenantKey == null) continue;
            if (!key.equalsIgnoreCase(String.valueOf(tenantKey))) continue;
            if (only != null) return Optional.empty(); // ambiguous
            only = m;
        }
        if (only != null) return Optional.of(only);
        return Optional.empty();
    }

    /**
     * Build the stable membership key for a specific account scope.
     * This must match the keys returned by {@link #listMemberships(UserPrincipal, String)}.
     */
    public String buildMembershipKey(Integer userId, String userType, Integer collegeId, Object facultyType) {
        String type = userType != null ? String.valueOf(userType).trim().toUpperCase(Locale.ROOT) : "";
        if (com._42students.lms.model.Recruiter.isUserType(type)) {
            // recruiter has a Global scope (no college), so its keys have their own shape.
            return RecruiterAuthService.membershipKey(userId, collegeId);
        }
        if (userId == null || collegeId == null) return null;
        String stableKey = "acc:" + (type.isEmpty() ? "UNKNOWN" : type) + ":" + userId + ":college:" + collegeId;
        if ("FACULTY".equalsIgnoreCase(type) && facultyType != null && !String.valueOf(facultyType).trim().isEmpty()) {
            stableKey = stableKey + ":facultyType:" + String.valueOf(facultyType).trim();
        }
        return stableKey;
    }

    private Map<String, Object> collegeMembership(College college,
                                                  Integer targetUserId,
                                                  String userType,
                                                  Object facultyType,
                                                  String fallbackHost) {
        Map<String, Object> m = new HashMap<>();
        String orgName = resolveOrganizationName(college.getOrgId());
        String type = userType != null ? String.valueOf(userType).trim().toUpperCase(Locale.ROOT) : "";
        String stableKey = buildMembershipKey(targetUserId, type, college.getId(), facultyType);
        m.put("key", stableKey);
        m.put("tenantKey", college.getUniqueId());
        m.put("collegeId", college.getId());
        m.put("collegeName", college.getName());
        // Stable short code for UI chips/switchers (prefer college.uniqueId).
        // FE uses this for compact "ROLE • CODE" display in navbars.
        m.put("collegeCode", college.getUniqueId());
        m.put("organizationId", college.getOrgId());
        m.put("organizationName", orgName);
        m.put("userType", type.isEmpty() ? null : type);
        m.put("facultyType", facultyType != null ? String.valueOf(facultyType) : null);
        String roleLabel = roleLabelForAccount(type, facultyType);
        m.put("role", roleLabel);
        m.put("label", buildMembershipLabel(college, orgName, roleLabel));
        m.put("userId", targetUserId);
        // Preferred: verified primary custom domain for this college (if configured).
        String host = null;
        boolean hostVerified = false;
        boolean hostPrimary = false;
        try {
            if (tenantDomainRepository != null) {
                List<com._42students.lms.model.TenantDomain> domains = tenantDomainRepository.findActiveByCollegeId(college.getId());
                // Deterministic preference order:
                // 1) verified + primary
                // 2) verified
                // 3) primary (unverified)
                // 4) any active
                com._42students.lms.model.TenantDomain chosen = domains.stream()
                        .filter(d -> d != null && Boolean.TRUE.equals(d.getIsVerified()) && Boolean.TRUE.equals(d.getIsPrimary()) && hasHost(d.getHost()))
                        .findFirst()
                        .orElse(domains.stream()
                                .filter(d -> d != null && Boolean.TRUE.equals(d.getIsVerified()) && hasHost(d.getHost()))
                                .findFirst()
                                .orElse(domains.stream()
                                        .filter(d -> d != null && Boolean.TRUE.equals(d.getIsPrimary()) && hasHost(d.getHost()))
                                        .findFirst()
                                        .orElse(domains.stream()
                                                .filter(d -> d != null && hasHost(d.getHost()))
                                                .findFirst()
                                                .orElse(null))));
                if (chosen != null) {
                    host = chosen.getHost().trim();
                    hostVerified = Boolean.TRUE.equals(chosen.getIsVerified());
                    hostPrimary = Boolean.TRUE.equals(chosen.getIsPrimary());
                }
            }
        } catch (Exception ignored) {}
        m.put("host", host);
        m.put("hostVerified", hostVerified);
        m.put("hostPrimary", hostPrimary);
        boolean strictVerified = "true".equalsIgnoreCase(String.valueOf(System.getenv("LMS_STRICT_DOMAIN_VERIFICATION")).trim());

        boolean domainEnforcementEnabled = isDomainEnforcementEnabled();
        boolean requireVerifiedDomains = requireVerifiedDomains();
        if (!domainEnforcementEnabled && (host == null || host.trim().isEmpty())
                && fallbackHost != null && !fallbackHost.trim().isEmpty()) {
            host = fallbackHost.trim();
            m.put("host", host);
            m.put("switchWarning", "DOMAIN_ENFORCEMENT_DISABLED");
        }

        boolean switchable;
        if (!domainEnforcementEnabled) {
            switchable = host != null && !host.trim().isEmpty();
        } else {
            boolean verifiedOk = !requireVerifiedDomains && !strictVerified || hostVerified;
            switchable = host != null && !host.trim().isEmpty() && verifiedOk;
        }
        m.put("switchable", switchable);
        if (!switchable) {
            if (host == null || host.trim().isEmpty()) {
                m.put("switchBlockReason", "DOMAIN_NOT_CONFIGURED");
            } else if (requireVerifiedDomains || strictVerified) {
                m.put("switchBlockReason", "DOMAIN_UNVERIFIED");
            } else {
                m.put("switchBlockReason", "UNKNOWN");
            }
        } else if (!hostVerified) {
            m.put("switchWarning", "DOMAIN_UNVERIFIED");
        }
        m.put("logoUrl", com._42students.lms.service.CollegeLogoService.logoOf(collegeLogoService, college));
        return m;
    }

    private boolean isDomainEnforcementEnabled() {
        // Default ON. Disable in non-prod via env or -D property.
        String sys = System.getProperty("lms.domain.enforcement.enabled");
        if (sys != null && !sys.trim().isEmpty()) {
            return !"false".equalsIgnoreCase(sys.trim());
        }
        String env = System.getenv("LMS_DOMAIN_ENFORCEMENT_ENABLED");
        if (env != null && !env.trim().isEmpty()) {
            return !"false".equalsIgnoreCase(env.trim());
        }
        return true;
    }

    private boolean requireVerifiedDomains() {
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

    private boolean hasHost(String host) {
        return host != null && !host.trim().isEmpty();
    }

    private String resolveOrganizationName(Integer orgId) {
        if (orgId == null || organizationRepository == null) return null;
        try {
            return organizationRepository.findById(orgId).map(o -> {
                String n = o.getName();
                return n != null && !n.trim().isEmpty() ? n.trim() : null;
            }).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private String buildMembershipLabel(College college, String orgName, String roleLabel) {
        if (college == null) return null;
        String collegeName = college.getName() != null ? college.getName().trim() : null;
        String base;
        if (orgName != null && collegeName != null && !orgName.isEmpty() && !collegeName.isEmpty()) {
            base = orgName + " • " + collegeName;
        } else {
            base = (collegeName != null && !collegeName.isEmpty()) ? collegeName : ("College #" + college.getId());
        }
        if (roleLabel != null && !roleLabel.trim().isEmpty()) {
            return base + " • " + roleLabel.trim();
        }
        return base;
    }

    private String roleLabelForAccount(String userType, Object facultyType) {
        if (userType == null) return null;
        if ("LEARNER".equalsIgnoreCase(userType)) return "Learner";
        if ("FACULTY".equalsIgnoreCase(userType)) {
            if (facultyType != null && "ADMIN".equalsIgnoreCase(String.valueOf(facultyType))) {
                return "Instructor (Admin)";
            }
            if (facultyType != null && "TPO".equalsIgnoreCase(String.valueOf(facultyType))) {
                return "TPO";
            }
            if (facultyType != null && "MENTOR".equalsIgnoreCase(String.valueOf(facultyType))) {
                return "Mentor";
            }
            return "Instructor";
        }
        return userType;
    }

    private String resolvePrincipalMobile(UserPrincipal principal) {
        if (principal == null || principal.getId() == null || principal.getUserType() == null) return null;
        try {
            if (principal.isLearner()) {
                Optional<Learner> l = learnerRepository.findById(principal.getId());
                return l.map(Learner::getContactMobile).orElse(null);
            }
            if (principal.isRecruiter()) {
                if (recruiterRepository == null) return null;
                return recruiterRepository.findActiveById(principal.getId())
                        .map(com._42students.lms.model.Recruiter::getContactMobile).orElse(null);
            }
            if (!principal.isFaculty()) return null;
            Optional<Faculty> f = facultyRepository.findById(principal.getId());
            return f.map(Faculty::getContactMobile).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
}

