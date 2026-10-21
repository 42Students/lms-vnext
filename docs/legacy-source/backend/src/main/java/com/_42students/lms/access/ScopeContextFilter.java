package com._42students.lms.access;

import com._42students.lms.security.UserPrincipal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Sets request-scoped ScopeContext from JWT principal. Runs after JwtAuthenticationFilter.
 * Clears thread-local in finally to avoid leaks.
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE - 100)
@Slf4j
public class ScopeContextFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof UserPrincipal) {
                ScopeContext context = ScopeContext.fromPrincipal((UserPrincipal) auth.getPrincipal());
                ScopeContextHolder.set(context);
            }
            chain.doFilter(request, response);
        } finally {
            ScopeContextHolder.clear();
        }
    }
}

