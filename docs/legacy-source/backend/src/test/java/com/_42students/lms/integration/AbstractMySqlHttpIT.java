package com._42students.lms.integration;

import com._42students.lms.security.JwtService;
import com._42students.lms.security.UserPrincipal;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Assertions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.support.EncodedResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Shared harness for the production-style API integration suite.
 *
 * <p>These tests intentionally use the same disposable localhost MySQL database as the existing
 * MySql*IT tests. The historical structure-only fixture is loaded when the database is empty and
 * the complete Flyway chain is then applied before Spring starts. HTTP requests go through the
 * real Spring Security filter chain and use genuinely signed JWTs; application services and JPA
 * repositories are not mocked.</p>
 *
 * <p>External integrations are configured with inert test values. Individual tests should still
 * avoid operations that send real email/SMS/storage traffic.</p>
 */
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.MOCK,
        properties = {
                "spring.flyway.enabled=false",
                "spring.jpa.hibernate.ddl-auto=none",
                "spring.jpa.open-in-view=false",
                "spring.main.allow-bean-definition-overriding=true",
                "STAGE=it",
                "JWT_SECRET=integration-test-only-jwt-secret-0123456789-abcdefghijklmnopqrstuvwxyz",
                "GOOGLE_OAUTH_CLIENT_ID=dummy",
                "GOOGLE_OAUTH_CLIENT_SECRET=dummy",
                "GOOGLE_OAUTH_REDIRECT_URI=http://localhost/callback",
                "APP_FRONTEND_URL=http://localhost:3000",
                "APP_SUPER_ADMIN_PHONES=9000000000",
                "CORS_ALLOWED_ORIGINS=http://localhost:3000",
                "R2_ACCOUNT_ID=dummy",
                "R2_ACCESS_KEY=dummy",
                "R2_SECRET_KEY=dummy",
                "R2_BUCKET_NAME=dummy",
                "R2_PUBLIC_URL=http://localhost/r2",
                "r2.account.id=dummy",
                "r2.access.key=dummy",
                "r2.secret.key=dummy",
                "r2.bucket.name=dummy",
                "r2.public.url=http://localhost/r2",
                "SMS_API_KEY=dummy",
                "EXOTEL_API_KEY=dummy",
                "EXOTEL_API_TOKEN=dummy"
        })
@AutoConfigureMockMvc(addFilters = true)
public abstract class AbstractMySqlHttpIT {

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected JdbcTemplate jdbc;

    @Autowired
    protected JwtService jwtService;

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        String url = System.getenv("LMS_MYSQL_IT_URL");
        String user = System.getenv("LMS_MYSQL_IT_USER");
        String password = System.getenv("LMS_MYSQL_IT_PASSWORD");

        Assertions.assertTrue(url != null && url.matches(
                        "^jdbc:mysql://(?:127\\.0\\.0\\.1|localhost):3306/lms_regression_test(?:\\?[^#]*)?$"),
                "BLOCKED: use only the dedicated localhost lms_regression_test database");
        Assertions.assertTrue(user != null && !user.isBlank(),
                "BLOCKED: dedicated MySQL test user is required");
        Assertions.assertTrue(password != null && !password.isBlank(),
                "BLOCKED: disposable MySQL password is required");

        prepareSchema(url, user, password);

        registry.add("spring.datasource.url", () -> url);
        registry.add("spring.datasource.username", () -> user);
        registry.add("spring.datasource.password", () -> password);
        registry.add("LMS_JDBC_URL", () -> url);
        registry.add("LMS_DB_USER", () -> user);
        registry.add("LMS_DB_PASS", () -> password);
    }

    private static void prepareSchema(String url, String user, String password) {
        try (Connection connection = DriverManager.getConnection(url, user, password);
             Statement statement = connection.createStatement();
             ResultSet tables = statement.executeQuery(
                     "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()")) {
            Assertions.assertTrue(tables.next());
            if (tables.getInt(1) == 0) {
                try (Statement session = connection.createStatement()) {
                    session.execute("SET FOREIGN_KEY_CHECKS=0");
                    try {
                        ScriptUtils.executeSqlScript(connection,
                                new EncodedResource(
                                        new ClassPathResource("db/mysql-schema-snapshot.sql"),
                                        StandardCharsets.UTF_8));
                    } finally {
                        session.execute("SET FOREIGN_KEY_CHECKS=1");
                    }
                }
            }
        } catch (SQLException e) {
            throw new IllegalStateException(
                    "BLOCKED: could not prepare the disposable MySQL schema", e);
        }

        Flyway flyway = Flyway.configure()
                .dataSource(url, user, password)
                .locations("classpath:db/migration")
                .baselineOnMigrate(false)
                .validateOnMigrate(true)
                .cleanDisabled(true)
                .load();
        flyway.migrate();
        flyway.validate();
    }

    protected String accessToken(UserPrincipal principal) {
        return jwtService.generateTokens(principal).getAccessToken();
    }

    protected UserPrincipal learnerPrincipal(int id, int collegeId) {
        return new UserPrincipal(id, "LEARNER", null, 1, collegeId, 0);
    }

    protected UserPrincipal facultyPrincipal(int id, String facultyType, int collegeId) {
        return new UserPrincipal(id, "FACULTY", facultyType, 1, collegeId, 0);
    }

    protected UserPrincipal superAdminPrincipal() {
        return UserPrincipal.forSuperAdmin();
    }

    protected void seedCollege(int id, String name) {
        jdbc.update(
                "insert into college (id, name, org_id, is_deleted) values (?, ?, 1, 0)",
                id, name);
        // Placements is a college-level switch; seeded colleges have it on, as a college using placements does.
        jdbc.update("insert ignore into app_setting (scope_type, scope_id, setting_key, setting_value, is_deleted) "
                + "values ('COLLEGE', ?, 'module.placements.enabled', 'true', 0)", id);
    }

    protected void seedFaculty(int id, int collegeId, String firstName) {
        jdbc.update(
                "insert into faculty (id, college_id, organization_id, first_name, last_name, " +
                        "department, token_version, version, is_deleted, user_type) " +
                        "values (?, ?, 1, ?, 'Integration', 'CSE', 0, 0, 0, 'FACULTY')",
                id, collegeId, firstName);
    }

    /** Placements open only to a learner decided Eligible (PlacementAccessFilter: "Placements are not open for you yet"). */
    protected void makePlacementEligible(int learnerId, int collegeId) {
        jdbc.update("insert into placement_eligibility (college_id, scope_type, scope_id, status, decided_by_type, decided_at) "
                + "values (?, 'LEARNER', ?, 'ELIGIBLE', 'ADMIN', now())", collegeId, learnerId);
    }

    protected void seedLearner(int id, int collegeId, String firstName) {
        String phone = String.format("98%08d", Math.floorMod(id, 100_000_000));
        jdbc.update(
                "insert into learner (id, college_id, organization_id, first_name, last_name, " +
                        "roll_number, contact_mail, contact_mobile, department, token_version, " +
                        "version, is_deleted, user_type) " +
                        "values (?, ?, 1, ?, 'Integration', ?, ?, ?, 'CSE', 0, 0, 0, 'LEARNER')",
                id, collegeId, firstName,
                "R" + id,
                "learner-" + id + "@integration.test",
                phone);
    }

    protected void seedDepartment(int id, int collegeId, String name) {
        jdbc.update(
                "insert into department (id, name, college_id, is_deleted) values (?, ?, ?, 0)",
                id, name, collegeId);
    }

    protected void seedProject(int id, int collegeId, String slug, String title) {
        jdbc.update(
                "insert into project_workspace " +
                        "(id, slug, title, status, progress, organization_id, college_id, version, is_deleted) " +
                        "values (?, ?, ?, 'IN_PROGRESS', 0, 1, ?, 0, 0)",
                id, slug, title, collegeId);
    }

    protected void seedProjectMember(
            int id, int projectId, int userId, String userType, String roleLabel) {
        jdbc.update(
                "insert into project_member " +
                        "(id, project_id, user_id, user_type, display_name, role_label, member_status, is_deleted) " +
                        "values (?, ?, ?, ?, 'Integration User', ?, 'ACTIVE', 0)",
                id, projectId, userId, userType, roleLabel);
    }
}
