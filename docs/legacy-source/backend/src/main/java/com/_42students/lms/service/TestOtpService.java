package com._42students.lms.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * God-tier testing support for UAT/E2E:
 * Allows a fixed OTP for whitelisted phone numbers so automated UI tests can login reliably.
 *
 * Enable via env vars (recommended only in UAT):
 * - APP_TEST_OTP_ENABLED=true
 * - APP_TEST_OTP=0000
 * - APP_TEST_OTP_PHONES=9397662127,8801448346
 * - APP_TEST_OTP_GLOBAL=false  (when true: OTP works for any phone; DEV ONLY)
 * - APP_TEST_OTP_EMAILS=qa.recruiter@company.com,...  (email sign-in, e.g. recruiters, who sign in by email only: the same code,
 *   and no email is sent. NEVER in production, whatever else is set; added 13 Oct 2026 so QA has a recruiter login on dev)
 *
 * Backward compatible aliases (older scripts):
 * - E2E_TEST_OTP_ENABLED=true
 * - E2E_TEST_OTP=0000
 * - E2E_TEST_OTP_PHONES=9397662127,8801448346
 * - E2E_TEST_OTP_GLOBAL=false
 */
@Service
public class TestOtpService {

    private static final Logger log = LoggerFactory.getLogger(TestOtpService.class);

    /** Legacy meaning, unchanged: test mode is on AND this is not production. Gates the e2e token endpoint and rate-limit exemption. */
    private final boolean enabled;
    /**
     * The configured QA number list is usable. Same as {@code enabled} everywhere except production,
     * where it additionally needs the explicit APP_TEST_OTP_ALLOW_IN_PRODUCTION switch.
     */
    private final boolean listedLoginEnabled;
    private final boolean production;
    private final String otp;
    private final Set<String> phones;
    private final Set<String> emails;
    private final boolean global;

    public TestOtpService(Environment env) {
        // Prefer Spring Environment so values work with dotenv/property sources too (not only real OS env vars).
        String en = firstNonBlank(env.getProperty("APP_TEST_OTP_ENABLED"), env.getProperty("E2E_TEST_OTP_ENABLED"));
        this.production = "prod".equalsIgnoreCase(env.getProperty("STAGE", ""))
                || "prod".equalsIgnoreCase(env.getProperty("spring.profiles.active", ""))
                || Arrays.stream(env.getActiveProfiles()).anyMatch(p -> "prod".equalsIgnoreCase(p));
        boolean switchOn = "true".equalsIgnoreCase(en != null ? en.trim() : null);
        String allowStr = normalize(env.getProperty("APP_TEST_OTP_ALLOW_IN_PRODUCTION"));
        boolean allowInProduction = "true".equalsIgnoreCase(allowStr);
        this.enabled = !production && switchOn;
        this.listedLoginEnabled = switchOn && (!production || allowInProduction);
        this.otp = normalize(firstNonBlank(env.getProperty("APP_TEST_OTP"), env.getProperty("E2E_TEST_OTP")));
        this.phones = parsePhones(firstNonBlank(env.getProperty("APP_TEST_OTP_PHONES"), env.getProperty("E2E_TEST_OTP_PHONES")));
        Set<String> mails = new HashSet<>();
        for (String e : parsePhones(env.getProperty("APP_TEST_OTP_EMAILS"))) mails.add(e.toLowerCase(java.util.Locale.ROOT));
        this.emails = mails;

        String globalStr = firstNonBlank(env.getProperty("APP_TEST_OTP_GLOBAL"), env.getProperty("E2E_TEST_OTP_GLOBAL"));
        // "Any number works" is never allowed in production, whatever else is set. The production block
        // used to enforce that only because it switched the whole service off; lifting the block for the
        // QA list must not quietly lift it for this.
        this.global = !production && "true".equalsIgnoreCase(globalStr != null ? globalStr.trim() : null);

        if (production && listedLoginEnabled && otp != null && !otp.isEmpty() && !phones.isEmpty()) {
            log.warn("SECURITY: fixed-OTP QA login is ACTIVE IN PRODUCTION for {} configured number(s). "
                    + "Remove APP_TEST_OTP_ALLOW_IN_PRODUCTION from the backend secret to switch it off.", phones.size());
        }
    }

    /**
     * True when running as production (STAGE=prod, or the prod profile). Hardcoded OTPs must never
     * authenticate anyone here.
     */
    public boolean isProductionEnvironment() {
        return production;
    }

    public boolean isEnabled() {
        if (!enabled || otp == null || otp.isEmpty()) return false;
        if (global) return true;
        return !phones.isEmpty();
    }

    public boolean isTestPhone(String phone) {
        if (isEnabled() && global) return true;
        if (!listedLoginEnabled || otp == null || otp.isEmpty() || phones.isEmpty()) return false;
        String p = normalize(phone);
        return p != null && phones.contains(p);
    }

    public boolean matchesTestOtp(String phone, String providedOtp) {
        if (!isTestPhone(phone)) return false;
        String o = normalize(providedOtp);
        return o != null && o.equals(otp);
    }

    /** A listed test email: test mode on, never production (unlike the phone list, no production switch exists for emails). */
    public boolean isTestEmail(String email) {
        if (!enabled || otp == null || otp.isEmpty() || emails.isEmpty() || email == null) return false;
        return emails.contains(email.trim().toLowerCase(java.util.Locale.ROOT));
    }

    public String getOtpForTestPhone() {
        return otp;
    }

    private Set<String> parsePhones(String csv) {
        if (csv == null || csv.trim().isEmpty()) return Collections.emptySet();
        Set<String> out = new HashSet<>();
        Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(this::normalize)
                .filter(s -> s != null && !s.isEmpty())
                .forEach(out::add);
        return out;
    }

    private String normalize(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private String firstNonBlank(String a, String b) {
        String na = normalize(a);
        if (na != null) return na;
        return normalize(b);
    }
}

