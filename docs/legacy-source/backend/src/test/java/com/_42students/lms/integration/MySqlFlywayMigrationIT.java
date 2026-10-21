package com._42students.lms.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.output.MigrateResult;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.support.EncodedResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;

/**
 * Opt-in disposable MySQL integration check. Historical LMS tables predate
 * Flyway V24; an empty schema cannot run the migration chain on its own.
 * CI invokes this IT explicitly against a dedicated localhost database.
 */
class MySqlFlywayMigrationIT {
    @Test
    void historicalMysqlSchemaMigratesValidatesAndIsIdempotent() throws Exception {
        String url = System.getenv("LMS_MYSQL_IT_URL");
        String user = System.getenv("LMS_MYSQL_IT_USER");
        String password = System.getenv("LMS_MYSQL_IT_PASSWORD");
        assertTrue(url != null && url.matches(
                "^jdbc:mysql://(?:127\\.0\\.0\\.1|localhost):3306/lms_regression_test(?:\\?[^#]*)?$"),
                "BLOCKED: use only the dedicated localhost lms_regression_test database");
        assertTrue(user != null && !user.isBlank(), "BLOCKED: dedicated MySQL test user is required");
        assertTrue(password != null && !password.isBlank(), "BLOCKED: disposable MySQL password is required");

        try (Connection connection = DriverManager.getConnection(url, user, password);
             Statement statement = connection.createStatement();
             ResultSet tables = statement.executeQuery(
                     "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()")) {
            assertTrue(tables.next());
            assertEquals(0, tables.getInt(1), "BLOCKED: MySQL fixture must start with an empty schema");
        }

        // The structure-only fixture includes the historical Flyway history but
        // no application records. Disable FK checks only while loading the dump:
        // its alphabetical table order can reference tables created later.
        try (Connection connection = DriverManager.getConnection(url, user, password);
             Statement statement = connection.createStatement()) {
            statement.execute("SET FOREIGN_KEY_CHECKS=0");
            try {
                ScriptUtils.executeSqlScript(connection,
                        new EncodedResource(new ClassPathResource("db/mysql-schema-snapshot.sql"), StandardCharsets.UTF_8));
            } finally {
                statement.execute("SET FOREIGN_KEY_CHECKS=1");
            }
        }

        Flyway flyway = Flyway.configure()
                .dataSource(url, user, password)
                .locations("classpath:db/migration")
                .baselineOnMigrate(false)
                .validateOnMigrate(true)
                .cleanDisabled(true)
                .load();
        MigrateResult first = flyway.migrate();
        assertTrue(first.success, "BLOCKED: migration failed against the historical schema");
        flyway.validate();
        MigrateResult second = flyway.migrate();
        assertEquals(0, second.migrationsExecuted, "BLOCKED: repeat migration was not idempotent");

        try (Connection connection = DriverManager.getConnection(url, user, password);
             Statement statement = connection.createStatement();
             ResultSet failed = statement.executeQuery(
                     "SELECT COUNT(*) FROM flyway_schema_history WHERE success = 0")) {
            assertTrue(failed.next());
            assertEquals(0, failed.getInt(1), "BLOCKED: unsuccessful Flyway schema history entry");
        }
        assertFalse(flyway.info().all().length == 0, "BLOCKED: no schema history found");
    }
}
