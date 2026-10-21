package com._42students.lms.security;

import com._42students.lms.service.tpo.PlacementEligibilityService;
import com._42students.lms.util.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Who may use placements at all (docs/tpo-ux/BATCHES-AND-ELIGIBILITY-DESIGN.md, "The access check"):
 *  - Level 1: the college has the Placements module (super admin). Without it the placement cell's workspace and recruiters'
 *    work with that college are closed.
 *  - Level 2: a student uses placements only when they are Eligible (batch, class or their own decision).
 * One place for the rule, in front of every placement API a student reaches. Runs after Spring Security.
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE - 9)
@RequiredArgsConstructor
public class PlacementAccessFilter extends OncePerRequestFilter {

    /** The placement APIs a student uses (their Placements pages). */
    static final List<String> LEARNER_PREFIXES = List.of(
            "/api/v1/jobs", "/api/v1/interviews", "/api/v2/jobs", "/api/v2/job-applications",
            "/api/v1/learner/drives", "/api/v1/learner/offers", "/api/v1/learner/placement", "/api/v1/learner/registration",
            "/api/v1/learner/requests", "/api/v1/learner/schedule", "/api/v1/learner/profile");
    /**
     * The student's own placement pages: every one of them reads "me" as the learner id of the session. A faculty, admin or
     * recruiter token there used to get 200 with the student whose learner id happens to equal their own user id.
     */
    static final List<String> LEARNER_SELF_PREFIXES = List.of(
            "/api/v1/learner/drives", "/api/v1/learner/offers", "/api/v1/learner/placement", "/api/v1/learner/registration",
            "/api/v1/learner/requests", "/api/v1/learner/schedule", "/api/v1/learner/profile");
    private static final String TPO = "/api/v1/tpo/";
    private static final Pattern RECRUITER_COLLEGE = Pattern.compile("^/api/v1/recruiter/colleges/(\\d+)(/|$)");
    /** A recruiter's own pages that work with the college of their session (account, bell and invites stay open). */
    static final List<String> RECRUITER_SESSION_PREFIXES = List.of("/api/v1/recruiter/home", "/api/v1/recruiter/messages", "/api/v1/recruiter/colleges",
            "/api/v1/recruiter/plan-drive", "/api/v1/recruiter/drive-groups");

    private final PlacementEligibilityService eligibility;
    private final SecurityContextUtil securityContextUtil;

    static boolean underAny(String path, List<String> prefixes) {
        for (String p : prefixes) if (path.equals(p) || path.startsWith(p + "/")) return true;
        return false;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws ServletException, IOException {
        String path = req.getRequestURI();
        String context = req.getContextPath();
        if (context != null && !context.isEmpty() && path.startsWith(context)) path = path.substring(context.length());
        UserPrincipal p;
        try { p = securityContextUtil.getAuthenticatedUserPrincipal(); } catch (RuntimeException e) { p = null; }
        if (p == null || (p.getId() != null && p.getId() == 0)) { chain.doFilter(req, res); return; } // anonymous (security decides) or super admin

        String refusal = null;
        if (!p.isLearner() && underAny(path, LEARNER_SELF_PREFIXES)) {
            refusal = "Only students use this page";
        } else if (p.isLearner() && underAny(path, LEARNER_PREFIXES)) {
            if (!eligibility.collegeHasPlacements(p.getCollegeId())) refusal = "Placements are not available at your college";
            else if (!eligibility.learnerInPlacements(p.getId(), p.getCollegeId())) refusal = "Placements are not open for you yet";
        } else if (path.startsWith(TPO)) {
            if (p.getCollegeId() != null && !eligibility.collegeHasPlacements(p.getCollegeId())) refusal = "Placements are not switched on for this college";
        } else {
            Matcher m = RECRUITER_COLLEGE.matcher(path);
            if (m.find()) {
                if (!eligibility.collegeHasPlacements(Integer.valueOf(m.group(1)))) refusal = "This college does not use placements on 42LMS";
            } else if (p.isRecruiter() && p.getCollegeId() != null && underAny(path, RECRUITER_SESSION_PREFIXES)
                    && !eligibility.collegeHasPlacements(p.getCollegeId())) {
                refusal = "This college does not use placements on 42LMS";
            }
        }
        if (refusal != null) {
            res.setStatus(HttpServletResponse.SC_FORBIDDEN);
            res.setContentType("application/json");
            res.getWriter().write("{\"status\":\"FORBIDDEN\",\"message\":\"" + refusal + "\",\"error\":\"" + refusal + "\"}");
            return;
        }
        chain.doFilter(req, res);
    }
}
