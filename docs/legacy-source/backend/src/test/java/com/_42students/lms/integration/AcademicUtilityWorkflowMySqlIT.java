package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

import static java.time.DayOfWeek.MONDAY;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Residual academic utilities: lecture halls, recurring schedules, faculty-course associations,
 * choices, and skills.
 */
@Transactional
@Rollback
class AcademicUtilityWorkflowMySqlIT extends AbstractMySqlHttpIT {

    /** The class-level transaction spans MockMvc calls; JdbcTemplate reads do not auto-flush JPA updates. */
    @javax.persistence.PersistenceContext
    private javax.persistence.EntityManager entityManager;

    private static final int COLLEGE_A = 109001;
    private static final int COLLEGE_B = 109002;
    private static final int ADMIN_A = 109011;
    private static final int FACULTY_A = 109012;
    private static final int LEARNER_A = 109021;
    private static final int LEARNER_FOREIGN = 109022;
    private static final int DEPT_A = 109031;
    private static final int DEPT_B = 109032;
    private static final int PROGRAM_A = 109041;
    private static final int PROGRAM_B = 109042;
    private static final long BATCH_A = 109051L;
    private static final long BATCH_B = 109052L;
    private static final int CLASS_A = 109061;
    private static final int CLASS_B = 109062;
    private static final int COURSE_A = 109071;
    private static final int COURSE_B = 109072;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Academic Utility College A");
        seedCollege(COLLEGE_B, "Academic Utility College B");
        seedFaculty(ADMIN_A, COLLEGE_A, "UtilityAdmin");
        seedFaculty(FACULTY_A, COLLEGE_A, "UtilityFaculty");
        seedLearner(LEARNER_A, COLLEGE_A, "UtilityLearnerA");
        seedLearner(LEARNER_FOREIGN, COLLEGE_B, "UtilityLearnerForeign");
        seedDepartment(DEPT_A, COLLEGE_A, "Utility Dept A");
        seedDepartment(DEPT_B, COLLEGE_B, "Utility Dept B");

        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Utility Program A', ?, 4, 0)",
                PROGRAM_A, DEPT_A);
        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Utility Program B', ?, 4, 0)",
                PROGRAM_B, DEPT_B);
        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (?, 'Utility Batch A', ?, 1, 1, '2026-27', 'ACTIVE', now(), now())", BATCH_A, PROGRAM_A);
        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (?, 'Utility Batch B', ?, 1, 1, '2026-27', 'ACTIVE', now(), now())", BATCH_B, PROGRAM_B);
        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Utility Section A', ?, ?, 60, 0, 'SECTION', 0)", CLASS_A, PROGRAM_A, BATCH_A);
        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Utility Section B', ?, ?, 60, 0, 'SECTION', 0)", CLASS_B, PROGRAM_B, BATCH_B);
        jdbc.update("update learner set program_id = ?, class_id = ?, department = 'CSE' where id = ?",
                PROGRAM_A, CLASS_A, LEARNER_A);
        jdbc.update("update learner set program_id = ?, class_id = ?, department = 'ECE' where id = ?",
                PROGRAM_B, CLASS_B, LEARNER_FOREIGN);

        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'UTA', ?, 'Utility Course A', 0, 1, 1, 1, 'utility-course-a-it', 0, 0)", COURSE_A, DEPT_A);
        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'UTB', ?, 'Utility Course B', 0, 1, 1, 1, 'utility-course-b-it', 0, 0)", COURSE_B, DEPT_B);

        jdbc.update("insert into learner_academic_record "
                + "(learner_id, passing_year, source) values (?, 2027, 'VERIFIED')", LEARNER_A);
        jdbc.update("insert into learner_academic_record "
                + "(learner_id, passing_year, source) values (?, 2030, 'VERIFIED')", LEARNER_FOREIGN);
    }

    private String adminToken() {
        return accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));
    }

    @Test
    void lectureHallCreateAndListAreCollegeScoped() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/lectureHall/create")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"college_id\":" + COLLEGE_A + ",\"dept_id\":" + DEPT_A
                                + ",\"name\":\"Integration Hall\",\"capacity\":80,"
                                + "\"description\":\"Main hall\",\"room_type\":\"LECTURE_HALL\"}"))
                .andExpect(status().isOk());

        Integer id = jdbc.queryForObject(
                "select id from lecture_hall where college_id = ? and name = 'Integration Hall' and is_deleted = 0",
                Integer.class, COLLEGE_A);

        String body = mvc.perform(get("/api/v1/lectureHall/fetchByCollege")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(body.contains("Integration Hall"), body);

        mvc.perform(get("/api/v1/lectureHall/fetch/" + id)
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());

        mvc.perform(get("/api/v1/lectureHall/fetchByCollege")
                        .param("collegeId", String.valueOf(COLLEGE_B))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isForbidden());
    }

    @Test
    void recurringScheduleCreatesOnlyRequestedWeekdaysAndRejectsInvertedRange() throws Exception {
        seedBase();
        LocalDate monday = LocalDate.now().plusWeeks(1).with(TemporalAdjusters.nextOrSame(MONDAY));
        LocalDate end = monday.plusWeeks(2);

        mvc.perform(post("/api/v1/admin/class-schedule/recurring")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"classId\":" + CLASS_A + ",\"courseId\":" + COURSE_A
                                + ",\"facultyId\":" + FACULTY_A + ",\"title\":\"Monday Session\","
                                + "\"startDate\":\"" + monday + "\",\"endDate\":\"" + end + "\","
                                + "\"startTime\":\"10:00\",\"endTime\":\"11:00\","
                                + "\"daysOfWeek\":[\"MONDAY\"]}"))
                .andExpect(status().isOk());

        assertEquals(3, jdbc.queryForObject(
                "select count(*) from class_schedule where class_id = ? and title = 'Monday Session' and is_deleted = 0",
                Integer.class, CLASS_A));

        mvc.perform(post("/api/v1/admin/class-schedule/recurring")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"classId\":" + CLASS_A + ",\"startDate\":\"" + end
                                + "\",\"endDate\":\"" + monday + "\",\"startTime\":\"10:00\",\"endTime\":\"11:00\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void facultyCourseAssociationCreateReadAndDeactivateRoundTrip() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/faculty-course-associations/create")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"facultyId\":" + FACULTY_A + ",\"courseIds\":[" + COURSE_A + "]}"))
                .andExpect(status().isOk());

        Long mappingId = jdbc.queryForObject(
                "select id from faculty_course_associations where faculty_id = ? and course_id = ?",
                Long.class, FACULTY_A, COURSE_A);

        String byFaculty = mvc.perform(get("/api/v1/faculty-course-associations/fetchActiveCoursesByFacultyId")
                        .param("facultyId", String.valueOf(FACULTY_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(byFaculty.contains("Utility Course A"), byFaculty);

        mvc.perform(patch("/api/v1/faculty-course-associations/deactivateAssociation")
                        .param("mappingId", String.valueOf(mappingId))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());
        entityManager.flush();

        assertEquals(0, jdbc.queryForObject(
                "select active from faculty_course_associations where id = ?", Integer.class, mappingId));
    }

    @Test
    void facultyCourseAssociationMustRejectCourseOutsideAdminsCollege() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/faculty-course-associations/create")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"facultyId\":" + FACULTY_A + ",\"courseIds\":[" + COURSE_B + "]}"))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/faculty-course-associations/createBulk")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"facultyCourseAssociations\":[{\"facultyId\":" + FACULTY_A
                                + ",\"courseIds\":[" + COURSE_A + "," + COURSE_B + "]}]}"))
                .andExpect(status().isForbidden());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from faculty_course_associations where faculty_id = ? and course_id = ?",
                Integer.class, FACULTY_A, COURSE_B));
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from faculty_course_associations where faculty_id = ?",
                Integer.class, FACULTY_A),
                "bulk request containing one foreign course must fail before persisting any mapping");
    }

    @Test
    void choicesUseAuthenticatedCollegeDataWithoutLeakingForeignBranchOrPassingYear() throws Exception {
        seedBase();

        String body = mvc.perform(get("/api/v1/choices")
                        .header("Authorization", "Bearer " + accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("CSE"), body);
        assertTrue(body.contains("2027"), body);
        assertTrue(!body.contains("ECE"), body);
        assertTrue(!body.contains("2030"), body);
        assertTrue(body.contains("registrationChoices"), body);
        assertTrue(body.contains("codingPlatforms"), body);
    }

    @Test
    void skillSearchReadsSeededSkillsAndGlobalCacheMutationIsSuperAdminOnly() throws Exception {
        seedBase();
        jdbc.update("insert into skills "
                + "(name, display_name, category, is_active, usage_count, search_priority, created_at, updated_at) "
                + "values ('integration-java-skill', 'Integration Java Skill', 'Technical Skills', 1, 9, 80, now(), now())");

        String body = mvc.perform(get("/api/v1/skills/search")
                        .param("query", "integration-java-skill")
                        .param("limit", "10")
                        .header("Authorization", "Bearer " + accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(body.contains("Integration Java Skill"), body);

        mvc.perform(post("/api/v1/skills/cache/evict")
                        .header("Authorization", "Bearer " + accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A))))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/skills/cache/evict")
                        .header("Authorization", "Bearer " + accessToken(superAdminPrincipal())))
                .andExpect(status().isOk());
    }

    @Test
    void learnerCannotUseRecurringScheduleOrFacultyAssociationMutationEndpoints() throws Exception {
        seedBase();
        String learner = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));
        LocalDate monday = LocalDate.now().plusWeeks(1).with(TemporalAdjusters.nextOrSame(MONDAY));

        mvc.perform(post("/api/v1/admin/class-schedule/recurring")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + learner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"classId\":" + CLASS_A + ",\"startDate\":\"" + monday
                                + "\",\"endDate\":\"" + monday + "\",\"startTime\":\"10:00\",\"endTime\":\"11:00\"}"))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/faculty-course-associations/create")
                        .header("Authorization", "Bearer " + learner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"facultyId\":" + FACULTY_A + ",\"courseIds\":[" + COURSE_A + "]}"))
                .andExpect(status().isForbidden());
    }
}
