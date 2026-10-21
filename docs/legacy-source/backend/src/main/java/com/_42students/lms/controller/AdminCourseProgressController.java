package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.Learner;
import com._42students.lms.security.UserPrincipal;
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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Course module audit, pass 2: how far a class has actually got through a course.
 *
 * <p>The console could create courses, lessons and content, grade assignments and export
 * submissions — and could not answer the first question anyone asks about a course in progress:
 * is this class keeping up? Progress data existed per learner per content item and was read only
 * by the learner's own screens. There was no aggregate anywhere, in any endpoint, so the question
 * had no product answer at all.
 *
 * <p>Counts completions of *timed* content only — video and youtube. Those are the items where
 * "completed" is measured rather than self-reported: a PDF is marked done by the learner clicking
 * a button, so including it would mix a measurement with a claim and quietly flatter the numbers.
 */
@RestController
@RequestMapping("/api/v1/admin/course-progress")
@Slf4j
@Api(tags = "Admin Course Progress")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class AdminCourseProgressController extends BaseController {

    /** Content types whose completion is measured rather than self-asserted. */
    private static final List<String> MEASURED_TYPES = List.of("video", "youtube");

    @Autowired
    private com._42students.lms.repository.LessonContentsRepository lessonContentsRepository;

    @Autowired
    private com._42students.lms.repository.LearnerContentProgressRepository progressRepository;

    @Autowired
    private com._42students.lms.repository.LearnerRepository learnerRepository;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    // Graded work is measured too: a quiz attempt or an assignment submission is a recorded fact,
    // not a self-report. Video-only progress showed nearly every learner at 0% (prod had ~250
    // progress rows for 240 videos) while their quizzes and submissions were invisible here.
    @Autowired(required = false)
    private NamedParameterJdbcTemplate jdbc;

    /** Published quizzes of the course that this class can see (shared, or targeted at it). */
    private static final String CLASS_QUIZZES_SQL = "SELECT q.id FROM quizzes q WHERE q.course_id = :courseId "
            + "AND (q.class_id IS NULL OR q.class_id < 1 OR q.class_id = :classId) "
            + "AND q.status = 'PUBLISHED' AND (q.active = true OR q.active IS NULL) "
            + "AND (q.enabled = true OR q.enabled IS NULL) AND (q.is_deleted = false OR q.is_deleted IS NULL)";

    private Map<Integer, Long> countPerLearner(String sql, MapSqlParameterSource params) {
        Map<Integer, Long> out = new HashMap<>();
        if (jdbc == null) return out;
        jdbc.query(sql, params, rs -> {
            out.put(rs.getInt(1), rs.getLong(2));
        });
        return out;
    }

    @GetMapping
    @ApiOperation(value = "How far a class has got through a course",
            notes = "Per-learner completion across the course's measured work: videos completed, assignments submitted, quizzes attempted. "
                    + "Counts each learner's current attempt only.")
    public ResponseEntity<Response<Map<String, Object>>> courseProgress(
            @RequestParam Integer courseId,
            @RequestParam Integer classId) {
        if (courseId == null || courseId <= 0) {
            return bad("courseId is required");
        }
        if (classId == null || classId <= 0) {
            return bad("classId is required");
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity<>(new Response<>(HttpStatus.UNAUTHORIZED.name(),
                    "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        // Both, because this joins one course's content to one class's roster: authorising only
        // the course would expose any class's learners, and only the class would expose any course.
        accessControlService.requireAccessCourse(principal, courseId);
        accessControlService.requireAccessClass(principal, classId);
        // College admin audit CA-H01: course and class were each checked on their own, so any course could be reported
        // against any class of the college. The course must be (or have been) taught in this class: the same teaching
        // assignment rows the page already uses to list a class's courses.
        if (jdbc != null && !Boolean.TRUE.equals(jdbc.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM faculty_teaching_assignment WHERE course_id = :courseId AND class_id = :classId "
                        + "AND (is_deleted = false OR is_deleted IS NULL))",
                new MapSqlParameterSource("courseId", courseId).addValue("classId", classId), Boolean.class))) {
            return bad("This course is not taught in this class");
        }

        // Only content this class can see: shared content (no class) or content targeted at this class. Content made for
        // another section counted in the denominator and made this class look behind (CA-H01), while quizzes were
        // already filtered the same way.
        List<com._42students.lms.model.LessonContents> allContent =
                lessonContentsRepository.findByIdIn(lessonContentsRepository.findIdsByCourseId(courseId)).stream()
                        .filter(c -> c.getClassId() == null || c.getClassId() < 1 || c.getClassId().equals(classId))
                        // BE-0130: hidden (disabled or inactive) content isn't shown to students, so it isn't counted against them.
                        .filter(c -> c.isEnabled() && c.isActive())
                        .collect(java.util.stream.Collectors.toList());
        List<Integer> measuredIds = new ArrayList<>();
        for (com._42students.lms.model.LessonContents c : allContent) {
            String type = c.getContentType() != null ? c.getContentType().toLowerCase() : "";
            if (MEASURED_TYPES.contains(type)) {
                measuredIds.add(c.getId());
            }
        }

        List<Learner> roster = learnerRepository.getActiveStudentDetailsByClassId(classId);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("courseId", courseId);
        out.put("classId", classId);
        out.put("measuredItemCount", measuredIds.size());
        out.put("learnerCount", roster.size());

        List<Integer> assignmentIds = new ArrayList<>();
        for (com._42students.lms.model.LessonContents c : allContent) {
            String type = c.getContentType() != null ? c.getContentType().toLowerCase() : "";
            if ("assignment".equals(type)) assignmentIds.add(c.getId());
        }
        List<Integer> quizIds = jdbc == null ? List.of()
                : jdbc.queryForList(CLASS_QUIZZES_SQL,
                        new MapSqlParameterSource("courseId", courseId).addValue("classId", classId), Integer.class);
        out.put("assignmentCount", assignmentIds.size());
        out.put("quizCount", quizIds.size());
        int totalItems = measuredIds.size() + assignmentIds.size() + quizIds.size();
        out.put("totalItemCount", totalItems);

        if (totalItems == 0 || roster.isEmpty()) {
            // Said explicitly rather than returning 0% for everyone, which would read as "nobody
            // has done anything" when the truth is "there is nothing to measure".
            out.put("learners", List.of());
            out.put("averagePercent", null);
            out.put("note", totalItems == 0
                    ? "This course has no videos, assignments or quizzes for this class yet, so there is nothing measurable to report."
                    : "This class has no active learners.");
            return ok(out);
        }

        List<Integer> rosterIds = new ArrayList<>();
        for (Learner l : roster) rosterIds.add(l.getId());

        Map<Integer, Long> completedByLearner = new HashMap<>();
        if (!measuredIds.isEmpty()) {
            for (Object[] row : progressRepository.countCompletedPerLearner(measuredIds)) {
                if (row == null || row.length < 2 || row[0] == null) continue;
                completedByLearner.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
            }
        }
        Map<Integer, Long> submittedByLearner = assignmentIds.isEmpty() ? Map.of() : countPerLearner(
                "SELECT student_id, COUNT(DISTINCT lesson_content_id) FROM student_assignment "
                        + "WHERE lesson_content_id IN (:ids) AND student_id IN (:learners) "
                        + "AND (is_deleted = false OR is_deleted IS NULL) GROUP BY student_id",
                new MapSqlParameterSource("ids", assignmentIds).addValue("learners", rosterIds));
        Map<Integer, Long> attemptedByLearner = quizIds.isEmpty() ? Map.of() : countPerLearner(
                "SELECT learner_id, COUNT(DISTINCT quiz_id) FROM quiz_attempts "
                        + "WHERE quiz_id IN (:ids) AND learner_id IN (:learners) AND submitted_at IS NOT NULL "
                        + "AND (is_deleted = false OR is_deleted IS NULL) GROUP BY learner_id",
                new MapSqlParameterSource("ids", quizIds).addValue("learners", rosterIds));

        List<Map<String, Object>> learners = new ArrayList<>();
        long totalPercent = 0;
        int notStarted = 0;
        for (Learner l : roster) {
            // Each count is clamped: content deleted after a learner finished it would otherwise
            // push the count past the current item count and the percentage above 100.
            long videos = Math.min(completedByLearner.getOrDefault(l.getId(), 0L), measuredIds.size());
            long assignments = Math.min(submittedByLearner.getOrDefault(l.getId(), 0L), assignmentIds.size());
            long quizzes = Math.min(attemptedByLearner.getOrDefault(l.getId(), 0L), quizIds.size());
            long done = videos + assignments + quizzes;
            int percent = (int) Math.round(100.0 * done / totalItems);
            if (done == 0) notStarted++;
            totalPercent += percent;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("learnerId", l.getId());
            row.put("name", ((l.getFirstName() != null ? l.getFirstName() : "") + " "
                    + (l.getLastName() != null ? l.getLastName() : "")).trim());
            row.put("rollNumber", l.getRollNumber());
            row.put("completed", done);
            row.put("videosCompleted", videos);
            row.put("assignmentsSubmitted", assignments);
            row.put("quizzesAttempted", quizzes);
            row.put("percent", percent);
            learners.add(row);
        }
        learners.sort((a, b) -> Integer.compare((int) a.get("percent"), (int) b.get("percent")));

        out.put("learners", learners);
        out.put("averagePercent", (int) Math.round((double) totalPercent / roster.size()));
        out.put("notStartedCount", notStarted);
        return ok(out);
    }

    private ResponseEntity<Response<Map<String, Object>>> ok(Map<String, Object> body) {
        return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), body), HttpStatus.OK);
    }

    private ResponseEntity<Response<Map<String, Object>>> bad(String message) {
        return new ResponseEntity<>(new Response<>("error", message, null), HttpStatus.BAD_REQUEST);
    }
}
