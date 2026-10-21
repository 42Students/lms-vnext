package com._42students.lms.configuration;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Protects the Super Admin Cloud Logging proxy from accidental refresh loops and excessive
 * upstream Cloud Logging API traffic. Authorization is still enforced by Spring Security.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 125)
public class SuperAdminLogsRateLimitFilter implements Filter {
    private static final String LOGS_PATH = "/api/v1/superadmin/logs";
    private static final int MAX_PER_MINUTE = 60;
    private static final long WINDOW_MS = 60_000L;
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;
        String path = normalizePath(request);

        if (!path.equals(LOGS_PATH)
                && !path.equals(LOGS_PATH + "/query")
                && !path.equals(LOGS_PATH + "/detail")) {
            chain.doFilter(req, res);
            return;
        }

        response.setHeader("Cache-Control", "no-store, private, max-age=0");
        response.setHeader("Pragma", "no-cache");

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(req, res);
            return;
        }

        if (windows.size() > 10_000) windows.clear();
        String key = getClientIp(request);
        Window window = windows.computeIfAbsent(key, ignored -> new Window());
        long now = System.currentTimeMillis();

        if (now - window.start.get() > WINDOW_MS) {
            window.start.set(now);
            window.count.set(0);
        }

        if (window.count.incrementAndGet() > MAX_PER_MINUTE) {
            response.setStatus(429);
            response.setHeader("Retry-After", "60");
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(
                    "{\"error\":\"Too many log queries. Try again shortly.\"}");
            return;
        }

        chain.doFilter(req, res);
    }

    private String normalizePath(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri == null) return "";
        String context = request.getContextPath();
        if (context != null && !context.isBlank() && uri.startsWith(context)) {
            uri = uri.substring(context.length());
        }
        if (uri.startsWith("/lms-backend")) {
            uri = uri.substring("/lms-backend".length());
        }
        return uri;
    }

    private String getClientIp(HttpServletRequest request) {
        String remote = request.getRemoteAddr();
        if (isPrivateIp(remote)) {
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                return forwarded.split(",")[0].trim();
            }
            String realIp = request.getHeader("X-Real-IP");
            if (realIp != null && !realIp.isBlank()) return realIp.trim();
        }
        return remote == null || remote.isBlank() ? "unknown" : remote;
    }

    private boolean isPrivateIp(String ip) {
        if (ip == null) return false;
        if (ip.startsWith("127.") || ip.startsWith("10.") || ip.startsWith("192.168.")
                || "::1".equals(ip) || "0:0:0:0:0:0:0:1".equals(ip)) return true;
        if (!ip.startsWith("172.")) return false;
        String[] parts = ip.split("\\.");
        if (parts.length != 4) return false;
        try {
            int second = Integer.parseInt(parts[1]);
            return second >= 16 && second <= 31;
        } catch (NumberFormatException ignored) {
            return false;
        }
    }

    private static final class Window {
        private final AtomicLong start = new AtomicLong(System.currentTimeMillis());
        private final AtomicInteger count = new AtomicInteger();
    }
}
