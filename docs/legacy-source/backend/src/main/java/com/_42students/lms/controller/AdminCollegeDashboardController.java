package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.response.Response;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AppSettingsService;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

/**
 * The college-admin dashboard's "what needs me today" data, in one call.
 *
 * <p>The dashboard used to be a first-run setup guide plus four totals: nothing on it changed from
 * one day to the next, so it answered none of the questions an admin opens it with. Each section
 * here is a question with a list behind it, and each is computed independently: one failing query
 * returns {@code null} for its section (the page shows "couldn't load") instead of failing the rest.
 *
 * <p>Times: class_schedule.start_time / end_time and quizzes.due_at are IST wall-clock values, so
 * "now" and "today" are computed in Asia/Kolkata, not in the JVM's UTC.
 */
@RestController
@RequestMapping("/api/v1/admin/college-dashboard")
@Slf4j
@Api(tags = "Admin College Dashboard")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class AdminCollegeDashboardController extends BaseController {

    static final ZoneId INDIA = ZoneId.of("Asia/Kolkata");
    private static final DateTimeFormatter WALL = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final int LIST_LIMIT = 8;

    /** Live classes of the college (sections and elective classes), joined as {@code c}. */
    private static final String COLLEGE_CLASS = " JOIN class c ON c.id = %s AND (c.is_deleted = false OR c.is_deleted IS NULL) "
            + "JOIN new_program p ON p.id = c.program_id "
            + "JOIN department d ON d.id = p.dept_id AND d.college_id = :collegeId ";

    /** Active learners of the college, whether linked by college_id or only through their class. */
    private static final String COLLEGE_LEARNER = " (l.is_deleted = false OR l.is_deleted IS NULL) AND l.suspended_at IS NULL "
            + "AND (l.college_id = :collegeId OR EXISTS (SELECT 1 FROM class lc JOIN new_program lp ON lp.id = lc.program_id "
            + "JOIN department ld ON ld.id = lp.dept_id WHERE lc.id = l.class_id AND ld.college_id = :collegeId)) ";

    @Autowired(required = false)
    private NamedParameterJdbcTemplate jdbc;

    @Autowired(required = false)
    private AppSettingsService appSettingsService;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @GetMapping
    @ApiOperation(value = "Operational dashboard for one college",
            notes = "Today's classes, attendance not taken, students under the attendance threshold, grading backlog, "
                    + "courses with no teacher, setup gaps and quizzes due this week. Sections fail independently (null).")
    public ResponseEntity<Response<Map<String, Object>>> dashboard(@RequestParam Integer collegeId) {
        if (collegeId == null || collegeId <= 0) {
            return new ResponseEntity<>(new Response<>("error", "collegeId must be a positive integer", null), HttpStatus.BAD_REQUEST);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity<>(new Response<>(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                build(collegeId, LocalDateTime.now(INDIA))), HttpStatus.OK);
    }

    Map<String, Object> build(int collegeId, LocalDateTime nowIst) {
        int threshold = appSettingsService != null
                ? appSettingsService.getInt("COLLEGE", collegeId, "attendance.eligibilityThresholdPercent", 75) : 75;
        LocalDate today = nowIst.toLocalDate();
        MapSqlParameterSource params = new MapSqlParameterSource("collegeId", collegeId)
                .addValue("now", nowIst.format(WALL))
                .addValue("todayStart", today.atStartOfDay().format(WALL))
                .addValue("tomorrowStart", today.plusDays(1).atStartOfDay().format(WALL))
                .addValue("weekAgo", today.minusDays(7).atStartOfDay().format(WALL))
                .addValue("monthAgo", today.minusDays(30).atStartOfDay().format(WALL))
                .addValue("weekAhead", today.plusDays(8).atStartOfDay().format(WALL))
                .addValue("threshold", threshold);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("generatedAt", nowIst.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        out.put("attendanceThreshold", threshold);
        out.put("today", section("today", () -> today(params)));
        out.put("attendancePending", section("attendancePending", () -> attendancePending(params)));
        out.put("attendanceAtRisk", section("attendanceAtRisk", () -> attendanceAtRisk(params)));
        out.put("gradingBacklog", section("gradingBacklog", () -> gradingBacklog(params)));
        out.put("unstaffed", section("unstaffed", () -> unstaffed(params)));
        out.put("setupGaps", section("setupGaps", () -> setupGaps(params)));
        out.put("dueThisWeek", section("dueThisWeek", () -> dueThisWeek(params)));
        return out;
    }

    private Object section(String name, Supplier<Object> body) {
        if (jdbc == null) return null;
        try {
            return body.get();
        } catch (Exception e) {
            log.warn("College dashboard section {} failed: {}", name, e.getMessage());
            return null;
        }
    }

    private long count(String sql, MapSqlParameterSource params) {
        Long n = jdbc.queryForObject(sql, params, Long.class);
        return n == null ? 0 : n;
    }

    private Map<String, Object> today(MapSqlParameterSource params) {
        String from = " FROM class_schedule cs" + String.format(COLLEGE_CLASS, "cs.class_id")
                + "WHERE (cs.is_deleted = false OR cs.is_deleted IS NULL) "
                + "AND cs.start_time >= :todayStart AND cs.start_time < :tomorrowStart ";
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("classCount", count("SELECT COUNT(*)" + from, params));
        out.put("heldCount", count("SELECT COUNT(*)" + from + "AND cs.end_time <= :now", params));
        out.put("markedCount", count("SELECT COUNT(*)" + from + "AND cs.attendance_marked_at IS NOT NULL", params));
        return out;
    }

    /** Sessions that ended in the last 7 days with no attendance taken, newest first. */
    private Map<String, Object> attendancePending(MapSqlParameterSource params) {
        String from = " FROM class_schedule cs" + String.format(COLLEGE_CLASS, "cs.class_id")
                + "LEFT JOIN course co ON co.id = cs.course_id "
                + "LEFT JOIN faculty f ON f.id = cs.faculty_id "
                + "WHERE (cs.is_deleted = false OR cs.is_deleted IS NULL) AND cs.attendance_marked_at IS NULL "
                + "AND cs.start_time >= :weekAgo AND cs.end_time <= :now ";
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("count", count("SELECT COUNT(*)" + from, params));
        out.put("items", jdbc.queryForList("SELECT cs.id AS scheduleId, cs.start_time AS startTime, cs.title AS title, "
                + "c.id AS classId, c.name AS className, co.id AS courseId, co.course_name AS courseName, "
                + "TRIM(CONCAT(COALESCE(f.first_name, ''), ' ', COALESCE(f.last_name, ''))) AS facultyName"
                + from + "ORDER BY cs.start_time DESC LIMIT " + LIST_LIMIT, params));
        return out;
    }

    /**
     * Learners under the attendance threshold over the last 30 days, counting only sessions that
     * were actually marked (an unmarked session is not a present one). Lowest first.
     */
    private Map<String, Object> attendanceAtRisk(MapSqlParameterSource params) {
        String perLearner = "SELECT l.id AS learnerId, TRIM(CONCAT(COALESCE(l.first_name, ''), ' ', COALESCE(l.last_name, ''))) AS name, "
                + "l.roll_number AS rollNumber, c.name AS className, COUNT(cs.id) AS held, "
                + "COUNT(a.id) AS absent "
                + "FROM learner l" + String.format(COLLEGE_CLASS, "l.class_id")
                + "JOIN class_schedule cs ON cs.class_id = l.class_id AND (cs.is_deleted = false OR cs.is_deleted IS NULL) "
                + " AND cs.attendance_marked_at IS NOT NULL AND cs.start_time >= :monthAgo AND cs.start_time <= :now "
                + "LEFT JOIN attend a ON a.class_schedule_id = cs.id AND a.student_id = l.id AND (a.is_deleted = false OR a.is_deleted IS NULL) "
                + "WHERE (l.is_deleted = false OR l.is_deleted IS NULL) AND l.suspended_at IS NULL "
                + "GROUP BY l.id, l.first_name, l.last_name, l.roll_number, c.name "
                + "HAVING COUNT(cs.id) > 0 AND (COUNT(cs.id) - COUNT(a.id)) * 100 < :threshold * COUNT(cs.id)";
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("count", count("SELECT COUNT(*) FROM (" + perLearner + ") r", params));
        List<Map<String, Object>> items = jdbc.queryForList("SELECT r.*, ROUND((r.held - r.absent) * 100 / r.held) AS percent FROM ("
                + perLearner + ") r ORDER BY (r.held - r.absent) / r.held ASC, r.held DESC LIMIT " + LIST_LIMIT, params);
        out.put("items", items);
        out.put("windowDays", 30);
        return out;
    }

    /** Assignment submissions nobody has graded yet, by course, biggest pile first. */
    private Map<String, Object> gradingBacklog(MapSqlParameterSource params) {
        String from = " FROM student_assignment sa JOIN learner l ON l.id = sa.student_id AND " + COLLEGE_LEARNER
                + "JOIN lesson_contents lc ON lc.id = sa.lesson_content_id "
                + "LEFT JOIN course co ON co.id = lc.course_id "
                + "WHERE (sa.is_deleted = false OR sa.is_deleted IS NULL) AND sa.grading_status = 'NOT_GRADED' ";
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("count", count("SELECT COUNT(*)" + from, params));
        out.put("oldestSubmittedAt", jdbc.queryForObject("SELECT MIN(sa.created_at)" + from, params, java.sql.Timestamp.class));
        out.put("items", jdbc.queryForList("SELECT lc.course_id AS courseId, MAX(co.course_name) AS courseName, COUNT(*) AS count, "
                + "MIN(sa.created_at) AS oldestSubmittedAt" + from + "GROUP BY lc.course_id ORDER BY COUNT(*) DESC LIMIT " + LIST_LIMIT, params));
        return out;
    }

    /**
     * Courses on a section's current-semester curriculum with no active teacher for that section.
     * Learners see these courses with nobody behind them.
     */
    private Map<String, Object> unstaffed(MapSqlParameterSource params) {
        String from = " FROM class c0 JOIN batch b ON b.id = c0.batch_id AND b.status = 'ACTIVE' "
                + String.format(COLLEGE_CLASS, "c0.id")
                + "JOIN semester s ON s.program_id = c.program_id AND s.semester_number = b.current_semester "
                + " AND (s.is_deleted = false OR s.is_deleted IS NULL) "
                + "JOIN semester_course sc ON sc.semester_id = s.id AND (sc.is_deleted = false OR sc.is_deleted IS NULL) "
                + "JOIN course co ON co.id = sc.course_id AND (co.is_deleted = false OR co.is_deleted IS NULL) "
                + "WHERE (c.class_type = 'SECTION' OR c.class_type IS NULL) "
                + "AND NOT EXISTS (SELECT 1 FROM faculty_teaching_assignment t WHERE t.class_id = c.id AND t.course_id = sc.course_id "
                + " AND t.is_active = true AND (t.is_deleted = false OR t.is_deleted IS NULL)) ";
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("count", count("SELECT COUNT(*)" + from, params));
        out.put("items", jdbc.queryForList("SELECT c.id AS classId, c.name AS className, co.id AS courseId, co.course_name AS courseName, "
                + "b.current_semester AS semester" + from + "ORDER BY c.name, co.course_name LIMIT " + LIST_LIMIT, params));
        return out;
    }

    /** Structural holes that make other pages look empty or broken. */
    private Map<String, Object> setupGaps(MapSqlParameterSource params) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("batchesWithoutClasses", count("SELECT COUNT(*) FROM batch b JOIN new_program p ON p.id = b.program_id "
                + "JOIN department d ON d.id = p.dept_id AND d.college_id = :collegeId WHERE b.status = 'ACTIVE' "
                + "AND NOT EXISTS (SELECT 1 FROM class c WHERE c.batch_id = b.id AND (c.is_deleted = false OR c.is_deleted IS NULL))", params));
        out.put("sectionsWithoutStudents", count("SELECT COUNT(*) FROM class c0" + String.format(COLLEGE_CLASS, "c0.id")
                + "JOIN batch b ON b.id = c.batch_id AND b.status = 'ACTIVE' "
                + "WHERE (c.class_type = 'SECTION' OR c.class_type IS NULL) AND NOT EXISTS (SELECT 1 FROM learner l "
                + "WHERE l.class_id = c.id AND (l.is_deleted = false OR l.is_deleted IS NULL))", params));
        out.put("studentsWithoutClass", count("SELECT COUNT(*) FROM learner l WHERE l.college_id = :collegeId "
                + "AND (l.is_deleted = false OR l.is_deleted IS NULL) AND l.suspended_at IS NULL "
                + "AND (l.class_id IS NULL OR l.class_id < 1 OR NOT EXISTS (SELECT 1 FROM class c WHERE c.id = l.class_id "
                + "AND (c.is_deleted = false OR c.is_deleted IS NULL)))", params));
        out.put("coursesWithoutLessons", count("SELECT COUNT(*) FROM course co JOIN department d ON d.id = co.dept_id AND d.college_id = :collegeId "
                + "WHERE (co.is_deleted = false OR co.is_deleted IS NULL) AND NOT EXISTS (SELECT 1 FROM lesson ls WHERE ls.course_id = co.id "
                + "AND (ls.is_deleted = false OR ls.is_deleted IS NULL))", params));
        return out;
    }

    /** Published quizzes closing in the next 7 days. */
    private Map<String, Object> dueThisWeek(MapSqlParameterSource params) {
        String from = " FROM quizzes q JOIN course co ON co.id = q.course_id AND (co.is_deleted = false OR co.is_deleted IS NULL) "
                + "JOIN department d ON d.id = co.dept_id AND d.college_id = :collegeId "
                + "LEFT JOIN class c ON c.id = q.class_id "
                + "WHERE q.status = 'PUBLISHED' AND (q.is_deleted = false OR q.is_deleted IS NULL) "
                + "AND (q.active = true OR q.active IS NULL) AND q.due_at >= :now AND q.due_at < :weekAhead ";
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("quizCount", count("SELECT COUNT(*)" + from, params));
        out.put("items", jdbc.queryForList("SELECT q.id AS quizId, q.title AS title, q.due_at AS dueAt, co.course_name AS courseName, "
                + "c.name AS className" + from + "ORDER BY q.due_at ASC LIMIT " + LIST_LIMIT, params));
        return out;
    }
}
