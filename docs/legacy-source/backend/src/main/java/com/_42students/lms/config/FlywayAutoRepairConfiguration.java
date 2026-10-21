package com._42students.lms.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Legacy Flyway startup auto-repair. This is NOT a safe default for a new environment:
 * it deletes failed migration history rows and accepts checksum changes before migration.
 *
 * <p>For compatibility with existing deployments the legacy behaviour remains enabled when
 * the property is absent. Set {@code lms.flyway.auto-repair.enabled=false} in a verified
 * environment to disable this strategy and let Spring Boot's ordinary Flyway initializer
 * validate and migrate WITHOUT repairing history. Do not flip the production default until
 * the deployed database's schema and migration history have been reconciled and startup
 * tested against a representative copy.
 */
@Configuration
@ConditionalOnProperty(name = "lms.flyway.auto-repair.enabled", havingValue = "true", matchIfMissing = true)
public class FlywayAutoRepairConfiguration {

    private static final Logger log = LoggerFactory.getLogger(FlywayAutoRepairConfiguration.class);

    @Autowired
    private DataSource dataSource;

    @Bean
    @Primary
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            log.warn("Legacy Flyway auto-repair is ENABLED: failed history entries may be removed "
                    + "and migration checksums repaired. Reconcile database history before disabling it.");
            // Historical behaviour, retained ONLY for compatibility with existing deployments.
            cleanFailedMigrations();

            log.info("Auto-repairing Flyway migrations (fixes checksum mismatches)...");
            try {
                flyway.repair();
                log.info("Flyway repair completed successfully");
            } catch (Exception e) {
                log.warn("Flyway repair encountered an issue (may be normal if no repairs needed): {}",
                        e.getMessage());
            }

            log.info("Running Flyway migrations...");
            try {
                flyway.migrate();
                log.info("Flyway migrations completed successfully");
            } catch (Exception e) {
                log.error("Flyway migration failed: {}", e.getMessage(), e);
                throw new RuntimeException("Flyway migration failed. Check logs for details. Application startup aborted.", e);
            }
        };
    }

    /**
     * Legacy behaviour: deletes failed history records before reattempting migration.
     *
     * <p>Deleting a failed row without recording which one it was is exactly how a repeatedly
     * failing migration goes unnoticed: each startup silently wipes the evidence and retries, so
     * the same failure can recur for weeks with nothing in the logs identifying it. This happened
     * to lms_dev_2026 across six separate dates in September 2026 before anyone noticed the
     * database's migration history no longer matched its actual schema (see FLYWAY_REPAIR_INSTRUCTIONS.md
     * and the dev DB repair notes). Logging each deleted row's version/description at WARN, before
     * deleting it, is the minimum needed for that class of drift to actually be visible.
     */
    private void cleanFailedMigrations() {
        try (Connection conn = dataSource.getConnection();
             Statement selectStmt = conn.createStatement();
             ResultSet rs = selectStmt.executeQuery(
                     "SELECT version, description, script FROM flyway_schema_history WHERE success = 0")) {
            while (rs.next()) {
                log.warn("Legacy Flyway auto-repair is about to delete a FAILED migration history record: "
                                + "version={} description=\"{}\" script={} — if this keeps recurring across restarts, "
                                + "the migration's expected schema state may no longer match the real database.",
                        rs.getString("version"), rs.getString("description"), rs.getString("script"));
            }
        } catch (SQLException e) {
            // Table may not exist yet on a fresh database.
            log.debug("Could not inspect failed migrations (may be a fresh DB): {}", e.getMessage());
            return;
        }
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            int deleted = stmt.executeUpdate(
                "DELETE FROM flyway_schema_history WHERE success = 0"
            );
            if (deleted > 0) {
                log.warn("Legacy Flyway auto-repair deleted {} failed migration history record(s) (see above for which)", deleted);
            }
        } catch (SQLException e) {
            log.debug("Could not clean failed migrations: {}", e.getMessage());
        }
    }
}
