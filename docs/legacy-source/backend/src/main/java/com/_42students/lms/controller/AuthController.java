package com._42students.lms.controller;

import com._42students.lms.dto.request.RefreshRequest;
import com._42students.lms.dto.request.SwitchOrgRequest;
import com._42students.lms.dto.response.AuthResponse;
import com._42students.lms.dto.response.TokenPair;
import com._42students.lms.model.Faculty;
import com._42students.lms.model.Learner;
import com._42students.lms.model.RefreshTokenBlocklist;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.RefreshTokenBlocklistRepository;
import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.security.JwtService;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.TokenVersionService;
import com._42students.lms.util.SecurityContextUtil;
import com._42students.lms.util.CookieUtil;
import com._42students.lms.util.RequestHostUtil;
import com._42students.lms.service.OrgMembershipService;
import com._42students.lms.service.AppSettingsService;
import com._42students.lms.model.AuthHandoffToken;
import com._42students.lms.repository.AuthHandoffTokenRepository;
import com._42students.lms.access.ScopeResolutionService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Authentication Controller for JWT token management.
 * Handles token refresh and logout endpoints.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private static final long REFRESH_REPLAY_GRACE_MILLIS = 10000L;
    private static final ConcurrentHashMap<String, RefreshReplay> REFRESH_REPLAY_CACHE = new ConcurrentHashMap<>();
    
    @Autowired
    private JwtService jwtService;

    @Autowired(required = false)
    private OrgMembershipService orgMembershipService;
    
    @Autowired
    private RefreshTokenBlocklistRepository blocklistRepository;
    
    @Autowired
    private FacultyRepository facultyRepository;
    
    @Autowired
    private LearnerRepository learnerRepository;

    @Autowired(required = false)
    private TokenVersionService tokenVersionService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired
    private AccessControlService accessControlService;

    @org.springframework.beans.factory.annotation.Value("${app.cookie.domain:}")
    private String cookieDomain;

    @Autowired(required = false)
    private AppSettingsService appSettingsService;

    @Autowired(required = false)
    private ScopeResolutionService scopeResolutionService;

    @Autowired(required = false)
    private com._42students.lms.service.UserSessionService userSessionService;

    @Autowired(required = false)
    private AuthHandoffTokenRepository authHandoffTokenRepository;

    @Autowired(required = false)
    private Environment environment;

    // recruiter (industry) sessions. Optional so tests that build this controller by hand keep working;
    // when absent every recruiter branch below refuses (fail closed). See docs/recruiter-tpo/DESIGN.md.
    @Autowired(required = false)
    private com._42students.lms.service.recruiter.RecruiterAccessService recruiterAccessService;

    @Autowired(required = false)
    private com._42students.lms.service.recruiter.RecruiterAuthService recruiterAuthService;

    /** Gradings one staff member may run per day (on each backend pod; see aiGradingAccess). */
    static final int AI_GRADING_DAILY_LIMIT = 25;
    private final java.util.concurrent.ConcurrentHashMap<String, java.util.concurrent.atomic.AtomicInteger> aiGradingUses = new java.util.concurrent.ConcurrentHashMap<>();

    /**
     * BE-0188/BE-0189: the Next.js AI-grading routes call OpenAI with the platform's key, and Next can't check a JWT signature.
     * They ask here instead, forwarding the caller's cookie: this filter chain verifies the token (signature, expiry, token
     * version), only staff pass, and {@code ?use=true} (sent right before a paid grading) counts against a daily allowance.
     * The allowance is kept in memory, so it is per backend pod and resets on restart: a ceiling on spend, not billing.
     */
    @GetMapping("/ai-grading-access")
    public ResponseEntity<?> aiGradingAccess(@RequestParam(name = "use", defaultValue = "false") boolean use) {
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        if (!principal.isFaculty() && !principal.isSuperAdmin()) {
            return ResponseEntity.status(403).body(Map.of("error", "AI grading is for faculty and admins."));
        }
        String today = java.time.LocalDate.now(ZoneId.of("Asia/Kolkata")).toString();
        String key = principal.getUserType() + ":" + principal.getId() + ":" + today;
        if (use) {
            aiGradingUses.keySet().removeIf(k -> !k.endsWith(":" + today));
            int n = aiGradingUses.computeIfAbsent(key, k -> new java.util.concurrent.atomic.AtomicInteger()).incrementAndGet();
            if (n > AI_GRADING_DAILY_LIMIT) {
                return ResponseEntity.status(429).body(Map.of("error", "You have used today's AI grading allowance (" + AI_GRADING_DAILY_LIMIT + "). Try again tomorrow."));
            }
        }
        java.util.concurrent.atomic.AtomicInteger used = aiGradingUses.get(key);
        Map<String, Object> out = new HashMap<>();
        out.put("userId", principal.getId());
        out.put("userType", principal.getUserType());
        out.put("remainingToday", Math.max(0, AI_GRADING_DAILY_LIMIT - (used == null ? 0 : used.get())));
        return ResponseEntity.ok(out);
    }

    @GetMapping("/memberships")
    public ResponseEntity<?> memberships(javax.servlet.http.HttpServletRequest httpRequest) {
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        if (orgMembershipService == null) {
            return ResponseEntity.ok(Map.of("memberships", java.util.Collections.emptyList()));
        }
        Map<String, Object> out = new HashMap<>();
        java.util.List<java.util.Map<String, Object>> memberships = orgMembershipService.listMemberships(principal, inferUiHost(httpRequest));
        out.put("memberships", memberships);
        try {
            String currentKey = orgMembershipService.buildMembershipKey(
                    principal.getId(),
                    principal.getUserType(),
                    principal.getCollegeId(),
                    principal.getFacultyType()
            );
            if (currentKey != null && !currentKey.trim().isEmpty()) {
                out.put("currentMembershipKey", currentKey);
                // Also return the current membership object so FE never guesses wrongly in multi-role scenarios.
                try {
                    java.util.Map<String, Object> current = null;
                    for (java.util.Map<String, Object> m : memberships) {
                        Object k = m != null ? m.get("key") : null;
                        if (k != null && currentKey.equalsIgnoreCase(String.valueOf(k))) {
                            current = m;
                            break;
                        }
                    }
                    if (current != null) out.put("currentMembership", current);
                } catch (Exception ignored2) {}
            }
        } catch (Exception ignored) {}
        out.put("domainEnforcementEnabled", domainEnforcementEnabled());
        out.put("requireVerifiedDomains", requireVerifiedDomains());
        out.put("strictDomainVerificationEnabled", strictDomainVerificationEnabled());
        out.put("trustForwardedHeaders", com._42students.lms.util.RequestHostUtil.trustForwardedHeaders());
        return ResponseEntity.ok(out);
    }

    private String inferUiHost(javax.servlet.http.HttpServletRequest req) {
        if (req == null) return null;
        try {
            String origin = req.getHeader("Origin");
            if (origin != null && !origin.trim().isEmpty()) {
                java.net.URI u = java.net.URI.create(origin.trim());
                return u.getAuthority();
            }
        } catch (Exception ignored) {}
        return null;
    }

    private boolean domainEnforcementEnabled() {
        String sys = System.getProperty("lms.domain.enforcement.enabled");
        if (sys != null && !sys.trim().isEmpty()) return !"false".equalsIgnoreCase(sys.trim());
        String env = System.getenv("LMS_DOMAIN_ENFORCEMENT_ENABLED");
        if (env != null && !env.trim().isEmpty()) return !"false".equalsIgnoreCase(env.trim());
        return true;
    }

    private boolean requireVerifiedDomains() {
        String sys = System.getProperty("lms.domain.require.verified");
        if (sys != null && !sys.trim().isEmpty()) return "true".equalsIgnoreCase(sys.trim());
        String env = System.getenv("LMS_REQUIRE_VERIFIED_DOMAINS");
        if (env != null && !env.trim().isEmpty()) return "true".equalsIgnoreCase(env.trim());
        return true;
    }

    private boolean strictDomainVerificationEnabled() {
        String env = System.getenv("LMS_STRICT_DOMAIN_VERIFICATION");
        return env != null && "true".equalsIgnoreCase(env.trim());
    }

    /**
     * Switch active org/college scope and issue a new token pair, then frontend redirects to target domain.
     */
    @PostMapping("/switch")
    public ResponseEntity<?> switchOrg(@Valid @RequestBody SwitchOrgRequest request,
                                       javax.servlet.http.HttpServletRequest httpRequest,
                                       javax.servlet.http.HttpServletResponse httpResponse) {
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        if (orgMembershipService == null) {
            return ResponseEntity.status(503).body(Map.of("error", "Service unavailable"));
        }
        Optional<Map<String, Object>> targetOpt = orgMembershipService.resolveTarget(principal, request.getTargetKey());
        if (targetOpt.isEmpty()) {
            return ResponseEntity.status(403).body(Map.of("error", "Not a member of target org"));
        }
        Map<String, Object> target = targetOpt.orElse(java.util.Collections.emptyMap());
        if (isRecruiterTarget(target)) {
            RecruiterSwitch recruiter = resolveRecruiterSwitch(target);
            if (recruiter == null) {
                return ResponseEntity.status(403).body(Map.of("error", "Not a member of target org"));
            }
            return completeSwitch(principal, target, recruiter.collegeId, recruiter.organizationId, request.getTargetKey(),
                    () -> recruiterAuthService.issueTokens(recruiter.user, recruiter.collegeId), httpRequest, httpResponse);
        }
        Integer targetOrgId = (Integer) target.get("organizationId");
        Integer targetCollegeId = (Integer) target.get("collegeId");
        if (targetOrgId == null || targetCollegeId == null) {
            return ResponseEntity.status(503).body(Map.of("error", "Invalid membership target"));
        }
        Integer targetUserId = null;
        try {
            Object uid = target.get("userId");
            if (uid instanceof Number) targetUserId = ((Number) uid).intValue();
            else if (uid != null) targetUserId = Integer.parseInt(String.valueOf(uid));
        } catch (Exception ignored) {}
        if (targetUserId == null) {
            return ResponseEntity.status(403).body(Map.of("error", "Not a member of target org"));
        }

        // Allow role switching: membership can represent a learner or instructor account.
        String targetUserType = null;
        String targetFacultyType = null;
        try {
            Object ut = target.get("userType");
            if (ut != null) targetUserType = String.valueOf(ut);
            Object ft = target.get("facultyType");
            if (ft != null) targetFacultyType = String.valueOf(ft);
        } catch (Exception ignored) {}
        if (targetUserType == null || targetUserType.trim().isEmpty()) {
            targetUserType = principal.getUserType();
        }

        Integer targetTokenVersion = resolveTargetTokenVersion(targetUserId, targetUserType);
        if (targetTokenVersion == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Target user not found"));
        }

        UserPrincipal switched = new UserPrincipal(
                targetUserId,
                targetUserType,
                targetFacultyType,
                targetOrgId,
                targetCollegeId,
                targetTokenVersion
        );

        return completeSwitch(principal, target, targetCollegeId, targetOrgId, request.getTargetKey(),
                () -> jwtService.generateTokens(switched), httpRequest, httpResponse);
    }

    /**
     * Shared tail of /switch: check the target host, mint tokens, prepare a cross-host handoff and
     * set cookies. Used for learner/faculty targets and for recruiter targets (whose scope may be Global).
     */
    private ResponseEntity<?> completeSwitch(UserPrincipal principal,
                                             Map<String, Object> target,
                                             Integer targetCollegeId,
                                             Integer targetOrgId,
                                             String targetKey,
                                             java.util.function.Supplier<TokenPair> tokenSupplier,
                                             javax.servlet.http.HttpServletRequest httpRequest,
                                             javax.servlet.http.HttpServletResponse httpResponse) {
        Object hostObj = target.get("host");
        String targetHost = hostObj != null ? String.valueOf(hostObj).trim() : null;
        if (targetHost == null || targetHost.isEmpty()) {
            // If we can't compute a host, switching would strand the user (no redirect target).
            log.warn("Org switch blocked: TARGET_HOST_MISSING principalId={} targetCollegeId={} targetOrgId={} targetKey={}",
                    principal.getId(), targetCollegeId, targetOrgId, targetKey);
            return ResponseEntity.status(503).body(Map.of("error", "TARGET_HOST_MISSING"));
        }

        TokenPair tokens = tokenSupplier.get();

        // If switching implies navigating to a different host, ensure a handoff token is available.
        // Without handoff, user will land on the target host without cookies and appear logged out.
        String requestHost = RequestHostUtil.getNormalizedHost(httpRequest);
        String normalizedTargetHost = RequestHostUtil.normalizeHostOnly(targetHost);
        boolean hostChange = requestHost != null && normalizedTargetHost != null && !requestHost.equalsIgnoreCase(normalizedTargetHost);

        // Cross-domain handoff token (needed when switching between different parent domains).
        // Frontend will redirect to targetHost + /auth/handoff?token=... and consume it there to set cookies.
        String handoffToken = null;
        if (authHandoffTokenRepository != null) {
            try {
                AuthHandoffToken ht = new AuthHandoffToken();
                ht.setToken(java.util.UUID.randomUUID().toString().replace("-", ""));
                ht.setAccessToken(tokens.getAccessToken());
                ht.setRefreshToken(tokens.getRefreshToken());
                ht.setExpiresAt(java.time.LocalDateTime.now().plusMinutes(2));
                ht.setUsed(false);
                ht.setIsDeleted(false);
                authHandoffTokenRepository.save(ht);
                handoffToken = ht.getToken();
            } catch (Exception ignored) {}
        }
        if (hostChange && (handoffToken == null || handoffToken.trim().isEmpty())) {
            log.warn("Org switch blocked: HANDOFF_UNAVAILABLE principalId={} targetCollegeId={} targetOrgId={} requestHost={} targetHost={}",
                    principal.getId(), targetCollegeId, targetOrgId, requestHost, targetHost);
            return ResponseEntity.status(503).body(Map.of("error", "HANDOFF_UNAVAILABLE"));
        }

        // Only set cookies after we know the switch is actionable (prevents partial switching on errors).
        setAuthCookies(httpRequest, httpResponse, tokens);
        Map<String, Object> out = new HashMap<>();
        out.put("accessToken", tokens.getAccessToken());
        out.put("refreshToken", tokens.getRefreshToken());
        out.put("expiresIn", tokens.getExpiresIn());
        out.put("targetHost", targetHost);
        out.put("hostChange", hostChange);
        out.put("switchType", hostChange ? "CROSS_HOST" : "SAME_HOST");
        out.put("targetKey", target.get("key"));
        out.put("collegeId", targetCollegeId);
        out.put("organizationId", targetOrgId);
        if (handoffToken != null && !handoffToken.trim().isEmpty()) {
            out.put("handoffToken", handoffToken);
        }
        return ResponseEntity.ok(out);
    }

    private boolean isRecruiterTarget(Map<String, Object> target) {
        return target != null && com._42students.lms.model.Recruiter.isUserType(String.valueOf(target.get("userType")));
    }

    private static final class RecruiterSwitch {
        private final com._42students.lms.model.Recruiter user;
        private final Integer collegeId;
        private final Integer organizationId;

        private RecruiterSwitch(com._42students.lms.model.Recruiter user, Integer collegeId, Integer organizationId) {
            this.user = user;
            this.collegeId = collegeId;
            this.organizationId = organizationId;
        }
    }

    /**
     * Re-validate a recruiter switch target against the database: the identity must be usable and, for a
     * college target, the grant must be active right now. Null means refuse.
     */
    private RecruiterSwitch resolveRecruiterSwitch(Map<String, Object> target) {
        if (recruiterAccessService == null || recruiterAuthService == null || target == null) return null;
        Integer recruiterId = target.get("userId") instanceof Number ? ((Number) target.get("userId")).intValue() : null;
        com._42students.lms.model.Recruiter recruiter = recruiterAccessService.findUsableRecruiter(recruiterId).orElse(null);
        if (recruiter == null) return null;
        Integer collegeId = target.get("collegeId") instanceof Number ? ((Number) target.get("collegeId")).intValue() : null;
        if (collegeId != null && !recruiterAccessService.hasActiveGrant(recruiter.getId(), collegeId)) return null;
        return new RecruiterSwitch(recruiter, collegeId, collegeId != null ? recruiterAccessService.organizationOf(collegeId) : null);
    }

    private Integer resolveTargetTokenVersion(Integer userId, String userType) {
        if (userId == null || userType == null || userType.trim().isEmpty()) {
            return null;
        }
        if ("LEARNER".equalsIgnoreCase(userType)) {
            return learnerRepository.findById(userId)
                    .map(learner -> learner.getTokenVersion() != null ? learner.getTokenVersion() : 0)
                    .orElse(null);
        }
        if ("FACULTY".equalsIgnoreCase(userType)) {
            return facultyRepository.findById(userId)
                    .map(faculty -> faculty.getTokenVersion() != null ? faculty.getTokenVersion() : 0)
                    .orElse(null);
        }
        if (com._42students.lms.model.Recruiter.isUserType(userType) && recruiterAccessService != null) {
            return recruiterAccessService.findUsableRecruiter(userId)
                    .map(recruiter -> recruiter.getTokenVersion() != null ? recruiter.getTokenVersion() : 0)
                    .orElse(null);
        }
        return null;
    }

    /**
     * Mobile-friendly variant of switch: issue a new token pair scoped to the selected membership,
     * without requiring a redirect targetHost / cross-domain handoff.
     *
     * Intended for native mobile apps that always start in GLOBAL mode and need to switch inside the app.
     */
    @PostMapping("/switch-token")
    public ResponseEntity<?> switchToken(@Valid @RequestBody SwitchOrgRequest request,
                                         javax.servlet.http.HttpServletRequest httpRequest,
                                         javax.servlet.http.HttpServletResponse httpResponse) {
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        if (orgMembershipService == null) {
            return ResponseEntity.status(503).body(Map.of("error", "Service unavailable"));
        }

        Optional<Map<String, Object>> targetOpt = orgMembershipService.resolveTarget(principal, request.getTargetKey());
        if (targetOpt.isEmpty()) {
            return ResponseEntity.status(403).body(Map.of("error", "Not a member of target org"));
        }
        Map<String, Object> target = targetOpt.orElse(java.util.Collections.emptyMap());
        if (isRecruiterTarget(target)) {
            RecruiterSwitch recruiter = resolveRecruiterSwitch(target);
            if (recruiter == null) {
                return ResponseEntity.status(403).body(Map.of("error", "Not a member of target org"));
            }
            TokenPair recruiterTokens = recruiterAuthService.issueTokens(recruiter.user, recruiter.collegeId);
            setAuthCookies(httpRequest, httpResponse, recruiterTokens);
            Map<String, Object> recruiterOut = new HashMap<>();
            recruiterOut.put("accessToken", recruiterTokens.getAccessToken());
            recruiterOut.put("refreshToken", recruiterTokens.getRefreshToken());
            recruiterOut.put("expiresIn", recruiterTokens.getExpiresIn());
            recruiterOut.put("targetKey", target.get("key"));
            recruiterOut.put("collegeId", recruiter.collegeId);
            recruiterOut.put("organizationId", recruiter.organizationId);
            return ResponseEntity.ok(recruiterOut);
        }
        Integer targetOrgId = (Integer) target.get("organizationId");
        Integer targetCollegeId = (Integer) target.get("collegeId");
        if (targetOrgId == null || targetCollegeId == null) {
            return ResponseEntity.status(503).body(Map.of("error", "SCOPE_RESOLUTION_FAILED"));
        }

        Integer targetUserId = principal.getId();
        String targetUserType = principal.getUserType();
        String targetFacultyType = principal.getFacultyType();
        try {
            Object uid = target.get("userId");
            if (uid instanceof Integer) targetUserId = (Integer) uid;
            Object ut = target.get("userType");
            if (ut != null) targetUserType = String.valueOf(ut);
            Object ft = target.get("facultyType");
            if (ft != null) targetFacultyType = String.valueOf(ft);
        } catch (Exception ignored) {}
        if (targetUserType == null || targetUserType.trim().isEmpty()) {
            targetUserType = principal.getUserType();
        }

        UserPrincipal switched = new UserPrincipal(
                targetUserId,
                targetUserType,
                targetFacultyType,
                targetOrgId,
                targetCollegeId,
                resolveTargetTokenVersion(targetUserId, targetUserType)
        );

        TokenPair tokens = jwtService.generateTokens(switched);
        // Harmless for mobile; useful for web clients that also call this endpoint.
        setAuthCookies(httpRequest, httpResponse, tokens);

        Map<String, Object> out = new HashMap<>();
        out.put("accessToken", tokens.getAccessToken());
        out.put("refreshToken", tokens.getRefreshToken());
        out.put("expiresIn", tokens.getExpiresIn());
        out.put("targetKey", target.get("key"));
        out.put("collegeId", targetCollegeId);
        out.put("organizationId", targetOrgId);
        return ResponseEntity.ok(out);
    }

    @PostMapping("/handoff/consume")
    public ResponseEntity<?> consumeHandoff(@RequestBody(required = false) Map<String, Object> body,
                                            javax.servlet.http.HttpServletRequest httpRequest,
                                            javax.servlet.http.HttpServletResponse httpResponse) {
        if (authHandoffTokenRepository == null) {
            return ResponseEntity.status(503).body(Map.of("error", "Service unavailable"));
        }
        String token = body != null && body.get("token") instanceof String ? (String) body.get("token") : null;
        if (token == null || token.trim().isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("error", "token required"));
        }
        AuthHandoffToken ht = authHandoffTokenRepository.findByToken(token.trim()).orElse(null);
        if (ht == null || Boolean.TRUE.equals(ht.getIsDeleted()) || Boolean.TRUE.equals(ht.getUsed())) {
            return ResponseEntity.status(404).body(Map.of("error", "Invalid token"));
        }
        if (ht.getExpiresAt() != null && ht.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
            ht.setUsed(true);
            authHandoffTokenRepository.save(ht);
            return ResponseEntity.status(410).body(Map.of("error", "Expired token"));
        }
        // BE-0190: single use, atomically. Only the request whose conditional update flips used=false -> true gets the session.
        if (authHandoffTokenRepository.claimUnused(ht.getId()) != 1) {
            return ResponseEntity.status(404).body(Map.of("error", "Invalid token"));
        }

        TokenPair tokens = new TokenPair(ht.getAccessToken(), ht.getRefreshToken(), null, jwtService.getAccessTokenExpirationSeconds());
        setAuthCookies(httpRequest, httpResponse, tokens);
        Object user = null;
        try {
            Claims claims = jwtService.validateToken(ht.getAccessToken());
            Integer userId = jwtService.getUserIdFromClaims(claims);
            String userType = jwtService.getUserTypeFromClaims(claims);
            if ("LEARNER".equalsIgnoreCase(userType)) {
                user = learnerRepository.findById(userId).orElse(null);
            } else if ("FACULTY".equalsIgnoreCase(userType)) {
                user = facultyRepository.findById(userId).orElse(null);
            } else if (com._42students.lms.model.Recruiter.isUserType(userType) && recruiterAccessService != null && recruiterAuthService != null) {
                Integer recruiterCollegeId = claims.get("collegeId", Integer.class);
                user = recruiterAccessService.findUsableRecruiter(userId)
                        .map(recruiter -> recruiterAuthService.authUser(recruiter, recruiterCollegeId))
                        .orElse(null);
            }
        } catch (Exception e) {
            log.warn("Failed to hydrate handoff auth response for token {}", token, e);
        }
        if (user != null) {
            return ResponseEntity.ok(Map.of(
                    "ok", true,
                    "auth", AuthResponse.of(user, tokens)
            ));
        }
        return ResponseEntity.ok(Map.of(
                "ok", true,
                "accessToken", tokens.getAccessToken(),
                "refreshToken", tokens.getRefreshToken(),
                "expiresIn", tokens.getExpiresIn()
        ));
    }

    /**
     * Super-admin only: set active scope (org/college) and re-issue tokens/cookies.
     * This is the "god tier" setup for /vasan so everything becomes JWT-scoped.
     */
    @PostMapping("/superadmin/scope")
    public ResponseEntity<?> superAdminScope(@RequestBody(required = false) Map<String, Object> body,
                                             javax.servlet.http.HttpServletRequest httpRequest,
                                             javax.servlet.http.HttpServletResponse httpResponse) {
        try {
            if (jwtService == null) {
                return ResponseEntity.status(503).body(Map.of("error", "Service unavailable"));
            }
            UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
            if (principal == null || !accessControlService.isSuperAdmin(principal)) {
                return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
            }
            Integer orgId = null;
            Integer collegeId = null;
            try {
                Object o = body != null ? body.get("organizationId") : null;
                Object c = body != null ? body.get("collegeId") : null;
                if (o instanceof Number) orgId = ((Number) o).intValue();
                if (c instanceof Number) collegeId = ((Number) c).intValue();
                if (orgId == null && o instanceof String && !((String) o).trim().isEmpty()) {
                    orgId = Integer.parseInt(((String) o).trim());
                }
                if (collegeId == null && c instanceof String && !((String) c).trim().isEmpty()) {
                    collegeId = Integer.parseInt(((String) c).trim());
                }
            } catch (Exception ignored) {}

            if (orgId != null && orgId <= 0) orgId = null;
            if (collegeId != null && collegeId <= 0) collegeId = null;

            // Validate college->org consistency if both provided
            if (collegeId != null && scopeResolutionService != null) {
                Integer resolvedOrg = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                if (resolvedOrg == null) {
                    return ResponseEntity.status(400).body(Map.of("error", "Invalid collegeId"));
                }
                if (orgId != null && !orgId.equals(resolvedOrg)) {
                    return ResponseEntity.status(400).body(Map.of("error", "collegeId does not belong to organizationId"));
                }
                if (orgId == null) orgId = resolvedOrg;
            }

            UserPrincipal scoped = UserPrincipal.forSuperAdminScoped(orgId, collegeId);

            // The refresh token minted here MUST carry contactMobile. refreshInternal's
            // super-admin fast path is gated on that claim, and super-admin is id=0 with no
            // Faculty row — so a refresh token without it falls through to
            // facultyRepository.findById(0) -> null -> 401 "User not found". Because the client
            // stores whatever refreshToken this endpoint returns, minting a claim-less one here
            // (the single-arg generateTokens overload builds a refresh token with minimal claims)
            // silently replaced the good login refresh token with a dead one: scoping into a
            // college then navigating logged the super-admin out on the next refresh.
            String contactMobile = null;
            try {
                String existingRefresh = CookieUtil.readCookie(httpRequest, "lms_refresh_token");
                if (existingRefresh != null && !existingRefresh.isEmpty()) {
                    Claims existingClaims = jwtService.validateToken(existingRefresh);
                    contactMobile = jwtService.getStringClaim(existingClaims, "contactMobile");
                }
            } catch (Exception ignored) {}

            Map<String, Object> out = new HashMap<>();
            Map<String, Object> refreshClaims = new HashMap<>();
            if (contactMobile != null && !contactMobile.isEmpty()) {
                refreshClaims.put("contactMobile", contactMobile);
            }
            // Always rotate both tokens when scope changes. JwtService signs orgId/collegeId into
            // the refresh token, so a later refresh reconstructs the same scope instead of
            // silently widening a college-scoped root session back to global.
            TokenPair tokens = jwtService.generateTokens(scoped, refreshClaims);
            setAuthCookies(httpRequest, httpResponse, tokens);
            out.put("refreshToken", tokens.getRefreshToken());
            out.put("accessToken", tokens.getAccessToken());
            out.put("expiresIn", tokens.getExpiresIn());
            out.put("organizationId", orgId);
            out.put("collegeId", collegeId);
            return ResponseEntity.ok(out);
        } catch (Exception e) {
            log.error("Superadmin scope set failed body={}", body, e);
            return ResponseEntity.status(500).body(Map.of("error", "SCOPE_SET_FAILED"));
        }
    }

    /**
     * Refresh using refresh token cookie (cross-subdomain restore).
     */
    @PostMapping("/refresh-cookie")
    public ResponseEntity<?> refreshCookie(javax.servlet.http.HttpServletRequest httpRequest,
                                           javax.servlet.http.HttpServletResponse httpResponse) {
        String refreshToken = CookieUtil.readCookie(httpRequest, "lms_refresh_token");
        if (refreshToken == null || refreshToken.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Refresh token required"));
        }
        RefreshRequest req = new RefreshRequest();
        req.setRefreshToken(refreshToken);
        return refreshInternal(req, httpRequest, httpResponse, false);
    }

    /**
     * Clear auth cookies (used on logout).
     */
    @PostMapping(value = "/logout-cookie", consumes = org.springframework.http.MediaType.ALL_VALUE)
    public ResponseEntity<?> logoutCookie(javax.servlet.http.HttpServletRequest httpRequest,
                                          javax.servlet.http.HttpServletResponse httpResponse,
                                          @RequestBody(required = false) java.util.Map<String, Object> body) {
        // Best-effort: also call existing logout logic if refreshToken present (body or cookie)
        try {
            String refreshToken = null;
            if (body != null && body.get("refreshToken") instanceof String) refreshToken = (String) body.get("refreshToken");
            if (refreshToken == null || refreshToken.isEmpty()) refreshToken = CookieUtil.readCookie(httpRequest, "lms_refresh_token");
            if (refreshToken != null && !refreshToken.isEmpty()) {
                RefreshRequest req = new RefreshRequest();
                req.setRefreshToken(refreshToken);
                logout(req, httpRequest.getHeader("Authorization"));
            }
        } catch (Exception ignored) {}

        boolean secure = CookieUtil.isSecureRequest(httpRequest);
        String configuredDomain = (appSettingsService != null) ? appSettingsService.getCookieDomain() : cookieDomain;
        String cd = CookieUtil.resolveCookieDomain(httpRequest, configuredDomain);
        String sameSite = (appSettingsService != null) ? appSettingsService.getCookieSameSite() : "Lax";
        clearAuthCookie(httpResponse, "lms_authenticated", cd, secure, sameSite);
        clearAuthCookie(httpResponse, "lms_refresh_token", cd, secure, sameSite);
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    private void clearAuthCookie(javax.servlet.http.HttpServletResponse response,
                                 String name,
                                 String domain,
                                 boolean secure,
                                 String sameSite) {
        CookieUtil.setCookie(response, name, "", 0, domain, secure, true, sameSite);
        if (domain != null && !domain.trim().isEmpty()) {
            CookieUtil.setCookie(response, name, "", 0, "", secure, true, sameSite);
        }
    }

    private TokenPair extractTokenPair(Object responseBody) {
        if (responseBody == null) return null;
        if (responseBody instanceof AuthResponse) {
            AuthResponse auth = (AuthResponse) responseBody;
            if (auth.getAccessToken() == null || auth.getRefreshToken() == null) return null;
            return new TokenPair(auth.getAccessToken(), auth.getRefreshToken(), null, auth.getExpiresIn());
        }
        if (!(responseBody instanceof Map)) return null;
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) responseBody;
        Object dataObj = body.get("data");
        Object authObj = dataObj != null ? dataObj : body;
        if (!(authObj instanceof Map)) return null;
        @SuppressWarnings("unchecked")
        Map<String, Object> auth = (Map<String, Object>) authObj;
        Object at = auth.get("accessToken");
        Object rt = auth.get("refreshToken");
        Object exp = auth.get("expiresIn");
        if (!(at instanceof String) || !(rt instanceof String)) return null;
        long expiresIn = exp instanceof Number ? ((Number) exp).longValue() : jwtService.getAccessTokenExpirationSeconds();
        return new TokenPair((String) at, (String) rt, null, expiresIn);
    }

    private void setAuthCookies(javax.servlet.http.HttpServletRequest request,
                                javax.servlet.http.HttpServletResponse response,
                                TokenPair tokens) {
        if (response == null || tokens == null) return;
        boolean secure = CookieUtil.isSecureRequest(request);
        String configuredDomain = (appSettingsService != null) ? appSettingsService.getCookieDomain() : cookieDomain;
        String cd = CookieUtil.resolveCookieDomain(request, configuredDomain);
        String sameSite = (appSettingsService != null) ? appSettingsService.getCookieSameSite() : "Lax";
        CookieUtil.setCookie(response, "lms_authenticated",
                tokens.getAccessToken(),
                (int) tokens.getExpiresIn(),
                cd,
                secure,
                true,
                sameSite);
        CookieUtil.setCookie(response, "lms_refresh_token",
                tokens.getRefreshToken(),
                (int) jwtService.getRefreshExpirationSeconds(),
                cd,
                secure,
                true,
                sameSite);
    }

    /**
     * Refresh the access cookie without touching the refresh cookie. Used by /superadmin/scope
     * when it deliberately leaves the existing refresh token in place.
     */
    private void setAccessCookieOnly(javax.servlet.http.HttpServletRequest request,
                                     javax.servlet.http.HttpServletResponse response,
                                     TokenPair tokens) {
        if (response == null || tokens == null) return;
        boolean secure = CookieUtil.isSecureRequest(request);
        String configuredDomain = (appSettingsService != null) ? appSettingsService.getCookieDomain() : cookieDomain;
        String cd = CookieUtil.resolveCookieDomain(request, configuredDomain);
        String sameSite = (appSettingsService != null) ? appSettingsService.getCookieSameSite() : "Lax";
        CookieUtil.setCookie(response, "lms_authenticated",
                tokens.getAccessToken(),
                (int) tokens.getExpiresIn(),
                cd,
                secure,
                true,
                sameSite);
    }

    private static class RefreshReplay {
        private final AuthResponse response;
        private final long expiresAtMillis;

        private RefreshReplay(AuthResponse response, long expiresAtMillis) {
            this.response = response;
            this.expiresAtMillis = expiresAtMillis;
        }
    }

    private void rememberRefreshReplay(String oldJti, AuthResponse response) {
        if (oldJti == null || oldJti.trim().isEmpty() || response == null) return;
        REFRESH_REPLAY_CACHE.put(oldJti, new RefreshReplay(
                response,
                System.currentTimeMillis() + REFRESH_REPLAY_GRACE_MILLIS
        ));
    }

    private ResponseEntity<?> replayRefreshIfRecent(String oldJti,
                                                    javax.servlet.http.HttpServletRequest httpRequest,
                                                    javax.servlet.http.HttpServletResponse httpResponse) {
        if (oldJti == null || oldJti.trim().isEmpty()) return null;
        RefreshReplay replay = REFRESH_REPLAY_CACHE.get(oldJti);
        if (replay == null || replay.expiresAtMillis < System.currentTimeMillis()) {
            REFRESH_REPLAY_CACHE.remove(oldJti);
            return null;
        }
        TokenPair tokens = extractTokenPair(replay.response);
        setCookiesIfPossible(httpRequest, httpResponse, tokens);
        return ResponseEntity.ok(replay.response);
    }

    /**
     * Refresh access token using a valid refresh token.
     * Implements token rotation: old refresh token is blocklisted, new tokens are issued.
     */
    @PostMapping("/refresh")
    @ApiOperation(value = "Refresh access token", notes = "Exchange a valid refresh token for new access and refresh tokens")
    public ResponseEntity<?> refresh(@Valid @RequestBody RefreshRequest request,
                                     javax.servlet.http.HttpServletRequest httpRequest,
                                     javax.servlet.http.HttpServletResponse httpResponse) {
        return refreshInternal(request, httpRequest, httpResponse, true);
    }

    private ResponseEntity<?> refresh(RefreshRequest request) {
        return refreshInternal(request, null, null, true);
    }

    private ResponseEntity<?> refreshInternal(RefreshRequest request,
                                             javax.servlet.http.HttpServletRequest httpRequest,
                                             javax.servlet.http.HttpServletResponse httpResponse,
                                             boolean rotateRefreshToken) {
        try {
            String refreshToken = request.getRefreshToken();
            if (refreshToken == null || refreshToken.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of("error", "Refresh token required"));
            }
            
            // Validate the refresh token
            Claims claims = jwtService.validateToken(refreshToken);
            
            // Ensure it's a refresh token, not an access token
            if (!jwtService.isRefreshToken(claims)) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid token type"));
            }
            
            String jti = claims.getId();
            Integer userId = jwtService.getUserIdFromClaims(claims);
            String userType = jwtService.getUserTypeFromClaims(claims);
            Integer tokenVersion = jwtService.getTokenVersionFromClaims(claims);
            LocalDateTime expiresAt = claims.getExpiration().toInstant()
                .atZone(ZoneId.systemDefault()).toLocalDateTime();

            if (rotateRefreshToken) {
                // TOKEN ROTATION: Insert blocklist FIRST to prevent concurrent refresh race
                RefreshTokenBlocklist blocked = new RefreshTokenBlocklist();
                blocked.setJti(jti);
                blocked.setUserId(userId);
                blocked.setUserType(userType);
                blocked.setBlockedAt(LocalDateTime.now());
                blocked.setExpiresAt(expiresAt);
                try {
                    // jti is an assigned @Id, so save() is a merge: for an already-blocklisted jti it finds the row and
                    // updates it instead of failing the insert. The duplicate-key path below never ran, so a used, rotated or
                    // logged-out refresh token kept minting fresh tokens. Check first; a concurrent twin still loses on the key.
                    if (blocklistRepository.existsByJti(jti)) {
                        throw new DataIntegrityViolationException("Refresh token already blocklisted: " + jti);
                    }
                    blocklistRepository.save(blocked);
                } catch (DataIntegrityViolationException e) {
                    ResponseEntity<?> replay = replayRefreshIfRecent(jti, httpRequest, httpResponse);
                    if (replay != null) {
                        log.debug("Refresh token replay served from grace cache: jti={}", jti);
                        return replay;
                    }
                    log.warn("Refresh token already used or revoked: jti={}", jti);
                    return ResponseEntity.status(401).body(Map.of("error", "Token revoked"));
                }
            } else if (blocklistRepository.existsByJti(jti)) {
                log.warn("Cookie refresh attempted with revoked token jti={}", jti);
                return ResponseEntity.status(401).body(Map.of("error", "Token revoked"));
            }

            // Platform root is reconstructed only from the signed explicit capability. Preserve
            // its signed org/college scope so refresh can never widen a scoped session to GLOBAL.
            String contactMobile = jwtService.getStringClaim(claims, "contactMobile");
            boolean superAdmin = Boolean.TRUE.equals(claims.get("superAdmin", Boolean.class));
            if (superAdmin && "FACULTY".equalsIgnoreCase(userType)) {
                Integer refreshOrgId = claims.get("orgId", Integer.class);
                Integer refreshCollegeId = claims.get("collegeId", Integer.class);
                UserPrincipal principal = (refreshOrgId != null || refreshCollegeId != null)
                        ? UserPrincipal.forSuperAdminScoped(refreshOrgId, refreshCollegeId)
                        : UserPrincipal.forSuperAdmin();
                Map<String, Object> refreshClaims = new HashMap<>();
                if (contactMobile != null && !contactMobile.isEmpty()) {
                    refreshClaims.put("contactMobile", contactMobile);
                }
                TokenPair newTokens = jwtService.generateTokens(principal, refreshClaims);
                Map<String, Object> superAdminUser = new HashMap<>();
                superAdminUser.put("id", principal.getId());
                if (contactMobile != null && !contactMobile.isEmpty()) {
                    superAdminUser.put("contactMobile", contactMobile);
                }
                superAdminUser.put("userType", "FACULTY");
                superAdminUser.put("facultyType", "ADMIN");
                if (refreshOrgId != null) superAdminUser.put("organizationId", refreshOrgId);
                if (refreshCollegeId != null) superAdminUser.put("collegeId", refreshCollegeId);
                AuthResponse authResponse = AuthResponse.of(superAdminUser, newTokens);
                setCookiesIfPossible(httpRequest, httpResponse, newTokens);
                if (rotateRefreshToken) rememberRefreshReplay(jti, authResponse);
                log.debug("Token refresh successful for super-admin scope org={} college={}", refreshOrgId, refreshCollegeId);
                return ResponseEntity.ok(authResponse);
            }

            // Load user from database and verify tokenVersion
            if (com._42students.lms.model.Recruiter.isUserType(userType)) {
                return refreshRecruiter(claims, jti, userId, tokenVersion, rotateRefreshToken, httpRequest, httpResponse);
            }

            Object user;
            Integer currentTokenVersion;
            
            if ("LEARNER".equalsIgnoreCase(userType)) {
                Learner learner = learnerRepository.findById(userId).orElse(null);
                if (learner == null) {
                    return ResponseEntity.status(401).body(Map.of("error", "User not found"));
                }
                currentTokenVersion = learner.getTokenVersion() != null ? learner.getTokenVersion() : 0;
                if (scopeResolutionService != null) {
                    scopeResolutionService.enrichLearnerHierarchy(learner);
                }
                user = learner;
            } else if ("FACULTY".equalsIgnoreCase(userType)) {
                Faculty faculty = facultyRepository.findById(userId).orElse(null);
                if (faculty == null) {
                    return ResponseEntity.status(401).body(Map.of("error", "User not found"));
                }
                currentTokenVersion = faculty.getTokenVersion() != null ? faculty.getTokenVersion() : 0;
                user = faculty;
            } else {
                // Unknown account type: never fall back to a faculty lookup (ids overlap across tables).
                return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
            }
            
            // Check tokenVersion matches (invalidated if password was changed)
            if (!tokenVersion.equals(currentTokenVersion)) {
                log.debug("Token version mismatch during refresh for user {}: token={}, current={}",
                    userId, tokenVersion, currentTokenVersion);
                return ResponseEntity.status(401).body(Map.of("error", "Token invalidated"));
            }

            // Issue new tokens
            UserPrincipal principal = UserPrincipal.fromUser(user);
            // Impersonation-aware refresh: the refresh token minted at impersonate-start carries
            // the impersonatorId/Type claims (see SuperAdminUserAdminController.impersonate,
            // which stamps them on BOTH access and refresh tokens). Without re-deriving them here,
            // a refresh mid-impersonation would silently rebuild a plain session for the target
            // user, dropping ImpersonationBanner (which only reads the access token's claim) and
            // making "Exit impersonation" unreachable until logout.
            Integer impersonatorId = claims.get("impersonatorId", Integer.class);
            TokenPair newTokens;
            if (impersonatorId != null) {
                Map<String, Object> impersonatorClaims = new HashMap<>();
                impersonatorClaims.put("impersonatorId", impersonatorId);
                impersonatorClaims.put("impersonatorType", claims.get("impersonatorType", String.class));
                Object impersonatorOrgId = claims.get("impersonatorOrgId");
                if (impersonatorOrgId != null) impersonatorClaims.put("impersonatorOrgId", impersonatorOrgId);
                Object impersonatorCollegeId = claims.get("impersonatorCollegeId");
                if (impersonatorCollegeId != null) impersonatorClaims.put("impersonatorCollegeId", impersonatorCollegeId);
                newTokens = jwtService.generateTokens(principal, impersonatorClaims, impersonatorClaims);
            } else {
                newTokens = jwtService.generateTokens(principal);
            }
            // AC-05: rotate session JTI (old → new)
            if (rotateRefreshToken && userSessionService != null && newTokens.getRefreshTokenJti() != null) {
                userSessionService.rotateSession(jti, newTokens.getRefreshTokenJti());
            }
            AuthResponse authResponse = AuthResponse.of(user, newTokens);
            setCookiesIfPossible(httpRequest, httpResponse, newTokens);
            if (rotateRefreshToken) rememberRefreshReplay(jti, authResponse);

            log.debug("Token refresh successful for user {}", userId);
            return ResponseEntity.ok(authResponse);
            
        } catch (ExpiredJwtException e) {
            log.debug("Refresh token expired: {}", e.getMessage());
            return ResponseEntity.status(401).body(Map.of("error", "Refresh token expired"));
        } catch (JwtException e) {
            log.debug("Invalid refresh token: {}", e.getMessage());
            return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
        } catch (Exception e) {
            log.error("Error during token refresh", e);
            return ResponseEntity.status(500).body(Map.of("error", "Internal error"));
        }
    }

    /**
     * Refresh for a recruiter (industry) identity. The selected college travels in the refresh token and is
     * re-checked here: if the grant was revoked or expired meanwhile, the new session is Global.
     */
    private ResponseEntity<?> refreshRecruiter(Claims claims,
                                        String jti,
                                        Integer userId,
                                        Integer tokenVersion,
                                        boolean rotateRefreshToken,
                                        javax.servlet.http.HttpServletRequest httpRequest,
                                        javax.servlet.http.HttpServletResponse httpResponse) {
        if (recruiterAccessService == null || recruiterAuthService == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
        }
        com._42students.lms.model.Recruiter recruiter = recruiterAccessService.findUsableRecruiter(userId).orElse(null);
        if (recruiter == null) {
            return ResponseEntity.status(401).body(Map.of("error", "User not found"));
        }
        int current = recruiter.getTokenVersion() != null ? recruiter.getTokenVersion() : 0;
        if (tokenVersion == null || tokenVersion != current) {
            return ResponseEntity.status(401).body(Map.of("error", "Token invalidated"));
        }
        Integer requestedCollegeId = claims.get(com._42students.lms.service.recruiter.RecruiterAuthService.REFRESH_CLAIM_COLLEGE, Integer.class);
        Integer collegeId = recruiterAuthService.effectiveCollegeId(recruiter, requestedCollegeId);
        TokenPair newTokens = recruiterAuthService.issueTokens(recruiter, collegeId);
        if (rotateRefreshToken && userSessionService != null && newTokens.getRefreshTokenJti() != null) {
            userSessionService.rotateSession(jti, newTokens.getRefreshTokenJti());
        }
        AuthResponse authResponse = AuthResponse.of(recruiterAuthService.authUser(recruiter, collegeId), newTokens);
        setCookiesIfPossible(httpRequest, httpResponse, newTokens);
        if (rotateRefreshToken) rememberRefreshReplay(jti, authResponse);
        return ResponseEntity.ok(authResponse);
    }

    private void setCookiesIfPossible(javax.servlet.http.HttpServletRequest request,
                                      javax.servlet.http.HttpServletResponse response,
                                      TokenPair tokens) {
        if (request != null && response != null && tokens != null) {
            setAuthCookies(request, response, tokens);
        }
    }
    
    /**
     * Logout by blocklisting the refresh token.
     * The token will no longer be usable for refresh.
     */
    @PostMapping("/logout")
    @ApiOperation(value = "Logout user", notes = "Invalidate the refresh token and the current access token")
    public ResponseEntity<?> logout(@Valid @RequestBody RefreshRequest request,
                                    @RequestHeader(value = "Authorization", required = false) String authHeader) {
        // Blocklist the refresh token
        try {
            String refreshToken = request.getRefreshToken();
            if (refreshToken != null && !refreshToken.isEmpty()) {
                Claims claims = jwtService.validateToken(refreshToken);
                String jti = claims.getId();
                Integer userId = jwtService.getUserIdFromClaims(claims);
                String userType = jwtService.getUserTypeFromClaims(claims);
                if (!blocklistRepository.existsByJti(jti)) {
                    RefreshTokenBlocklist blocked = new RefreshTokenBlocklist();
                    blocked.setJti(jti);
                    blocked.setUserId(userId);
                    blocked.setUserType(userType);
                    blocked.setBlockedAt(LocalDateTime.now());
                    blocked.setExpiresAt(claims.getExpiration().toInstant()
                                               .atZone(ZoneId.systemDefault()).toLocalDateTime());
                    blocklistRepository.save(blocked);
                    log.debug("Logout: blocklisted refresh token for user {}", userId);
                }
                // AC-05: remove session row on logout
                if (userSessionService != null) {
                    userSessionService.deleteSession(jti);
                }
            }
        } catch (JwtException e) {
            log.debug("Logout: refresh token invalid/expired (ignored): {}", e.getMessage());
        } catch (Exception e) {
            log.error("Logout: error blocklisting refresh token", e);
        }

        // Also blocklist the access token so it cannot be used after logout
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String accessToken = authHeader.substring(7);
                Claims accessClaims = jwtService.validateToken(accessToken);
                String accessJti = accessClaims.getId();
                if (!blocklistRepository.existsByJti(accessJti)) {
                    RefreshTokenBlocklist blocked = new RefreshTokenBlocklist();
                    blocked.setJti(accessJti);
                    blocked.setUserId(jwtService.getUserIdFromClaims(accessClaims));
                    blocked.setUserType(jwtService.getUserTypeFromClaims(accessClaims));
                    blocked.setBlockedAt(LocalDateTime.now());
                    blocked.setExpiresAt(accessClaims.getExpiration().toInstant()
                                                     .atZone(ZoneId.systemDefault()).toLocalDateTime());
                    blocklistRepository.save(blocked);
                    log.debug("Logout: blocklisted access token jti={}", accessJti);
                }
            } catch (JwtException e) {
                // Already expired — no need to blocklist
                log.debug("Logout: access token already expired (ignored): {}", e.getMessage());
            } catch (Exception e) {
                log.error("Logout: error blocklisting access token", e);
            }
        }

        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    /**
     * Revoke all sessions for a user by incrementing their token version.
     * Caller must be the user themselves (revoke own sessions) or have admin/scope access to that user.
     */
    @PostMapping("/revoke-sessions")
    @ApiOperation(value = "Revoke all sessions for a user", notes = "Increments token version so all existing JWTs for that user are invalid. Requires auth; caller must be the user or admin.")
    public ResponseEntity<?> revokeSessions(@RequestParam int userId, @RequestParam String userType) {
        if (tokenVersionService == null || securityContextUtil == null || accessControlService == null) {
            return ResponseEntity.status(503).body(Map.of("error", "Service unavailable"));
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        // Allow: self, or admin with access to that user's college
        if (principal.getId() != null && principal.getId().equals(userId)
                && principal.getUserType() != null && principal.getUserType().equalsIgnoreCase(userType)) {
            // Self revoke
        } else if ("LEARNER".equalsIgnoreCase(userType)) {
            accessControlService.requireAccessLearner(principal, userId);
        } else if ("FACULTY".equalsIgnoreCase(userType)) {
            accessControlService.requireAccessFacultySchedule(principal, userId);
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "userType must be LEARNER or FACULTY"));
        }
        Integer newVersion = tokenVersionService.incrementTokenVersion(userId, userType);
        if (newVersion == null) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
        return ResponseEntity.ok(Map.of("message", "All sessions revoked", "userId", userId, "userType", userType));
    }

    /**
     * AC-05: List all active sessions for the authenticated user.
     */
    @GetMapping("/sessions")
    @ApiOperation(value = "List active sessions", notes = "Returns all active login sessions for the authenticated user.")
    public ResponseEntity<?> listSessions() {
        if (userSessionService == null || securityContextUtil == null) {
            return ResponseEntity.status(503).body(Map.of("error", "Service unavailable"));
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null || principal.getId() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        java.util.List<com._42students.lms.model.UserSession> sessions =
                userSessionService.getActiveSessions(principal.getId(), principal.getUserType());
        return ResponseEntity.ok(Map.of("sessions", sessions));
    }

    /**
     * AC-05: Revoke a specific session by JTI (remote logout from one device).
     */
    @DeleteMapping("/sessions/{jti}")
    @ApiOperation(value = "Revoke a specific session", notes = "Blocklists the session's refresh token and removes it from active sessions. User can only revoke their own sessions.")
    public ResponseEntity<?> revokeSession(@PathVariable String jti) {
        if (userSessionService == null || securityContextUtil == null) {
            return ResponseEntity.status(503).body(Map.of("error", "Service unavailable"));
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null || principal.getId() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            userSessionService.revokeSession(jti, principal.getId(), principal.getUserType());
            return ResponseEntity.ok(Map.of("message", "Session revoked"));
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return ResponseEntity.status(e.getStatus()).body(Map.of("error", e.getReason()));
        } catch (Exception e) {
            log.error("Error revoking session {}: {}", jti, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", "Internal error"));
        }
    }
}

