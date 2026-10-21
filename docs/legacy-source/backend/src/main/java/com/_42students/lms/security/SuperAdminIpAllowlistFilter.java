package com._42students.lms.security;

import com._42students.lms.service.AppSettingsService;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.InetAddress;
import java.util.ArrayList;
import java.util.List;

/**
 * Optional hard safety: allow superadmin endpoints only from configured IP/CIDR allowlist.
 * Configure in DB (GLOBAL app_setting):
 * - policy.superadmin.ipAllowlist = "1.2.3.4/32,5.6.7.0/24"
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 30)
public class SuperAdminIpAllowlistFilter extends OncePerRequestFilter {

    private final AppSettingsService appSettingsService;

    public SuperAdminIpAllowlistFilter(AppSettingsService appSettingsService) {
        this.appSettingsService = appSettingsService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (request != null && "OPTIONS".equalsIgnoreCase(request.getMethod())) return true;
        String path = normalizePath(request);
        return path == null || !path.startsWith("/api/v1/superadmin");
    }

    private String normalizePath(HttpServletRequest request) {
        if (request == null) return null;
        String uri = request.getRequestURI();
        if (uri == null) return null;
        String context = request.getContextPath();
        if (context != null && !context.isBlank() && uri.startsWith(context)) {
            uri = uri.substring(context.length());
        }
        if (uri.startsWith("/lms-backend")) {
            uri = uri.substring("/lms-backend".length());
        }
        return uri;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String raw = appSettingsService != null ? appSettingsService.getSettingValue("GLOBAL", null, "policy.superadmin.ipAllowlist") : null;
        if (raw == null || raw.trim().isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }
        String ip = extractIp(request);
        if (ip == null || ip.isEmpty()) {
            deny(response);
            return;
        }
        if (!isAllowed(ip, raw)) {
            deny(response);
            return;
        }
        filterChain.doFilter(request, response);
    }

    private void deny(HttpServletResponse response) throws IOException {
        response.setStatus(403);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"SUPERADMIN_IP_BLOCKED\"}");
    }

    private String extractIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.trim().isEmpty()) {
            return xff.split(",")[0].trim();
        }
        String xrip = request.getHeader("X-Real-IP");
        if (xrip != null && !xrip.trim().isEmpty()) return xrip.trim();
        return request.getRemoteAddr();
    }

    private boolean isAllowed(String ip, String csvCidrs) {
        try {
            InetAddress addr = InetAddress.getByName(ip);
            for (String part : split(csvCidrs)) {
                if (part.contains("/")) {
                    if (cidrMatch(addr, part.trim())) return true;
                } else {
                    if (ip.equals(part.trim())) return true;
                }
            }
            return false;
        } catch (Exception ignored) {
            return false;
        }
    }

    private List<String> split(String csv) {
        List<String> out = new ArrayList<>();
        for (String p : csv.split(",")) {
            if (p != null && !p.trim().isEmpty()) out.add(p.trim());
        }
        return out;
    }

    private boolean cidrMatch(InetAddress address, String cidr) {
        try {
            String[] parts = cidr.split("/");
            if (parts.length != 2) return false;
            InetAddress network = InetAddress.getByName(parts[0]);
            int prefix = Integer.parseInt(parts[1]);
            byte[] a = address.getAddress();
            byte[] n = network.getAddress();
            if (a.length != n.length) return false;
            int fullBytes = prefix / 8;
            int remainingBits = prefix % 8;
            for (int i = 0; i < fullBytes; i++) {
                if (a[i] != n[i]) return false;
            }
            if (remainingBits == 0) return true;
            int mask = (-1) << (8 - remainingBits);
            return (a[fullBytes] & mask) == (n[fullBytes] & mask);
        } catch (Exception ignored) {
            return false;
        }
    }
}

