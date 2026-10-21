package com._42students.lms.security;

import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.RefreshTokenBlocklistRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * JWT Authentication Filter.
 * Validates JWT tokens on each request and sets the SecurityContext.
 * Runs before Spring Security's authentication filter.
 */
@Slf4j
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    @Autowired
    private JwtService jwtService;
    
    @Autowired
    private FacultyRepository facultyRepository;
    
    @Autowired
    private LearnerRepository learnerRepository;

    @Autowired
    private RefreshTokenBlocklistRepository blocklistRepository;

    // recruiter (industry) identities live in recruiter, not faculty/learner. Optional so unit tests that
    // build this filter by hand keep working; when absent every recruiter token is rejected (fail closed).
    @Autowired(required = false)
    private com._42students.lms.service.recruiter.RecruiterAccessService recruiterAccessService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        
        String authHeader = request.getHeader("Authorization");

        // SSE endpoints cannot send headers — accept token as query param for /subscribe only
        if ((authHeader == null || !authHeader.startsWith("Bearer "))
                && request.getRequestURI() != null
                && request.getRequestURI().endsWith("/notification/subscribe")) {
            String queryToken = request.getParameter("token");
            if (queryToken != null && !queryToken.isEmpty()) {
                authHeader = "Bearer " + queryToken;
            }
        }

        // Browser-native previews/downloads (iframe, object, direct tab) cannot attach the
        // in-memory Authorization header. Accept the HttpOnly access-token cookie set by login,
        // refresh-cookie, and auth handoff flows.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            String cookieToken = readCookie(request, "lms_authenticated");
            if (cookieToken != null && !cookieToken.isEmpty()) {
                authHeader = "Bearer " + cookieToken;
            }
        }

        // No Authorization header - let the request continue (may be public endpoint)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        // Only token validation/authentication-setup is caught here. chain.doFilter()
        // deliberately sits outside this try block — it runs the actual controller and can
        // start streaming the response body. If it were inside the try, any unrelated
        // downstream exception (a slow query, a serialization error, a client disconnect)
        // would land in the generic catch below and call sendUnauthorized(), which then
        // throws IllegalStateException on an already-committed response — masking the real
        // error behind a confusing "authentication error" and leaving the client hanging.
        try {
            // Validate the token
            Claims claims = jwtService.validateToken(token);

            // Ensure it's an access token, not a refresh token
            if (!jwtService.isAccessToken(claims)) {
                sendUnauthorized(response, "Invalid token type");
                return;
            }

            // Extract user info from claims
            Integer userId = jwtService.getUserIdFromClaims(claims);
            String userType = jwtService.getUserTypeFromClaims(claims);
            Integer tokenVersion = jwtService.getTokenVersionFromClaims(claims);
            boolean superAdmin = Boolean.TRUE.equals(claims.get("superAdmin", Boolean.class));

            // Only known account types may authenticate. An unknown or missing userType used to
            // fall through to a faculty lookup and then ROLE_LEARNER; it is now refused outright.
            java.util.Optional<PrincipalType> principalType = PrincipalType.parse(userType);
            if (principalType.isEmpty() || userId == null || tokenVersion == null) {
                sendUnauthorized(response, "Invalid token");
                return;
            }
            if (superAdmin && principalType.get() != PrincipalType.FACULTY) {
                sendUnauthorized(response, "Invalid super-admin token");
                return;
            }

            // Verify tokenVersion matches current user (invalidated on password change).
            // Platform-root principals are synthetic and therefore have no Faculty row.
            Integer currentVersion = getCurrentTokenVersion(userId, principalType.get(), superAdmin);
            if (currentVersion == null) {
                sendUnauthorized(response, "User not found");
                return;
            }

            if (!tokenVersion.equals(currentVersion)) {
                log.debug("Token version mismatch for user {}: token={}, current={}",
                         userId, tokenVersion, currentVersion);
                sendUnauthorized(response, "Token invalidated");
                return;
            }

            // Check if this specific access token has been explicitly revoked (e.g. on logout)
            if (blocklistRepository.existsByJti(claims.getId())) {
                sendUnauthorized(response, "Token revoked");
                return;
            }

            // Build UserPrincipal from claims
            String facultyType = principalType.get() == PrincipalType.FACULTY
                    ? claims.get("facultyType", String.class) : null;
            UserPrincipal principal = new UserPrincipal(
                userId,
                principalType.get().name(),
                facultyType,
                claims.get("orgId", Integer.class),
                claims.get("collegeId", Integer.class),
                tokenVersion
            );
            principal.setSuperAdmin(superAdmin);

            // recruiter: a selected college is only honoured while the grant is still active. A revoked or
            // expired grant makes this token unusable; the client refreshes and lands in Global.
            if (principalType.get() == PrincipalType.RECRUITER && principal.getCollegeId() != null
                    && (recruiterAccessService == null || !recruiterAccessService.hasActiveGrant(userId, principal.getCollegeId()))) {
                sendUnauthorized(response, "RECRUITER_COLLEGE_ACCESS_REVOKED");
                return;
            }
            // Impersonation claims, if present (see SuperAdminUserAdminController.impersonate) —
            // set post-construction since they're not part of UserPrincipal's 6-arg constructor.
            principal.setImpersonatorId(claims.get("impersonatorId", Integer.class));
            principal.setImpersonatorType(claims.get("impersonatorType", String.class));
            principal.setImpersonatorOrgId(claims.get("impersonatorOrgId", Integer.class));
            principal.setImpersonatorCollegeId(claims.get("impersonatorCollegeId", Integer.class));

            // Authorities: ROLE_ADMIN for placement/admin
            List<SimpleGrantedAuthority> authorities = authoritiesFor(principalType.get(), facultyType, superAdmin);
            UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                    principal,
                    null,
                    authorities
                );

            // Set authentication in SecurityContext
            SecurityContextHolder.getContext().setAuthentication(authentication);
            com._42students.lms.configuration.RequestLogContext.putIdentity(principal);
        } catch (ExpiredJwtException e) {
            log.debug("JWT token expired: {}", e.getMessage());
            sendUnauthorized(response, "Token expired");
            return;
        } catch (JwtException e) {
            log.debug("Invalid JWT token: {}", e.getMessage());
            sendUnauthorized(response, "Invalid token");
            return;
        } catch (Exception e) {
            log.error("Error validating JWT token", e);
            sendUnauthorized(response, "Authentication error");
            return;
        }

        // Runs outside the auth try/catch — a downstream failure here is a real application
        // error and should propagate to Spring's normal exception handling, not be reported
        // as an authentication failure.
        chain.doFilter(request, response);
    }
    
    /**
     * Get current token version from database.
     * Explicit super-admin principals have no DB record — return synthetic version 0 without lookup.
     */
    /**
     * Current token version for the user, or null if the token must be rejected.
     *
     * <p>Returns null for a soft-deleted (suspended/deactivated) account as well as a missing
     * one. This previously looked up the row with a bare findById and never consulted isDeleted,
     * so suspending a user had NO effect on any session they already had: their existing access
     * token kept authenticating every request until it expired on its own. Deactivation was
     * effectively "cannot log in again" rather than "is logged out", which is not what the
     * action says it does and not what an admin suspending a compromised account needs.
     *
     * <p>Both callers treat null as "reject", so soft-deleted accounts are refused for every
     * user type, not just the faculty admins whose status screen exposed the gap.
     */
    /**
     * Spring authorities per account type. recruiter gets ROLE_RECRUITER only: never FACULTY or LEARNER, so no
     * existing role rule can match it, and RecruiterFenceFilter confines it to /api/v1/recruiter/**.
     */
    static List<SimpleGrantedAuthority> authoritiesFor(PrincipalType type, String facultyType, boolean superAdmin) {
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        switch (type) {
            case FACULTY:
                // Root authority comes only from the signed explicit capability claim.
                if (superAdmin) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"));
                }
                if ("ADMIN".equalsIgnoreCase(facultyType)) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                }
                if ("TPO".equalsIgnoreCase(facultyType)) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_TPO"));
                }
                authorities.add(new SimpleGrantedAuthority("ROLE_FACULTY"));
                break;
            case LEARNER:
                authorities.add(new SimpleGrantedAuthority("ROLE_LEARNER"));
                break;
            case RECRUITER:
                authorities.add(new SimpleGrantedAuthority("ROLE_RECRUITER"));
                break;
            default:
                throw new IllegalStateException("Unhandled principal type " + type);
        }
        return authorities;
    }

    private Integer getCurrentTokenVersion(Integer userId, PrincipalType type, boolean superAdmin) {
        switch (type) {
            case FACULTY:
                if (superAdmin) {
                    return 0;
                }
                return facultyRepository.findById(userId)
                    .filter(faculty -> !Boolean.TRUE.equals(faculty.getIsDeleted()))
                    .map(faculty -> faculty.getTokenVersion() != null ? faculty.getTokenVersion() : 0)
                    .orElse(null);
            case LEARNER:
                return learnerRepository.findById(userId)
                    .filter(learner -> !Boolean.TRUE.equals(learner.getIsDeleted()))
                    .map(learner -> learner.getTokenVersion() != null ? learner.getTokenVersion() : 0)
                    .orElse(null);
            case RECRUITER:
                // Deleted or suspended recruiter: no version, so the token is refused ("User not found").
                if (recruiterAccessService == null) return null;
                return recruiterAccessService.findUsableRecruiter(userId)
                    .map(recruiter -> recruiter.getTokenVersion() != null ? recruiter.getTokenVersion() : 0)
                    .orElse(null);
            default:
                return null;
        }
    }
    
    /**
     * Send 401 Unauthorized response with JSON body.
     */
    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        // Defense in depth: if the response is already committed (streaming already began,
        // or the client disconnected), writing to it throws IllegalStateException and masks
        // whatever actually went wrong. There's nothing useful left to send at that point.
        if (response.isCommitted()) {
            log.warn("Cannot send 401 ({}) — response already committed", message);
            return;
        }
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"error\":\"" + message + "\"}");
    }

    private String readCookie(HttpServletRequest request, String name) {
        if (request == null || name == null || request.getCookies() == null) return null;
        for (Cookie cookie : request.getCookies()) {
            if (cookie != null && name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
    
    /**
     * Skip filter for specific paths (e.g., login, refresh endpoints).
     * Returning false means the filter will run.
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();

        // Skip authentication filter for these paths
        // /api/v1/public/** must be exempt too (mirrors HostAllowlistFilter's exemption for the
        // same paths): this filter reads whatever HttpOnly `lms_authenticated` cookie the browser
        // happens to be carrying and 401s on it if it's stale (expired, or invalidated by a
        // password change / forced logout elsewhere) — even though the endpoint itself is
        // `permitAll()`. Authorization never gets a say because this filter short-circuits the
        // response before the request reaches Spring Security's authorization stage. A stale
        // cookie on a genuinely anonymous-accessible endpoint like tenant-bootstrap should be
        // ignored, not treated as a hard failure.
        return path.startsWith("/users/login") ||
               path.startsWith("/users/verifyOTP") ||
               path.startsWith("/api/v1/auth/refresh") ||
               path.startsWith("/api/v1/auth/logout") ||
               path.startsWith("/api/v1/learner/login") ||
               path.startsWith("/api/v1/learner/verifyOTP") ||
               path.startsWith("/api/v1/faculty/login") ||
               path.startsWith("/api/v1/faculty/verifyOTP") ||
               path.startsWith("/api/v1/public") ||
               path.startsWith("/lms-backend/api/v1/public") ||
               path.startsWith("/actuator") ||
               path.startsWith("/lms-backend/actuator") ||
               path.startsWith("/swagger-ui") ||
               path.startsWith("/v3/api-docs");
    }
}

