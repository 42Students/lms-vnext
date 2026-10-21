package com._42students.lms.service.recruiter;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.model.College;
import com._42students.lms.model.RecruiterCollegeAccess;
import com._42students.lms.model.Recruiter;
import com._42students.lms.model.Company;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.RecruiterCollegeAccessRepository;
import com._42students.lms.repository.RecruiterRepository;
import com._42students.lms.service.company.CompanyDirectoryService;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.InputSanitizer;
import com._42students.lms.util.OnboardingMobileNumber;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Super-admin management of recruiter (industry) identities and their college grants.
 *
 * Scope rules: a GLOBAL super admin can manage any recruiter. A super admin scoped to an organization or a
 * college can grant or revoke colleges inside that scope, and can edit / suspend / delete a recruiter only
 * when every college that recruiter has ever been granted lies inside the scope (a recruiter spans colleges, so a
 * scoped admin must not affect access elsewhere). See docs/recruiter-tpo/DESIGN.md.
 */
@Service
public class RecruiterAdminService {

    public static final int MAX_PAGE_SIZE = 100;

    private final RecruiterRepository recruiterRepository;
    private final RecruiterCollegeAccessRepository accessRepository;
    private final CompanyDirectoryService companyRepository;
    private final CollegeRepository collegeRepository;
    private final AccessControlService accessControlService;
    private final RecruiterAuthService recruiterAuthService;

    public RecruiterAdminService(RecruiterRepository recruiterRepository,
                          RecruiterCollegeAccessRepository accessRepository,
                          CompanyDirectoryService companyRepository,
                          CollegeRepository collegeRepository,
                          AccessControlService accessControlService,
                          RecruiterAuthService recruiterAuthService) {
        this.recruiterRepository = recruiterRepository;
        this.accessRepository = accessRepository;
        this.companyRepository = companyRepository;
        this.collegeRepository = collegeRepository;
        this.accessControlService = accessControlService;
        this.recruiterAuthService = recruiterAuthService;
    }

    // ------------------------------------------------------------------------------------------
    // Input / result types
    // ------------------------------------------------------------------------------------------

    /** Profile fields; null means "leave unchanged" on update. */
    public static class RecruiterProfileInput {
        public String firstName;
        public String lastName;
        public String contactMobile;
        public String contactMail;
        public String designation;
        public String companyName;
    }

    public static class RecruiterAdminException extends RuntimeException {
        private final int status;
        private final String code;
        private final transient Map<String, Object> details;

        public RecruiterAdminException(int status, String code, String message) {
            this(status, code, message, null);
        }

        public RecruiterAdminException(int status, String code, String message, Map<String, Object> details) {
            super(message);
            this.status = status;
            this.code = code;
            this.details = details;
        }

        public int getStatus() { return status; }
        public String getCode() { return code; }
        public Map<String, Object> getDetails() { return details; }
    }

    // ------------------------------------------------------------------------------------------
    // Reads
    // ------------------------------------------------------------------------------------------

    public Map<String, Object> list(UserPrincipal principal, String query, int page, int size) {
        requireSuperAdmin(principal);
        int safeSize = Math.max(1, Math.min(size, MAX_PAGE_SIZE));
        int safePage = Math.max(0, page);
        String pattern = "%" + likeSafe(query).toLowerCase(Locale.ROOT) + "%";

        List<Recruiter> rows;
        long total;
        if (accessControlService.isGlobalSuperAdmin(principal)) {
            Page<Recruiter> result = recruiterRepository.searchActive(pattern,
                    PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.ASC, "firstName", "id")));
            rows = result.getContent();
            total = result.getTotalElements();
        } else {
            // Scoped super admin: only recruiters holding (or having held) a grant inside the scope.
            Set<Integer> scope = collegesInScope(principal);
            Set<Integer> recruiterIds = scope == null || scope.isEmpty() ? Set.of()
                    : accessRepository.findAllForColleges(scope).stream()
                        .map(RecruiterCollegeAccess::getRecruiterId).collect(Collectors.toCollection(HashSet::new));
            List<Recruiter> all = recruiterIds.isEmpty() ? List.of() : recruiterRepository.findActiveByIds(recruiterIds).stream()
                    .filter(recruiter -> matches(recruiter, pattern))
                    .sorted((a, b) -> String.valueOf(a.getFirstName()).compareToIgnoreCase(String.valueOf(b.getFirstName())))
                    .collect(Collectors.toList());
            total = all.size();
            int from = Math.min(all.size(), safePage * safeSize);
            rows = all.subList(from, Math.min(all.size(), from + safeSize));
        }

        List<Integer> rowIds = rows.stream().map(Recruiter::getId).collect(Collectors.toList());
        Map<Integer, List<RecruiterCollegeAccess>> grants = rowIds.isEmpty() ? Map.of()
                : accessRepository.findAllForRecruiters(rowIds).stream()
                    .collect(Collectors.groupingBy(RecruiterCollegeAccess::getRecruiterId));
        List<Map<String, Object>> items = new ArrayList<>();
        for (Recruiter recruiter : rows) {
            items.add(viewForPrincipal(principal, recruiter, grants.getOrDefault(recruiter.getId(), List.of())));
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("items", items);
        out.put("page", safePage);
        out.put("size", safeSize);
        out.put("total", total);
        return out;
    }

    public Map<String, Object> get(UserPrincipal principal, Integer recruiterId) {
        requireSuperAdmin(principal);
        Recruiter recruiter = requireExisting(recruiterId);
        List<RecruiterCollegeAccess> grants = accessRepository.findAllForRecruiter(recruiter.getId());
        requireVisible(principal, grants);
        return viewForPrincipal(principal, recruiter, grants);
    }

    public List<Company> companies(UserPrincipal principal) {
        requireSuperAdmin(principal);
        return companyRepository.allLive();
    }

    // ------------------------------------------------------------------------------------------
    // Identity writes
    // ------------------------------------------------------------------------------------------

    /**
     * Create (or restore) a recruiter and grant the given colleges in one transaction: either everything
     * is saved or nothing is. A scoped super admin must pass at least one college in scope.
     */
    @Transactional
    public Recruiter createWithColleges(UserPrincipal principal, RecruiterProfileInput input, Collection<Integer> collegeIds) {
        requireSuperAdmin(principal);
        List<Integer> colleges = collegeIds == null ? List.of()
                : collegeIds.stream().filter(Objects::nonNull).distinct().collect(Collectors.toList());
        if (!accessControlService.isGlobalSuperAdmin(principal) && colleges.isEmpty()) {
            throw bad("COLLEGE_REQUIRED", "Pick at least one college in your scope");
        }
        for (Integer collegeId : colleges) {
            requireCollegeInScope(principal, requireCollege(collegeId).getId());
        }
        Recruiter recruiter = create(principal, input);
        for (Integer collegeId : colleges) {
            grant(principal, recruiter.getId(), collegeId, null, null);
        }
        return recruiter;
    }

    @Transactional
    public Recruiter create(UserPrincipal principal, RecruiterProfileInput input) {
        requireSuperAdmin(principal);
        if (input == null) throw bad("BODY_REQUIRED", "Request body is required");
        // The work email is the recruiter's identity (L9); a mobile number is an optional contact only.
        String email0 = cleanEmail(input.contactMail);
        if (email0 == null) throw bad("COMPANY_EMAIL_REQUIRED", "A recruiter needs a company email; their company comes from its domain");
        String mobile = null;
        if (input.contactMobile != null && !input.contactMobile.isBlank()) {
            mobile = OnboardingMobileNumber.normalize(input.contactMobile);
            if (mobile == null) throw bad("INVALID_MOBILE", "Enter a valid 10-digit mobile number, or leave it blank");
        }
        String firstName = clean(input.firstName, 100);
        if (firstName == null) throw bad("FIRST_NAME_REQUIRED", "firstName is required");

        Recruiter existing = recruiterRepository.findByContactMail(email0).orElse(null);
        if (existing != null && !Boolean.TRUE.equals(existing.getIsDeleted())) {
            Map<String, Object> details = new HashMap<>();
            details.put("recruiterId", existing.getId());
            throw new RecruiterAdminException(409, "RECRUITER_ALREADY_EXISTS",
                    "A recruiter account already exists for this email", details);
        }
        Recruiter recruiter = existing != null ? existing : new Recruiter();
        if (existing != null) {
            // Restoring a deleted identity. A scoped super admin may only restore one whose past
            // grants all lie inside their scope (or that never had any).
            List<RecruiterCollegeAccess> pastGrants = accessRepository.findAllForRecruiter(existing.getId());
            if (!pastGrants.isEmpty()) requireManageable(principal, pastGrants);
            recruiter.setIsDeleted(false);
            recruiter.setSuspendedAt(null);
            recruiter.setSuspensionReason(null);
            recruiter.setTokenVersion((recruiter.getTokenVersion() != null ? recruiter.getTokenVersion() : 0) + 1);
        } else {
            recruiter.setTokenVersion(0);
            recruiter.setIsDeleted(false);
            recruiter.setCreatedByUserId(principal.getId());
            recruiter.setCreatedByUserType(principal.getUserType());
        }
        String email = cleanEmail(input.contactMail);
        if (email != null) {
            recruiterRepository.findByContactMail(email).ifPresent(other -> {
                if (existing == null || other.getId() != existing.getId()) {
                    throw new RecruiterAdminException(409, "EMAIL_IN_USE", "Another recruiter account uses this email");
                }
            });
        }
        recruiter.setContactMobile(mobile);
        recruiter.setFirstName(firstName);
        recruiter.setLastName(clean(input.lastName, 100));
        recruiter.setContactMail(email);
        recruiter.setDesignation(clean(input.designation, 150));
        recruiter.setCompanyId(resolveCompanyId(principal, input.companyName, email));
        return recruiterRepository.save(recruiter);
    }

    @Transactional
    public Recruiter update(UserPrincipal principal, Integer recruiterId, RecruiterProfileInput input) {
        requireSuperAdmin(principal);
        if (input == null) throw bad("BODY_REQUIRED", "Request body is required");
        Recruiter recruiter = requireLive(recruiterId);
        requireManageable(principal, accessRepository.findAllForRecruiter(recruiter.getId()));

        if (input.firstName != null) {
            String firstName = clean(input.firstName, 100);
            if (firstName == null) throw bad("FIRST_NAME_REQUIRED", "firstName cannot be blank");
            recruiter.setFirstName(firstName);
        }
        if (input.lastName != null) recruiter.setLastName(clean(input.lastName, 100));
        if (input.contactMail != null) {
            String email = cleanEmail(input.contactMail);
            if (email != null && !email.equals(recruiter.getContactMail())) {
                recruiterRepository.findByContactMail(email).ifPresent(other -> {
                    if (other.getId() != recruiter.getId()) {
                        throw new RecruiterAdminException(409, "EMAIL_IN_USE", "Another recruiter account uses this email");
                    }
                });
                // The login identity may have changed (email is the account key): every session of the old email ends now.
                recruiter.setTokenVersion((recruiter.getTokenVersion() != null ? recruiter.getTokenVersion() : 0) + 1);
            }
            recruiter.setContactMail(email);
        }
        if (input.designation != null) recruiter.setDesignation(clean(input.designation, 150));
        if (input.companyName != null || input.contactMail != null) recruiter.setCompanyId(resolveCompanyId(principal, input.companyName, recruiter.getContactMail()));
        if (input.contactMobile != null) {
            // A contact number only (L9): changing it changes nothing about sign-in.
            if (input.contactMobile.isBlank()) recruiter.setContactMobile(null);
            else {
                String mobile = OnboardingMobileNumber.normalize(input.contactMobile);
                if (mobile == null) throw bad("INVALID_MOBILE", "Enter a valid 10-digit mobile number, or leave it blank");
                recruiter.setContactMobile(mobile);
            }
        }
        return recruiterRepository.save(recruiter);
    }

    @Transactional
    public Recruiter suspend(UserPrincipal principal, Integer recruiterId, String reason) {
        requireSuperAdmin(principal);
        Recruiter recruiter = requireLive(recruiterId);
        requireManageable(principal, accessRepository.findAllForRecruiter(recruiter.getId()));
        recruiter.setSuspendedAt(LocalDateTime.now());
        recruiter.setSuspensionReason(clean(reason, 500));
        recruiter.setTokenVersion((recruiter.getTokenVersion() != null ? recruiter.getTokenVersion() : 0) + 1);
        return recruiterRepository.save(recruiter);
    }

    @Transactional
    public Recruiter reactivate(UserPrincipal principal, Integer recruiterId) {
        requireSuperAdmin(principal);
        Recruiter recruiter = requireLive(recruiterId);
        requireManageable(principal, accessRepository.findAllForRecruiter(recruiter.getId()));
        recruiter.setSuspendedAt(null);
        recruiter.setSuspensionReason(null);
        return recruiterRepository.save(recruiter);
    }

    @Transactional
    public Recruiter delete(UserPrincipal principal, Integer recruiterId) {
        requireSuperAdmin(principal);
        Recruiter recruiter = requireLive(recruiterId);
        requireManageable(principal, accessRepository.findAllForRecruiter(recruiter.getId()));
        recruiter.setIsDeleted(true);
        recruiter.setTokenVersion((recruiter.getTokenVersion() != null ? recruiter.getTokenVersion() : 0) + 1);
        return recruiterRepository.save(recruiter);
    }

    @Transactional
    public Recruiter revokeSessions(UserPrincipal principal, Integer recruiterId) {
        requireSuperAdmin(principal);
        Recruiter recruiter = requireLive(recruiterId);
        requireManageable(principal, accessRepository.findAllForRecruiter(recruiter.getId()));
        recruiter.setTokenVersion((recruiter.getTokenVersion() != null ? recruiter.getTokenVersion() : 0) + 1);
        return recruiterRepository.save(recruiter);
    }

    // ------------------------------------------------------------------------------------------
    // Grants
    // ------------------------------------------------------------------------------------------

    /** Grant (or re-activate / update) access to one college. */
    @Transactional
    public RecruiterCollegeAccess grant(UserPrincipal principal, Integer recruiterId, Integer collegeId,
                                 LocalDateTime validUntil, Collection<String> capabilities) {
        requireSuperAdmin(principal);
        Recruiter recruiter = requireLive(recruiterId);
        College college = requireCollege(collegeId);
        requireCollegeInScope(principal, college.getId());
        if (validUntil != null && !validUntil.isAfter(LocalDateTime.now())) {
            throw bad("VALID_UNTIL_IN_PAST", "validUntil must be in the future");
        }
        Set<String> caps = validCapabilities(capabilities);

        RecruiterCollegeAccess grant = accessRepository.findForRecruiterAndCollege(recruiter.getId(), college.getId()).orElse(null);
        if (grant == null) {
            grant = new RecruiterCollegeAccess();
            grant.setRecruiterId(recruiter.getId());
            grant.setCollegeId(college.getId());
            grant.setIsDeleted(false);
        }
        grant.setOrganizationId(college.getOrgId());
        grant.setStatus(RecruiterCollegeAccess.STATUS_ACTIVE);
        grant.setValidUntil(validUntil);
        grant.setGrantedAt(LocalDateTime.now());
        grant.setGrantedByUserId(principal.getId());
        grant.setGrantedByUserType(principal.getUserType());
        grant.setRevokedAt(null);
        grant.setRevokedByUserId(null);
        grant.setRevokedByUserType(null);
        grant.setRevokeReason(null);
        grant.setCapabilities(caps);
        return accessRepository.save(grant);
    }

    @Transactional
    public RecruiterCollegeAccess revoke(UserPrincipal principal, Integer recruiterId, Integer collegeId, String reason) {
        requireSuperAdmin(principal);
        Recruiter recruiter = requireExisting(recruiterId);
        requireCollegeInScope(principal, collegeId);
        RecruiterCollegeAccess grant = accessRepository.findForRecruiterAndCollege(recruiter.getId(), collegeId)
                .orElseThrow(() -> new RecruiterAdminException(404, "GRANT_NOT_FOUND", "This recruiter has no access to that college"));
        grant.setStatus(RecruiterCollegeAccess.STATUS_REVOKED);
        grant.setRevokedAt(LocalDateTime.now());
        grant.setRevokedByUserId(principal.getId());
        grant.setRevokedByUserType(principal.getUserType());
        grant.setRevokeReason(clean(reason, 500));
        return accessRepository.save(grant);
    }

    // ------------------------------------------------------------------------------------------
    // Views
    // ------------------------------------------------------------------------------------------

    /**
     * Build a recruiter view without leaking college-grant history outside the caller's scope.
     * A scoped super admin may need to know that account-wide actions are blocked because other
     * grants exist, but does not need the other tenant's college names, dates or access history.
     */
    private Map<String, Object> viewForPrincipal(UserPrincipal principal, Recruiter recruiter,
                                                 List<RecruiterCollegeAccess> grants) {
        List<RecruiterCollegeAccess> safeGrants = grants == null ? List.of() : grants;
        if (accessControlService.isGlobalSuperAdmin(principal)) {
            Map<String, Object> out = view(recruiter, safeGrants);
            out.put("accountManageable", true);
            out.put("hasAccessOutsideScope", false);
            return out;
        }

        boolean hasOutsideScope = safeGrants.stream()
                .anyMatch(grant -> !accessControlService.canAccessCollege(principal, grant.getCollegeId()));
        List<RecruiterCollegeAccess> visibleGrants = safeGrants.stream()
                .filter(grant -> accessControlService.canAccessCollege(principal, grant.getCollegeId()))
                .collect(Collectors.toList());
        Map<String, Object> out = view(recruiter, visibleGrants);
        // Mirrors requireManageable: a scoped admin cannot perform account-wide actions when there
        // are no grants to establish authority, or when any historical grant lies outside scope.
        out.put("accountManageable", !safeGrants.isEmpty() && !hasOutsideScope);
        out.put("hasAccessOutsideScope", hasOutsideScope);
        return out;
    }

    public Map<String, Object> view(Recruiter recruiter, List<RecruiterCollegeAccess> grants) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", recruiter.getId());
        m.put("firstName", recruiter.getFirstName());
        m.put("lastName", recruiter.getLastName());
        m.put("contactMobile", recruiter.getContactMobile());
        m.put("contactMail", recruiter.getContactMail());
        m.put("designation", recruiter.getDesignation());
        m.put("companyId", recruiter.getCompanyId());
        m.put("companyName", recruiterAuthService.companyName(recruiter));
        m.put("status", Boolean.TRUE.equals(recruiter.getIsDeleted()) ? "DELETED" : recruiter.getSuspendedAt() != null ? "SUSPENDED" : "ACTIVE");
        m.put("suspendedAt", recruiter.getSuspendedAt());
        m.put("suspensionReason", recruiter.getSuspensionReason());
        m.put("lastLoginAt", recruiter.getLastLoginAt());
        m.put("createdAt", recruiter.getCreatedAt());
        LocalDateTime now = LocalDateTime.now();
        List<Map<String, Object>> colleges = new ArrayList<>();
        for (RecruiterCollegeAccess grant : grants) {
            Map<String, Object> g = new LinkedHashMap<>();
            College college = collegeRepository.findById(grant.getCollegeId()).orElse(null);
            g.put("collegeId", grant.getCollegeId());
            g.put("collegeName", college != null ? college.getName() : null);
            g.put("collegeCode", college != null ? college.getUniqueId() : null);
            g.put("organizationId", grant.getOrganizationId());
            g.put("status", grant.getStatus());
            g.put("active", grant.isActiveAt(now));
            g.put("validUntil", grant.getValidUntil());
            g.put("grantedAt", grant.getGrantedAt());
            g.put("revokedAt", grant.getRevokedAt());
            g.put("revokeReason", grant.getRevokeReason());
            g.put("capabilities", grant.getCapabilities() != null ? new ArrayList<>(grant.getCapabilities()) : List.of());
            colleges.add(g);
        }
        m.put("colleges", colleges);
        m.put("activeCollegeCount", grants.stream().filter(g -> g.isActiveAt(now)).count());
        return m;
    }

    // ------------------------------------------------------------------------------------------
    // Scope helpers
    // ------------------------------------------------------------------------------------------

    private void requireSuperAdmin(UserPrincipal principal) {
        if (!accessControlService.isSuperAdmin(principal)) {
            throw new AccessDeniedException("Super admin only");
        }
    }

    /** Colleges the principal's scope covers; null for a global super admin (= all). */
    private Set<Integer> collegesInScope(UserPrincipal principal) {
        if (accessControlService.isGlobalSuperAdmin(principal)) return null;
        if (principal.getCollegeId() != null) return Set.of(principal.getCollegeId());
        Integer orgId = principal.getOrganizationId();
        return collegeRepository.findAll().stream()
                .filter(c -> !Boolean.TRUE.equals(c.getIsDeleted()) && Objects.equals(c.getOrgId(), orgId))
                .map(College::getId)
                .collect(Collectors.toSet());
    }

    private void requireCollegeInScope(UserPrincipal principal, Integer collegeId) {
        if (accessControlService.isGlobalSuperAdmin(principal)) return;
        if (collegeId == null || !accessControlService.canAccessCollege(principal, collegeId)) {
            throw new AccessDeniedException("College is outside your super admin scope");
        }
    }

    /** Scoped super admins may only change a recruiter whose every grant lies inside their scope. */
    private void requireManageable(UserPrincipal principal, List<RecruiterCollegeAccess> grants) {
        if (accessControlService.isGlobalSuperAdmin(principal)) return;
        if (grants == null || grants.isEmpty()) {
            throw new AccessDeniedException("Switch to the global super admin view to manage this recruiter");
        }
        for (RecruiterCollegeAccess grant : grants) {
            if (!accessControlService.canAccessCollege(principal, grant.getCollegeId())) {
                throw new AccessDeniedException("This recruiter also has access outside your scope; use the global super admin view");
            }
        }
    }

    /** A scoped super admin can only see a recruiter with at least one grant inside the scope. */
    private void requireVisible(UserPrincipal principal, List<RecruiterCollegeAccess> grants) {
        if (accessControlService.isGlobalSuperAdmin(principal)) return;
        boolean any = grants != null && grants.stream()
                .anyMatch(grant -> accessControlService.canAccessCollege(principal, grant.getCollegeId()));
        if (!any) throw new RecruiterAdminException(404, "NOT_FOUND", "Recruiter not found");
    }

    // ------------------------------------------------------------------------------------------
    // Small helpers
    // ------------------------------------------------------------------------------------------

    private Recruiter requireExisting(Integer recruiterId) {
        if (recruiterId == null || recruiterId <= 0) throw new RecruiterAdminException(404, "NOT_FOUND", "Recruiter not found");
        return recruiterRepository.findById(recruiterId)
                .orElseThrow(() -> new RecruiterAdminException(404, "NOT_FOUND", "Recruiter not found"));
    }

    private Recruiter requireLive(Integer recruiterId) {
        Recruiter recruiter = requireExisting(recruiterId);
        if (Boolean.TRUE.equals(recruiter.getIsDeleted())) throw new RecruiterAdminException(404, "NOT_FOUND", "Recruiter not found");
        return recruiter;
    }

    private College requireCollege(Integer collegeId) {
        if (collegeId == null || collegeId <= 0) throw bad("COLLEGE_REQUIRED", "collegeId is required");
        College college = collegeRepository.findById(collegeId).orElse(null);
        if (college == null || Boolean.TRUE.equals(college.getIsDeleted())) {
            throw new RecruiterAdminException(404, "COLLEGE_NOT_FOUND", "College not found");
        }
        return college;
    }

    private Set<String> validCapabilities(Collection<String> capabilities) {
        Set<String> out = new HashSet<>();
        if (capabilities == null) return out;
        for (String raw : capabilities) {
            String cap = raw != null ? raw.trim().toUpperCase(Locale.ROOT) : "";
            if (cap.isEmpty()) continue;
            if (!RecruiterCapability.isKnown(cap)) throw bad("UNKNOWN_CAPABILITY", "Unknown capability: " + cap);
            out.add(cap);
        }
        return out;
    }

    /** The company is the one owning the work email's domain (L1); the typed name is used only when the company is new. */
    private Integer resolveCompanyId(UserPrincipal principal, String companyName, String email) {
        if (email == null) throw bad("COMPANY_EMAIL_REQUIRED", "A recruiter needs a company email; their company comes from its domain");
        try {
            Company company = companyRepository.forWorkEmail(email, clean(companyName, 150),
                    new CompanyDirectoryService.Actor(principal.getUserType(), principal.getId(), null));
            return company.getId();
        } catch (IllegalArgumentException e) {
            throw bad("COMPANY_EMAIL_REQUIRED", e.getMessage());
        }
    }

    private static boolean matches(Recruiter recruiter, String pattern) {
        String needle = pattern.replace("%", "");
        if (needle.isEmpty()) return true;
        return contains(recruiter.getFirstName(), needle) || contains(recruiter.getLastName(), needle)
                || contains(recruiter.getContactMobile(), needle) || contains(recruiter.getContactMail(), needle);
    }

    private static boolean contains(String value, String needle) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(needle);
    }

    /** Drop LIKE wildcards and escapes from a search box so input is matched literally. */
    static String likeSafe(String query) {
        if (query == null) return "";
        return query.trim().replace("\\", "").replace("%", "").replace("_", "");
    }

    private static String clean(String value, int max) {
        if (value == null) return null;
        String v = InputSanitizer.sanitize(value.trim());
        if (v == null || v.isEmpty()) return null;
        return v.length() > max ? v.substring(0, max) : v;
    }

    private static String cleanEmail(String value) {
        String v = clean(value, 255);
        if (v == null) return null;
        if (!v.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) throw bad("INVALID_EMAIL", "contactMail is not a valid email");
        return v.toLowerCase(Locale.ROOT);
    }

    private static RecruiterAdminException bad(String code, String message) {
        return new RecruiterAdminException(400, code, message);
    }
}
