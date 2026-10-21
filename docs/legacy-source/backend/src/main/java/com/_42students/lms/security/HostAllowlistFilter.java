package com._42students.lms.security;

import com._42students.lms.repository.TenantDomainRepository;
import com._42students.lms.service.AppSettingsService;
import com._42students.lms.service.TenantResolutionService;
import com._42students.lms.util.RequestHostUtil;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Protects against unknown Host headers in multi-tenant mode.
 * Allows:
 * - localhost/dev hosts
 * - globalHost (app setting)
 * - configured tenant_domain.host entries (non-deleted)
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class HostAllowlistFilter extends OncePerRequestFilter {

    private final AppSettingsService appSettingsService;
    private final TenantDomainRepository tenantDomainRepository;
    private final TenantResolutionService tenantResolutionService;

    public HostAllowlistFilter(AppSettingsService appSettingsService,
                               TenantDomainRepository tenantDomainRepository,
                               TenantResolutionService tenantResolutionService) {
        this.appSettingsService = appSettingsService;
        this.tenantDomainRepository = tenantDomainRepository;
        this.tenantResolutionService = tenantResolutionService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (request == null) return true;
        // Never block CORS preflight
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;
        String path = resolvePath(request);
        if (path == null) return false;
        // Never block public and tooling endpoints (they must work even before tenant setup)
        return path.startsWith("/api/v1/public")
                || path.startsWith("/lms-backend/api/v1/public")
                || path.startsWith("/actuator")
                || path.startsWith("/lms-backend/actuator")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/lms-backend/swagger-ui")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/lms-backend/v3/api-docs")
                || path.startsWith("/swagger-resources")
                || path.startsWith("/lms-backend/swagger-resources")
                || path.startsWith("/webjars");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String normalized = RequestHostUtil.getNormalizedHost(request);
        if (normalized == null || normalized.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        // Allow dev
        if (RequestHostUtil.isDevLocalHost(normalized)) {
            filterChain.doFilter(request, response);
            return;
        }

        String globalHost = appSettingsService != null ? appSettingsService.getGlobalHost() : null;
        String baseDomain = appSettingsService != null ? appSettingsService.getBaseDomain() : null;
        String normalizedGlobalHost = RequestHostUtil.normalizeHostOnly(globalHost);
        if ((normalizedGlobalHost == null || normalizedGlobalHost.trim().isEmpty()) && baseDomain != null && !baseDomain.trim().isEmpty()) {
            normalizedGlobalHost = RequestHostUtil.normalizeHostOnly(baseDomain);
        }
        if (normalizedGlobalHost != null && !normalizedGlobalHost.trim().isEmpty()
                && normalized.equalsIgnoreCase(normalizedGlobalHost)) {
            filterChain.doFilter(request, response);
            return;
        }

        boolean requireVerified = requireVerifiedDomains();
        boolean known = (requireVerified
                ? tenantDomainRepository.findVerifiedActiveByHost(normalized).isPresent()
                : tenantDomainRepository.findActiveByHost(normalized).isPresent());
        if (!known) {
            addCorsHeadersIfOriginAllowed(request, response);
            response.setStatus(404);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"UNKNOWN_HOST\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }

    private String resolvePath(HttpServletRequest request) {
        if (request == null) return null;
        String path = request.getServletPath();
        if (path == null || path.isEmpty()) {
            path = request.getRequestURI();
        }
        String contextPath = request.getContextPath();
        if (path != null && contextPath != null && !contextPath.isEmpty() && path.startsWith(contextPath)) {
            path = path.substring(contextPath.length());
        }
        return path;
    }

    private boolean requireVerifiedDomains() {
        String sys = System.getProperty("lms.domain.require.verified");
        if (sys != null && !sys.trim().isEmpty()) {
            return "true".equalsIgnoreCase(sys.trim());
        }
        String env = System.getenv("LMS_REQUIRE_VERIFIED_DOMAINS");
        if (env != null && !env.trim().isEmpty()) {
            return "true".equalsIgnoreCase(env.trim());
        }
        return true;
    }

    /**
     * When blocking early in a filter, Spring Security's CORS processing may not get a chance to add headers.
     * Add minimal CORS headers for allowed origins so browsers don't surface this as a confusing CORS failure.
     */
    private void addCorsHeadersIfOriginAllowed(HttpServletRequest request, HttpServletResponse response) {
        if (request == null || response == null) return;
        String origin = request.getHeader("Origin");
        if (origin == null || origin.trim().isEmpty()) return;

        String originsEnv = System.getenv("CORS_ALLOWED_ORIGINS");
        Set<String> allowed = new HashSet<>();
        if (originsEnv != null && !originsEnv.trim().isEmpty()) {
            Arrays.stream(originsEnv.split(",")).map(String::trim).filter(s -> !s.isEmpty()).forEach(allowed::add);
        } else {
            allowed.add("http://localhost:3000");
            allowed.add("http://localhost:3001");
            allowed.add("http://localhost:8080");
        }

        if (!allowed.contains(origin.trim())) return;
        response.setHeader("Vary", "Origin");
        response.setHeader("Access-Control-Allow-Origin", origin.trim());
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setHeader("Access-Control-Allow-Headers", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,PATCH");
    }
}

