package com._42students.lms.service;

import com._42students.lms.model.AdminAuditLog;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Names for the thing each audit row is about. Most rows store only an id in entity_type /
 * entity_id ("learner 152", "batch 12", "quiz 96") with an empty payload, so the Activity Log read
 * "Ananya Reddy suspended learner", "changed module access for" with nothing after it. Resolved
 * per page in one query per kind, keyed "entitytype:entityId" (type lower-cased), the same way
 * actor names already are. A row that can't be resolved simply has no entry.
 */
@Component
@Slf4j
public class AuditTargetNameResolver {

    private static final String PERSON = "TRIM(CONCAT(COALESCE(first_name,''),' ',COALESCE(last_name,'')))";

    /** kind -> SQL returning (id, name) for :ids. */
    private static final Map<String, String> QUERIES = Map.ofEntries(
            Map.entry("learner", "SELECT id, " + PERSON + " AS name FROM learner WHERE id IN (:ids)"),
            Map.entry("faculty", "SELECT id, " + PERSON + " AS name FROM faculty WHERE id IN (:ids)"),
            Map.entry("batch", "SELECT id, batch_name AS name FROM batch WHERE id IN (:ids)"),
            Map.entry("quiz", "SELECT id, title AS name FROM quizzes WHERE id IN (:ids)"),
            Map.entry("course", "SELECT id, course_name AS name FROM course WHERE id IN (:ids)"),
            Map.entry("class", "SELECT id, name FROM `class` WHERE id IN (:ids)"),
            Map.entry("department", "SELECT id, name FROM department WHERE id IN (:ids)"),
            // Programs live in new_program (NewProgram); the old `program` table is legacy and its ids
            // do not match, so names came out wrong.
            Map.entry("program", "SELECT id, name FROM new_program WHERE id IN (:ids)"),
            Map.entry("semester", "SELECT id, name FROM semester WHERE id IN (:ids)"),
            Map.entry("lecture_hall", "SELECT id, name FROM lecture_hall WHERE id IN (:ids)"),
            Map.entry("lesson", "SELECT id, lesson_name AS name FROM lesson WHERE id IN (:ids)"),
            Map.entry("lesson_content", "SELECT id, content_title AS name FROM lesson_contents WHERE id IN (:ids)"),
            Map.entry("project", "SELECT slug AS id, title AS name FROM project_workspace WHERE slug IN (:ids)"),
            Map.entry("project_template", "SELECT slug AS id, title AS name FROM project_template WHERE slug IN (:ids)")
    );

    @Autowired(required = false)
    private NamedParameterJdbcTemplate jdbc;

    /** Which table an audit row's entity lives in, or null when there is nothing to look up. */
    static String kindOf(AdminAuditLog row) {
        String type = row.getEntityType() == null ? "" : row.getEntityType().trim().toLowerCase(Locale.ROOT);
        String action = row.getActionKey() == null ? "" : row.getActionKey().toUpperCase(Locale.ROOT);
        switch (type) {
            case "learner":
            case "learner_profile":
                return "learner";
            case "user":
                // LEARNER_SUSPEND / FACULTY_REACTIVATE store the account under the generic "user" type.
                if (action.startsWith("LEARNER")) return "learner";
                if (action.startsWith("FACULTY")) return "faculty";
                return null;
            default:
                return QUERIES.containsKey(type) ? type : null;
        }
    }

    /** Kinds whose audit rows carry a slug rather than a numeric id. */
    private static final Set<String> SLUG_KEYED = Set.of("project", "project_template");

    static String keyOf(AdminAuditLog row) {
        return (row.getEntityType() == null ? "" : row.getEntityType().trim().toLowerCase(Locale.ROOT)) + ":" + row.getEntityId();
    }

    public Map<String, String> resolve(List<AdminAuditLog> rows) {
        Map<String, String> out = new HashMap<>();
        if (jdbc == null || rows == null || rows.isEmpty()) return out;
        Map<String, Set<String>> idsByKind = new HashMap<>();
        for (AdminAuditLog row : rows) {
            String kind = kindOf(row);
            if (kind == null || row.getEntityId() == null || row.getEntityId().isBlank()) continue;
            String id = row.getEntityId().trim();
            if (!SLUG_KEYED.contains(kind) && !id.matches("\\d{1,10}")) continue;
            idsByKind.computeIfAbsent(kind, k -> new HashSet<>()).add(id);
        }
        Map<String, Map<String, String>> namesByKind = new HashMap<>();
        idsByKind.forEach((kind, ids) -> {
            try {
                Map<String, String> names = new HashMap<>();
                jdbc.query(QUERIES.get(kind), new MapSqlParameterSource("ids", ids), rs -> {
                    String name = rs.getString("name");
                    if (name != null && !name.isBlank()) names.put(rs.getString("id"), name.trim());
                });
                namesByKind.put(kind, names);
            } catch (Exception e) {
                // A name lookup must never break the audit trail itself.
                log.warn("Audit target-name lookup for {} failed: {}", kind, e.getMessage());
            }
        });
        for (AdminAuditLog row : rows) {
            String kind = kindOf(row);
            if (kind == null || row.getEntityId() == null) continue;
            String name = namesByKind.getOrDefault(kind, Map.of()).get(row.getEntityId().trim());
            if (name != null) out.put(keyOf(row), name);
        }
        return out;
    }
}
