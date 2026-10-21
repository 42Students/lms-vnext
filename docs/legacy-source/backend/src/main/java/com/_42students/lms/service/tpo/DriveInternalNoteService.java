package com._42students.lms.service.tpo;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * A drive's internal discussion (recruiter phase 1, N7): the placement team talks about the drive here, and it is never shown to
 * the recruiter. The discussion with the company is the drive's message thread (TpoMessagesService); the two are kept apart.
 */
@Service
@RequiredArgsConstructor
public class DriveInternalNoteService {

    public static final int MAX_LENGTH = 4000;

    private final NamedParameterJdbcTemplate jdbc;

    public List<Map<String, Object>> list(Integer collegeId, Integer jobId) {
        return jdbc.queryForList("SELECT n.id, n.body, n.created_at AS createdAt, n.author_faculty_id AS authorId, " +
                "TRIM(CONCAT(COALESCE(f.first_name, ''), ' ', COALESCE(f.last_name, ''))) AS authorName " +
                "FROM drive_internal_note n LEFT JOIN faculty f ON f.id = n.author_faculty_id " +
                "WHERE n.job_id = :j AND n.college_id = :c ORDER BY n.id", new MapSqlParameterSource("j", jobId).addValue("c", collegeId));
    }

    public Map<String, Object> add(Integer collegeId, Integer jobId, Integer facultyId, String body) {
        // Stored as typed: the screen escapes it when it shows it (escaping here too showed "&amp;amp;" for "&").
        String text = body == null ? null : body.trim();
        if (text == null || text.isEmpty()) throw new IllegalArgumentException("Write something first");
        if (text.length() > MAX_LENGTH) throw new IllegalArgumentException("Keep it under " + MAX_LENGTH + " characters");
        jdbc.update("INSERT INTO drive_internal_note (job_id, college_id, author_faculty_id, body) VALUES (:j, :c, :f, :b)",
                new MapSqlParameterSource("j", jobId).addValue("c", collegeId).addValue("f", facultyId).addValue("b", text));
        return Map.of("status", "ADDED");
    }
}
