package com._42students.lms.configuration;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URI;

/**
 * Early CORS filter: adds CORS headers so frontend (e.g. localhost:3000) can call the API.
 *
 * Why this exists even though Spring Security also configures CORS:
 * Some requests can be rejected by very-early servlet filters (host allowlist, rate limit, etc.)
 * before Spring Security's CORS handling runs. Browsers then surface confusing CORS errors.
 *
 * This filter runs at highest precedence to ensure preflight/blocked responses still include
 * correct CORS headers for allowed origins.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CORSFilter implements Filter {

    private boolean isAllowedOrigin(String origin) {
        if (origin == null || origin.isBlank()) return false;
        try {
            URI uri = URI.create(origin.trim());
            String host = uri.getHost();
            if (host == null || host.isBlank()) return false;
            String normalizedHost = host.trim().toLowerCase();
            if ("localhost".equals(normalizedHost) || "127.0.0.1".equals(normalizedHost)) {
                return true;
            }
            if (normalizedHost.endsWith(".42lms.com") || "42lms.com".equals(normalizedHost) || "www.42lms.com".equals(normalizedHost)) {
                return "https".equalsIgnoreCase(uri.getScheme());
            }
        } catch (Exception ignored) {}

        String originsEnv = System.getenv("CORS_ALLOWED_ORIGINS");
        if (originsEnv != null && !originsEnv.trim().isEmpty()) {
            for (String allowedOrigin : originsEnv.split(",")) {
                if (allowedOrigin != null && origin.trim().equalsIgnoreCase(allowedOrigin.trim())) {
                    return true;
                }
            }
        }
        return false;
    }

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {
        HttpServletResponse response = (HttpServletResponse) res;
        HttpServletRequest request = (HttpServletRequest) req;

        String origin = request.getHeader("Origin");
        if (origin != null && !origin.isBlank()) {
            if (isAllowedOrigin(origin)) {
                // Avoid overriding if already set by Spring Security
                if (response.getHeader("Access-Control-Allow-Origin") == null) {
                    response.setHeader("Vary", "Origin");
                    response.setHeader("Access-Control-Allow-Origin", origin.trim());
                }
                if (response.getHeader("Access-Control-Allow-Credentials") == null) {
                    response.setHeader("Access-Control-Allow-Credentials", "true");
                }
            }
        }
        if (response.getHeader("Access-Control-Allow-Methods") == null) {
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
        }
        if (response.getHeader("Access-Control-Max-Age") == null) {
            response.setHeader("Access-Control-Max-Age", "3600");
        }
        if (response.getHeader("Access-Control-Allow-Headers") == null) {
            response.setHeader("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Authorization, Origin, Accept, Access-Control-Request-Method, Access-Control-Request-Headers");
        }

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        chain.doFilter(req, res);
    }

    @Override
    public void init(FilterConfig filterConfig) {}

    @Override
    public void destroy() {}
}

