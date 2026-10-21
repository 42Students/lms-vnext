package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.enums.FacultyType;
import com._42students.lms.model.Faculty;
import com._42students.lms.model.Learner;
import com._42students.lms.model.ProjectWorkspace;
import com._42students.lms.model.UserSession;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.ProjectMemberRepository;
import com._42students.lms.repository.ProjectWorkspaceRepository;
import com._42students.lms.security.JwtService;
import com._42students.lms.dto.response.TokenPair;
import com._42students.lms.util.CookieUtil;
import com._42students.lms.util.OnboardingMobileNumber;
import com._42students.lms.service.AdminAuditLogService;
import com._42students.lms.service.AppSettingsService;
import com._42students.lms.service.UserSessionService;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/v1/superadmin/users")
public class SuperAdminUserAdminController {

    private final AccessControlService accessControlService;
    private final SecurityContextUtil securityContextUtil;
    private final FacultyRepository facultyRepository;
    private final ScopeResolutionService scopeResolutionService;
    private final UserSessionService userSessionService;
    private final AdminAuditLogService audit;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectWorkspaceRepository projectWorkspaceRepository;
    private final LearnerRepository learnerRepository;
    private final JwtService jwtService;

    @Value("${app.cookie.domain:}")
    private String cookieDomain;

    @Autowired(required = false)
    private AppSettingsService appSettingsService;

    public SuperAdminUserAdminController(AccessControlService accessControlService,
                                         SecurityContextUtil securityContextUtil,
                                         FacultyRepository facultyRepository,
                                         ScopeResolutionService scopeResolutionService,
                                         UserSessionService userSessionService,
                                         AdminAuditLogService audit,
                                         ProjectMemberRepository projectMemberRepository,
                                         ProjectWorkspaceRepository projectWorkspaceRepository,
                                         LearnerRepository learnerRepository,
                                         JwtService jwtService) {
        this.accessControlService = accessControlService;
        this.securityContextUtil = securityContextUtil;
        this.facultyRepository = facultyRepository;
        this.scopeResolutionService = scopeResolutionService;
        this.userSessionService = userSessionService;
        this.audit = audit;
        this.projectMemberRepository = projectMemberRepository;
        this.projectWorkspaceRepository = projectWorkspaceRepository;
        this.learnerRepository = learnerRepository;
        this.jwtService = jwtService;
    }

    private void setAuthCookies(HttpServletRequest request, HttpServletResponse response, TokenPair tokens) {
        if (response == null || tokens == null) return;
        boolean secure = CookieUtil.isSecureRequest(request);
        String configuredDomain = (appSettingsService != null) ? appSettingsService.getCookieDomain() : cookieDomain;
        String cd = CookieUtil.resolveCookieDomain(request, configuredDomain);
        String sameSite = (appSettingsService != null) ? appSettingsService.getCookieSameSite() : "Lax";
        CookieUtil.setCookie(response, "lms_authenticated", tokens.getAccessToken(), (int) tokens.getExpiresIn(), cd, secure, true, sameSite);
        CookieUtil.setCookie(response, "lms_refresh_token", tokens.getRefreshToken(), (int) jwtService.getRefreshExpirationSeconds(), cd, secure, true, sameSite);
    }

    private void requireSuperadminScopedCollegeWithinScope(UserPrincipal principal, Integer collegeId) {
        if (principal == null) return;
        if (!accessControlService.isSuperAdmin(principal)) return;
        if (principal.getCollegeId() == null && principal.getOrganizationId() == null) return; // GLOBAL
        if (collegeId == null) throw new org.springframework.security.access.AccessDeniedException("collegeId required");

        if (principal.getCollegeId() != null && !Objects.equals(principal.getCollegeId(), collegeId)) {
            throw new org.springframework.security.access.AccessDeniedException("Scoped superadmin cannot access other colleges");
        }
        if (principal.getOrganizationId() != null) {
            Integer resolvedOrgId = scopeResolutionService != null ? scopeResolutionService.resolveCollegeToOrganizationId(collegeId) : null;
            if (resolvedOrgId != null && !Objects.equals(resolvedOrgId, principal.getOrganizationId())) {
                throw new org.springframework.security.access.AccessDeniedException("Scoped superadmin cannot access other organizations");
            }
        }
    }

    private void requireSuperadminScopedUserWithinScope(UserPrincipal principal, String userType, Integer userId) {
        if (principal == null) return;
        if (!accessControlService.isSuperAdmin(principal)) return;
        if (principal.getCollegeId() == null && principal.getOrganizationId() == null) return; // GLOBAL
        if (userType == null || userId == null) {
            throw new org.springframework.security.access.AccessDeniedException("userType and userId required");
        }

        Integer collegeId = null;
        String ut = userType.trim().toUpperCase();
        if ("FACULTY".equals(ut)) {
            collegeId = scopeResolutionService != null ? scopeResolutionService.resolveFacultyToCollegeId(userId) : null;
        } else if ("LEARNER".equals(ut)) {
            collegeId = scopeResolutionService != null ? scopeResolutionService.resolveLearnerToCollegeId(userId) : null;
        } else {
            throw new org.springframework.security.access.AccessDeniedException("Unsupported userType for scoped superadmin");
        }
        requireSuperadminScopedCollegeWithinScope(principal, collegeId);
    }

    @GetMapping("/faculty-admins")
    public ResponseEntity<?> listFacultyAdmins(@RequestParam(required = false) Integer organizationId,
                                               @RequestParam(required = false) Integer collegeId,
                                               @RequestParam(required = false) String role) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireSuperAdmin(principal);
        FacultyType facultyType = parseManagedRole(role);
        if (facultyType == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "role must be ADMIN or TPO"));
        }

        Integer effectiveOrgId = organizationId;
        Integer effectiveCollegeId = collegeId;

        if (principal != null && principal.getCollegeId() != null) {
            effectiveCollegeId = principal.getCollegeId();
            effectiveOrgId = principal.getOrganizationId();
        } else if (principal != null && principal.getOrganizationId() != null) {
            effectiveOrgId = principal.getOrganizationId();
            if (effectiveCollegeId != null && scopeResolutionService != null) {
                Integer resolvedOrgId = scopeResolutionService.resolveCollegeToOrganizationId(effectiveCollegeId);
                if (resolvedOrgId != null && !Objects.equals(resolvedOrgId, effectiveOrgId)) {
                    throw new org.springframework.security.access.AccessDeniedException("Superadmin is org-scoped and cannot access other organizations");
                }
            }
        }

        List<Faculty> list;
        if (effectiveCollegeId != null) {
            list = facultyRepository.findByFacultyTypeAndCollegeIdAndNotDeleted(facultyType, effectiveCollegeId);
        } else if (effectiveOrgId != null) {
            list = facultyRepository.findByFacultyTypeAndOrganizationIdAndNotDeleted(facultyType, effectiveOrgId);
        } else {
            list = facultyRepository.findByFacultyTypeAndNotDeleted(facultyType);
        }
        return ResponseEntity.ok(Map.of("items", list));
    }

    @PostMapping("/faculty-admins")
    @Transactional
    public ResponseEntity<?> createFacultyAdmin(@Valid @RequestBody CreateFacultyAdminRequest req, HttpServletRequest httpRequest) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireSuperAdmin(principal);
        if (req.getCollegeId() == null || req.getCollegeId() <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "collegeId required"));
        }
        FacultyType role = parseManagedRole(req.getRole());
        if (role == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "role must be ADMIN or TPO"));
        }
        String mobile = OnboardingMobileNumber.normalize(req.getContactMobile());
        if (mobile == null) return ResponseEntity.badRequest().body(Map.of("error", "Valid 10-digit contactMobile required"));

        requireSuperadminScopedCollegeWithinScope(principal, req.getCollegeId());

        Optional<Faculty> existing = facultyRepository.findByContactMobileAndCollegeId(mobile, req.getCollegeId());
        if (existing.isPresent()) {
            return ResponseEntity.status(409).body(Map.of("error", "MOBILE_ALREADY_EXISTS_IN_COLLEGE"));
        }

        Integer orgId = req.getOrganizationId();
        if (orgId == null && scopeResolutionService != null) {
            orgId = scopeResolutionService.resolveCollegeToOrganizationId(req.getCollegeId());
        }

        if (principal != null && principal.getOrganizationId() != null && orgId != null && !Objects.equals(principal.getOrganizationId(), orgId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Scoped superadmin cannot access other organizations"));
        }

        Faculty f = new Faculty();
        f.setFirstName(trim(req.getFirstName()));
        f.setLastName(trim(req.getLastName()));
        f.setContactMobile(mobile);
        f.setContactMail(trim(req.getContactMail()));
        f.setCollegeId(req.getCollegeId());
        f.setOrganizationId(orgId);
        f.setUserType("FACULTY");
        f.setFacultyType(role);
        f.setIsDeleted(false);
        Faculty saved = facultyRepository.save(f);

        if (audit != null) {
            Map<String, Object> auditPayload = new java.util.HashMap<>();
            auditPayload.put("contactMobile", mobile);
            auditPayload.put("contactMail", saved.getContactMail());
            auditPayload.put("role", role.name());
            audit.log(httpRequest, "FACULTY_ADMIN_CREATE", "faculty", String.valueOf(saved.getId()), orgId, req.getCollegeId(),
                    auditPayload);
        }
        return ResponseEntity.ok(Map.of("user", saved));
    }

    @PutMapping("/faculty-admins/{id}/status")
    @Transactional
    public ResponseEntity<?> setFacultyAdminStatus(@PathVariable Integer id, @RequestBody Map<String, Object> body, HttpServletRequest httpRequest) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireSuperAdmin(principal);
        Faculty f = facultyRepository.findById(id).orElse(null);
        if (f == null) return ResponseEntity.status(404).body(Map.of("error", "Not found"));

        requireSuperadminScopedCollegeWithinScope(principal, f.getCollegeId());

        boolean isDeleted = body != null && Boolean.TRUE.equals(body.get("isDeleted"));
        if (isDeleted) {
            List<Integer> mentoredProjectIds = projectMemberRepository.findProjectIdsForUser(id, "FACULTY");
            long activeMentoredCount = mentoredProjectIds == null || mentoredProjectIds.isEmpty()
                    ? 0
                    : projectWorkspaceRepository.findActiveByIds(mentoredProjectIds).stream()
                        .filter(project -> !"ARCHIVED".equalsIgnoreCase(String.valueOf(project.getStatus())))
                        .count();
            if (activeMentoredCount > 0) {
                String guardMessage = "Cannot deactivate this faculty member: they mentor " + activeMentoredCount
                        + " active project workspace(s). Reassign those projects to another mentor first.";
                return ResponseEntity.status(409).body(Map.of("error", guardMessage, "message", guardMessage));
            }
        }
        f.setIsDeleted(isDeleted);
        if (isDeleted) {
            // Bump tokenVersion so every already-issued token for this account stops validating
            // immediately. JwtAuthenticationFilter now also refuses soft-deleted accounts, so
            // this is belt-and-braces for the access token — but it is the ONLY thing that kills
            // an outstanding refresh token, without which a suspended admin could mint a fresh
            // access token straight after being suspended.
            Integer current = f.getTokenVersion() != null ? f.getTokenVersion() : 0;
            f.setTokenVersion(current + 1);
        }
        Faculty saved = facultyRepository.save(f);
        if (audit != null) {
            audit.log(httpRequest, "FACULTY_ADMIN_STATUS", "faculty", String.valueOf(id), saved.getOrganizationId(), saved.getCollegeId(),
                    Map.of("isDeleted", isDeleted));
        }
        return ResponseEntity.ok(Map.of("user", saved));
    }

    @GetMapping("/{userType}/{userId}/sessions")
    public ResponseEntity<?> listSessions(@PathVariable String userType, @PathVariable Integer userId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireSuperAdmin(principal);
        requireSuperadminScopedUserWithinScope(principal, userType, userId);
        List<UserSession> sessions = userSessionService.getActiveSessions(userId, userType.toUpperCase());
        return ResponseEntity.ok(Map.of("sessions", sessions));
    }

    @PostMapping("/{userType}/{userId}/sessions/revoke-all")
    @Transactional
    public ResponseEntity<?> revokeAllSessions(@PathVariable String userType,
                                               @PathVariable Integer userId,
                                               HttpServletRequest httpRequest) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireSuperAdmin(principal);
        requireSuperadminScopedUserWithinScope(principal, userType, userId);
        List<UserSession> sessions = userSessionService.getActiveSessions(userId, userType.toUpperCase());
        int revoked = 0;
        for (UserSession s : sessions) {
            try {
                // Pass the actual caller's identity rather than hardcoded literals — revokeSession's
                // "isAdmin" bypass checks requestingUserType, and since this whole method already
                // requires requireSuperAdmin(principal) above, principal.getUserType() is always
                // "FACULTY" (every superadmin JWT is minted with userType=FACULTY, facultyType=ADMIN
                // — see UserPrincipal.forSuperAdmin/forSuperAdminScoped) and principal.getId() is
                // always 0, so this was functionally equivalent, just fragile if that ever changes.
                userSessionService.adminRevokeSession(s.getJti(), principal.getId(), principal.getUserType());
                revoked++;
            } catch (Exception e) {
                log.warn("Could not revoke session {} for {}:{}: {}", s.getJti(), userType, userId, e.getMessage());
            }
        }
        if (audit != null) audit.log(httpRequest, "USER_SESSIONS_REVOKE_ALL", "user_session", userType + ":" + userId, null, null, Map.of("count", revoked));
        return ResponseEntity.ok(Map.of("ok", revoked == sessions.size(), "revoked", revoked));
    }

    // Login-as-user for support debugging. Superadmin-only (not exposed to college admin — see
    // the admin panel gap audit's note that this is the most security-sensitive item on the
    // list). Mints a fresh token pair for the TARGET user, carrying the real superadmin's identity
    // as extra impersonatorId/impersonatorType(/impersonatorOrgId/impersonatorCollegeId) claims so
    // /impersonate/end can restore the original session and every audit entry during the
    // impersonation window can be attributed to who was really acting.
    @PostMapping("/{userType}/{userId}/impersonate")
    public ResponseEntity<?> impersonate(@PathVariable String userType, @PathVariable Integer userId,
                                          HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireSuperAdmin(principal);
        requireSuperadminScopedUserWithinScope(principal, userType, userId);

        UserPrincipal targetPrincipal;
        Object targetUser;
        String ut = userType == null ? "" : userType.trim().toUpperCase();
        if ("LEARNER".equals(ut)) {
            Learner learner = learnerRepository.findById(userId).orElse(null);
            if (learner == null) return ResponseEntity.status(404).body(Map.of("error", "Not found"));
            targetUser = learner;
            targetPrincipal = UserPrincipal.fromLearner(learner);
        } else if ("FACULTY".equals(ut)) {
            Faculty faculty = facultyRepository.findById(userId).orElse(null);
            if (faculty == null) return ResponseEntity.status(404).body(Map.of("error", "Not found"));
            targetUser = faculty;
            targetPrincipal = UserPrincipal.fromFaculty(faculty);
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "userType must be LEARNER or FACULTY"));
        }

        Map<String, Object> impersonatorClaims = new HashMap<>();
        impersonatorClaims.put("impersonatorId", principal.getId());
        impersonatorClaims.put("impersonatorType", principal.getUserType());
        if (principal.getOrganizationId() != null) impersonatorClaims.put("impersonatorOrgId", principal.getOrganizationId());
        if (principal.getCollegeId() != null) impersonatorClaims.put("impersonatorCollegeId", principal.getCollegeId());

        TokenPair tokens = jwtService.generateTokens(targetPrincipal, impersonatorClaims, impersonatorClaims);
        setAuthCookies(httpRequest, httpResponse, tokens);

        if (audit != null) {
            // Use the TARGET user's own org/college, not the acting superadmin's (which is null
            // for a global superadmin) — otherwise a college-scoped impersonation of one of their
            // users is logged with collegeId=null and never shows up on that college's Activity
            // Log page, even though the feature is specifically meant to be scoped that way.
            audit.log(httpRequest, "IMPERSONATION_START", "user", ut + ":" + userId,
                    targetPrincipal.getOrganizationId(), targetPrincipal.getCollegeId(),
                    Map.of("targetUserType", ut, "targetUserId", userId));
        }
        // The frontend's axios client sends Authorization: Bearer <localStorage token> as its
        // PRIMARY auth mechanism (cookies are a secondary/SSR path) — returning the tokens in the
        // body, not just setting cookies, is required for impersonation to actually take effect on
        // the next API call rather than silently keeping the original session.
        Map<String, Object> out = new HashMap<>();
        out.put("ok", true);
        out.put("user", targetUser);
        out.put("userType", ut);
        out.put("accessToken", tokens.getAccessToken());
        out.put("refreshToken", tokens.getRefreshToken());
        out.put("expiresIn", tokens.getExpiresIn());
        return ResponseEntity.ok(out);
    }

    @PostMapping("/impersonate/end")
    public ResponseEntity<?> endImpersonation(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null || principal.getImpersonatorId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Not currently impersonating"));
        }
        // Only ever superadmin (id 0) today — impersonatorType is carried through for
        // forward-compatibility if a non-superadmin impersonation path is ever added.
        UserPrincipal restored = "FACULTY".equalsIgnoreCase(principal.getImpersonatorType())
                ? UserPrincipal.forSuperAdminScoped(principal.getImpersonatorOrgId(), principal.getImpersonatorCollegeId())
                : UserPrincipal.forSuperAdmin();
        TokenPair tokens = jwtService.generateTokens(restored);
        setAuthCookies(httpRequest, httpResponse, tokens);

        if (audit != null) {
            // `principal` here is the currently-authenticated (impersonated target's) principal —
            // its org/college reflect the target user actually impersonated, not the restored
            // superadmin — so pass those through instead of null,null for the same reason as
            // IMPERSONATION_START above.
            audit.log(httpRequest, "IMPERSONATION_END", "user", principal.getUserType() + ":" + principal.getId(),
                    principal.getOrganizationId(), principal.getCollegeId(), Map.of());
        }
        Map<String, Object> out = new HashMap<>();
        out.put("ok", true);
        out.put("accessToken", tokens.getAccessToken());
        out.put("refreshToken", tokens.getRefreshToken());
        out.put("expiresIn", tokens.getExpiresIn());
        return ResponseEntity.ok(out);
    }

    private String trim(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    @Data
    private static class CreateFacultyAdminRequest {
        private Integer organizationId;
        private Integer collegeId;
        private String firstName;
        private String lastName;
        private String contactMobile;
        private String contactMail;
        /** ADMIN (default, college admin) or TPO. Both are super-admin-managed roles. */
        private String role;
    }

    /** ADMIN when blank; TPO or ADMIN when given; null for anything else. */
    static FacultyType parseManagedRole(String raw) {
        if (raw == null || raw.trim().isEmpty()) return FacultyType.ADMIN;
        String value = raw.trim().toUpperCase(java.util.Locale.ROOT);
        if ("ADMIN".equals(value)) return FacultyType.ADMIN;
        if ("TPO".equals(value)) return FacultyType.TPO;
        return null;
    }
}

