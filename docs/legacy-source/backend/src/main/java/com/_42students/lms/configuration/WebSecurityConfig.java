package com._42students.lms.configuration;

import com._42students.lms.access.ScopeContextFilter;
import com._42students.lms.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Web security: keep public login/refresh/progress endpoints reachable while enforcing
 * administrative authority for mutations of academic structure and user rosters.
 * Resource/tenant authorization must ALSO be enforced by each controller and service.
 */
@Configuration
@EnableWebSecurity
@EnableAsync
@Profile("!controllerAccessTest")
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {

    private static final String[] ACADEMIC_ADMIN_PATHS = {
            "/api/v1/courses/**",
            "/api/v1/lesson/**",
            "/api/v1/batch/**",
            "/api/v1/class/**",
            "/api/v1/semester/**",
            "/api/v1/program/**",
            "/api/v1/new-program/**",
            "/api/v1/program-structure/**",
            "/api/v1/scheduleClass/**",
            "/api/v1/lectureHall/**",
            "/api/v1/faculty-course-associations/**"
    };

    // Legacy people controllers mix public OTP, self-service reads and admin-only writes
    // under the same prefix. Gate ONLY these write routes, not /login or /verifyOTP.
    private static final String[] PEOPLE_ADMIN_POST_PATHS = {
            "/api/v1/faculty/register",
            "/api/v1/faculty/bulk-register",
            "/api/v1/faculty/bulk-validate",
            "/api/v1/faculty/createCourseMapping",
            "/api/v1/learner/register",
            "/api/v1/learner/bulk-register",
            "/api/v1/learner/bulk-validate",
            "/api/v1/learner/bulk-imports/*/undo"
    };

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private ScopeContextFilter scopeContextFilter;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(buildAllowedOriginPatterns());
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setExposedHeaders(Arrays.asList("Content-Type", "Cache-Control", "X-Total-Count", "X-Truncated")); // BE-0034: audit completeness
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    private List<String> buildAllowedOriginPatterns() {
        List<String> patterns = new ArrayList<>();
        patterns.add("http://localhost:*");
        patterns.add("https://42lms.com");
        patterns.add("https://www.42lms.com");
        patterns.add("https://*.42lms.com");
        String originsEnv = System.getenv("CORS_ALLOWED_ORIGINS");
        if (originsEnv != null && !originsEnv.trim().isEmpty()) {
            patterns.addAll(Arrays.asList(originsEnv.split(",")));
        }
        return patterns;
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .cors(c -> c.configurationSource(corsConfigurationSource()))
            .csrf().disable()
            .headers()
                .frameOptions().sameOrigin()
                .contentTypeOptions().and()
                .httpStrictTransportSecurity().maxAgeInSeconds(31536000).includeSubDomains(true).and()
                .addHeaderWriter(new org.springframework.security.web.header.writers.StaticHeadersWriter("X-Content-Type-Options", "nosniff"))
                .addHeaderWriter(new org.springframework.security.web.header.writers.StaticHeadersWriter("X-Permitted-Cross-Domain-Policies", "none"))
                .addHeaderWriter(new org.springframework.security.web.header.writers.StaticHeadersWriter("Referrer-Policy", "strict-origin-when-cross-origin"))
                .contentSecurityPolicy("default-src 'self'; script-src 'self'; object-src 'none'")
                .and()
                .and()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            .authorizeRequests()
                .requestMatchers(CorsUtils::isPreFlightRequest).permitAll()
                .antMatchers("/users/login", "/users/verifyOTP").permitAll()
                .antMatchers(
                        "/api/v1/auth/refresh",
                        "/api/v1/auth/refresh-cookie",
                        "/api/v1/auth/logout",
                        "/api/v1/auth/logout-cookie",
                        "/api/v1/auth/handoff/consume",
                        "/lms-backend/api/v1/auth/refresh",
                        "/lms-backend/api/v1/auth/refresh-cookie",
                        "/lms-backend/api/v1/auth/logout",
                        "/lms-backend/api/v1/auth/logout-cookie",
                        "/lms-backend/api/v1/auth/handoff/consume"
                ).permitAll()
                .antMatchers("/api/v1/learner/login/**", "/api/v1/learner/verifyOTP/**").permitAll()
                .antMatchers("/api/v1/faculty/login", "/api/v1/faculty/verifyOTP").permitAll()
                .antMatchers("/api/v1/public/**", "/lms-backend/api/v1/public/**").permitAll()
                .antMatchers("/actuator/**", "/lms-backend/actuator/**", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .antMatchers("/swagger-resources/**", "/webjars/**").permitAll()

                // Production/dev/UAT Cloud Logging is operationally sensitive. The tracker
                // reporting surface remains public, but the logs console is Super Admin-only.
                .antMatchers("/api/v1/superadmin/logs", "/api/v1/superadmin/logs/**")
                    .hasRole("SUPER_ADMIN")

                // Module allocation is exclusively a super-admin operation, including reads.
                // Keep this more specific matcher BEFORE the general admin rule.
                .antMatchers("/api/v1/admin/module-access", "/api/v1/admin/module-access/**")
                    .hasRole("SUPER_ADMIN")
                .antMatchers("/api/v1/admin/**").hasRole("ADMIN")

                // recruiter (industry) accounts: their own API only. RecruiterFenceFilter additionally refuses an
                // recruiter token on every other endpoint (deny by default). See docs/recruiter-tpo/DESIGN.md.
                .antMatchers("/api/v1/superadmin/recruiters", "/api/v1/superadmin/recruiters/**").hasRole("SUPER_ADMIN")
                // Audit findings (/tracker/audit-findings): can describe security holes, so super admins only, at the door too.
                .antMatchers("/api/v1/superadmin/audit-findings", "/api/v1/superadmin/audit-findings/**").hasRole("SUPER_ADMIN")
                .antMatchers("/api/v1/superadmin/companies", "/api/v1/superadmin/companies/**").hasRole("SUPER_ADMIN")
                .antMatchers("/api/v1/superadmin/announcements", "/api/v1/superadmin/announcements/**").hasRole("SUPER_ADMIN")
                .antMatchers("/api/v1/superadmin/inbound-mail", "/api/v1/superadmin/inbound-mail/**").hasRole("SUPER_ADMIN")
                .antMatchers("/api/v1/recruiter", "/api/v1/recruiter/**").hasRole("RECRUITER")

                // TPO V1 (docs/recruiter-tpo-flows/TPO V1 - Locked.docx). A college with no TPO faculty
                // account still runs placements: its college ADMIN holds TPO-admin rights here.
                // TpoTeamAccessFilter narrows faculty to the placement team (TPO admins).
                .antMatchers("/api/v1/tpo/**").hasAnyRole("TPO", "ADMIN", "FACULTY")

                // Electives admin: college admin or a super-admin scoped to a college (both carry
                // ROLE_ADMIN — see JwtAuthenticationFilter#authoritiesFor). Every endpoint also
                // does its own canPerformAdminActionForCollege + module-flag check
                // (ElectiveAdminController#college); this matcher is the coarse defense-in-depth
                // layer so a future endpoint added here without that call isn't wide open to any
                // authenticated LEARNER/FACULTY the way a bare "/api/v1/**".authenticated() would be.
                .antMatchers("/api/v1/electives/admin/**").hasRole("ADMIN")

                // Learners must still be able to save their own video progress.
                .antMatchers(HttpMethod.PUT, "/api/v1/lesson/contents/progress").authenticated()

                // Legacy people writes must not rely on read-level college access checks.
                // The general learner update route is deprecated for self-service: profile
                // changes belong to /api/v1/profile/learner/{id}/* instead.
                .antMatchers(HttpMethod.POST, PEOPLE_ADMIN_POST_PATHS).hasAnyRole("ADMIN", "SUPER_ADMIN")
                .antMatchers(HttpMethod.PUT, "/api/v1/faculty/update/**", "/api/v1/learner/update/**")
                    .hasAnyRole("ADMIN", "SUPER_ADMIN")
                .antMatchers(HttpMethod.DELETE, "/api/v1/faculty/delete/**", "/api/v1/learner/delete/**")
                    .hasAnyRole("ADMIN", "SUPER_ADMIN")

                // Faculty edit, delete and reorder their own lesson content. These live under
                // /api/v1/lesson/** (admin-only below), so faculty got a 403 on every edit and delete
                // once creation moved to /api/v1/faculty/lesson-contents/create. Ownership and the
                // active teaching assignment are still checked in LessonContentsServiceImpl and
                // LessonContentController, exactly as for the create path.
                .antMatchers(HttpMethod.PUT, "/api/v1/lesson/contents/update/**", "/api/v1/lesson/contents/class-content-order")
                    .hasAnyRole("ADMIN", "SUPER_ADMIN", "FACULTY")
                .antMatchers(HttpMethod.DELETE, "/api/v1/lesson/contents/delete/**")
                    .hasAnyRole("ADMIN", "SUPER_ADMIN", "FACULTY")

                .antMatchers(HttpMethod.POST, ACADEMIC_ADMIN_PATHS).hasAnyRole("ADMIN", "SUPER_ADMIN")
                .antMatchers(HttpMethod.PUT, ACADEMIC_ADMIN_PATHS).hasAnyRole("ADMIN", "SUPER_ADMIN")
                .antMatchers(HttpMethod.PATCH, ACADEMIC_ADMIN_PATHS).hasAnyRole("ADMIN", "SUPER_ADMIN")
                .antMatchers(HttpMethod.DELETE, ACADEMIC_ADMIN_PATHS).hasAnyRole("ADMIN", "SUPER_ADMIN")

                .antMatchers("/api/v1/**").authenticated()
                .antMatchers("/users/**").authenticated()
                .antMatchers("/api/v2/jobs/refresh", "/api/v2/job-applications/refresh").hasRole("ADMIN")
                .antMatchers("/api/v2/**").authenticated()
                .anyRequest().authenticated()
            .and()
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(scopeContextFilter, JwtAuthenticationFilter.class)
            .addFilterAfter(new com._42students.lms.security.RecruiterFenceFilter(), JwtAuthenticationFilter.class)
            .exceptionHandling()
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(401);
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");
                    response.getWriter().write("{\"error\":\"Unauthorized\"}");
                });
    }
}
