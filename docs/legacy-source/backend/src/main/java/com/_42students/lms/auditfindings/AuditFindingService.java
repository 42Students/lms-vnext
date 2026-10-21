package com._42students.lms.auditfindings;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * The tracker's side of audit findings: lists, detail and the decisions people make. Every change writes an
 * audit_finding_event row (who, what, from, to, why); nothing is ever deleted.
 */
@Service
public class AuditFindingService {

    static final String PERSON = "PERSON";

    public static final List<String> STATUSES = List.of("new", "confirmed", "in_progress", "fixed", "released", "verified",
            "duplicate", "wont_fix", "needs_info", "cannot_reproduce");
    /** Closing or reopening says why. */
    private static final Set<String> NEEDS_NOTE = Set.of("wont_fix", "cannot_reproduce", "needs_info", "verified");
    private static final Set<String> CLOSED = Set.of("verified", "duplicate", "wont_fix", "cannot_reproduce");
    private static final Pattern SHA = Pattern.compile("^[0-9a-f]{7,40}$");

    private final NamedParameterJdbcTemplate jdbc;
    private final AuditFindingSyncService sync;
    private final ObjectMapper json = new ObjectMapper();

    public AuditFindingService(NamedParameterJdbcTemplate jdbc, AuditFindingSyncService sync) {
        this.jdbc = jdbc;
        this.sync = sync;
    }

    public record Filter(String status, String severity, String area, String kind, String q, String view, int page, int size) {}

    public Map<String, Object> list(Filter f) {
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        MapSqlParameterSource p = new MapSqlParameterSource();
        if (has(f.status())) { where.append(" AND status IN (:status)"); p.addValue("status", List.of(f.status().split(","))); }
        if (has(f.severity())) { where.append(" AND severity IN (:severity)"); p.addValue("severity", List.of(f.severity().split(","))); }
        if (has(f.area())) { where.append(" AND area IN (:area)"); p.addValue("area", List.of(f.area().split(","))); }
        if (has(f.kind())) { where.append(" AND kind IN (:kind)"); p.addValue("kind", List.of(f.kind().split(","))); }
        if (has(f.q())) {
            where.append(" AND (LOWER(title) LIKE :q OR LOWER(summary) LIKE :q OR id LIKE :q OR LOWER(where_json) LIKE :q)");
            p.addValue("q", "%" + f.q().trim().toLowerCase().replace("%", "\\%").replace("_", "\\_") + "%");
        }
        if ("open".equals(f.view())) where.append(" AND status NOT IN ('verified','duplicate','wont_fix','cannot_reproduce')");
        // Release check: anything that would still be wrong on prod after a release.
        if ("release".equals(f.view())) where.append(" AND status IN ('new','confirmed','in_progress','fixed','needs_info') AND severity IN ('critical','high')");
        int size = Math.max(1, Math.min(f.size() <= 0 ? 50 : f.size(), 200));
        int page = Math.max(0, f.page());
        p.addValue("limit", size).addValue("offset", page * size);
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT id, title, area, roles, severity, reported_severity AS reportedSeverity, kind, environment, "
                + "status, assignee, found_by_agent AS foundBy, found_at AS foundAt, updated_at AS updatedAt, duplicate_of AS duplicateOf FROM audit_finding"
                + where + " ORDER BY FIELD(severity,'critical','high','medium','low'), found_at DESC, id LIMIT :limit OFFSET :offset", p);
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM audit_finding" + where, p, Long.class);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("items", rows);
        out.put("total", total);
        out.put("page", page);
        out.put("size", size);
        out.put("counts", counts());
        return out;
    }

    /** Numbers for the strip at the top: by status, and open ones by severity. */
    public Map<String, Object> counts() {
        Map<String, Object> byStatus = new LinkedHashMap<>();
        STATUSES.forEach(s -> byStatus.put(s, 0L));
        jdbc.queryForList("SELECT status, COUNT(*) n FROM audit_finding GROUP BY status", Map.of())
                .forEach(r -> byStatus.put((String) r.get("status"), ((Number) r.get("n")).longValue()));
        Map<String, Object> openBySeverity = new LinkedHashMap<>();
        AuditFindingRules.SEVERITIES.forEach(s -> openBySeverity.put(s, 0L));
        jdbc.queryForList("SELECT severity, COUNT(*) n FROM audit_finding WHERE status NOT IN ('verified','duplicate','wont_fix','cannot_reproduce') GROUP BY severity", Map.of())
                .forEach(r -> openBySeverity.put((String) r.get("severity"), ((Number) r.get("n")).longValue()));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("byStatus", byStatus);
        out.put("openBySeverity", openBySeverity);
        return out;
    }

    public Map<String, Object> detail(String id) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM audit_finding WHERE id = :id", Map.of("id", id));
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Finding not found");
        Map<String, Object> f = new LinkedHashMap<>(rows.get(0));
        for (String k : List.of("where_json", "steps_json", "related_json", "fix_commits_json")) {
            Object v = f.get(k);
            if (v != null) {
                try { f.put(k, json.readTree(v.toString())); } catch (Exception ignored) { }
            }
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("finding", f);
        out.put("events", jdbc.queryForList("SELECT id, event_type AS type, from_value AS fromValue, to_value AS toValue, note, commits_json AS commits, "
                + "actor, actor_kind AS actorKind, source_file AS sourceFile, created_at AS at FROM audit_finding_event WHERE finding_id = :id ORDER BY id", Map.of("id", id)));
        out.put("similar", similar(id, (String) f.get("area"), (String) f.get("title")));
        return out;
    }

    /** Other findings in the same area whose titles share most words (for merging duplicates). */
    List<Map<String, Object>> similar(String id, String area, String title) {
        Set<String> words = words(title);
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> r : jdbc.queryForList("SELECT id, title, status, severity FROM audit_finding WHERE area = :a AND id <> :id", Map.of("a", area, "id", id))) {
            Set<String> other = words((String) r.get("title"));
            if (words.isEmpty() || other.isEmpty()) continue;
            long both = words.stream().filter(other::contains).count();
            if ((double) both / Math.min(words.size(), other.size()) >= 0.6) out.add(r);
            if (out.size() >= 5) break;
        }
        return out;
    }

    private static Set<String> words(String s) {
        Set<String> out = new java.util.HashSet<>();
        for (String w : String.valueOf(s).toLowerCase().replaceAll("[^a-z0-9 ]", " ").split("\\s+")) if (w.length() > 3) out.add(w);
        return out;
    }

    @Transactional
    public Map<String, Object> setStatus(String id, String status, String note, String duplicateOf, String actor) {
        if (!STATUSES.contains(status)) throw bad("Unknown status");
        Map<String, Object> f = lock(id);
        String current = (String) f.get("status");
        if (current.equals(status)) throw bad("It is already " + status.replace('_', ' '));
        if (NEEDS_NOTE.contains(status) && !has(note)) throw bad("Say why (for \"verified\": what you re-tested)");
        if (("released".equals(status) || "verified".equals(status)) && !Set.of("fixed", "released").contains(current)) {
            throw bad("Only a fixed finding can be marked " + status);
        }
        if ("duplicate".equals(status)) {
            if (!has(duplicateOf) || duplicateOf.equals(id)) throw bad("Choose the finding this repeats");
            if (jdbc.queryForObject("SELECT COUNT(*) FROM audit_finding WHERE id = :d", Map.of("d", duplicateOf), Integer.class) == 0) throw bad("That finding doesn't exist");
        }
        // Reopening something closed says why.
        if (CLOSED.contains(current) && !CLOSED.contains(status) && !has(note)) throw bad("Say why it is being reopened");
        jdbc.update("UPDATE audit_finding SET status = :s, duplicate_of = CASE WHEN :s = 'duplicate' THEN :d ELSE duplicate_of END, updated_at = :now WHERE id = :id",
                new MapSqlParameterSource("s", status).addValue("d", duplicateOf).addValue("now", now()).addValue("id", id));
        sync.event(id, "status", current, status, trimNote(note) + ("duplicate".equals(status) ? " (duplicate of " + duplicateOf + ")" : ""), null, actor, PERSON, null, now());
        return detail(id);
    }

    @Transactional
    public Map<String, Object> setSeverity(String id, String severity, String note, String actor) {
        if (!AuditFindingRules.SEVERITIES.contains(severity)) throw bad("Unknown severity");
        Map<String, Object> f = lock(id);
        if (severity.equals(f.get("severity"))) throw bad("It is already " + severity);
        jdbc.update("UPDATE audit_finding SET severity = :s, updated_at = :now WHERE id = :id", Map.of("s", severity, "now", now(), "id", id));
        sync.event(id, "severity", (String) f.get("severity"), severity, trimNote(note), null, actor, PERSON, null, now());
        return detail(id);
    }

    @Transactional
    public Map<String, Object> setAssignee(String id, String assignee, String actor) {
        Map<String, Object> f = lock(id);
        String next = has(assignee) ? assignee.trim() : null;
        if (next != null && next.length() > 100) throw bad("Keep the name under 100 characters");
        jdbc.update("UPDATE audit_finding SET assignee = :a, updated_at = :now WHERE id = :id",
                new MapSqlParameterSource("a", next).addValue("now", now()).addValue("id", id));
        sync.event(id, "assignee", (String) f.get("assignee"), next, null, null, actor, PERSON, null, now());
        return detail(id);
    }

    @Transactional
    public Map<String, Object> comment(String id, String note, String actor) {
        lock(id);
        if (!has(note)) throw bad("Write a comment");
        sync.event(id, "comment", null, null, trimNote(note), null, actor, PERSON, null, now());
        jdbc.update("UPDATE audit_finding SET updated_at = :now WHERE id = :id", Map.of("now", now(), "id", id));
        return detail(id);
    }

    @Transactional
    public Map<String, Object> addCommit(String id, String repo, String sha, String actor) {
        Map<String, Object> f = lock(id);
        if (!AuditFindingRules.REPOS.contains(repo)) throw bad("Unknown repo");
        if (sha == null || !SHA.matcher(sha.trim()).matches()) throw bad("That isn't a commit hash");
        JsonNode add = json.createArrayNode().add(json.createObjectNode().put("repo", repo).put("sha", sha.trim()));
        jdbc.update("UPDATE audit_finding SET fix_commits_json = :c, updated_at = :now WHERE id = :id",
                new MapSqlParameterSource("c", sync.mergeCommits((String) f.get("fix_commits_json"), add)).addValue("now", now()).addValue("id", id));
        sync.event(id, "commit", null, repo + "@" + sha.trim(), null, add.toString(), actor, PERSON, null, now());
        return detail(id);
    }

    private Map<String, Object> lock(String id) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM audit_finding WHERE id = :id FOR UPDATE", Map.of("id", id));
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Finding not found");
        return rows.get(0);
    }

    private static String trimNote(String note) {
        if (!has(note)) return null;
        String n = note.trim();
        return n.length() > 4000 ? n.substring(0, 4000) : n;
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private static boolean has(String s) { return s != null && !s.isBlank(); }

    private static LocalDateTime now() { return LocalDateTime.now(ZoneOffset.UTC); }
}
