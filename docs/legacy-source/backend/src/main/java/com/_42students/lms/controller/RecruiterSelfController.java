package com._42students.lms.controller;

import com._42students.lms.model.College;
import com._42students.lms.model.RecruiterCollegeAccess;
import com._42students.lms.model.Recruiter;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.RecruiterRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.recruiter.RecruiterAccessService;
import com._42students.lms.service.recruiter.RecruiterAuthService;
import com._42students.lms.service.recruiter.RecruiterDashboardService;
import com._42students.lms.util.InputSanitizer;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * The recruiter's own session: who they are, the current scope (Global or one college) and the colleges
 * they may enter. Only ROLE_RECRUITER reaches this (WebSecurityConfig); RecruiterFenceFilter keeps recruiter tokens away
 * from everything else. Every future recruiter feature lives under /api/v1/recruiter and must call
 * RecruiterAccessService.requireCollege before touching college data. See docs/recruiter-tpo/DESIGN.md.
 */
@RestController
@RequestMapping("/api/v1/recruiter")
public class RecruiterSelfController {

    private final RecruiterAccessService recruiterAccessService;
    private final RecruiterAuthService recruiterAuthService;
    private final RecruiterRepository recruiterRepository;
    private final CollegeRepository collegeRepository;

    /** The one college logo (Branding, falling back to the college record). */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.service.CollegeLogoService collegeLogoService;
    private final SecurityContextUtil securityContextUtil;
    private final NamedParameterJdbcTemplate jdbc;
    private final RecruiterDashboardService dashboardService;
    private final com._42students.lms.service.recruiter.RecruiterNotificationService notificationService;

    public RecruiterSelfController(RecruiterAccessService recruiterAccessService,
                            RecruiterAuthService recruiterAuthService,
                            RecruiterRepository recruiterRepository,
                            CollegeRepository collegeRepository,
                            SecurityContextUtil securityContextUtil,
                            NamedParameterJdbcTemplate jdbc,
                            RecruiterDashboardService dashboardService,
                            com._42students.lms.service.recruiter.RecruiterNotificationService notificationService) {
        this.recruiterAccessService = recruiterAccessService;
        this.recruiterAuthService = recruiterAuthService;
        this.recruiterRepository = recruiterRepository;
        this.collegeRepository = collegeRepository;
        this.securityContextUtil = securityContextUtil;
        this.jdbc = jdbc;
        this.dashboardService = dashboardService;
        this.notificationService = notificationService;
    }

    /** The bell for the session's college: replies and what the placement cell did on this recruiter's drives. */
    @GetMapping("/notifications")
    public ResponseEntity<Map<String, Object>> notifications() {
        UserPrincipal principal = requireRecruiter();
        Recruiter recruiter = requireUsable(principal);
        return ResponseEntity.ok(notificationService.feed(recruiter.getId(), requireSelectedCollege(principal)));
    }

    /** The bell badge only: polled every 30 seconds, so it carries one number instead of the whole feed. */
    @GetMapping("/notifications/unread-count")
    public ResponseEntity<Map<String, Object>> notificationsUnreadCount() {
        UserPrincipal principal = requireRecruiter();
        Recruiter recruiter = requireUsable(principal);
        return ResponseEntity.ok(Map.of("unread", notificationService.unreadCount(recruiter.getId(), requireSelectedCollege(principal))));
    }

    @PutMapping("/notifications/mark-all-read")
    public ResponseEntity<Map<String, Object>> markNotificationsRead() {
        UserPrincipal principal = requireRecruiter();
        Recruiter recruiter = requireUsable(principal);
        notificationService.markAllRead(recruiter.getId(), requireSelectedCollege(principal));
        return ResponseEntity.ok(Map.of("ok", true));
    }

    /**
     * Placements UX pass: the cross-college Home dashboard — totals across every college this recruiter
     * can reach, a per-college breakdown, and the most recent unified message threads. See
     * {@link RecruiterDashboardService} for why this composes existing per-college read models rather
     * than a new mega-query.
     */
    @GetMapping("/home")
    public ResponseEntity<Map<String, Object>> home() {
        UserPrincipal principal = requireRecruiter();
        Recruiter recruiter = requireUsable(principal);
        return ResponseEntity.ok(dashboardService.home(recruiter.getId(), requireSelectedCollege(principal)));
    }

    /** The message threads of the session's college, newest first. */
    @GetMapping("/messages/threads")
    public ResponseEntity<List<Map<String, Object>>> allThreads() {
        UserPrincipal principal = requireRecruiter();
        Recruiter recruiter = requireUsable(principal);
        return ResponseEntity.ok(dashboardService.allThreads(recruiter.getId(), requireSelectedCollege(principal)));
    }

    /** The college this session was issued for. A college-less (hub) session has none and gets 403. */
    private Integer requireSelectedCollege(UserPrincipal principal) {
        if (principal.getCollegeId() == null) throw new AccessDeniedException("A college must be selected");
        return principal.getCollegeId();
    }

    public static class ProfileUpdate {
        public String firstName;
        public String lastName;
        public String contactMail;
        public String designation;
        public String contactMobile;
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        UserPrincipal principal = requireRecruiter();
        Recruiter recruiter = requireUsable(principal);
        Integer selected = principal.getCollegeId();

        // A college session sees its own college only. The college list exists solely for the
        // college-less hub session, which is the account chooser on the global domain.
        List<RecruiterCollegeAccess> visible = selected == null
                ? recruiterAccessService.activeGrants(recruiter.getId())
                : recruiterAccessService.activeGrant(recruiter.getId(), selected).map(List::of).orElse(List.of());
        List<Map<String, Object>> colleges = new ArrayList<>();
        RecruiterCollegeAccess current = null;
        for (RecruiterCollegeAccess grant : visible) {
            College college = collegeRepository.findById(grant.getCollegeId()).orElse(null);
            if (college == null) continue;
            Map<String, Object> c = new LinkedHashMap<>();
            c.put("collegeId", college.getId());
            c.put("collegeName", college.getName());
            c.put("collegeCode", college.getUniqueId());
            c.put("logoUrl", com._42students.lms.service.CollegeLogoService.logoOf(collegeLogoService, college));
            c.put("validUntil", grant.getValidUntil());
            c.put("membershipKey", RecruiterAuthService.membershipKey(recruiter.getId(), college.getId()));
            colleges.add(c);
            if (selected != null && selected.equals(college.getId())) current = grant;
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("user", recruiterAuthService.authUser(recruiter, selected));
        out.put("scope", selected == null ? "GLOBAL" : "COLLEGE");
        out.put("collegeId", selected);
        out.put("capabilities", current != null && current.getCapabilities() != null
                ? new ArrayList<>(current.getCapabilities()) : List.of());
        out.put("colleges", colleges);
        if (selected == null) out.put("globalMembershipKey", RecruiterAuthService.membershipKey(recruiter.getId(), null));
        return ResponseEntity.ok(out);
    }

    /**
     * recruiter V1 §4 "Colleges" list: every college this recruiter can reach, each with a logo, name, graduating
     * count, branch list, drives-with-you count and the TPO contact to reach (§4 "TPO contact,
     * access status"). {@code /me} already lists colleges for the session switcher; this is the
     * richer, dedicated Colleges page.
     */
    @GetMapping("/colleges")
    public ResponseEntity<List<Map<String, Object>>> colleges() {
        UserPrincipal principal = requireRecruiter();
        Recruiter recruiter = requireUsable(principal);
        List<Map<String, Object>> out = new ArrayList<>();
        Integer selected = requireSelectedCollege(principal);
        for (RecruiterCollegeAccess grant : recruiterAccessService.activeGrant(recruiter.getId(), selected).map(List::of).orElse(List.<RecruiterCollegeAccess>of())) {
            College college = collegeRepository.findById(grant.getCollegeId()).orElse(null);
            if (college == null) continue;
            Map<String, Object> c = new LinkedHashMap<>();
            c.put("collegeId", college.getId());
            c.put("collegeName", college.getName());
            c.put("collegeCode", college.getUniqueId());
            c.put("logoUrl", com._42students.lms.service.CollegeLogoService.logoOf(collegeLogoService, college));
            c.put("validUntil", grant.getValidUntil());
            c.put("accessStatus", grant.getStatus());
            c.put("membershipKey", RecruiterAuthService.membershipKey(recruiter.getId(), college.getId()));

            Long total = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM learner WHERE college_id = :c AND (is_deleted = 0 OR is_deleted IS NULL) AND suspended_at IS NULL",
                    new MapSqlParameterSource("c", college.getId()), Long.class);
            c.put("studentsTotal", total == null ? 0 : total);
            List<String> branches = jdbc.queryForList(
                    "SELECT DISTINCT department FROM learner WHERE college_id = :c AND (is_deleted = 0 OR is_deleted IS NULL) AND department IS NOT NULL AND department <> '' ORDER BY department",
                    new MapSqlParameterSource("c", college.getId()), String.class);
            c.put("branches", branches);

            Long drives = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM job WHERE college_id = :c AND recruiter_id = :h AND (is_deleted = 0 OR is_deleted IS NULL)",
                    new MapSqlParameterSource("c", college.getId()).addValue("h", recruiter.getId()), Long.class);
            c.put("drivesWithYou", drives == null ? 0 : drives);

            List<Map<String, Object>> contact = jdbc.queryForList(
                    "SELECT f.first_name AS firstName, f.last_name AS lastName, f.contact_mail AS email FROM tpo_team_member t " +
                    "JOIN faculty f ON f.id = t.faculty_id WHERE t.college_id = :c AND t.role = 'TPO_ADMIN' ORDER BY f.first_name LIMIT 1",
                    new MapSqlParameterSource("c", college.getId()));
            if (contact.isEmpty()) {
                contact = jdbc.queryForList(
                        "SELECT first_name AS firstName, last_name AS lastName, contact_mail AS email FROM faculty " +
                        "WHERE college_id = :c AND faculty_type = 14 AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY id LIMIT 1",
                        new MapSqlParameterSource("c", college.getId()));
            }
            if (!contact.isEmpty()) {
                Map<String, Object> t = contact.get(0);
                c.put("tpoContactName", String.valueOf(t.get("firstName")) + (t.get("lastName") != null ? " " + t.get("lastName") : ""));
                c.put("tpoContactEmail", t.get("email"));
            }
            out.add(c);
        }
        return ResponseEntity.ok(out);
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMe(@RequestBody ProfileUpdate body) {
        UserPrincipal principal = requireRecruiter();
        Recruiter recruiter = requireUsable(principal);
        if (body == null) return ResponseEntity.badRequest().body(Map.of("error", "BODY_REQUIRED"));
        if (body.firstName != null) {
            String first = clean(body.firstName, 100);
            if (first == null) return ResponseEntity.badRequest().body(Map.of("error", "FIRST_NAME_REQUIRED"));
            recruiter.setFirstName(first);
        }
        if (body.lastName != null) recruiter.setLastName(clean(body.lastName, 100));
        if (body.designation != null) recruiter.setDesignation(clean(body.designation, 150));
        // The work email is the sign-in identity, proven with a code when the account was made (N1): it is never changed here.
        // A different company means a new work email and a new account.
        if (body.contactMail != null && !body.contactMail.trim().equalsIgnoreCase(recruiter.getContactMail() == null ? "" : recruiter.getContactMail())) {
            return ResponseEntity.badRequest().body(Map.of("error", "EMAIL_LOCKED",
                    "message", "Your work email is how you sign in, so it can't be changed here."));
        }
        // Mobile is optional, only for the placement cell to call.
        if (body.contactMobile != null) {
            if (body.contactMobile.isBlank()) recruiter.setContactMobile(null);
            else {
                String mobile = com._42students.lms.util.OnboardingMobileNumber.normalize(body.contactMobile);
                if (mobile == null) return ResponseEntity.badRequest().body(Map.of("error", "INVALID_MOBILE", "message", "Enter a valid 10-digit mobile number, or leave it blank"));
                recruiter.setContactMobile(mobile);
            }
        }
        Recruiter saved = recruiterRepository.save(recruiter);
        return ResponseEntity.ok(Map.of("user", recruiterAuthService.authUser(saved, principal.getCollegeId())));
    }

    private UserPrincipal requireRecruiter() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null || !principal.isRecruiter()) throw new AccessDeniedException("Recruiter access required");
        return principal;
    }

    private Recruiter requireUsable(UserPrincipal principal) {
        return recruiterAccessService.findUsableRecruiter(principal.getId())
                .orElseThrow(() -> new AccessDeniedException("Recruiter account is not active"));
    }

    private static String clean(String value, int max) {
        if (value == null) return null;
        String v = InputSanitizer.sanitize(value.trim());
        if (v == null || v.isEmpty()) return null;
        return v.length() > max ? v.substring(0, max) : v;
    }
}
