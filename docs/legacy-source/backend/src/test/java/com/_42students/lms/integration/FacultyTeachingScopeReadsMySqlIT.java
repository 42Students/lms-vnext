package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.ResultMatcher;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Faculty audit F-016/F-017/F-032/F-051/F-094 (T-01, T-02): sensitive faculty reads need an active teaching assignment
 * for the course and class, not just a course/class in the same college. Admin faculty keep college-wide reads.
 */
@Transactional
@Rollback
class FacultyTeachingScopeReadsMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE = 106301;
    private static final int TEACHER = 106311;
    private static final int OTHER_FACULTY = 106312;
    private static final int ADMIN_FACULTY = 106313;
    private static final int DEPT = 106331;
    private static final int PROGRAM = 106341;
    private static final long BATCH = 106351L;
    private static final int CLASS_A = 106361;
    private static final int CLASS_B = 106362;
    private static final int COURSE = 106371;
    private static final int LESSON = 106381;
    private static final int ASSIGNMENT = 106391;

    private void seedBase() {
        seedCollege(COLLEGE, "Teaching Scope College");
        seedFaculty(TEACHER, COLLEGE, "Teacher");
        seedFaculty(OTHER_FACULTY, COLLEGE, "OtherFaculty");
        seedFaculty(ADMIN_FACULTY, COLLEGE, "AdminFaculty");
        seedDepartment(DEPT, COLLEGE, "Teaching Scope Dept");
        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) "
                + "values (?, 'Teaching Scope Program', ?, 4, 0)", PROGRAM, DEPT);
        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (?, 'Teaching Scope Batch', ?, 0, 1, '2026-27', 'ACTIVE', now(), now())", BATCH, PROGRAM);
        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Scope Section A', ?, ?, 60, 0, 'SECTION', 0)", CLASS_A, PROGRAM, BATCH);
        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Scope Section B', ?, ?, 60, 0, 'SECTION', 0)", CLASS_B, PROGRAM, BATCH);
        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'TSC', ?, 'Teaching Scope Course', 0, 1, 1, 1, 'teaching-scope-it', 0, 0)", COURSE, DEPT);
        jdbc.update("insert into semester (id, program_id, semester_number, name, is_active, total_credits, is_deleted) "
                + "values (106392, ?, 1, 'Semester 1', 1, 20, 0)", PROGRAM);
        jdbc.update("insert into semester_course (id, semester_id, course_id, is_mandatory, credits, course_order, is_deleted) "
                + "values (106393, 106392, ?, 1, 3, 1, 0)", COURSE);
        jdbc.update("insert into lesson (id, lesson_name, course_id, active, enabled, sequence, version, is_deleted) "
                + "values (?, 'Teaching Scope Lesson', ?, 1, 1, 1, 0, 0)", LESSON, COURSE);
        jdbc.update("insert into lesson_contents "
                        + "(id, lesson_id, course_id, class_id, sequence, content_type, content_title, content_data, active, enabled, points, version, is_deleted) "
                        + "values (?, ?, ?, ?, 1, 'assignment', 'Section A Assignment', "
                        + "JSON_OBJECT('allowed_submission_types', JSON_ARRAY('WRITTEN_RESPONSE')), 1, 1, 10, 0, 0)",
                ASSIGNMENT, LESSON, COURSE, CLASS_A);
        // TEACHER teaches the course in section A only; OTHER_FACULTY teaches nothing.
        jdbc.update("insert into faculty_teaching_assignment "
                        + "(id, faculty_id, course_id, class_id, batch_id, semester_number, academic_year, role, is_active, is_deleted) "
                        + "values (106394, ?, ?, ?, ?, 1, '2026-27', 'PRIMARY', 1, 0)",
                TEACHER, COURSE, CLASS_A, BATCH);
    }

    private String token(int facultyId, String facultyType) {
        return "Bearer " + accessToken(facultyPrincipal(facultyId, facultyType, COLLEGE));
    }

    private void expectAllReads(String auth, ResultMatcher expected) throws Exception {
        mvc.perform(get("/api/v1/discussion/fetchDiscussion").param("lessonContentId", "" + ASSIGNMENT)
                .header("Authorization", auth)).andExpect(expected);
        mvc.perform(get("/api/v1/classroom/messages").param("courseId", "" + COURSE).param("classId", "" + CLASS_A)
                .header("Authorization", auth)).andExpect(expected);
        mvc.perform(get("/api/v1/assignment/fetchSubmissions").param("lessonContentId", "" + ASSIGNMENT)
                .header("Authorization", auth)).andExpect(expected);
        mvc.perform(get("/api/v1/assignment/submissionStats").param("lessonContentId", "" + ASSIGNMENT)
                .header("Authorization", auth)).andExpect(expected);
        for (String path : new String[]{"fetchSpecificLessonContents", "fetchSpecificLessonContentsMetrics", "fetchSpecificLessonContentsGrades"}) {
            mvc.perform(get("/api/v1/lesson/contents/" + path).param("lessonId", "" + LESSON).param("classId", "" + CLASS_A)
                    .header("Authorization", auth)).andExpect(expected);
        }
    }

    @Test
    void facultyWhoDoesNotTeachTheCourseCannotReadItsOperationalData() throws Exception {
        seedBase();
        expectAllReads(token(OTHER_FACULTY, "LECTURER"), status().isForbidden());
    }

    @Test
    void facultyWhoTeachesTheSectionReadsEverything() throws Exception {
        seedBase();
        expectAllReads(token(TEACHER, "LECTURER"), status().isOk());
    }

    @Test
    void adminFacultyKeepsCollegeWideReads() throws Exception {
        seedBase();
        expectAllReads(token(ADMIN_FACULTY, "ADMIN"), status().isOk());
    }

    @Test
    void teachingOneSectionDoesNotOpenAnotherSectionOfTheSameCourse() throws Exception {
        seedBase();
        String auth = token(TEACHER, "LECTURER");
        mvc.perform(get("/api/v1/classroom/messages").param("courseId", "" + COURSE).param("classId", "" + CLASS_B)
                .header("Authorization", auth)).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/lesson/contents/fetchSpecificLessonContentsGrades").param("lessonId", "" + LESSON)
                .param("classId", "" + CLASS_B).header("Authorization", auth)).andExpect(status().isForbidden());
    }

    @Test
    void bulkSubmissionStatsLeaveOutAssignmentsTheFacultyDoesNotTeach() throws Exception {
        seedBase();
        String other = mvc.perform(get("/api/v1/assignment/submissionStats/bulk").param("lessonContentIds", "" + ASSIGNMENT)
                        .header("Authorization", token(OTHER_FACULTY, "LECTURER")))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertFalse(other.contains("\"" + ASSIGNMENT + "\""), other);
        String mine = mvc.perform(get("/api/v1/assignment/submissionStats/bulk").param("lessonContentIds", "" + ASSIGNMENT)
                        .header("Authorization", token(TEACHER, "LECTURER")))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertTrue(mine.contains("\"" + ASSIGNMENT + "\""), mine);
    }

    @Test
    void contentOwnerStillReadsSubmissionsOfTheirOwnAssignment() throws Exception {
        seedBase();
        jdbc.update("update lesson_contents set faculty_id = ? where id = ?", OTHER_FACULTY, ASSIGNMENT);
        mvc.perform(get("/api/v1/assignment/fetchSubmissions").param("lessonContentId", "" + ASSIGNMENT)
                .header("Authorization", token(OTHER_FACULTY, "LECTURER"))).andExpect(status().isOk());
    }
}
