package com._42students.lms.configuration;

import com._42students.lms.security.UserPrincipal;
import org.slf4j.MDC;

/**
 * Puts the authenticated caller's identifiers into the logging context so every log line written
 * while serving that request says whose problem it was.
 *
 * Identifiers only, deliberately: no names, phone numbers, emails or tokens ever enter a log line.
 * Names are looked up from these ids at report time, by an authorized admin, and never stored in logs.
 */
public final class RequestLogContext {
    static final String[] KEYS = {"userId", "userType", "facultyType", "collegeId", "organizationId", "impersonatorId"};

    private RequestLogContext() {}

    public static void putIdentity(UserPrincipal principal) {
        if (principal == null) return;
        put("userId", principal.getId());
        put("userType", principal.getUserType());
        put("facultyType", principal.getFacultyType());
        put("collegeId", principal.getCollegeId());
        put("organizationId", principal.getOrganizationId());
        put("impersonatorId", principal.getImpersonatorId());
    }

    public static void clear() {
        for (String key : KEYS) MDC.remove(key);
    }

    private static void put(String key, Object value) {
        if (value == null) {
            MDC.remove(key);
        } else {
            MDC.put(key, String.valueOf(value));
        }
    }
}
