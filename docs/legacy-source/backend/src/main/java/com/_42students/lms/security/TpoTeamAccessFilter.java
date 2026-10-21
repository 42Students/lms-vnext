package com._42students.lms.security;

import com._42students.lms.service.tpo.TpoTeamService;
import com._42students.lms.util.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * WebSecurityConfig lets any faculty reach /api/v1/tpo/**. This filter narrows that to the placement team: the TPO, the
 * college admin, and faculty the placement cell added as TPO admins on Settings -> Team. Anyone else gets 403.
 * (Faculty and student coordinators were removed on 9 Oct 2026; see TpoTeamService.)
 * It runs after Spring Security, so the authenticated principal is already set.
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE - 10)
@RequiredArgsConstructor
public class TpoTeamAccessFilter extends OncePerRequestFilter {

    private static final String PREFIX = "/api/v1/tpo/";

    private final TpoTeamService team;
    private final SecurityContextUtil securityContextUtil;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith(PREFIX);
    }

    private static boolean has(Authentication a, String role) {
        for (GrantedAuthority g : a.getAuthorities()) if (role.equals(g.getAuthority())) return true;
        return false;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || has(auth, "ROLE_TPO") || has(auth, "ROLE_ADMIN") || has(auth, "ROLE_SUPER_ADMIN")) {
            chain.doFilter(req, res);
            return;
        }
        UserPrincipal p = securityContextUtil.getAuthenticatedUserPrincipal();
        String path = req.getRequestURI();
        boolean write = !"GET".equals(req.getMethod()) && !"HEAD".equals(req.getMethod());
        if (TpoTeamService.TPO_ADMIN.equals(team.roleOf(p))) {
            chain.doFilter(req, res);
            return;
        }
        // A teacher's sidebar asks "am I on the placement team?": my-access answers role "" for someone on no team, not a 403
        // (a 403 was logged as a failed call, and reported as a client error, on every page load).
        if (!write && path.equals(PREFIX + "my-access")) {
            chain.doFilter(req, res);
            return;
        }
        res.setStatus(HttpServletResponse.SC_FORBIDDEN);
        res.setContentType("application/json");
        res.getWriter().write("{\"error\":\"You don't have access to this\"}");
    }
}
