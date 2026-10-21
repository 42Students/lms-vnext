package com._42students.lms.auditfindings;

import com._42students.lms.service.SchedulerLockService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Imports the lms-findings inbox into the tracker. Every few minutes (one pod, SchedulerLockService) and on the page's Sync
 * button. Each inbox file is handled once, in its own transaction, and recorded in audit_finding_file with its content hash:
 *  - a new file is checked (AuditFindingRules plus: unique id, updates name a known finding) and imported, or kept as
 *    REJECTED with the reasons (shown on the page);
 *  - a file that was imported and later changes or disappears is never re-imported: it is marked TAMPERED / DELETED and
 *    the finding's history says so (the repo's rule is "only add files");
 *  - a rejected file that is corrected (changed) is checked again.
 * Agent updates never make decisions: "fixed" (with commits) moves an open finding to fixed; the rest are notes in the history.
 */
@Slf4j
@Service
public class AuditFindingSyncService {

    static final String AGENT = "AGENT";
    /** Statuses an agent's "fixed" may move a finding out of; anything a person already closed or released is left alone. */
    private static final Set<String> AGENT_FIXABLE = Set.of("new", "confirmed", "in_progress", "needs_info", "cannot_reproduce");

    private final GitHubFindingsClient github;
    private final NamedParameterJdbcTemplate jdbc;
    private final TransactionTemplate tx;
    private final ObjectMapper json = new ObjectMapper();

    @Autowired(required = false)
    private SchedulerLockService schedulerLock;

    public AuditFindingSyncService(GitHubFindingsClient github, NamedParameterJdbcTemplate jdbc, PlatformTransactionManager txManager) {
        this.github = github;
        this.jdbc = jdbc;
        this.tx = new TransactionTemplate(txManager);
    }

    public record SyncResult(boolean ran, String commit, int findings, int updates, int rejected, int tampered, int deleted, String message) {}

    @Scheduled(fixedDelay = 5 * 60 * 1000, initialDelay = 60 * 1000)
    public void scheduledSync() {
        if (!github.isConfigured()) return;
        Runnable job = () -> {
            try { sync(); } catch (Exception e) { log.warn("Audit findings sync failed: {}", e.getMessage()); }
        };
        if (schedulerLock == null) job.run();
        else schedulerLock.runExclusively("audit-findings.sync", Duration.ofMinutes(4), job);
    }

    /** One import pass. Safe to run twice at once: every write is keyed (finding id, file path), the loser skips. */
    public synchronized SyncResult sync() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        if (!github.isConfigured()) {
            recordRun(now, null, null, "Sync is not set up: the findings repo's credentials are missing on this server.");
            return new SyncResult(false, null, 0, 0, 0, 0, 0, "Sync is not set up on this server");
        }
        String head;
        List<GitHubFindingsClient.InboxFile> files;
        try {
            head = github.headCommit();
            files = github.inboxFiles(head);
        } catch (Exception e) {
            recordRun(now, null, null, "Could not read " + github.repo() + ": " + e.getMessage());
            return new SyncResult(false, null, 0, 0, 0, 0, 0, "Could not read the findings repo: " + e.getMessage());
        }

        Map<String, Map<String, Object>> ledger = new HashMap<>();
        for (Map<String, Object> row : jdbc.queryForList("SELECT path, blob_sha, result, record_id FROM audit_finding_file", Map.of())) {
            ledger.put((String) row.get("path"), row);
        }

        int findings = 0, updates = 0, rejected = 0, tampered = 0, deleted = 0;
        Set<String> present = new java.util.HashSet<>();
        // Findings first, so an update in the same push finds its finding.
        List<GitHubFindingsClient.InboxFile> ordered = new ArrayList<>(files);
        ordered.sort(Comparator.comparing((GitHubFindingsClient.InboxFile f) -> f.path().contains(".u") ? 1 : 0).thenComparing(GitHubFindingsClient.InboxFile::path));

        for (GitHubFindingsClient.InboxFile f : ordered) {
            present.add(f.path());
            Map<String, Object> seen = ledger.get(f.path());
            if (seen != null && f.blobSha().equals(seen.get("blob_sha"))) continue; // already handled exactly this content
            if (seen != null && ("IMPORTED".equals(seen.get("result")) || "TAMPERED".equals(seen.get("result")))) {
                if ("IMPORTED".equals(seen.get("result"))) {
                    markFile(f.path(), "TAMPERED", "Changed after it was imported. The imported version stands; add an update file instead.", now);
                    noteOnFinding((String) seen.get("record_id"), "file_changed", "The file " + f.path() + " was changed in the repo after it was imported. The change was ignored.", f.path(), now);
                    tampered++;
                }
                continue;
            }
            try {
                String outcome = handleFile(f, head, now);
                if ("finding".equals(outcome)) findings++;
                else if ("update".equals(outcome)) updates++;
                else rejected++;
            } catch (Exception e) {
                log.warn("Audit findings: could not handle {}: {}", f.path(), e.getMessage());
                rejected++;
            }
        }
        for (Map.Entry<String, Map<String, Object>> e : ledger.entrySet()) {
            if (!present.contains(e.getKey()) && "IMPORTED".equals(e.getValue().get("result"))) {
                markFile(e.getKey(), "DELETED", "Deleted from the repo after it was imported. The imported version stands.", now);
                noteOnFinding((String) e.getValue().get("record_id"), "file_deleted", "The file " + e.getKey() + " was deleted from the repo after it was imported.", e.getKey(), now);
                deleted++;
            }
        }
        String summary = findings + " new finding(s), " + updates + " update(s), " + rejected + " rejected"
                + (tampered > 0 ? ", " + tampered + " changed after import" : "") + (deleted > 0 ? ", " + deleted + " deleted after import" : "");
        recordRun(now, head, summary, null);
        return new SyncResult(true, head, findings, updates, rejected, tampered, deleted, summary);
    }

    /** Checks and imports one file in its own transaction; returns "finding", "update" or "rejected". */
    private String handleFile(GitHubFindingsClient.InboxFile f, String commit, LocalDateTime now) throws Exception {
        String name = f.path().substring("inbox/".length());
        List<String> errors = new ArrayList<>();
        JsonNode rec = null;
        if (name.contains("/")) errors.add("no folders inside inbox/");
        else if (!name.endsWith(".json")) errors.add("only .json files go in inbox/");
        else {
            byte[] bytes = github.blob(f.blobSha());
            if (bytes.length > AuditFindingRules.FILE_MAX_BYTES) errors.add("file is larger than 32 KB");
            else {
                try { rec = json.readTree(new String(bytes, StandardCharsets.UTF_8)); }
                catch (Exception e) { errors.add("not valid JSON"); }
                if (rec != null) errors.addAll(AuditFindingRules.check(rec, name));
            }
        }
        final JsonNode record = rec;
        if (errors.isEmpty() && record != null) {
            String type = record.path("type").asText();
            String outcome = tx.execute(s -> {
                List<String> more = "finding".equals(type) ? importFinding(record, f, commit, now) : importUpdate(record, f, now);
                if (!more.isEmpty()) {
                    s.setRollbackOnly();
                    return String.join("; ", more);
                }
                upsertFile(f, commit, "IMPORTED", null, record.path("id").asText(), now);
                return null;
            });
            if (outcome == null) return type;
            errors.add(outcome);
        }
        upsertFile(f, commit, "REJECTED", String.join("; ", errors), record != null ? record.path("id").asText(null) : null, now);
        return "rejected";
    }

    private List<String> importFinding(JsonNode r, GitHubFindingsClient.InboxFile f, String commit, LocalDateTime now) {
        String id = r.path("id").asText();
        List<String> problems = new ArrayList<>();
        if (exists(id)) problems.add("id " + id + " is already used by another finding");
        for (JsonNode ref : r.path("related")) if (!exists(ref.asText())) problems.add("refers to " + ref.asText() + ", which is not a known finding");
        if (r.hasNonNull("duplicate_of") && !exists(r.path("duplicate_of").asText())) problems.add("duplicate_of " + r.path("duplicate_of").asText() + " is not a known finding");
        if (!problems.isEmpty()) return problems;
        String roles = String.join(",", toList(r.path("roles")));
        try {
            jdbc.update("INSERT INTO audit_finding (id, title, area, roles, reported_severity, severity, kind, environment, where_json, summary, "
                    + "steps_json, expected, actual, evidence, suggested_fix, found_by_agent, found_by_session, found_at, related_json, duplicate_of, "
                    + "status, source_file, source_commit, imported_at, updated_at) VALUES (:id, :title, :area, :roles, :sev, :sev, :kind, :env, :where, "
                    + ":summary, :steps, :expected, :actual, :evidence, :fix, :agent, :session, :foundAt, :related, :dup, :status, :file, :commit, :now, :now)",
                    new MapSqlParameterSource("id", id)
                            .addValue("title", r.path("title").asText())
                            .addValue("area", r.path("area").asText())
                            .addValue("roles", roles)
                            .addValue("sev", r.path("severity").asText())
                            .addValue("kind", r.path("kind").asText())
                            .addValue("env", r.path("environment").asText())
                            .addValue("where", r.path("where").toString())
                            .addValue("summary", r.path("summary").asText())
                            .addValue("steps", r.has("steps") ? r.path("steps").toString() : null)
                            .addValue("expected", textOrNull(r, "expected"))
                            .addValue("actual", textOrNull(r, "actual"))
                            .addValue("evidence", textOrNull(r, "evidence"))
                            .addValue("fix", textOrNull(r, "suggested_fix"))
                            .addValue("agent", r.path("found_by").path("agent").asText())
                            .addValue("session", textOrNull(r.path("found_by"), "session"))
                            .addValue("foundAt", utc(r.path("found_at")))
                            .addValue("related", r.has("related") ? r.path("related").toString() : null)
                            .addValue("dup", textOrNull(r, "duplicate_of"))
                            .addValue("status", r.hasNonNull("duplicate_of") ? "duplicate" : "new")
                            .addValue("file", f.path())
                            .addValue("commit", commit)
                            .addValue("now", now));
        } catch (DuplicateKeyException e) {
            return List.of("id " + id + " is already used by another finding");
        }
        event(id, "imported", null, r.hasNonNull("duplicate_of") ? "duplicate" : "new",
                "Reported by " + r.path("found_by").path("agent").asText() + " (" + r.path("severity").asText() + ")", null,
                r.path("found_by").path("agent").asText(), AGENT, f.path(), now);
        return List.of();
    }

    private List<String> importUpdate(JsonNode r, GitHubFindingsClient.InboxFile f, LocalDateTime now) {
        String findingId = r.path("finding").asText();
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT status, fix_commits_json FROM audit_finding WHERE id = :id FOR UPDATE", Map.of("id", findingId));
        if (rows.isEmpty()) return List.of("updates " + findingId + ", which is not a known finding");
        String status = r.path("status").asText();
        String by = r.path("by").asText();
        String commits = r.has("commits") ? r.path("commits").toString() : null;
        event(findingId, "agent_update", null, status, textOrNull(r, "note"), commits, by, AGENT, f.path(), now);
        String current = (String) rows.get(0).get("status");
        if ("fixed".equals(status) && AGENT_FIXABLE.contains(current)) {
            jdbc.update("UPDATE audit_finding SET status = 'fixed', fix_commits_json = :commits, updated_at = :now WHERE id = :id",
                    new MapSqlParameterSource("id", findingId).addValue("now", now)
                            .addValue("commits", mergeCommits((String) rows.get(0).get("fix_commits_json"), r.path("commits"))));
            event(findingId, "status", current, "fixed", "Marked fixed by " + by + " (agent)", commits, by, AGENT, f.path(), now);
        } else if ("fixed".equals(status)) {
            jdbc.update("UPDATE audit_finding SET fix_commits_json = :commits, updated_at = :now WHERE id = :id",
                    new MapSqlParameterSource("id", findingId).addValue("now", now)
                            .addValue("commits", mergeCommits((String) rows.get(0).get("fix_commits_json"), r.path("commits"))));
        } else {
            jdbc.update("UPDATE audit_finding SET updated_at = :now WHERE id = :id", Map.of("id", findingId, "now", now));
        }
        return List.of();
    }

    String mergeCommits(String existing, JsonNode add) {
        try {
            ArrayNode out = existing == null ? json.createArrayNode() : (ArrayNode) json.readTree(existing);
            Set<String> have = new java.util.HashSet<>();
            out.forEach(c -> have.add(c.path("repo").asText() + "@" + c.path("sha").asText()));
            for (JsonNode c : add) if (have.add(c.path("repo").asText() + "@" + c.path("sha").asText())) out.add(c);
            return out.toString();
        } catch (Exception e) {
            return add.toString();
        }
    }

    void event(String findingId, String type, String from, String to, String note, String commitsJson, String actor, String actorKind, String file, LocalDateTime now) {
        jdbc.update("INSERT INTO audit_finding_event (finding_id, event_type, from_value, to_value, note, commits_json, actor, actor_kind, source_file, created_at) "
                        + "VALUES (:f, :t, :from, :to, :note, :commits, :actor, :kind, :file, :now)",
                new MapSqlParameterSource("f", findingId).addValue("t", type).addValue("from", from).addValue("to", to).addValue("note", note)
                        .addValue("commits", commitsJson).addValue("actor", actor).addValue("kind", actorKind).addValue("file", file).addValue("now", now));
    }

    private void noteOnFinding(String recordId, String type, String note, String file, LocalDateTime now) {
        if (recordId == null) return;
        String findingId = recordId.contains(".u") ? recordId.substring(0, recordId.indexOf(".u")) : recordId;
        if (exists(findingId)) event(findingId, type, null, null, note, null, "importer", "AGENT", file, now);
    }

    private void upsertFile(GitHubFindingsClient.InboxFile f, String commit, String result, String errors, String recordId, LocalDateTime now) {
        String trimmed = errors == null ? null : (errors.length() > 4000 ? errors.substring(0, 4000) : errors);
        jdbc.update("INSERT INTO audit_finding_file (path, blob_sha, commit_sha, result, errors, record_id, first_seen_at, last_checked_at) "
                        + "VALUES (:p, :b, :c, :r, :e, :rid, :now, :now) ON DUPLICATE KEY UPDATE blob_sha = VALUES(blob_sha), commit_sha = VALUES(commit_sha), "
                        + "result = VALUES(result), errors = VALUES(errors), record_id = VALUES(record_id), last_checked_at = VALUES(last_checked_at)",
                new MapSqlParameterSource("p", f.path()).addValue("b", f.blobSha()).addValue("c", commit).addValue("r", result)
                        .addValue("e", trimmed).addValue("rid", recordId).addValue("now", now));
    }

    private void markFile(String path, String result, String note, LocalDateTime now) {
        jdbc.update("UPDATE audit_finding_file SET result = :r, errors = :e, last_checked_at = :now WHERE path = :p",
                new MapSqlParameterSource("p", path).addValue("r", result).addValue("e", note).addValue("now", now));
    }

    private void recordRun(LocalDateTime now, String commit, String result, String error) {
        jdbc.update("UPDATE audit_finding_sync SET last_run_at = :now, last_commit = COALESCE(:commit, last_commit), "
                        + "last_success_at = CASE WHEN :error IS NULL THEN :now ELSE last_success_at END, last_result = COALESCE(:result, last_result), "
                        + "last_error = :error WHERE id = 1",
                new MapSqlParameterSource("now", now).addValue("commit", commit).addValue("result", result).addValue("error", error));
    }

    private boolean exists(String id) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM audit_finding WHERE id = :id", Map.of("id", id), Integer.class);
        return n != null && n > 0;
    }

    private static String textOrNull(JsonNode r, String key) {
        JsonNode v = r.path(key);
        return v.isTextual() && !v.asText().isEmpty() ? v.asText() : null;
    }

    private static List<String> toList(JsonNode arr) {
        List<String> out = new ArrayList<>();
        arr.forEach(n -> out.add(n.asText()));
        return out;
    }

    private static LocalDateTime utc(JsonNode isoTime) {
        return OffsetDateTime.parse(isoTime.asText()).withOffsetSameInstant(ZoneOffset.UTC).toLocalDateTime();
    }

    /** For the page: the importer's state and the files it refused or flagged. */
    public Map<String, Object> status() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("configured", github.isConfigured());
        out.put("repo", github.repo());
        out.putAll(jdbc.queryForMap("SELECT last_commit AS lastCommit, last_run_at AS lastRunAt, last_success_at AS lastSuccessAt, "
                + "last_result AS lastResult, last_error AS lastError FROM audit_finding_sync WHERE id = 1", Map.of()));
        out.put("problemFiles", jdbc.queryForList("SELECT path, result, errors, record_id AS recordId, last_checked_at AS checkedAt "
                + "FROM audit_finding_file WHERE result <> 'IMPORTED' ORDER BY last_checked_at DESC LIMIT 200", Map.of()));
        return out;
    }
}
