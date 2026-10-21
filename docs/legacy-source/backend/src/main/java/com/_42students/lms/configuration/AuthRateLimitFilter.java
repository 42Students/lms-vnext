package com._42students.lms.configuration;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com._42students.lms.service.TestOtpService;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Rate limit for auth endpoints (login, verifyOTP, refresh) to reduce brute force and abuse.
 * Per-IP limits; does not require authentication.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 100)
public class AuthRateLimitFilter implements Filter {

    private static final int LOGIN_MAX_PER_MINUTE = 10;
    private static final int VERIFY_OTP_MAX_PER_MINUTE = 10;
    private static final int REFRESH_MAX_PER_MINUTE = 30;
    private static final long WINDOW_MS = 60_000L;

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    @Autowired(required = false)
    private TestOtpService testOtpService;

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;
        String path = request.getRequestURI();
        if (path == null) {
            chain.doFilter(req, res);
            return;
        }

        String key;
        int limit;
        if (isLoginPath(path)) {
            if (isE2eTestPhone(request)) {
                chain.doFilter(req, res);
                return;
            }
            key = "ip:" + getClientIp(request) + ":login";
            limit = LOGIN_MAX_PER_MINUTE;
        } else if (isVerifyOtpPath(path)) {
            if (isE2eTestPhone(request)) {
                chain.doFilter(req, res);
                return;
            }
            key = "ip:" + getClientIp(request) + ":verifyOTP";
            limit = VERIFY_OTP_MAX_PER_MINUTE;
        } else if (path.startsWith("/api/v1/auth/refresh")) {
            key = "ip:" + getClientIp(request) + ":refresh";
            limit = REFRESH_MAX_PER_MINUTE;
        } else {
            chain.doFilter(req, res);
            return;
        }

        if (windows.size() > 100_000) windows.clear();
        Window w = windows.computeIfAbsent(key, k -> new Window());
        long now = System.currentTimeMillis();
        if (now - w.start.get() > WINDOW_MS) {
            w.start.set(now);
            w.count.set(0);
        }
        int n = w.count.incrementAndGet();
        if (n > limit) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Too many requests. Try again later.\"}");
            return;
        }
        chain.doFilter(req, res);
    }

    private boolean isE2eTestPhone(HttpServletRequest request) {
        if (testOtpService == null || !testOtpService.isEnabled()) return false;
        String phone = request.getParameter("phoneNumber");
        if (phone == null || phone.isBlank()) phone = request.getParameter("phone");
        if (phone == null || phone.isBlank()) return false;
        String digits = phone.trim().replaceAll("\\D", "");
        return testOtpService.isTestPhone(digits);
    }

    private static boolean isLoginPath(String path) {
        return "/users/login".equals(path)
                || path.startsWith("/api/v1/learner/login")
                || path.startsWith("/api/v1/faculty/login")
                ;
    }

    private static boolean isVerifyOtpPath(String path) {
        return "/users/verifyOTP".equals(path)
                || path.startsWith("/api/v1/learner/verifyOTP")
                || path.startsWith("/api/v1/faculty/verifyOTP")
                ;
    }

    private static String getClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        // Only trust X-Forwarded-For if request comes from localhost/private network
        if (isPrivateIp(remoteAddr)) {
            String xff = request.getHeader("X-Forwarded-For");
            if (xff != null && !xff.isBlank()) {
                return xff.split(",")[0].trim();
            }
        }
        return remoteAddr != null ? remoteAddr : "unknown";
    }

    private static boolean isPrivateIp(String ip) {
        return ip != null && (ip.startsWith("127.") || ip.startsWith("10.") ||
               ip.startsWith("172.16.") || ip.startsWith("192.168.") || ip.equals("0:0:0:0:0:0:0:1"));
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

