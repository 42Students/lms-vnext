package com._42students.lms.service.impl;

import com._42students.lms.dto.request.LogContextRequest;
import com._42students.lms.dto.response.LogContextResponse;
import com._42students.lms.enums.FacultyType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Turns the ids on log lines into names, class and college -- one read-only lookup for the whole
 * report instead of a database session per error. Read-only, parameterized, and capped, because the
 * caller is an admin page and the input comes from log content.
 */
@Service
public class LogContextService {
    static final int MAX_IDS = 200;

    @Autowired private JdbcTemplate jdbc;

    public LogContextResponse resolve(LogContextRequest request) {
        Set<Integer> learnerIds = new LinkedHashSet<>();
        Set<Integer> facultyIds = new LinkedHashSet<>();
        Set<Integer> collegeIds = new LinkedHashSet<>();
        if (request != null && request.getUsers() != null) {
            for (LogContextRequest.UserRef ref : request.getUsers()) {
                if (ref == null || ref.getId() == null || ref.getId() <= 0) continue;
                String type = ref.getUserType() == null ? "" : ref.getUserType().toUpperCase(Locale.ROOT);
                if ("LEARNER".equals(type) && learnerIds.size() < MAX_IDS) learnerIds.add(ref.getId());
                if ("FACULTY".equals(type) && facultyIds.size() < MAX_IDS) facultyIds.add(ref.getId());
            }
        }
        if (request != null && request.getCollegeIds() != null) {
            for (Integer id : request.getCollegeIds()) {
                if (id != null && id > 0 && collegeIds.size() < MAX_IDS) collegeIds.add(id);
            }
        }

        List<LogContextResponse.UserContext> users = new ArrayList<>();
        users.addAll(learners(learnerIds));
        users.addAll(faculty(facultyIds));

        // Colleges seen only through users still get named, so a report can say "college 6 (NSRIT)".
        for (LogContextResponse.UserContext user : users) {
            if (user.getCollegeId() != null && collegeIds.size() < MAX_IDS) collegeIds.add(user.getCollegeId());
        }
        return LogContextResponse.builder().users(users).colleges(colleges(collegeIds)).build();
    }

    private List<LogContextResponse.UserContext> learners(Set<Integer> ids) {
        if (ids.isEmpty()) return List.of();
        String sql = "SELECT l.id, l.first_name, l.last_name, l.unique_id, l.roll_number, l.class_id, l.college_id,"
                + " l.program_id, l.organization_id, c.name AS class_name, c.batch_id"
                + " FROM learner l LEFT JOIN class c ON c.id = l.class_id WHERE l.id IN (" + placeholders(ids.size()) + ")";
        return jdbc.query(sql, ids.toArray(), (rs, i) -> LogContextResponse.UserContext.builder()
                .id(rs.getInt("id"))
                .userType("LEARNER")
                .displayName(fullName(rs.getString("first_name"), rs.getString("last_name")))
                .uniqueId(rs.getString("unique_id"))
                .rollNumber(rs.getString("roll_number"))
                .classId(nullableInt(rs.getObject("class_id")))
                .className(rs.getString("class_name"))
                .batchId(nullableInt(rs.getObject("batch_id")))
                .collegeId(nullableInt(rs.getObject("college_id")))
                .programId(nullableInt(rs.getObject("program_id")))
                .organizationId(nullableInt(rs.getObject("organization_id")))
                .build());
    }

    private List<LogContextResponse.UserContext> faculty(Set<Integer> ids) {
        if (ids.isEmpty()) return List.of();
        String sql = "SELECT id, first_name, last_name, unique_id, faculty_type, dept_id, college_id, organization_id"
                + " FROM faculty WHERE id IN (" + placeholders(ids.size()) + ")";
        return jdbc.query(sql, ids.toArray(), (rs, i) -> LogContextResponse.UserContext.builder()
                .id(rs.getInt("id"))
                .userType("FACULTY")
                .displayName(fullName(rs.getString("first_name"), rs.getString("last_name")))
                .uniqueId(rs.getString("unique_id"))
                .facultyType(facultyTypeName(rs.getString("faculty_type")))
                .deptId(nullableInt(rs.getObject("dept_id")))
                .collegeId(nullableInt(rs.getObject("college_id")))
                .organizationId(nullableInt(rs.getObject("organization_id")))
                .build());
    }

    private List<LogContextResponse.CollegeContext> colleges(Set<Integer> ids) {
        if (ids.isEmpty()) return List.of();
        String sql = "SELECT id, name, unique_id, org_id FROM college WHERE id IN (" + placeholders(ids.size()) + ")";
        return jdbc.query(sql, ids.toArray(), (rs, i) -> LogContextResponse.CollegeContext.builder()
                .id(rs.getInt("id"))
                .name(rs.getString("name"))
                .uniqueId(rs.getString("unique_id"))
                .organizationId(nullableInt(rs.getObject("org_id")))
                .build());
    }

    /** faculty.faculty_type is stored as the enum's ORDINAL (see FacultyType); turn it back into its name. */
    static String facultyTypeName(String stored) {
        if (stored == null || stored.isBlank()) return null;
        String trimmed = stored.trim();
        if (!trimmed.chars().allMatch(Character::isDigit)) return trimmed;
        try {
            int ordinal = Integer.parseInt(trimmed);
            FacultyType[] values = FacultyType.values();
            return ordinal >= 0 && ordinal < values.length ? values[ordinal].name() : trimmed;
        } catch (NumberFormatException e) {
            return trimmed;
        }
    }

    static String placeholders(int count) {
        return java.util.stream.IntStream.range(0, count).mapToObj(i -> "?").collect(Collectors.joining(","));
    }

    static String fullName(String first, String last) {
        String joined = ((first == null ? "" : first.trim()) + " " + (last == null ? "" : last.trim())).trim();
        return joined.isEmpty() ? null : joined;
    }

    private static Integer nullableInt(Object value) {
        return value instanceof Number ? ((Number) value).intValue() : null;
    }
}
