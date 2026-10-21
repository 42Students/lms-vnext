package com._42students.lms.configuration;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Per-user (or per-IP) rate limit on course/lesson mutation paths, matching
 * AssignmentRateLimitFilter's pattern. COURSE-MODULE-ADVERSARIAL-AUDIT 8.2: create/update/delete
 * on courses and lessons had no rate limiting at all, unlike the assignment and auth paths, which
 * already have this same filter. Only mutating methods are limited — GET/HEAD traffic (browsing
 * courses/lessons) is untouched.
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE - 200)
public class CourseMutationRateLimitFilter implements Filter {

    private static final String[] PREFIXES = {"/api/v1/courses", "/api/v1/lesson"};
    private static final int MAX_REQUESTS_PER_MINUTE = 60;
    private static final long WINDOW_MS = 60_000L;

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;
        String path = request.getRequestURI();
        String method = request.getMethod();
        boolean isMutation = "POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method)
                || "PATCH".equalsIgnoreCase(method) || "DELETE".equalsIgnoreCase(method);
        if (!isMutation || path == null || !matchesPrefix(path)) {
            chain.doFilter(req, res);
            return;
        }
        String key = resolveKey(request);
        Window w = windows.computeIfAbsent(key, k -> new Window());
        long now = System.currentTimeMillis();
        if (now - w.start.get() > WINDOW_MS) {
            w.start.set(now);
            w.count.set(0);
        }
        int n = w.count.incrementAndGet();
        if (n > MAX_REQUESTS_PER_MINUTE) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"status\":\"TOO_MANY_REQUESTS\",\"message\":\"Rate limit exceeded. Try again later.\",\"data\":null}");
            return;
        }
        chain.doFilter(req, res);
    }

    private static boolean matchesPrefix(String path) {
        for (String p : PREFIXES) {
            if (path.startsWith(p)) return true;
        }
        return false;
    }

    private static String resolveKey(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() != null) {
            String name = auth.getName();
            if (name != null && !name.isEmpty()) return "u:" + name;
        }
        String ip = request.getRemoteAddr();
        if (ip == null) ip = "unknown";
        return "ip:" + ip;
    }

    @Override
    public void init(FilterConfig filterConfig) {}

    @Override
    public void destroy() {}

    private static class Window {
        final AtomicLong start = new AtomicLong(System.currentTimeMillis());
        final AtomicInteger count = new AtomicInteger(0);
    }
}
