package com._42students.lms.controller;

import com._42students.lms.dto.request.TrackerLogsAccessRequest;
import com._42students.lms.dto.response.AuthResponse;
import com._42students.lms.dto.response.Response;
import com._42students.lms.dto.response.TokenPair;
import com._42students.lms.security.JwtService;
import com._42students.lms.security.RateLimitingService;
import com._42students.lms.security.UserPrincipal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import javax.servlet.http.HttpServletRequest;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * A second, deliberately narrower front door onto the same super-admin session the real
 * phone+OTP "Vasan" login produces (see UserController#verifyOTP) -- for one specific reporter
 * (never shared further) who found that flow too slow just to check the tracker's Logs page.
 *
 * <p>Trades the normal login's per-account identity for a single shared secret: anyone who knows
 * the password gets a full super-admin session, same as today's OTP path, with no separate record
 * of *which* person that was. That's an accepted trade-off for a single trusted user, not a
 * pattern to extend to a shared password.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/public/bug-tracker/logs-access")
public class PublicTrackerLogsAccessController {
    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_SECONDS = 900;
    // AuthController#refreshInternal only takes its no-DB-lookup super-admin path when the refresh
    // token's "contactMobile" claim is present and non-empty (see the "Vasan" phone+OTP login,
    // which stamps the real phone there). Without it, a refresh silently falls through to
    // facultyRepository.findById(0) -- which finds nothing, since id 0 is a synthetic principal,
    // not a real row -- and 401s. There's no real phone number in this password-only flow, so this
    // placeholder exists purely to keep that claim non-empty; nothing reads it as a real number.
    private static final String CONTACT_MOBILE_CLAIM = "logs-password-access";

    private final JwtService jwtService;
    private final RateLimitingService rateLimitingService;
    private final BCryptPasswordEncoder passwordEncoder;

    @Value("${app.tracker-logs-access-password-hash:}")
    private String passwordHash;

    public PublicTrackerLogsAccessController(JwtService jwtService,
                                              RateLimitingService rateLimitingService,
                                              BCryptPasswordEncoder passwordEncoder) {
        this.jwtService = jwtService;
        this.rateLimitingService = rateLimitingService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/verify")
    public Response<AuthResponse> verify(@RequestBody TrackerLogsAccessRequest request,
                                          HttpServletRequest servletRequest) {
        String ip = RateLimitingService.getClientIp(servletRequest);
        String rateLimitKey = "trackerLogsAccess:" + ip;

        if (rateLimitingService.isRateLimited(rateLimitKey, MAX_ATTEMPTS, WINDOW_SECONDS)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many attempts. Please try again later.");
        }
        rateLimitingService.recordAttempt(rateLimitKey, MAX_ATTEMPTS, WINDOW_SECONDS);

        // Fail closed: an unconfigured password must never be treated as "no password required".
        if (passwordHash == null || passwordHash.trim().isEmpty()) {
            log.warn("Tracker logs access attempted from {} but no password hash is configured", ip);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Logs access is not configured");
        }

        String password = request != null ? request.getPassword() : null;
        if (password == null || password.isEmpty() || !passwordEncoder.matches(password, passwordHash)) {
            log.warn("Incorrect tracker logs access password from {}", ip);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect password");
        }

        log.info("Tracker logs access granted via password from {}", ip);

        UserPrincipal principal = UserPrincipal.forSuperAdmin();
        TokenPair tokens = jwtService.generateTokens(principal,
                Collections.singletonMap("contactMobile", CONTACT_MOBILE_CLAIM));

        Map<String, Object> superAdminUser = new HashMap<>();
        superAdminUser.put("id", 0);
        superAdminUser.put("contactMobile", CONTACT_MOBILE_CLAIM);
        superAdminUser.put("userType", "FACULTY");
        superAdminUser.put("facultyType", "ADMIN");

        AuthResponse authResponse = AuthResponse.of(superAdminUser, tokens);
        return new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), authResponse);
    }
}
