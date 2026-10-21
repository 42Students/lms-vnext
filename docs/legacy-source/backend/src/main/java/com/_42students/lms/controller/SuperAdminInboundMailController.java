package com._42students.lms.controller;

import com._42students.lms.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Super Admin > Inbound mail (13 Oct 2026): every email sent to a 42lms.com address, kept in inbound_email by the Cloudflare
 * Email Worker (no Gmail). Replies posted into a conversation are there too; everything else waits here for someone to read
 * and mark done. Super admins only (WebSecurityConfig).
 */
@RestController
@RequestMapping("/api/v1/superadmin/inbound-mail")
public class SuperAdminInboundMailController {

    static final int PAGE = 50;
    private static final String LIST =
            "SELECT e.id, e.created_at AS receivedAt, e.from_address AS fromAddress, e.to_address AS toAddress, e.subject, e.kind, e.status, " +
            "  e.body_preview AS preview, e.handled_at AS handledAt, e.thread_id AS threadId, " +
            "  TRIM(CONCAT(COALESCE(h.first_name, ''), ' ', COALESCE(h.last_name, ''))) AS recruiterName, " +
            "  TRIM(CONCAT(COALESCE(l.first_name, ''), ' ', COALESCE(l.last_name, ''))) AS studentName, c.name AS collegeName " +
            "FROM inbound_email e LEFT JOIN recruiter h ON h.id = e.recruiter_id LEFT JOIN learner l ON l.id = e.learner_id " +
            "LEFT JOIN college c ON c.id = e.college_id ";

    private final NamedParameterJdbcTemplate jdbc;

    public SuperAdminInboundMailController(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** show: OPEN (not done, the default), DONE, REPLIES (posted into conversations), ALL. q searches sender, subject and text. */
    @GetMapping
    public Map<String, Object> list(@RequestParam(defaultValue = "OPEN") String show, @RequestParam(required = false) String q,
                                    @RequestParam(defaultValue = "0") int page) {
        StringBuilder where = new StringBuilder("WHERE 1 = 1 ");
        MapSqlParameterSource p = new MapSqlParameterSource();
        switch (show) {
            case "DONE" -> where.append("AND e.handled_at IS NOT NULL AND e.status <> 'POSTED' ");
            case "REPLIES" -> where.append("AND e.status = 'POSTED' ");
            case "ALL" -> { }
            default -> where.append("AND e.handled_at IS NULL AND e.status <> 'POSTED' ");
        }
        if (q != null && !q.isBlank()) {
            where.append("AND (e.from_address LIKE :q OR e.subject LIKE :q OR e.body_text LIKE :q) ");
            p.addValue("q", "%" + q.trim().replace("%", "\\%").replace("_", "\\_") + "%");
        }
        int offset = Math.max(0, page) * PAGE;
        List<Map<String, Object>> rows = jdbc.queryForList(LIST + where + "ORDER BY e.id DESC LIMIT " + PAGE + " OFFSET " + offset, p);
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM inbound_email e " + where, p, Long.class);
        Long open = jdbc.queryForObject("SELECT COUNT(*) FROM inbound_email WHERE handled_at IS NULL AND status <> 'POSTED'", new MapSqlParameterSource(), Long.class);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("items", rows);
        out.put("total", total == null ? 0 : total);
        out.put("open", open == null ? 0 : open);
        out.put("pageSize", PAGE);
        return out;
    }

    /** One email in full. */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> one(@PathVariable long id) {
        List<Map<String, Object>> rows = jdbc.queryForList(LIST.replace("e.body_preview AS preview,", "e.body_preview AS preview, e.body_text AS body,") + "WHERE e.id = :id",
                new MapSqlParameterSource("id", id));
        return rows.isEmpty() ? ResponseEntity.notFound().build() : ResponseEntity.ok(rows.get(0));
    }

    /** Mark done (or back to open with done=false). */
    @PostMapping("/{id}/done")
    public ResponseEntity<Map<String, Object>> done(@PathVariable long id, @RequestParam(defaultValue = "true") boolean done) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal me = auth != null && auth.getPrincipal() instanceof UserPrincipal u ? u : null;
        int n = jdbc.update("UPDATE inbound_email SET handled_at = " + (done ? "UTC_TIMESTAMP()" : "NULL") + ", handled_by = :by WHERE id = :id",
                new MapSqlParameterSource("id", id).addValue("by", done && me != null ? me.getId() : null));
        return n == 0 ? ResponseEntity.notFound().build() : ResponseEntity.ok(Map.of("id", id, "done", done));
    }
}
