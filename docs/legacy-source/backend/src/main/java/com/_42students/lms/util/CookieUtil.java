package com._42students.lms.util;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Locale;

public final class CookieUtil {
    private CookieUtil() {}

    public static boolean isSecureRequest(HttpServletRequest request) {
        if (request == null) return false;
        String proto = RequestHostUtil.getEffectiveProto(request);
        if (proto != null && proto.toLowerCase(Locale.ROOT).contains("https")) return true;
        return request.isSecure();
    }

    public static void setCookie(HttpServletResponse response,
                                 String name,
                                 String value,
                                 int maxAgeSeconds,
                                 String domain,
                                 boolean secure,
                                 boolean httpOnly,
                                 String sameSite) {
        if (response == null || name == null || name.isEmpty()) return;
        String v = value == null ? "" : value;
        String ss = sameSite != null ? sameSite.trim() : "";
        // Modern browsers require Secure when SameSite=None. If request isn't secure (local http),
        // falling back to Lax avoids silently dropped cookies.
        if ("None".equalsIgnoreCase(ss) && !secure) {
            ss = "Lax";
        }
        StringBuilder sb = new StringBuilder();
        sb.append(name).append("=").append(v).append("; Path=/; Max-Age=").append(maxAgeSeconds);
        if (domain != null && !domain.trim().isEmpty()) {
            sb.append("; Domain=").append(domain.trim());
        }
        if (secure) sb.append("; Secure");
        if (httpOnly) sb.append("; HttpOnly");
        if (!ss.isEmpty()) {
            sb.append("; SameSite=").append(ss);
        }
        response.addHeader("Set-Cookie", sb.toString());
    }

    public static String resolveCookieDomain(HttpServletRequest request, String configuredDomain) {
        String host = RequestHostUtil.getNormalizedHost(request);
        if (RequestHostUtil.isDevLocalHost(host)) {
            return "";
        }

        if (configuredDomain != null && !configuredDomain.trim().isEmpty()) {
            return configuredDomain.trim();
        }

        if (host != null) {
            String lower = host.toLowerCase(Locale.ROOT);
            if ("42lms.com".equals(lower) || lower.endsWith(".42lms.com")) {
                return ".42lms.com";
            }
        }

        return "";
    }

    public static String readCookie(HttpServletRequest request, String name) {
        if (request == null || request.getCookies() == null || name == null) return null;
        for (javax.servlet.http.Cookie c : request.getCookies()) {
            if (c != null && name.equals(c.getName())) return c.getValue();
        }
        return null;
    }
}

