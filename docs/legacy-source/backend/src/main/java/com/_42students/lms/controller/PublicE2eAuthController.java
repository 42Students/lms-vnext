package com._42students.lms.controller;

import com._42students.lms.dto.response.AuthResponse;
import com._42students.lms.dto.response.Response;
import com._42students.lms.dto.response.TokenPair;
import com._42students.lms.security.JwtService;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AppSettingsService;
import com._42students.lms.service.TestOtpService;
import com._42students.lms.util.CookieUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Test-only auth helpers for E2E automation.
 * Guarded by APP_TEST_OTP_ENABLED + APP_TEST_OTP_PHONES allowlist.
 *
 * IMPORTANT: Do not enable in production without strict access controls.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/public/e2e/auth")
public class PublicE2eAuthController {

    private final JwtService jwtService;
    private final TestOtpService testOtpService;
    private final AppSettingsService appSettingsService;

    @Value("${app.super-admin-phones:}")
    private String superAdminPhonesConfig;

    @Value("${app.cookie.domain:}")
    private String cookieDomain;

    public PublicE2eAuthController(JwtService jwtService,
                                   TestOtpService testOtpService,
                                   AppSettingsService appSettingsService) {
        this.jwtService = jwtService;
        this.testOtpService = testOtpService;
        this.appSettingsService = appSettingsService;
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

    private void setAuthCookies(HttpServletRequest request,
                                HttpServletResponse response,
                                TokenPair tokens) {
        if (response == null || tokens == null) return;
        boolean secure = CookieUtil.isSecureRequest(request);
        String cd = CookieUtil.resolveCookieDomain(request, cookieDomain);
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

    @PostMapping("/superadmin")
    public ResponseEntity<?> loginSuperAdmin(@RequestBody Map<String, Object> body,
                                            HttpServletRequest request,
                                            HttpServletResponse response) {
        if (testOtpService == null || !testOtpService.isEnabled()) {
            return ResponseEntity.status(404).body(Map.of("error", "NOT_FOUND"));
        }
        Object phoneObj = body != null ? body.get("phone") : null;
        if (phoneObj != null && !(phoneObj instanceof String)) {
            return ResponseEntity.badRequest().body(Map.of("error", "phone must be a string"));
        }
        String phone = (String) phoneObj;
        String digits = phone != null ? phone.trim().replaceAll("\\D", "") : null;
        if (digits == null || digits.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "PHONE_REQUIRED"));
        }
        if (!testOtpService.isTestPhone(digits)) {
            return ResponseEntity.status(403).body(Map.of("error", "PHONE_NOT_ALLOWED"));
        }
        if (!getSuperAdminPhones().contains(digits)) {
            return ResponseEntity.status(403).body(Map.of("error", "NOT_SUPER_ADMIN"));
        }

        // Synthetic principal: id=0, FACULTY, ADMIN => ROLE_SUPER_ADMIN in JwtAuthenticationFilter
        UserPrincipal principal = UserPrincipal.forSuperAdmin();
        // The refresh token MUST carry contactMobile: refreshInternal's super-admin fast path is gated
        // on that claim (super-admin is id=0 with no Faculty row), so a claim-less refresh token from the
        // single-arg overload 401s on the first /auth/refresh and logs the e2e session straight out.
        TokenPair tokens = jwtService.generateTokens(principal, java.util.Collections.singletonMap("contactMobile", digits));
        setAuthCookies(request, response, tokens);

        Map<String, Object> superAdminUser = new HashMap<>();
        superAdminUser.put("id", 0);
        superAdminUser.put("contactMobile", digits);
        superAdminUser.put("userType", "FACULTY");
        superAdminUser.put("facultyType", "ADMIN");

        AuthResponse authResponse = AuthResponse.of(superAdminUser, tokens);
        return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), authResponse), HttpStatus.OK);
    }
}

