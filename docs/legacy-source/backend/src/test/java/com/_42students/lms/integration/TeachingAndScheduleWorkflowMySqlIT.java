package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Teaching assignment and timetable integration. These mappings are shared inputs to Courses,
 * Quizzes, Attendance and faculty workload, so tenant and conflict mistakes have broad blast radius.
 */
@Transactional
@Rollback
class TeachingAndScheduleWorkflowMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 101801;
    private static final int COLLEGE_B = 101802;
    private static final int ADMIN_A = 101811;
    private static final int LEARNER_A = 101821;
    private static final int FACULTY_A = 101812;
    private static final int FACULTY_B = 101813;
    private static final int DEPT_A = 101831;
    private static final int DEPT_B = 101832;
    private static final int PROGRAM_A = 101841;
    private static final int PROGRAM_B = 101842;
    private static final int BATCH_A = 101851;
    private static final int BATCH_B = 101852;
    private static final int CLASS_A = 101861;
    private static final int CLASS_B = 101862;
    private static final int COURSE_A = 101871;
    private static final int COURSE_B = 101872;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Teaching College A");
        seedCollege(COLLEGE_B, "Teaching College B");
        seedFaculty(ADMIN_A, COLLEGE_A, "TeachingAdmin");
        seedLearner(LEARNER_A, COLLEGE_A, "TeachingLearner");
        seedFaculty(FACULTY_A, COLLEGE_A, "FacultyA");
        seedFaculty(FACULTY_B, COLLEGE_B, "FacultyB");
        seedDepartment(DEPT_A, COLLEGE_A, "Teaching Dept A");
        seedDepartment(DEPT_B, COLLEGE_B, "Teaching Dept B");

        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Teaching Program A', ?, 4, 0)",
                PROGRAM_A, DEPT_A);
        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Teaching Program B', ?, 4, 0)",
                PROGRAM_B, DEPT_B);
        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (?, 'Teaching Batch A', ?, 0, 1, '2026-27', 'ACTIVE', now(), now())", BATCH_A, PROGRAM_A);
        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (?, 'Teaching Batch B', ?, 0, 1, '2026-27', 'ACTIVE', now(), now())", BATCH_B, PROGRAM_B);

        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Teaching Section A', ?, ?, 60, 0, 'SECTION', 0)", CLASS_A, PROGRAM_A, BATCH_A);
        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Teaching Section B', ?, ?, 60, 0, 'SECTION', 0)", CLASS_B, PROGRAM_B, BATCH_B);

        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'TCA', ?, 'Teaching Course A', 0, 1, 1, 1, 'teaching-course-a-it', 0, 0)", COURSE_A, DEPT_A);
        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'TCB', ?, 'Teaching Course B', 0, 1, 1, 1, 'teaching-course-b-it', 0, 0)", COURSE_B, DEPT_B);

        // TeachingAssignmentScopeValidator requires the assignment's semester to exist in the class's program.
        jdbc.update("insert into semester (id, program_id, semester_number, name, is_active, total_credits, is_deleted) "
                + "values (101881, ?, 1, 'Teaching Semester A', 1, 20, 0)", PROGRAM_A);
        jdbc.update("insert into semester (id, program_id, semester_number, name, is_active, total_credits, is_deleted) "
                + "values (101882, ?, 1, 'Teaching Semester B', 1, 20, 0)", PROGRAM_B);
    }

    private String adminToken() {
        return accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));
    }

    private String time(LocalDateTime value) {
        return value.withSecond(0).withNano(0).format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    private String scheduleBody(int classId, int facultyId, int courseId, LocalDateTime start, LocalDateTime end) {
        return "{\"class_id\":" + classId + ",\"faculty_id\":" + facultyId + ",\"course_id\":" + courseId
                + ",\"start_time\":\"" + time(start) + "\",\"end_time\":\"" + time(end)
                + "\",\"lecture_hall_id\":0,\"title\":\"Integration Session\"}";
    }

    @Test
    void adminCreatesTeachingAssignmentAndItIsVisibleByClass() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/teaching-assignment/create")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"faculty_id\":" + FACULTY_A + ",\"course_id\":" + COURSE_A
                                + ",\"class_id\":" + CLASS_A + ",\"batch_id\":" + BATCH_A
                                + ",\"semester_number\":1,\"academic_year\":\"2026-27\","
                                + "\"role\":\"PRIMARY\",\"is_active\":true}"))
                .andExpect(status().isCreated());

        assertEquals(1, jdbc.queryForObject(
                "select count(*) from faculty_teaching_assignment where faculty_id = ? and course_id = ? and class_id = ? and is_active = 1",
                Integer.class, FACULTY_A, COURSE_A, CLASS_A));

        String body = mvc.perform(get("/api/v1/teaching-assignment/byClass/" + CLASS_A)
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(body.contains("FacultyA"), body);
        assertTrue(body.contains("Teaching Course A"), body);
    }

    @Test
    void teachingAssignmentCannotReferenceForeignCollegeFacultyOrCourse() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/teaching-assignment/create")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"faculty_id\":" + FACULTY_B + ",\"course_id\":" + COURSE_A
                                + ",\"class_id\":" + CLASS_A + ",\"batch_id\":" + BATCH_A
                                + ",\"semester_number\":1}"))
                // TeachingAssignmentScopeValidator rejects a foreign-college faculty/course as invalid input
                // (IllegalArgumentException -> writeError -> 400); nothing is written either way.
                .andExpect(status().isBadRequest());

        mvc.perform(post("/api/v1/teaching-assignment/create")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"faculty_id\":" + FACULTY_A + ",\"course_id\":" + COURSE_B
                                + ",\"class_id\":" + CLASS_A + ",\"batch_id\":" + BATCH_A
                                + ",\"semester_number\":1}"))
                .andExpect(status().isBadRequest());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from faculty_teaching_assignment where class_id = ?",
                Integer.class, CLASS_A));
    }

    @Test
    void validFutureClassSchedulePersistsAndOverlappingSessionIsRejected() throws Exception {
        seedBase();
        LocalDateTime start = LocalDateTime.now().plusDays(2).withHour(10).withMinute(0);
        LocalDateTime end = start.plusHours(1);

        mvc.perform(post("/api/v1/scheduleClass/create")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scheduleBody(CLASS_A, FACULTY_A, COURSE_A, start, end)))
                .andExpect(status().isOk());

        assertEquals(1, jdbc.queryForObject(
                "select count(*) from class_schedule where class_id = ? and faculty_id = ? and is_deleted = 0",
                Integer.class, CLASS_A, FACULTY_A));

        mvc.perform(post("/api/v1/scheduleClass/create")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scheduleBody(CLASS_A, FACULTY_A, COURSE_A,
                                start.plusMinutes(30), end.plusMinutes(30))))
                .andExpect(status().isBadRequest());

        assertEquals(1, jdbc.queryForObject(
                "select count(*) from class_schedule where class_id = ? and is_deleted = 0",
                Integer.class, CLASS_A));
    }

    @Test
    void scheduleRejectsMoreThanTwelveHoursAndCrossCollegeFaculty() throws Exception {
        seedBase();
        LocalDateTime start = LocalDateTime.now().plusDays(3).withHour(6).withMinute(0);

        mvc.perform(post("/api/v1/scheduleClass/create")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scheduleBody(CLASS_A, FACULTY_A, COURSE_A, start, start.plusHours(13))))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/api/v1/scheduleClass/create")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scheduleBody(CLASS_A, FACULTY_B, COURSE_A, start, start.plusHours(1))))
                .andExpect(status().isBadRequest());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from class_schedule where class_id = ?",
                Integer.class, CLASS_A));
    }

    @Test
    void deletingScheduleSoftDeletesItInsteadOfDestroyingAttendanceAnchor() throws Exception {
        seedBase();
        LocalDateTime start = LocalDateTime.now().plusDays(4).withHour(10).withMinute(0);

        mvc.perform(post("/api/v1/scheduleClass/create")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scheduleBody(CLASS_A, FACULTY_A, COURSE_A, start, start.plusHours(1))))
                .andExpect(status().isOk());

        Integer id = jdbc.queryForObject(
                "select id from class_schedule where class_id = ? and faculty_id = ? and is_deleted = 0",
                Integer.class, CLASS_A, FACULTY_A);

        mvc.perform(delete("/api/v1/scheduleClass/delete/" + id)
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());

        assertEquals(1, jdbc.queryForObject(
                "select count(*) from class_schedule where id = ?", Integer.class, id));
        assertEquals(1, jdbc.queryForObject(
                "select is_deleted from class_schedule where id = ?", Integer.class, id));
    }

    @Test
    void learnerCannotCreateTeachingAssignmentsOrClassSchedules() throws Exception {
        seedBase();
        String learner = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));

        mvc.perform(post("/api/v1/teaching-assignment/create")
                        .header("Authorization", "Bearer " + learner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"faculty_id\":" + FACULTY_A + ",\"course_id\":" + COURSE_A
                                + ",\"class_id\":" + CLASS_A + ",\"semester_number\":1}"))
                .andExpect(status().isForbidden());

        LocalDateTime start = LocalDateTime.now().plusDays(5).withHour(10).withMinute(0);
        mvc.perform(post("/api/v1/scheduleClass/create")
                        .header("Authorization", "Bearer " + learner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scheduleBody(CLASS_A, FACULTY_A, COURSE_A, start, start.plusHours(1))))
                .andExpect(status().isForbidden());
    }
}
