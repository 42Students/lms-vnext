package com._42students.lms.auditfindings;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The real GitHub client against the real 42Students/lms-findings repo, into an in-memory database. Runs only when
 * AUDIT_FINDINGS_GITHUB_TOKEN is set (a token that can read that repo), so CI and ordinary builds never call GitHub.
 * The local-test profile leaves *LiveTest classes out (as skipped they would block the prod build); run it with
 * {@code mvn test -P live-tests}.
 */
@EnabledIfEnvironmentVariable(named = "AUDIT_FINDINGS_GITHUB_TOKEN", matches = ".+")
class AuditFindingGitHubLiveTest {

    @Test
    void importsTheRealInbox() {
        DriverManagerDataSource ds = new DriverManagerDataSource("jdbc:h2:mem:live" + System.nanoTime() + ";MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1", "sa", "");
        NamedParameterJdbcTemplate jdbc = new NamedParameterJdbcTemplate(ds);
        AuditFindingSyncTest.createSchema(jdbc);

        GitHubFindingsClient github = new GitHubFindingsClient();
        ReflectionTestUtils.setField(github, "repo", "42Students/lms-findings");
        ReflectionTestUtils.setField(github, "branch", "main");
        ReflectionTestUtils.setField(github, "token", System.getenv("AUDIT_FINDINGS_GITHUB_TOKEN"));
        ReflectionTestUtils.setField(github, "appId", "");
        ReflectionTestUtils.setField(github, "installationId", "");
        ReflectionTestUtils.setField(github, "privateKeyPem", "");
        AuditFindingSyncService sync = new AuditFindingSyncService(github, jdbc, new DataSourceTransactionManager(ds));

        AuditFindingSyncService.SyncResult first = sync.sync();
        System.out.println("LIVE first sync: " + first);
        System.out.println("LIVE files: " + jdbc.queryForList("SELECT path, result, errors FROM audit_finding_file", Map.of()));
        System.out.println("LIVE findings: " + jdbc.queryForList("SELECT id, status, severity FROM audit_finding ORDER BY id", Map.of()));
        assertTrue(first.ran(), first.message());
        assertTrue(first.findings() > 0, "the repo has findings");
        assertEquals(0, first.rejected(), "every file in the real inbox is valid");

        AuditFindingSyncService.SyncResult second = sync.sync();
        assertEquals(0, second.findings() + second.updates() + second.rejected(), "a second sync imports nothing again");
    }
}
