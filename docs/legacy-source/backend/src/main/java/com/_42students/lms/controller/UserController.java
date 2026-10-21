package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.UserDto;
import com._42students.lms.dto.response.AuthResponse;
import com._42students.lms.dto.response.ContactDTO;
import com._42students.lms.dto.response.ContactResponseDTO;
import com._42students.lms.dto.response.LearnerResponseDTO;
import com._42students.lms.dto.response.PageDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.dto.response.TokenPair;
import com._42students.lms.model.Faculty;
import com._42students.lms.model.Learner;
import com._42students.lms.model.User;
import com._42students.lms.security.JwtService;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.security.RateLimitingService;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.service.FacultyService;
import com._42students.lms.service.LearnerService;
import com._42students.lms.service.UserSessionService;
import com._42students.lms.service.TokenVersionService;
import com._42students.lms.service.NotificationTemplateContext;
import com._42students.lms.service.NotificationTemplateContextResolver;
import com._42students.lms.service.SmsService;
import com._42students.lms.service.UserService;
import com._42students.lms.service.VerificationService;
import com._42students.lms.service.AppSettingsService;
import com._42students.lms.util.SecurityContextUtil;
import com._42students.lms.util.CookieUtil;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.client.RestTemplate;

import javax.validation.Valid;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping({"/api/v1/users", "/users"})
@Slf4j
//@ConditionalOnExpression("${my.controller.enabled:false}")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private LearnerService learnerService;

    @Autowired
    private VerificationService verificationService;

    @Autowired
    private FacultyService facultyService;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private LearnerRepository learnerRepository;

    @Autowired
    private SmsService smsService;
    
    @Autowired
    private NotificationTemplateContextResolver contextResolver;
    
    @Autowired
    private JwtService jwtService;

    @Autowired
    RestTemplate restTemplate;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired
    private com._42students.lms.access.ScopeResolutionService scopeResolutionService;

    @Autowired(required = false)
    private RateLimitingService rateLimitingService;

    @Autowired(required = false)
    private TokenVersionService tokenVersionService;

    @Autowired(required = false)
    private UserSessionService userSessionService;

    /** Super-admin phone numbers from config (comma-separated). Used for Vasan login (?superAdmin=true). */
    @Value("${app.super-admin-phones:}")
    private String superAdminPhonesConfig;

    @Value("${app.cookie.domain:}")
    private String cookieDomain;

    @Autowired(required = false)
    private AppSettingsService appSettingsService;

    @Autowired(required = false)
    private com._42students.lms.service.TestOtpService testOtpService;

    private int otpMaxAttempts() {
        return appSettingsService != null ? appSettingsService.getOtpMaxAttempts() : 5;
    }

    private long otpWindowSeconds() {
        return appSettingsService != null ? appSettingsService.getOtpWindowSeconds() : 900;
    }

    private Set<String> getSuperAdminPhones() {
        if (superAdminPhonesConfig == null || superAdminPhonesConfig.trim().isEmpty()) {
            return Collections.emptySet();
        }
        return Arrays.stream(superAdminPhonesConfig.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .collect(Collectors.toSet());
    }

    private boolean isTestOtpPhone(String phone) {
        return testOtpService != null && testOtpService.isTestPhone(phone);
    }

    private void setAuthCookies(javax.servlet.http.HttpServletRequest request,
                                javax.servlet.http.HttpServletResponse response,
                                TokenPair tokens) {
        if (response == null || tokens == null) return;
        boolean secure = CookieUtil.isSecureRequest(request);
        String configuredDomain = (appSettingsService != null) ? appSettingsService.getCookieDomain() : cookieDomain;
        String cd = CookieUtil.resolveCookieDomain(request, configuredDomain);
        String sameSite = (appSettingsService != null) ? appSettingsService.getCookieSameSite() : "Lax";
        // Access token cookie: used by Next.js middleware route protection across subdomains.
        CookieUtil.setCookie(response, "lms_authenticated",
                tokens.getAccessToken(),
                (int) tokens.getExpiresIn(),
                cd,
                secure,
                true,
                sameSite);
        // Refresh token cookie: used for cross-subdomain session restore/switch.
        CookieUtil.setCookie(response, "lms_refresh_token",
                tokens.getRefreshToken(),
                (int) jwtService.getRefreshExpirationSeconds(),
                cd,
                secure,
                true,
                sameSite);
    }

    // W3 in the super-admin audit: "A student can't log in... no admin-triggered OTP resend,
    // password reset, or lockout clear exists at any layer." This app is OTP-only (no passwords,
    // so "password reset" doesn't map to anything real here), and the OTP itself regenerates on
    // every self-service send -- what actually blocks a locked-out student is the rate limit, so
    // clearing it is the fix: the student can then request their own OTP again. Clears every key
    // prefix used across the three login surfaces (learner/faculty/superadmin all key off the
    // same RateLimitingService by phone number) so it doesn't matter which one the student uses.
    @RequestMapping(value = "/admin/clear-otp-lockout", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Admin: clear OTP rate-limit lockout for a phone number", notes = "Any admin (superadmin or college admin) may call this -- phone numbers aren't college-scoped at the rate-limit layer.")
    public ResponseEntity clearOtpLockout(@RequestParam String phoneNumber) {
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        boolean isAdmin = principal != null && (
                accessControlService.isSuperAdmin(principal)
                        || ("FACULTY".equalsIgnoreCase(principal.getUserType()) && "ADMIN".equalsIgnoreCase(principal.getFacultyType())));
        if (!isAdmin) {
            return new ResponseEntity(new Response("FORBIDDEN", "Admin access required", null), HttpStatus.FORBIDDEN);
        }
        String phone = phoneNumber != null ? phoneNumber.trim() : null;
        if (phone == null || phone.isEmpty()) {
            return new ResponseEntity(new Response("error", "phoneNumber is required", null), HttpStatus.BAD_REQUEST);
        }
        if (rateLimitingService != null) {
            for (String prefix : new String[] {"login:", "verifyOTP:", "faculty:login:", "faculty:verifyOTP:", "learner:login:", "learner:verifyOTP:"}) {
                rateLimitingService.clearAttempts(prefix + phone);
            }
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), "OTP lockout cleared", null), HttpStatus.OK);
    }

    @RequestMapping(value = "/login", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Login learner with phone number", notes = "")
    public ResponseEntity login(String phoneNumber,
                                @RequestParam(required = false) String superAdmin,
                                @RequestParam(required = false) Integer collegeId,
                                javax.servlet.http.HttpServletRequest request)
            throws Exception {
        String phone = (phoneNumber != null) ? phoneNumber.trim() : null;
        if (phone == null || phone.isEmpty()) {
            throw new IllegalArgumentException("Mobile number is required");
        }
        // Rate limit OTP send requests per phone number (5 per 15 minutes)
        if (rateLimitingService != null && rateLimitingService.isRateLimited("login:" + phone, otpMaxAttempts(), otpWindowSeconds())) {
            throw new Exception("Too many OTP requests. Please try again later.");
        }
        if (rateLimitingService != null) {
            rateLimitingService.recordAttempt("login:" + phone, otpMaxAttempts(), otpWindowSeconds());
        }
        boolean isVasanFlow = "true".equalsIgnoreCase(superAdmin != null ? superAdmin.trim() : null);
        // Super-admin (Vasan) only when explicitly requested via ?superAdmin=true; else treat as normal login
        if (isVasanFlow && !getSuperAdminPhones().contains(phone)) {
            return ResponseEntity.status(403).body(Map.of("error", "NOT_SUPER_ADMIN"));
        }
        if (isVasanFlow) {
            // Optional hard safety: block superadmin OTP on mobile apps by policy (GLOBAL setting)
            String allowMobile = (appSettingsService != null)
                    ? appSettingsService.getSettingValue("GLOBAL", null, "policy.superadmin.allowMobileApp")
                    : null;
            boolean mobileAllowed = "true".equalsIgnoreCase(allowMobile);
            String ua = request.getHeader("User-Agent");
            String client = request.getHeader("X-Client");
            boolean looksLikeMobileApp = (client != null && client.equalsIgnoreCase("mobile"))
                    || (ua != null && (ua.contains("Capacitor") || ua.contains("wv")));
            if (!mobileAllowed && looksLikeMobileApp && !isTestOtpPhone(phone)) {
                throw new Exception("Superadmin login is disabled on mobile app");
            }
            String otp = String.valueOf(ThreadLocalRandom.current().nextInt(1000, 9999));
            smsService.sendOtp(phone, otp, NotificationTemplateContext.LMS);
            verificationService.savePreUserPhoneOtp(phone, otp);
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), "OTP triggered"),
                    HttpStatus.OK);
        }
        Faculty faculty;
        Learner learner;
        if (collegeId != null && collegeId > 0) {
            faculty = facultyRepository.findByContactMobileAndCollegeId(phone, collegeId).orElse(null);
            learner = learnerRepository.findByContactMobileAndCollegeId(phone, collegeId).orElse(null);
        } else {
            faculty = facultyService.getFacultyDetails(phone);
            learner = learnerService.getLearnerDetails(phone);
        }
        if(null!=faculty){
            String otp = (testOtpService != null && testOtpService.isTestPhone(phone))
                    ? testOtpService.getOtpForTestPhone()
                    : String.valueOf(ThreadLocalRandom.current().nextInt(1000, 9999));
            smsService.sendOtp(phone, otp, NotificationTemplateContext.LMS);
            verificationService.saveInstructorAccountVerification(phone, otp);
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),"OTP triggered"),
                    HttpStatus.OK);
        }
        if(null!=learner){
            String otp = (testOtpService != null && testOtpService.isTestPhone(phone))
                    ? testOtpService.getOtpForTestPhone()
                    : String.valueOf(ThreadLocalRandom.current().nextInt(1000, 9999));
            NotificationTemplateContext context = contextResolver.getContextForLearner(learner);
            smsService.sendOtp(phone, otp, context);
            verificationService.saveAccountVerification(phone, otp);
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),"OTP triggered"),
                    HttpStatus.OK);
        }
        throw new Exception("No faculty/learner registered with Mobile number " + phone);
    }

    @RequestMapping(value = "/verifyOTP", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Verify OTP for faculty/learner phone number", notes = "Returns user data with JWT tokens")
    public ResponseEntity verifyOTP(String phoneNumber, String otp,
                                    @RequestParam(required = false) String superAdmin,
                                    @RequestParam(required = false) Integer collegeId,
                                    javax.servlet.http.HttpServletRequest request,
                                    javax.servlet.http.HttpServletResponse response)
            throws Exception {
        // Normalize so save and verify use same format (lookup must match saved phone)
        String phone = (phoneNumber != null) ? phoneNumber.trim() : null;
        String otpTrimmed = (otp != null) ? otp.trim() : null;
        if (phone == null || phone.isEmpty()) {
            throw new IllegalArgumentException("Mobile number is required");
        }
        if (otpTrimmed == null || otpTrimmed.isEmpty()) {
            throw new IllegalArgumentException("OTP is required");
        }
        // Rate limit OTP verification attempts per phone number (5 per 15 minutes)
        if (rateLimitingService != null && rateLimitingService.isRateLimited("verifyOTP:" + phone, otpMaxAttempts(), otpWindowSeconds())) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many verification attempts. Please try again later.");
        }
        if (rateLimitingService != null) {
            rateLimitingService.recordAttempt("verifyOTP:" + phone, otpMaxAttempts(), otpWindowSeconds());
        }
        boolean isVasanFlow = "true".equalsIgnoreCase(superAdmin != null ? superAdmin.trim() : null);
        // Super-admin only when ?superAdmin=true; else require Faculty/Learner in DB
        if (isVasanFlow && getSuperAdminPhones().contains(phone)) {
            String allowMobile = (appSettingsService != null)
                    ? appSettingsService.getSettingValue("GLOBAL", null, "policy.superadmin.allowMobileApp")
                    : null;
            boolean mobileAllowed = "true".equalsIgnoreCase(allowMobile);
            String ua = request.getHeader("User-Agent");
            String client = request.getHeader("X-Client");
            boolean looksLikeMobileApp = (client != null && client.equalsIgnoreCase("mobile"))
                    || (ua != null && (ua.contains("Capacitor") || ua.contains("wv")));
            if (!mobileAllowed && looksLikeMobileApp && !isTestOtpPhone(phone)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Superadmin login is disabled on mobile app");
            }
            // God-tier UAT/E2E support: fixed OTP for whitelisted phones
            if (testOtpService != null && testOtpService.matchesTestOtp(phone, otpTrimmed)) {
                UserPrincipal principal = UserPrincipal.forSuperAdmin();
                TokenPair tokens = jwtService.generateTokens(principal, Collections.singletonMap("contactMobile", phone));
                Map<String, Object> superAdminUser = new HashMap<>();
                superAdminUser.put("id", 0);
                superAdminUser.put("contactMobile", phone);
                superAdminUser.put("userType", "FACULTY");
                superAdminUser.put("facultyType", "ADMIN");
                AuthResponse authResponse = AuthResponse.of(superAdminUser, tokens);
                setAuthCookies(request, response, tokens);
                return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), authResponse), HttpStatus.OK);
            }
            if (!verificationService.verifyPreUserPhoneOtp(phone, otpTrimmed)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Incorrect OTP");
            }
            UserPrincipal principal = UserPrincipal.forSuperAdmin();
            TokenPair tokens = jwtService.generateTokens(principal, Collections.singletonMap("contactMobile", phone));
            Map<String, Object> superAdminUser = new HashMap<>();
            superAdminUser.put("id", 0);
            superAdminUser.put("contactMobile", phone);
            superAdminUser.put("userType", "FACULTY");
            superAdminUser.put("facultyType", "ADMIN");
            AuthResponse authResponse = AuthResponse.of(superAdminUser, tokens);
            setAuthCookies(request, response, tokens);
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), authResponse), HttpStatus.OK);
        }
        Faculty faculty;
        Learner learner;
        if (collegeId != null && collegeId > 0) {
            faculty = facultyRepository.findByContactMobileAndCollegeId(phone, collegeId).orElse(null);
            learner = learnerRepository.findByContactMobileAndCollegeId(phone, collegeId).orElse(null);
        } else {
            faculty = facultyService.getFacultyDetails(phone);
            learner = learnerService.getLearnerDetails(phone);
        }
        if(null!=faculty){
            if (testOtpService != null && testOtpService.matchesTestOtp(phone, otpTrimmed)) {
                // ok
            } else if (!verificationService.verifyInstructorOTP(phone, otpTrimmed)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Incorrect OTP");
            }
            if (faculty.getSuspendedAt() != null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ACCOUNT_SUSPENDED");
            }
            // AC-07: increment token version on new login to invalidate prior sessions
            if (tokenVersionService != null && faculty.getId() > 0) {
                try {
                    tokenVersionService.incrementTokenVersionForFaculty(faculty.getId());
                    // Reload faculty so principal has the new tokenVersion
                    Faculty reloaded = facultyService.findById(faculty.getId()).orElse(null);
                    if (reloaded != null) faculty = reloaded;
                } catch (Exception ignored) {}
            }
            // Generate JWT tokens for faculty
            UserPrincipal principal = UserPrincipal.fromFaculty(faculty);
            TokenPair tokens = jwtService.generateTokens(principal);
            // AC-05: record session for per-device tracking
            if (userSessionService != null && tokens.getRefreshTokenJti() != null) {
                java.time.LocalDateTime expiresAt = java.time.LocalDateTime.now().plusSeconds(
                        jwtService.getRefreshExpirationSeconds());
                userSessionService.createSession(tokens.getRefreshTokenJti(),
                        faculty.getId(), "FACULTY",
                        request != null ? request.getHeader("X-Device-Name") : null,
                        request != null ? request.getHeader("User-Agent") : null,
                        request != null ? RateLimitingService.getClientIp(request) : null,
                        expiresAt);
            }
            AuthResponse authResponse = AuthResponse.of(faculty, tokens);
            setAuthCookies(request, response, tokens);
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                    authResponse), HttpStatus.OK);
        }
        if(null!=learner){
            if (testOtpService != null && testOtpService.matchesTestOtp(phone, otpTrimmed)) {
                // ok
            } else if (!verificationService.verifyOTP(phone, otpTrimmed)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Incorrect OTP");
            }
            if (learner.getSuspendedAt() != null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ACCOUNT_SUSPENDED");
            }
            scopeResolutionService.enrichLearnerHierarchy(learner);
            // AC-07: increment token version on new login to invalidate prior sessions
            if (tokenVersionService != null && learner.getId() > 0) {
                try {
                    tokenVersionService.incrementTokenVersionForLearner(learner.getId());
                    // Reload learner so principal has the new tokenVersion
                    Learner reloaded = learnerService.findById(learner.getId()).orElse(null);
                    if (reloaded != null) learner = reloaded;
                } catch (Exception ignored) {}
            }
            UserPrincipal principal = UserPrincipal.fromLearner(learner);
            TokenPair tokens = jwtService.generateTokens(principal);
            // AC-05: record session for per-device tracking
            if (userSessionService != null && tokens.getRefreshTokenJti() != null) {
                java.time.LocalDateTime expiresAt = java.time.LocalDateTime.now().plusSeconds(
                        jwtService.getRefreshExpirationSeconds());
                userSessionService.createSession(tokens.getRefreshTokenJti(),
                        learner.getId(), "LEARNER",
                        request != null ? request.getHeader("X-Device-Name") : null,
                        request != null ? request.getHeader("User-Agent") : null,
                        request != null ? RateLimitingService.getClientIp(request) : null,
                        expiresAt);
            }
            AuthResponse authResponse = AuthResponse.of(learner, tokens);
            setAuthCookies(request, response, tokens);
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                    authResponse)
                    , HttpStatus.OK);
        }
        throw new Exception("No faculty/learner registered with Mobile number " + phone);
    }

    // JWT Authentication endpoint removed - will be implemented later
    // @RequestMapping(value = "/authenticate", method = RequestMethod.POST)
    // public ResponseEntity<?> generateToken(@RequestBody LoginUserDTO loginUserDTO) throws AuthenticationException {
    //     // Implementation removed - will be added later
    // }

    @RequestMapping(value = "/contacts", method = RequestMethod.GET, produces = "application/json")
public ResponseEntity<PageDTO<ContactDTO>> getContacts(
        @RequestParam(defaultValue = "0") int pageNumber,
        @RequestParam(defaultValue = "5") int pageSize,
        @RequestParam(required = false) String userType,
        @RequestParam(required = true) int collegeId) {

    com._42students.lms.security.UserPrincipal contactsCaller = securityContextUtil.getAuthenticatedUserPrincipal();
    // BE-0018: the contacts directory (phones and emails of every learner and faculty member) is for staff. Same-college access
    // alone let any learner read it.
    if (contactsCaller != null && (contactsCaller.isLearner() || contactsCaller.isRecruiter())) {
        throw new org.springframework.security.access.AccessDeniedException("The contacts directory is for staff only");
    }
    accessControlService.requireAccessCollege(contactsCaller, collegeId);
    List<ContactDTO> contactDTOList = userService.getContacts(userType, collegeId);
    ContactResponseDTO contactResponseDTO = new ContactResponseDTO();
    int totalItems = contactDTOList.size();
    
    // Ensure that pageSize is positive, or set a default value if it's not
    if (pageSize <= 0) {
        pageSize = 5; // Set a reasonable default value
    }
    
    if (totalItems == 0) {
        contactResponseDTO.setContactDTOList(new java.util.ArrayList<>());
        contactResponseDTO.setSize(0);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), contactResponseDTO), HttpStatus.OK);
    }

    int totalPages = (int) Math.ceil((double) totalItems / pageSize);

    // Use 0-based pageNumber; clamp to valid range
    if (pageNumber < 0) {
        pageNumber = 0;
    } else if (pageNumber >= totalPages) {
        pageNumber = totalPages - 1;
    }

    int startIndex = pageNumber * pageSize;
    int endIndex = Math.min(startIndex + pageSize, totalItems);

    List<ContactDTO> paginatedList = contactDTOList.subList(startIndex, endIndex);
    contactResponseDTO.setContactDTOList(paginatedList);
    contactResponseDTO.setSize(totalItems);

    return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), contactResponseDTO), HttpStatus.OK);
}


    
    @RequestMapping(value="/register", method = RequestMethod.POST)
    public ResponseEntity<Response<User>> saveUser(@RequestBody @Valid UserDto user){
        try {
            User user1 = userService.save(user);
            return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), user1), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error registering user: {}", e.getMessage());
            return new ResponseEntity<>(new Response<>("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Unexpected error registering user: ", e);
            return new ResponseEntity<>(new Response<>("error", "Failed to register user. Please try again or contact support.", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @RequestMapping(value="/adminping", method = RequestMethod.GET)
    public String adminPing(@RequestHeader(value = "Authorisation", required = false) String token){
        return "Only Admins Can Read This";
    }

    @PreAuthorize("isAuthenticated()")
    @RequestMapping(value="/userping", method = RequestMethod.GET)
    public String userPing(@RequestHeader(value = "Authorisation", required = false) String token){
        return "Any User Can Read This";
    }

    @ApiOperation(value = "Get learner contacts by Program Id")
    @RequestMapping(value = "/learnerContactsByProgramId", method = RequestMethod.GET, produces = "application/json")
    public ResponseEntity<Response<List<ContactDTO>>> getLearnerContactsByProgramId(@RequestParam int programId) {
          if (programId <= 0) {
              return new ResponseEntity<>(new Response<>("error", "programId must be a positive integer", null), HttpStatus.BAD_REQUEST);
          }
          accessControlService.requireAccessProgram(securityContextUtil.getAuthenticatedUserPrincipal(), programId);
        List<ContactDTO> contactDTOList = new ArrayList<>();
        List<LearnerResponseDTO> learnerResponseDTOList = learnerService.getLearnersByProgram(programId);
        for (LearnerResponseDTO learnerResponseDTO : learnerResponseDTOList) {
            ContactDTO contactDTO = new ContactDTO();
            contactDTO.setFirstName(learnerResponseDTO.getFirstName());
            contactDTO.setLastName(learnerResponseDTO.getLastName());
            contactDTO.setUserType(learnerResponseDTO.getUserType());
            contactDTO.setEmail(learnerResponseDTO.getContactMail());
            contactDTO.setContactMobile(learnerResponseDTO.getContactMobile());
            contactDTO.setContactPhone(learnerResponseDTO.getContactPhone());
            contactDTOList.add(contactDTO);
        }
        return ResponseEntity.ok(new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), contactDTOList));
    }

    @ApiOperation(value = "Get faculty contacts by Department Id")
    @RequestMapping(value = "/facultyContactsByDeptId", method = RequestMethod.GET, produces = "application/json")
    public ResponseEntity<Response<List<ContactDTO>>> getFacultyContactsByDeptId(@RequestParam int deptId) {
          if (deptId <= 0) {
              return new ResponseEntity<>(new Response<>("error", "deptId must be a positive integer", null), HttpStatus.BAD_REQUEST);
          }
          accessControlService.requireAccessDepartment(securityContextUtil.getAuthenticatedUserPrincipal(), deptId);
        List<ContactDTO> contactDTOList = new ArrayList<>();
        List<Faculty> facultyResponseDTOList = facultyService.getFacultyByDeptId(deptId);
        for (Faculty facultyResponseDTO : facultyResponseDTOList) {
            ContactDTO contactDTO = new ContactDTO();
            contactDTO.setFirstName(facultyResponseDTO.getFirstName());
            contactDTO.setLastName(facultyResponseDTO.getLastName());
            contactDTO.setUserType(facultyResponseDTO.getUserType());
            contactDTO.setEmail(facultyResponseDTO.getContactMail());
            contactDTO.setContactMobile(facultyResponseDTO.getContactMobile());
            contactDTO.setContactPhone(facultyResponseDTO.getContactPhone());
            contactDTOList.add(contactDTO);
        }
        return ResponseEntity.ok(new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), contactDTOList));
    }


}

