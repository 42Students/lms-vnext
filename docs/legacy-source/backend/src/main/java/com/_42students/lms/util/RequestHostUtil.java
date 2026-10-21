package com._42students.lms.util;

import javax.servlet.http.HttpServletRequest;
import java.util.Locale;

/**
 * Utilities for deriving the effective request host/proto behind reverse proxies.
 * Defensive parsing:
 * - X-Forwarded-Host can be a comma-separated list (take first)
 * - Forwarded can include host= and proto=
 * - Host can include port
 * - values may include scheme/path in misconfigured setups
 */
public final class RequestHostUtil {
    private RequestHostUtil() {}

    public static boolean devHostBypassEnabled() {
        String sys = System.getProperty("lms.dev.host.bypass");
        if (sys != null && !sys.trim().isEmpty()) {
            return "true".equalsIgnoreCase(sys.trim());
        }
        String env = System.getenv("LMS_DEV_HOST_BYPASS");
        if (env != null && !env.trim().isEmpty()) {
            return "true".equalsIgnoreCase(env.trim());
        }
        return false;
    }

    /**
     * Whether this app should trust proxy-provided forwarded headers.
     *
     * Security note:
     * Only enable this when your reverse proxy / load balancer *strips* any client-sent
     * X-Forwarded-* / Forwarded headers and sets them itself. Otherwise, attackers can spoof hosts.
     */
    public static boolean trustForwardedHeaders() {
        String sys = System.getProperty("lms.trust.forwarded.headers");
        if (sys != null && !sys.trim().isEmpty()) {
            return "true".equalsIgnoreCase(sys.trim());
        }
        String env = System.getenv("LMS_TRUST_FORWARDED_HEADERS");
        if (env != null && !env.trim().isEmpty()) {
            return "true".equalsIgnoreCase(env.trim());
        }
        return false;
    }

    public static String getNormalizedHost(HttpServletRequest request) {
        return normalizeHostOnly(getEffectiveHostHeader(request));
    }

    public static String getEffectiveHostHeader(HttpServletRequest request) {
        if (request == null) return null;

        if (trustForwardedHeaders()) {
            String xfHost = firstNonEmpty(request.getHeader("X-Forwarded-Host"));
            if (xfHost != null) return xfHost;

            String forwarded = firstNonEmpty(request.getHeader("Forwarded"));
            String fHost = parseForwardedParam(forwarded, "host");
            if (fHost != null) return fHost;
        }

        String host = firstNonEmpty(request.getHeader("Host"));
        if (host != null) return host;

        String serverName = firstNonEmpty(request.getServerName());
        return serverName;
    }

    public static String getEffectiveProto(HttpServletRequest request) {
        if (request == null) return null;
        if (trustForwardedHeaders()) {
            String xfProto = firstNonEmpty(request.getHeader("X-Forwarded-Proto"));
            if (xfProto != null) return firstCsvToken(xfProto);
            String forwarded = firstNonEmpty(request.getHeader("Forwarded"));
            String proto = parseForwardedParam(forwarded, "proto");
            return proto;
        }
        return null;
    }

    public static String normalizeHostOnly(String hostHeader) {
        if (hostHeader == null) return null;
        String host = firstCsvToken(hostHeader);
        if (host == null) return null;
        host = host.trim();
        if (host.isEmpty()) return host;

        host = host.replaceFirst("(?i)^https?://", "");
        int slash = host.indexOf('/');
        if (slash > 0) host = host.substring(0, slash);

        // Handle IPv6 literal forms:
        // - [::1]:8080  -> ::1
        // - [2001:db8::1] -> 2001:db8::1
        if (host.startsWith("[")) {
            int end = host.indexOf(']');
            if (end > 1) host = host.substring(1, end);
        } else {
            // Strip :port for normal hosts / IPv4 (best-effort; raw IPv6 without brackets is unsupported)
            int colon = host.indexOf(':');
            if (colon > 0) host = host.substring(0, colon);
        }
        if (host.toLowerCase(Locale.ROOT).startsWith("www.")) host = host.substring(4);
        return host;
    }

    public static boolean isDevLocalHost(String hostHeader) {
        String host = normalizeHostOnly(hostHeader);
        if (host == null || host.isEmpty()) return false;
        String lower = host.toLowerCase(Locale.ROOT);

        if ("localhost".equals(lower)
                || "127.0.0.1".equals(lower)
                || "0.0.0.0".equals(lower)
                || "::1".equals(lower)
                || lower.endsWith(".localhost")) {
            return true;
        }

        if (!devHostBypassEnabled()) return false;
        if ("10.0.2.2".equals(lower)) return true;
        return isPrivateIpv4(lower);
    }

    private static boolean isPrivateIpv4(String host) {
        String[] parts = host.split("\\.");
        if (parts.length != 4) return false;
        try {
            int a = Integer.parseInt(parts[0]);
            int b = Integer.parseInt(parts[1]);
            int c = Integer.parseInt(parts[2]);
            int d = Integer.parseInt(parts[3]);
            if (!inByteRange(a) || !inByteRange(b) || !inByteRange(c) || !inByteRange(d)) return false;
            return a == 10
                    || (a == 172 && b >= 16 && b <= 31)
                    || (a == 192 && b == 168);
        } catch (NumberFormatException ignored) {
            return false;
        }
    }

    private static boolean inByteRange(int value) {
        return value >= 0 && value <= 255;
    }

    private static String firstNonEmpty(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static String firstCsvToken(String header) {
        if (header == null) return null;
        String[] parts = header.split(",");
        if (parts.length == 0) return header;
        return parts[0] != null ? parts[0].trim() : null;
    }

    /**
     * Parse RFC 7239 Forwarded header. Minimal parsing: we scan the first element only.
     * Example: Forwarded: for=1.2.3.4;proto=https;host=example.com:443
     */
    private static String parseForwardedParam(String forwarded, String key) {
        if (forwarded == null || key == null) return null;
        String first = firstCsvToken(forwarded);
        if (first == null) return null;
        String[] parts = first.split(";");
        for (String part : parts) {
            if (part == null) continue;
            String p = part.trim();
            int eq = p.indexOf('=');
            if (eq <= 0) continue;
            String k = p.substring(0, eq).trim().toLowerCase(Locale.ROOT);
            if (!k.equals(key.toLowerCase(Locale.ROOT))) continue;
            String v = p.substring(eq + 1).trim();
            if (v.startsWith("\"") && v.endsWith("\"") && v.length() >= 2) {
                v = v.substring(1, v.length() - 1);
            }
            return v.isEmpty() ? null : v;
        }
        return null;
    }
}

