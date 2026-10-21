package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.model.Learner;
import com._42students.lms.model.LessonContents;
import com._42students.lms.repository.LearnerContentProgressRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.LessonContentsRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.test.util.ReflectionTestUtils;

import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AdminCourseProgressControllerTest {

    private AdminCourseProgressController controller;
    private LessonContentsRepository contents;
    private LearnerContentProgressRepository progress;
    private LearnerRepository learners;
    private NamedParameterJdbcTemplate jdbc;

    @BeforeEach
    void setUp() {
        controller = new AdminCourseProgressController();
        contents = mock(LessonContentsRepository.class);
        progress = mock(LearnerContentProgressRepository.class);
        learners = mock(LearnerRepository.class);
        jdbc = mock(NamedParameterJdbcTemplate.class);
        SecurityContextUtil security = mock(SecurityContextUtil.class);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(mock(UserPrincipal.class));
        ReflectionTestUtils.setField(controller, "lessonContentsRepository", contents);
        ReflectionTestUtils.setField(controller, "progressRepository", progress);
        ReflectionTestUtils.setField(controller, "learnerRepository", learners);
        ReflectionTestUtils.setField(controller, "accessControlService", mock(AccessControlService.class));
        ReflectionTestUtils.setField(controller, "securityContextUtil", security);
        ReflectionTestUtils.setField(controller, "jdbc", jdbc);
        // The course is taught in the class (CA-H01 check).
        when(jdbc.queryForObject(argThat((String sql) -> sql != null && sql.contains("faculty_teaching_assignment")),
                any(SqlParameterSource.class), eq(Boolean.class))).thenReturn(true);
    }

    @Test
    void courseNotTaughtInTheClassIsRefused() {
        when(jdbc.queryForObject(argThat((String sql) -> sql != null && sql.contains("faculty_teaching_assignment")),
                any(SqlParameterSource.class), eq(Boolean.class))).thenReturn(false);

        var response = controller.courseProgress(5, 9);

        org.junit.jupiter.api.Assertions.assertEquals(400, response.getStatusCodeValue());
        org.mockito.Mockito.verifyNoInteractions(learners);
    }

    private static LessonContents content(int id, String type) {
        LessonContents c = new LessonContents();
        c.setId(id);
        c.setContentType(type);
        c.setEnabled(true); // what students can see (real rows default to visible)
        c.setActive(true);
        return c;
    }

    private static Learner learner(int id) {
        Learner l = new Learner();
        l.setId(id);
        l.setFirstName("L" + id);
        return l;
    }

    /** Answers jdbc.query(sql containing marker, params, handler) with the given (learnerId, count) rows. */
    private void rows(String marker, long[][] data) throws Exception {
        doAnswer(inv -> {
            RowCallbackHandler handler = inv.getArgument(2);
            for (long[] row : data) {
                ResultSet rs = mock(ResultSet.class);
                when(rs.getInt(1)).thenReturn((int) row[0]);
                when(rs.getLong(2)).thenReturn(row[1]);
                handler.processRow(rs);
            }
            return null;
        }).when(jdbc).query(argThat((String sql) -> sql != null && sql.contains(marker)),
                any(SqlParameterSource.class), any(RowCallbackHandler.class));
    }

    /** BE-0130: content hidden from students (disabled or inactive) isn't counted against them. */
    @Test
    void hiddenContentIsNotInTheDenominator() throws Exception {
        LessonContents hidden = content(4, "video");
        hidden.setEnabled(false);
        LessonContents inactive = content(5, "assignment");
        inactive.setActive(false);
        when(contents.findIdsByCourseId(5)).thenReturn(List.of(1, 4, 5));
        when(contents.findByIdIn(anyList())).thenReturn(List.of(content(1, "video"), hidden, inactive));
        when(jdbc.queryForList(anyString(), any(SqlParameterSource.class), eq(Integer.class))).thenReturn(List.of());
        when(learners.getActiveStudentDetailsByClassId(9)).thenReturn(List.of(learner(100)));
        when(progress.countCompletedPerLearner(anyList())).thenReturn(new ArrayList<>());

        Map<String, Object> body = controller.courseProgress(5, 9).getBody().getData();

        assertEquals(1, body.get("measuredItemCount"));
        assertEquals(0, body.get("assignmentCount"));
    }

    @Test
    void progressCountsVideosAssignmentsAndQuizzesTogether() throws Exception {
        when(contents.findIdsByCourseId(5)).thenReturn(List.of(1, 2, 3));
        when(contents.findByIdIn(anyList())).thenReturn(List.of(content(1, "video"), content(2, "assignment"), content(3, "resource")));
        when(jdbc.queryForList(anyString(), any(SqlParameterSource.class), eq(Integer.class))).thenReturn(List.of(70, 71));
        when(learners.getActiveStudentDetailsByClassId(9)).thenReturn(List.of(learner(100), learner(101)));
        List<Object[]> videoRows = new ArrayList<>();
        videoRows.add(new Object[]{100, 1L});
        when(progress.countCompletedPerLearner(anyList())).thenReturn(videoRows);
        rows("student_assignment", new long[][]{{100, 1}});
        rows("quiz_attempts", new long[][]{{100, 2}, {101, 1}});

        Map<String, Object> body = controller.courseProgress(5, 9).getBody().getData();

        assertEquals(4, body.get("totalItemCount")); // 1 video + 1 assignment + 2 quizzes; resource excluded
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = (List<Map<String, Object>>) body.get("learners");
        Map<String, Object> behind = rows.get(0);
        Map<String, Object> ahead = rows.get(1);
        assertEquals(101, behind.get("learnerId"));
        assertEquals(25, behind.get("percent"));
        assertEquals(100, ahead.get("percent"));
        assertEquals(1L, ahead.get("assignmentsSubmitted"));
        assertEquals(2L, ahead.get("quizzesAttempted"));
        assertEquals(0, body.get("notStartedCount"));
    }

    @Test
    void courseWithOnlyQuizzesIsNoLongerReportedAsUnmeasurable() {
        when(contents.findIdsByCourseId(5)).thenReturn(List.of(3));
        when(contents.findByIdIn(anyList())).thenReturn(List.of(content(3, "resource")));
        when(jdbc.queryForList(anyString(), any(SqlParameterSource.class), eq(Integer.class))).thenReturn(List.of(70));
        when(learners.getActiveStudentDetailsByClassId(9)).thenReturn(List.of(learner(100)));

        Map<String, Object> body = controller.courseProgress(5, 9).getBody().getData();

        assertNull(body.get("note"));
        assertEquals(1, body.get("quizCount"));
        assertEquals(1, body.get("notStartedCount"));
    }

    @Test
    void nothingMeasurableSaysSoInsteadOfZeroPercent() {
        when(contents.findIdsByCourseId(5)).thenReturn(List.of(3));
        when(contents.findByIdIn(anyList())).thenReturn(List.of(content(3, "resource")));
        when(jdbc.queryForList(anyString(), any(SqlParameterSource.class), eq(Integer.class))).thenReturn(List.of());
        when(learners.getActiveStudentDetailsByClassId(9)).thenReturn(List.of(learner(100)));

        Map<String, Object> body = controller.courseProgress(5, 9).getBody().getData();

        assertTrue(String.valueOf(body.get("note")).contains("nothing measurable"));
    }
}
