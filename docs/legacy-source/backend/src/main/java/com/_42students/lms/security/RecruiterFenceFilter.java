package com._42students.lms.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Set;

/**
 * Deny-by-default fence for recruiter (industry) principals. A recruiter token may call only the recruiter API and a
 * short list of session endpoints; every other endpoint, including any added in the future,
 * answers 403 before a controller runs. RecruiterFenceSweepTest walks every registered endpoint to prove
 * it. Runs right after JwtAuthenticationFilter. See docs/recruiter-tpo/DESIGN.md.
 *
 * Deliberately not a Spring bean: WebSecurityConfig constructs it, so the security chain can never
 * be built without it (and it is not registered a second time as a plain servlet filter).
 *
 * Paths are matched on the servlet path, which never includes the /lms-backend context path.
 */
@Slf4j
public class RecruiterFenceFilter extends OncePerRequestFilter {

    /** Prefixes a recruiter may reach. */
    static final List<String> ALLOWED_PREFIXES = List.of(
            "/api/v1/recruiter/",
            "/api/v1/public/",
            "/actuator/"
    );

    /** Exact paths a recruiter may reach (session lifecycle and the account switcher). */
    static final Set<String> ALLOWED_EXACT = Set.of(
            "/api/v1/recruiter",
            "/api/v1/auth/refresh",
            "/api/v1/auth/refresh-cookie",
            "/api/v1/auth/logout",
            "/api/v1/auth/logout-cookie",
            "/api/v1/auth/handoff/consume",
            "/api/v1/auth/memberships",
            "/api/v1/auth/switch",
            "/api/v1/auth/switch-token",
            "/api/v1/auth/sessions",
            "/api/v1/client-errors/report"
    );

    /** Own-session revocation: DELETE /api/v1/auth/sessions/{jti}. */
    static final String OWN_SESSION_PREFIX = "/api/v1/auth/sessions/";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal
                && ((UserPrincipal) auth.getPrincipal()).isRecruiter()) {
            UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
            String path = pathWithinApplication(request);
            if (!isAllowedForRecruiter(path)) {
                log.warn("HR fence blocked principalId={} method={} path={}",
                        principal.getId(), request.getMethod(), path);
                deny(response, HttpServletResponse.SC_FORBIDDEN, "RECRUITER_ACCESS_DENIED");
                return;
            }
            // One college per session: the scope is enforced here, for every recruiter endpoint, so a
            // controller that forgets to check can still never serve another college's data.
            Scope scope = scopeFor(path, principal.getCollegeId());
            if (scope == Scope.COLLEGE_REQUIRED) {
                log.warn("HR fence: hub session principalId={} asked for college data path={}", principal.getId(), path);
                deny(response, HttpServletResponse.SC_FORBIDDEN, "RECRUITER_COLLEGE_REQUIRED");
                return;
            }
            if (scope == Scope.OTHER_COLLEGE) {
                log.warn("HR fence: principalId={} collegeId={} asked for another college path={}",
                        principal.getId(), principal.getCollegeId(), path);
                deny(response, HttpServletResponse.SC_NOT_FOUND, "NOT_FOUND");
                return;
            }
        }
        chain.doFilter(request, response);
    }

    private static void deny(HttpServletResponse response, int status, String code) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"error\":\"" + code + "\"}");
    }

    enum Scope { OK, COLLEGE_REQUIRED, OTHER_COLLEGE }

    private static final String COLLEGES_PREFIX = "/api/v1/recruiter/colleges/";

    /** Paths a college-less ("hub", account chooser) recruiter session may reach inside the recruiter API. */
    private static boolean isHubPath(String path) {
        return path.equals("/api/v1/recruiter/me")
                || path.equals("/api/v1/recruiter/pending-invites")
                || path.startsWith("/api/v1/recruiter/pending-invites/");
    }

    /**
     * Where a recruiter session may go, given the college it was issued for. A hub session (no college) is
     * only an account chooser plus pending invitations. A college session reaches that college and
     * nothing else: a different college id in the path answers 404, exactly like a college that does
     * not exist. Non-recruiter-API paths (session lifecycle, public) are not scoped here.
     */
    static Scope scopeFor(String rawPath, Integer sessionCollegeId) {
        if (rawPath == null) return Scope.OK;
        String trimmed = rawPath.length() > 1 && rawPath.endsWith("/") ? rawPath.substring(0, rawPath.length() - 1) : rawPath;
        String path = trimmed;
        boolean recruiterApi = path.equals("/api/v1/recruiter") || path.startsWith("/api/v1/recruiter/");
        if (!recruiterApi) return Scope.OK;
        if (sessionCollegeId == null) return isHubPath(path) ? Scope.OK : Scope.COLLEGE_REQUIRED;
        // Pending invitations name other colleges: only the chooser (hub) session may see them.
        if (path.equals("/api/v1/recruiter/pending-invites") || path.startsWith("/api/v1/recruiter/pending-invites/")) {
            return Scope.OTHER_COLLEGE;
        }
        if (path.startsWith(COLLEGES_PREFIX)) {
            String rest = path.substring(COLLEGES_PREFIX.length());
            int slash = rest.indexOf('/');
            String id = slash < 0 ? rest : rest.substring(0, slash);
            if (!id.equals(String.valueOf(sessionCollegeId))) return Scope.OTHER_COLLEGE;
        }
        return Scope.OK;
    }

    static String pathWithinApplication(HttpServletRequest request) {
        String servletPath = request.getServletPath() != null ? request.getServletPath() : "";
        String pathInfo = request.getPathInfo() != null ? request.getPathInfo() : "";
        String path = servletPath + pathInfo;
        if (path.isEmpty()) {
            String uri = request.getRequestURI() != null ? request.getRequestURI() : "";
            String context = request.getContextPath() != null ? request.getContextPath() : "";
            path = !context.isEmpty() && uri.startsWith(context) ? uri.substring(context.length()) : uri;
        }
        return path;
    }

    static boolean isAllowedForRecruiter(String rawPath) {
        if (rawPath == null) return false;
        // Refuse traversal / encoded tricks outright rather than trying to normalise them.
        if (rawPath.contains("..") || rawPath.contains("//") || rawPath.contains(";") || rawPath.contains("%")) {
            return false;
        }
        String path = rawPath.length() > 1 && rawPath.endsWith("/")
                ? rawPath.substring(0, rawPath.length() - 1) : rawPath;
        if (ALLOWED_EXACT.contains(path)) return true;
        if (path.startsWith(OWN_SESSION_PREFIX) && path.indexOf('/', OWN_SESSION_PREFIX.length()) < 0) return true;
        for (String prefix : ALLOWED_PREFIXES) {
            if (path.startsWith(prefix)) return true;
        }
        return false;
    }
}
