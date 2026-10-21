package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * College-admin attendance corrections through the real service/repository path. Covers the
 * soft-delete/revive uniqueness edge that historically made a corrected learner impossible to
 * mark absent again for the same session.
 */
@Transactional
@Rollback
class AdminAttendanceCorrectionMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 101401;
    private static final int COLLEGE_B = 101402;
    private static final int ADMIN_A = 101411;
    private static final int LEARNER_A = 101421;
    private static final int LEARNER_B = 101422;
    private static final int DEPT_A = 101431;
    private static final int DEPT_B = 101432;
    private static final int PROGRAM_A = 101441;
    private static final int PROGRAM_B = 101442;
    private static final int CLASS_A = 101451;
    private static final int CLASS_B = 101452;
    private static final int COURSE_A = 101461;
    private static final int COURSE_B = 101462;
    private static final int SCHEDULE_A = 101471;
    private static final int SCHEDULE_B = 101472;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Attendance College A");
        seedCollege(COLLEGE_B, "Attendance College B");
        seedFaculty(ADMIN_A, COLLEGE_A, "AttendanceAdmin");
        seedLearner(LEARNER_A, COLLEGE_A, "AttendanceLearnerA");
        seedLearner(LEARNER_B, COLLEGE_B, "AttendanceLearnerB");
        // Prevent asynchronous SMS delivery attempts from being part of these integration tests.
        jdbc.update("update learner set contact_mobile = null where id in (?, ?)", LEARNER_A, LEARNER_B);

        seedDepartment(DEPT_A, COLLEGE_A, "Attendance Dept A");
        seedDepartment(DEPT_B, COLLEGE_B, "Attendance Dept B");
        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Attendance Program A', ?, 4, 0)",
                PROGRAM_A, DEPT_A);
        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Attendance Program B', ?, 4, 0)",
                PROGRAM_B, DEPT_B);

        jdbc.update("insert into class (id, name, program_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Attendance Section A', ?, 60, 0, 'SECTION', 0)", CLASS_A, PROGRAM_A);
        jdbc.update("insert into class (id, name, program_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Attendance Section B', ?, 60, 0, 'SECTION', 0)", CLASS_B, PROGRAM_B);

        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'ATA', ?, 'Attendance Course A', 0, 1, 1, 1, 'attendance-course-a-it', 0, 0)", COURSE_A, DEPT_A);
        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'ATB', ?, 'Attendance Course B', 0, 1, 1, 1, 'attendance-course-b-it', 0, 0)", COURSE_B, DEPT_B);

        jdbc.update("update learner set program_id = ?, class_id = ? where id = ?", PROGRAM_A, CLASS_A, LEARNER_A);
        jdbc.update("update learner set program_id = ?, class_id = ? where id = ?", PROGRAM_B, CLASS_B, LEARNER_B);

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        String start = LocalDateTime.now().minusDays(2).withMinute(0).withSecond(0).withNano(0).format(fmt);
        String end = LocalDateTime.now().minusDays(2).plusHours(1).withMinute(0).withSecond(0).withNano(0).format(fmt);
        jdbc.update("insert into class_schedule "
                        + "(id, class_id, course_id, faculty_id, start_time, end_time, lecture_hall_id, title, is_deleted) "
                        + "values (?, ?, ?, ?, ?, ?, 0, 'Attendance IT A', 0)",
                SCHEDULE_A, CLASS_A, COURSE_A, ADMIN_A, start, end);
        jdbc.update("insert into class_schedule "
                        + "(id, class_id, course_id, faculty_id, start_time, end_time, lecture_hall_id, title, is_deleted) "
                        + "values (?, ?, ?, ?, ?, ?, 0, 'Attendance IT B', 0)",
                SCHEDULE_B, CLASS_B, COURSE_B, ADMIN_A, start, end);
    }

    private String adminToken() {
        return accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));
    }

    private String learnerToken() {
        return accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));
    }

    @Test
    void adminCanMarkAbsentCorrectToPresentAndMarkAbsentAgainWithoutDuplicateRow() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/admin/attendance/mark-absent")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .param("status", "EXCUSED")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"student_id\":\"" + LEARNER_A + "\",\"class_schedule_id\":" + SCHEDULE_A + "}"))
                .andExpect(status().isOk());

        Integer attendanceId = jdbc.queryForObject(
                "select id from attend where student_id = ? and class_schedule_id = ?",
                Integer.class, String.valueOf(LEARNER_A), SCHEDULE_A);
        assertNotNull(attendanceId);
        assertEquals(ADMIN_A, jdbc.queryForObject(
                "select marked_by from attend where id = ?", Integer.class, attendanceId));
        assertEquals("EXCUSED", jdbc.queryForObject(
                "select attendance_status from attend where id = ?", String.class, attendanceId));
        assertEquals(0, jdbc.queryForObject(
                "select is_deleted from attend where id = ?", Integer.class, attendanceId));

        mvc.perform(post("/api/v1/admin/attendance/mark-present")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .param("studentId", String.valueOf(LEARNER_A))
                        .param("classScheduleId", String.valueOf(SCHEDULE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());

        assertEquals(1, jdbc.queryForObject(
                "select is_deleted from attend where id = ?", Integer.class, attendanceId));

        // Must revive the same unique (student_id, class_schedule_id) row, not attempt a second insert.
        mvc.perform(post("/api/v1/admin/attendance/mark-absent")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .param("status", "LATE")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"student_id\":\"" + LEARNER_A + "\",\"class_schedule_id\":" + SCHEDULE_A + "}"))
                .andExpect(status().isOk());

        assertEquals(1, jdbc.queryForObject(
                "select count(*) from attend where student_id = ? and class_schedule_id = ?",
                Integer.class, String.valueOf(LEARNER_A), SCHEDULE_A));
        assertEquals(0, jdbc.queryForObject(
                "select is_deleted from attend where id = ?", Integer.class, attendanceId));
        assertEquals("LATE", jdbc.queryForObject(
                "select attendance_status from attend where id = ?", String.class, attendanceId));
    }

    @Test
    void adminCannotUseOwnCollegeParameterWithForeignClassSchedule() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/admin/attendance/mark-absent")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"student_id\":\"" + LEARNER_B + "\",\"class_schedule_id\":" + SCHEDULE_B + "}"))
                .andExpect(status().isForbidden());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from attend where class_schedule_id = ?",
                Integer.class, SCHEDULE_B));
    }

    @Test
    void adminCorrectionCannotMarkFutureClassAbsentEvenThoughCorrectionWindowIsBypassed() throws Exception {
        seedBase();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        jdbc.update("update class_schedule set start_time = ?, end_time = ? where id = ?",
                LocalDateTime.now().plusHours(2).withSecond(0).withNano(0).format(fmt),
                LocalDateTime.now().plusHours(3).withSecond(0).withNano(0).format(fmt),
                SCHEDULE_A);

        mvc.perform(post("/api/v1/admin/attendance/mark-absent")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"student_id\":\"" + LEARNER_A + "\",\"class_schedule_id\":" + SCHEDULE_A + "}"))
                .andExpect(status().isBadRequest());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from attend where class_schedule_id = ?",
                Integer.class, SCHEDULE_A));
    }

    @Test
    void deletedScheduleCannotBeUsedForAttendanceCorrection() throws Exception {
        seedBase();
        jdbc.update("update class_schedule set is_deleted = 1 where id = ?", SCHEDULE_A);

        mvc.perform(post("/api/v1/admin/attendance/mark-absent")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"student_id\":\"" + LEARNER_A + "\",\"class_schedule_id\":" + SCHEDULE_A + "}"))
                .andExpect(status().isBadRequest());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from attend where class_schedule_id = ?",
                Integer.class, SCHEDULE_A));
    }

    @Test
    void malformedScheduleTimeFailsClosedInsteadOfCreatingAttendance() throws Exception {
        seedBase();
        jdbc.update("update class_schedule set start_time = 'not-a-date' where id = ?", SCHEDULE_A);

        mvc.perform(post("/api/v1/admin/attendance/mark-absent")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"student_id\":\"" + LEARNER_A + "\",\"class_schedule_id\":" + SCHEDULE_A + "}"))
                .andExpect(status().isBadRequest());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from attend where class_schedule_id = ?",
                Integer.class, SCHEDULE_A));
    }

    @Test
    void learnerCannotUseAdminAttendanceCorrectionSurface() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/admin/attendance/mark-absent")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + learnerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"student_id\":\"" + LEARNER_A + "\",\"class_schedule_id\":" + SCHEDULE_A + "}"))
                .andExpect(status().isForbidden());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from attend where class_schedule_id = ?",
                Integer.class, SCHEDULE_A));
    }

    @Test
    void invalidAttendanceStatusIsRejectedBeforeMutation() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/admin/attendance/mark-absent")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .param("status", "VACATION")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"student_id\":\"" + LEARNER_A + "\",\"class_schedule_id\":" + SCHEDULE_A + "}"))
                .andExpect(status().isBadRequest());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from attend where class_schedule_id = ?",
                Integer.class, SCHEDULE_A));
    }
}
