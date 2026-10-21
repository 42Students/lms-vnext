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
 * Lightweight abuse guard for the deliberately no-login Tracker write path.
 * Reads are open; issue creation is capped per client IP so an accidentally shared
 * internal URL cannot become an unlimited public write endpoint.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 120)
public class BugTrackerRateLimitFilter implements Filter {
    private static final String TRACKER_PREFIX = "/api/v1/public/bug-tracker";
    private static final int CREATE_MAX_PER_MINUTE = 30;
    private static final int ATTACHMENT_MAX_PER_MINUTE = 120;
    private static final long WINDOW_MS = 60_000L;

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;
        String path = normalizePath(request);
        if (!path.startsWith(TRACKER_PREFIX)) {
            chain.doFilter(req, res);
            return;
        }

        response.setHeader("Cache-Control", "no-store, max-age=0");
        response.setHeader("Pragma", "no-cache");

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(req, res);
            return;
        }

        if ("POST".equalsIgnoreCase(request.getMethod())
                && ((TRACKER_PREFIX + "/issues").equals(path)
                || path.endsWith("/attachments/presign")
                || path.endsWith("/attachments/confirm"))) {
            if (windows.size() > 50_000) windows.clear();
            boolean attachmentAction = path.contains("/attachments/");
            int requestLimit = attachmentAction ? ATTACHMENT_MAX_PER_MINUTE : CREATE_MAX_PER_MINUTE;
            String key = getClientIp(request) + (attachmentAction ? ":attachment" : ":issue");
            Window window = windows.computeIfAbsent(key, ignored -> new Window());
            long now = System.currentTimeMillis();
            if (now - window.start.get() > WINDOW_MS) {
                window.start.set(now);
                window.count.set(0);
            }
            if (window.count.incrementAndGet() > requestLimit) {
                response.setStatus(429);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write(
                        "{\"error\":\"Too many tracker write requests. Try again in a minute.\"}");
                return;
            }
        }

        chain.doFilter(req, res);
    }

    private String normalizePath(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri == null) return "";
        String context = request.getContextPath();
        if (context != null && !context.isBlank() && uri.startsWith(context)) {
            return uri.substring(context.length());
        }
        if (uri.startsWith("/lms-backend")) {
            return uri.substring("/lms-backend".length());
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
                || "0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) {
            return true;
        }
        if (!ip.startsWith("172.")) return false;
        String[] parts = ip.split("\\.");
        if (parts.length != 4) return false;
        try {
            int secondOctet = Integer.parseInt(parts[1]);
            return secondOctet >= 16 && secondOctet <= 31;
        } catch (NumberFormatException ignored) {
            return false;
        }
    }

    private static final class Window {
        private final AtomicLong start = new AtomicLong(System.currentTimeMillis());
        private final AtomicInteger count = new AtomicInteger();
    }
}
