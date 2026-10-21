package com._42students.lms.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;

import javax.sql.DataSource;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

/**
 * This test never connects to a real database or invokes a migration. It verifies only that
 * an explicit opt-out removes the legacy history-rewriting strategy from the Spring context;
 * verifying clean Flyway migration and the deployed database remains a separate release gate.
 */
class FlywayAutoRepairOptOutTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withUserConfiguration(FlywayAutoRepairConfiguration.class)
            .withBean(DataSource.class, () -> mock(DataSource.class));

    @Test
    void explicitOptOutDisablesLegacyRepairStrategy() {
        runner.withPropertyValues("lms.flyway.auto-repair.enabled=false")
                .run(context -> {
                    assertFalse(context.containsBean("flywayMigrationStrategy"));
                    assertFalse(context.getBeansOfType(FlywayMigrationStrategy.class)
                            .containsKey("flywayMigrationStrategy"));
                });
    }

    @Test
    void absentPropertyPreservesExistingDeploymentBehavior() {
        runner.run(context -> assertTrue(context.containsBean("flywayMigrationStrategy")));
    }

    @Test
    void explicitOptInKeepsLegacyRepairStrategyAvailable() {
        runner.withPropertyValues("lms.flyway.auto-repair.enabled=true")
                .run(context -> assertTrue(context.containsBean("flywayMigrationStrategy")));
    }
}
