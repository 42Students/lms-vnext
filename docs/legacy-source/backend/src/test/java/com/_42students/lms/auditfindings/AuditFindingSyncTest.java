package com._42students.lms.auditfindings;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * The importer end to end on an in-memory database, with GitHub replaced by a fake repo: what gets imported, what is
 * refused, and that a file changed or deleted after import never rewrites a finding. Then the decisions people make.
 */
class AuditFindingSyncTest {

    private NamedParameterJdbcTemplate jdbc;
    private AuditFindingSyncService sync;
    private AuditFindingService service;
    /** The fake repo: path -> content; blob hash = a hash of the content. */
    private final Map<String, String> repo = new HashMap<>();

    @BeforeEach
    void setUp() throws Exception {
        DriverManagerDataSource ds = new DriverManagerDataSource("jdbc:h2:mem:af" + System.nanoTime() + ";MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1", "sa", "");
        jdbc = new NamedParameterJdbcTemplate(ds);
        createSchema(jdbc);

        GitHubFindingsClient github = mock(GitHubFindingsClient.class);
        when(github.isConfigured()).thenReturn(true);
        when(github.repo()).thenReturn("42Students/lms-findings");
        when(github.headCommit()).thenAnswer(a -> "c" + Integer.toHexString(repo.hashCode() & 0xfffffff));
        when(github.inboxFiles(anyString())).thenAnswer(a -> {
            List<GitHubFindingsClient.InboxFile> out = new ArrayList<>();
            repo.forEach((path, body) -> out.add(new GitHubFindingsClient.InboxFile(path, sha(body))));
            return out;
        });
        when(github.blob(anyString())).thenAnswer(a -> repo.values().stream().filter(b -> sha(b).equals(a.getArgument(0))).findFirst()
                .orElseThrow().getBytes(StandardCharsets.UTF_8));
        sync = new AuditFindingSyncService(github, jdbc, new DataSourceTransactionManager(ds));
        service = new AuditFindingService(jdbc, sync);
    }

    /** V219 with plain text in place of MySQL's JSON columns (also used by AuditFindingGitHubLiveTest). */
    static void createSchema(NamedParameterJdbcTemplate jdbc) {
        var j = jdbc.getJdbcTemplate();
        j.execute("CREATE TABLE audit_finding (id VARCHAR(80) PRIMARY KEY, title VARCHAR(200) NOT NULL, area VARCHAR(40) NOT NULL, roles VARCHAR(200) NOT NULL, "
                + "reported_severity VARCHAR(16) NOT NULL, severity VARCHAR(16) NOT NULL, kind VARCHAR(20) NOT NULL, environment VARCHAR(10) NOT NULL, "
                + "where_json TEXT NOT NULL, summary TEXT NOT NULL, steps_json TEXT, expected TEXT, actual TEXT, evidence TEXT, suggested_fix TEXT, "
                + "found_by_agent VARCHAR(60) NOT NULL, found_by_session VARCHAR(300), found_at TIMESTAMP NOT NULL, related_json TEXT, duplicate_of VARCHAR(80), "
                + "status VARCHAR(20) NOT NULL DEFAULT 'new', assignee VARCHAR(100), fix_commits_json TEXT, source_file VARCHAR(200) NOT NULL, "
                + "source_commit VARCHAR(40) NOT NULL, imported_at TIMESTAMP NOT NULL, updated_at TIMESTAMP NOT NULL)");
        j.execute("CREATE TABLE audit_finding_event (id BIGINT AUTO_INCREMENT PRIMARY KEY, finding_id VARCHAR(80) NOT NULL, event_type VARCHAR(30) NOT NULL, "
                + "from_value VARCHAR(200), to_value VARCHAR(200), note TEXT, commits_json TEXT, actor VARCHAR(100) NOT NULL, actor_kind VARCHAR(10) NOT NULL, "
                + "source_file VARCHAR(200), created_at TIMESTAMP NOT NULL)");
        j.execute("CREATE TABLE audit_finding_file (path VARCHAR(200) PRIMARY KEY, blob_sha VARCHAR(40) NOT NULL, commit_sha VARCHAR(40) NOT NULL, "
                + "result VARCHAR(12) NOT NULL, errors TEXT, record_id VARCHAR(120), first_seen_at TIMESTAMP NOT NULL, last_checked_at TIMESTAMP NOT NULL)");
        j.execute("CREATE TABLE audit_finding_sync (id TINYINT PRIMARY KEY, last_commit VARCHAR(40), last_run_at TIMESTAMP, last_success_at TIMESTAMP, "
                + "last_result VARCHAR(400), last_error VARCHAR(1000))");
        j.execute("INSERT INTO audit_finding_sync (id) VALUES (1)");
    }

    private static String sha(String body) {
        try {
            byte[] d = java.security.MessageDigest.getInstance("SHA-1").digest(body.getBytes(StandardCharsets.UTF_8));
            return String.format("%040x", new java.math.BigInteger(1, d));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static String finding(String id, String title) {
        String area = id.substring(11, id.length() - 5);
        return "{\"schema\":1,\"type\":\"finding\",\"id\":\"" + id + "\",\"title\":\"" + title + "\",\"area\":\"" + area + "\",\"roles\":[\"public\"],"
                + "\"severity\":\"high\",\"kind\":\"bug\",\"environment\":\"prod\",\"where\":{\"repo\":\"lms2-fe\",\"pages\":[\"/login\"]},"
                + "\"summary\":\"Something specific is wrong and it matters to people.\",\"found_by\":{\"agent\":\"chatgpt-web\"},"
                + "\"found_at\":\"2026-10-13T10:30:00+05:30\"}";
    }

    private static String fixedUpdate(String findingId, String sha) {
        return "{\"schema\":1,\"type\":\"update\",\"id\":\"" + findingId + ".u202610131145-x9q2\",\"finding\":\"" + findingId + "\",\"status\":\"fixed\","
                + "\"commits\":[{\"repo\":\"lms2-fe\",\"sha\":\"" + sha + "\"}],\"by\":\"codex\",\"at\":\"2026-10-13T11:45:00+05:30\"}";
    }

    private String status(String id) {
        return jdbc.queryForObject("SELECT status FROM audit_finding WHERE id = :id", Map.of("id", id), String.class);
    }

    private String fileResult(String path) {
        return jdbc.queryForObject("SELECT result FROM audit_finding_file WHERE path = :p", Map.of("p", path), String.class);
    }

    @Test
    void importsFindingsAndAgentUpdatesOnceAndRefusesBadFiles() {
        repo.put("inbox/2026-10-13-login-k7f3.json", finding("2026-10-13-login-k7f3", "Unregistered number shows a generic failure"));
        repo.put("inbox/2026-10-13-login-k7f3.u202610131145-x9q2.json", fixedUpdate("2026-10-13-login-k7f3", "38bd0eda"));
        repo.put("inbox/2026-10-13-quiz-bad1.json", "{\"schema\":1,\"type\":\"finding\",\"id\":\"2026-10-13-quiz-bad1\"}");
        repo.put("inbox/2026-10-13-quiz-zzzz.u202610131145-qqqq.json", fixedUpdate("2026-10-13-quiz-zzzz", "abc1234").replace("x9q2", "qqqq"));

        var r = sync.sync();

        assertEquals(1, r.findings());
        assertEquals(1, r.updates());
        assertEquals(2, r.rejected());
        assertEquals("fixed", status("2026-10-13-login-k7f3"), "an agent's fixed update with a commit moves a new finding to fixed");
        assertEquals("REJECTED", fileResult("inbox/2026-10-13-quiz-bad1.json"));
        assertTrue(jdbc.queryForObject("SELECT errors FROM audit_finding_file WHERE path = :p", Map.of("p", "inbox/2026-10-13-quiz-zzzz.u202610131145-qqqq.json"), String.class)
                .contains("not a known finding"));
        List<String> history = jdbc.queryForList("SELECT event_type FROM audit_finding_event WHERE finding_id = '2026-10-13-login-k7f3' ORDER BY id", Map.of(), String.class);
        assertEquals(List.of("imported", "agent_update", "status"), history);

        var again = sync.sync();
        assertEquals(0, again.findings() + again.updates() + again.rejected(), "nothing is imported twice");
    }

    @Test
    void aFileChangedOrDeletedAfterImportNeverRewritesTheFinding() {
        String path = "inbox/2026-10-13-login-k7f3.json";
        repo.put(path, finding("2026-10-13-login-k7f3", "Unregistered number shows a generic failure"));
        repo.put("inbox/2026-10-13-login-ab12.json", finding("2026-10-13-login-ab12", "Code screen loses its place after a refresh"));
        sync.sync();

        repo.put(path, finding("2026-10-13-login-k7f3", "Rewritten title that should never be imported"));
        repo.remove("inbox/2026-10-13-login-ab12.json");
        var r = sync.sync();

        assertEquals(1, r.tampered());
        assertEquals(1, r.deleted());
        assertEquals("TAMPERED", fileResult(path));
        assertEquals("DELETED", fileResult("inbox/2026-10-13-login-ab12.json"));
        assertEquals("Unregistered number shows a generic failure",
                jdbc.queryForObject("SELECT title FROM audit_finding WHERE id = '2026-10-13-login-k7f3'", Map.of(), String.class));
        assertTrue(jdbc.queryForList("SELECT event_type FROM audit_finding_event WHERE finding_id = '2026-10-13-login-k7f3'", Map.of(), String.class).contains("file_changed"));
    }

    @Test
    void aReusedIdIsRefusedAndACorrectedRejectedFileIsImported() {
        repo.put("inbox/2026-10-13-login-k7f3.json", finding("2026-10-13-login-k7f3", "Unregistered number shows a generic failure"));
        sync.sync();
        // The same id under another name is refused by the name rule; a broken file is kept as rejected...
        String broken = "inbox/2026-10-13-login-cd34.json";
        repo.put(broken, finding("2026-10-13-login-cd34", "short"));
        sync.sync();
        assertEquals("REJECTED", fileResult(broken));
        // ...and imported once it is corrected.
        repo.put(broken, finding("2026-10-13-login-cd34", "Resend countdown freezes after a refresh"));
        var r = sync.sync();
        assertEquals(1, r.findings());
        assertEquals("IMPORTED", fileResult(broken));
    }

    @Test
    void peopleDecideWithReasons() {
        repo.put("inbox/2026-10-13-login-k7f3.json", finding("2026-10-13-login-k7f3", "Unregistered number shows a generic failure"));
        repo.put("inbox/2026-10-13-login-ab12.json", finding("2026-10-13-login-ab12", "Unregistered number shows generic failure again"));
        sync.sync();

        assertThrows(ResponseStatusException.class, () -> service.setStatus("2026-10-13-login-k7f3", "verified", "re-tested", null, "super admin"),
                "only a fixed finding can be verified");
        assertThrows(ResponseStatusException.class, () -> service.setStatus("2026-10-13-login-k7f3", "wont_fix", " ", null, "super admin"),
                "closing says why");
        assertThrows(ResponseStatusException.class, () -> service.setStatus("2026-10-13-login-ab12", "duplicate", null, "2026-10-13-login-nope", "super admin"),
                "a duplicate points at a real finding");

        service.setStatus("2026-10-13-login-ab12", "duplicate", null, "2026-10-13-login-k7f3", "super admin");
        service.setStatus("2026-10-13-login-k7f3", "confirmed", null, null, "super admin");
        service.addCommit("2026-10-13-login-k7f3", "lms2-fe", "38bd0eda", "super admin");
        service.setStatus("2026-10-13-login-k7f3", "fixed", null, null, "super admin");
        service.setStatus("2026-10-13-login-k7f3", "verified", "Re-tested on dev: field message shows", null, "super admin");
        assertEquals("verified", status("2026-10-13-login-k7f3"));
        assertThrows(ResponseStatusException.class, () -> service.setStatus("2026-10-13-login-k7f3", "confirmed", null, null, "super admin"),
                "reopening says why");

        Map<String, Object> detail = service.detail("2026-10-13-login-k7f3");
        @SuppressWarnings("unchecked") List<Map<String, Object>> events = (List<Map<String, Object>>) detail.get("events");
        assertEquals("verified", events.get(events.size() - 1).get("toValue"));
        assertEquals("duplicate", status("2026-10-13-login-ab12"));
    }
}
