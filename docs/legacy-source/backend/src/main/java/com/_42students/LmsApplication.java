package com._42students;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

/**
 * Configuration: All values are hardcoded in application.properties
 * Only databases credentials differ via environment variables (LMS_JDBC_URL, LMS_DB_USER, LMS_DB_PASS)
 */
@SpringBootApplication
@EnableScheduling
@EnableAsync
// Was never enabled anywhere in this codebase, which meant every @PreAuthorize annotation across
// every controller was a silent no-op — the JWT filter (JwtAuthenticationFilter) does correctly
// grant ROLE_ADMIN/ROLE_SUPER_ADMIN/ROLE_FACULTY/ROLE_LEARNER authorities matching every existing
// hasRole(...) expression, so enabling this closes real, live gaps (e.g. FacultyTeachingAssignment
// Controller's fetchAll/fetchActive, SuperAdminE2eController's seed endpoint) rather than breaking
// anything — verified every existing @PreAuthorize usage's role expression against what the filter
// actually grants before turning this on.
@EnableMethodSecurity
public class LmsApplication {
    public static void main(String[] args) {
        SpringApplication.run(LmsApplication.class, args);
    }
}
