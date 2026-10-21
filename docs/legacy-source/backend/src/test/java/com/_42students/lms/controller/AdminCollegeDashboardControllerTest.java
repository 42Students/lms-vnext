package com._42students.lms.controller;

import com._42students.lms.service.AppSettingsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AdminCollegeDashboardControllerTest {

    private AdminCollegeDashboardController controller;
    private NamedParameterJdbcTemplate jdbc;
    private final List<String> sqls = new ArrayList<>();
    private final List<SqlParameterSource> paramsSeen = new ArrayList<>();

    @BeforeEach
    void setUp() {
        controller = new AdminCollegeDashboardController();
        jdbc = mock(NamedParameterJdbcTemplate.class);
        AppSettingsService settings = mock(AppSettingsService.class);
        when(settings.getInt(eq("COLLEGE"), anyInt(), eq("attendance.eligibilityThresholdPercent"), anyInt())).thenReturn(80);
        ReflectionTestUtils.setField(controller, "jdbc", jdbc);
        ReflectionTestUtils.setField(controller, "appSettingsService", settings);
        when(jdbc.queryForObject(anyString(), any(SqlParameterSource.class), eq(Long.class))).thenAnswer(inv -> {
            sqls.add(inv.getArgument(0));
            paramsSeen.add(inv.getArgument(1));
            return 3L;
        });
        when(jdbc.queryForList(anyString(), any(SqlParameterSource.class))).thenAnswer(inv -> {
            sqls.add(inv.getArgument(0));
            return List.of(Map.of("k", "v"));
        });
    }

    @Test
    void everySectionIsBuiltWithIstTimesAndTheCollegeThreshold() {
        Map<String, Object> out = controller.build(6, LocalDateTime.of(2026, 10, 4, 18, 30, 0));

        assertEquals(80, out.get("attendanceThreshold"));
        for (String key : List.of("today", "attendancePending", "attendanceAtRisk", "gradingBacklog", "unstaffed", "setupGaps", "dueThisWeek")) {
            assertNotNull(out.get(key), key);
        }
        MapSqlParameterSource p = (MapSqlParameterSource) paramsSeen.get(0);
        assertEquals("2026-10-04 18:30:00", p.getValue("now"));
        assertEquals("2026-10-04 00:00:00", p.getValue("todayStart"));
        assertEquals("2026-10-05 00:00:00", p.getValue("tomorrowStart"));
        assertEquals(6, p.getValue("collegeId"));
        // Every query is scoped to the college.
        assertTrue(sqls.stream().allMatch(sql -> sql.contains(":collegeId")), "unscoped query");
    }

    @Test
    void oneFailingSectionDoesNotTakeDownTheOthers() {
        when(jdbc.queryForObject(argThat((String sql) -> sql != null && sql.contains("student_assignment")),
                any(SqlParameterSource.class), eq(Long.class))).thenThrow(new RuntimeException("boom"));

        Map<String, Object> out = controller.build(6, LocalDateTime.of(2026, 10, 4, 9, 0));

        assertNull(out.get("gradingBacklog"));
        assertNotNull(out.get("today"));
        assertNotNull(out.get("unstaffed"));
    }

    @Test
    void dumpSqlForManualVerification() throws Exception {
        controller.build(6, LocalDateTime.of(2026, 10, 4, 18, 30, 0));
        String target = System.getProperty("dashboardSqlDump");
        if (target == null) return;
        MapSqlParameterSource p = (MapSqlParameterSource) paramsSeen.get(0);
        StringBuilder sb = new StringBuilder();
        for (String sql : sqls) {
            String literal = sql;
            for (String name : p.getParameterNames()) {
                Object v = p.getValue(name);
                literal = literal.replace(":" + name, v instanceof Number ? v.toString() : "'" + v + "'");
            }
            sb.append(literal).append(";\n");
        }
        java.nio.file.Files.writeString(java.nio.file.Path.of(target), sb.toString());
    }
}
