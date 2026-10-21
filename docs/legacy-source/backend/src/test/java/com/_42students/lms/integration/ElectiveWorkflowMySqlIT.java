package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Elective slot/offering/allocation integration across the electives feature and groups kernel.
 */
@Transactional
@Rollback
class ElectiveWorkflowMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 101601;
    private static final int COLLEGE_B = 101602;
    private static final int ADMIN_A = 101611;
    private static final int FACULTY_A = 101612;
    private static final int LEARNER_A = 101621;
    private static final int LEARNER_B = 101622;
    private static final int DEPT_A = 101631;
    private static final int DEPT_B = 101632;
    private static final int PROGRAM_A = 101641;
    private static final int PROGRAM_B = 101642;
    private static final int BATCH_A = 101651;
    private static final int BATCH_B = 101652;
    private static final int CLASS_A = 101661;
    private static final int CLASS_B = 101662;
    private static final int COURSE_A = 101671;
    private static final int COURSE_A2 = 101672;
    private static final int COURSE_B = 101673;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Elective College A");
        seedCollege(COLLEGE_B, "Elective College B");
        seedFaculty(ADMIN_A, COLLEGE_A, "ElectiveAdmin");
        seedFaculty(FACULTY_A, COLLEGE_A, "ElectiveFaculty");
        seedLearner(LEARNER_A, COLLEGE_A, "ElectiveLearnerA");
        seedLearner(LEARNER_B, COLLEGE_B, "ElectiveLearnerB");
        seedDepartment(DEPT_A, COLLEGE_A, "Elective Dept A");
        seedDepartment(DEPT_B, COLLEGE_B, "Elective Dept B");

        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Elective Program A', ?, 4, 0)",
                PROGRAM_A, DEPT_A);
        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Elective Program B', ?, 4, 0)",
                PROGRAM_B, DEPT_B);

        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (?, 'Elective Batch A', ?, 0, 5, '2026-27', 'ACTIVE', now(), now())", BATCH_A, PROGRAM_A);
        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (?, 'Elective Batch B', ?, 0, 5, '2026-27', 'ACTIVE', now(), now())", BATCH_B, PROGRAM_B);

        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Elective Section A', ?, ?, 60, 0, 'SECTION', 0)", CLASS_A, PROGRAM_A, BATCH_A);
        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Elective Section B', ?, ?, 60, 0, 'SECTION', 0)", CLASS_B, PROGRAM_B, BATCH_B);

        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'ELA', ?, 'Elective Course A', 0, 1, 1, 1, 'elective-course-a-it', 0, 0)", COURSE_A, DEPT_A);
        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'ELA2', ?, 'Elective Course A2', 0, 1, 1, 1, 'elective-course-a2-it', 0, 0)", COURSE_A2, DEPT_A);
        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'ELB', ?, 'Elective Course B', 0, 1, 1, 1, 'elective-course-b-it', 0, 0)", COURSE_B, DEPT_B);

        jdbc.update("update learner set program_id = ?, class_id = ? where id = ?", PROGRAM_A, CLASS_A, LEARNER_A);
        jdbc.update("update learner set program_id = ?, class_id = ? where id = ?", PROGRAM_B, CLASS_B, LEARNER_B);
    }

    // The whole test runs in one rolled-back transaction, so MockMvc requests share its persistence context:
    // pending entity updates (e.g. the group's DRAFT -> ACTIVE transition) must be flushed before JDBC reads them.
    @javax.persistence.PersistenceContext
    private javax.persistence.EntityManager entityManager;

    private String adminToken() {
        return accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));
    }

    private long createSlot(int maxPick) throws Exception {
        mvc.perform(post("/api/v1/electives/admin/slots")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"programId\":" + PROGRAM_A + ",\"semesterNumber\":5,"
                                + "\"academicYear\":\"2026-27\",\"name\":\"Professional Elective IT\","
                                + "\"credits\":3,\"minPick\":1,\"maxPick\":" + maxPick + "}"))
                .andExpect(status().isOk());

        Long id = jdbc.queryForObject(
                "select id from elective_slot where college_id = ? and name = 'Professional Elective IT'",
                Long.class, COLLEGE_A);
        assertNotNull(id);
        return id;
    }

    private long createOffering(long slotId, int courseId, Integer capacity) throws Exception {
        String capacityJson = capacity == null ? "null" : String.valueOf(capacity);
        mvc.perform(post("/api/v1/electives/admin/slots/" + slotId + "/offerings")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"courseId\":" + courseId + ",\"capacity\":" + capacityJson + "}"))
                .andExpect(status().isOk());
        entityManager.flush();

        Long id = jdbc.queryForObject(
                "select id from elective_offering where slot_id = ? and course_id = ? and is_deleted = 0",
                Long.class, slotId, courseId);
        assertNotNull(id);
        return id;
    }

    @Test
    void createOfferingMaterializesGroupAndBackedClassThenAllocatesEligibleLearner() throws Exception {
        seedBase();
        long slotId = createSlot(1);
        long offeringId = createOffering(slotId, COURSE_A, 30);

        Long groupId = jdbc.queryForObject(
                "select group_id from elective_offering where id = ?", Long.class, offeringId);
        Integer backedClassId = jdbc.queryForObject(
                "select backed_class_id from elective_offering where id = ?", Integer.class, offeringId);
        assertNotNull(groupId);
        assertNotNull(backedClassId);
        assertEquals("ACTIVE", jdbc.queryForObject(
                "select status from lms_group where id = ?", String.class, groupId));
        assertEquals("GROUP_BACKED", jdbc.queryForObject(
                "select class_type from class where id = ?", String.class, backedClassId));

        String response = mvc.perform(post("/api/v1/electives/admin/offerings/" + offeringId + "/allocate")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"learnerIds\":[" + LEARNER_A + "],\"note\":\"integration allocation\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(response.contains("\"added\":1"), response);
        assertEquals("ACTIVE", jdbc.queryForObject(
                "select state from lms_group_member where group_id = ? and member_type = 'LEARNER' and member_id = ?",
                String.class, groupId, LEARNER_A));
    }

    @Test
    void maxPickRulePreventsLearnerFromJoiningSecondOfferingInSameSlot() throws Exception {
        seedBase();
        long slotId = createSlot(1);
        long offeringA = createOffering(slotId, COURSE_A, 30);
        long offeringB = createOffering(slotId, COURSE_A2, 30);

        for (long offeringId : new long[]{offeringA, offeringB}) {
            mvc.perform(post("/api/v1/electives/admin/offerings/" + offeringId + "/allocate")
                            .header("Authorization", "Bearer " + adminToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"learnerIds\":[" + LEARNER_A + "]}"))
                    .andExpect(status().isOk());
        }

        Integer current = jdbc.queryForObject(
                "select count(*) from lms_group_member m join elective_offering o on o.group_id = m.group_id "
                        + "where o.slot_id = ? and m.member_type = 'LEARNER' and m.member_id = ? "
                        + "and m.state in ('ACTIVE','WAITLISTED')",
                Integer.class, slotId, LEARNER_A);
        assertEquals(1, current,
                "maxPick=1 must prevent a second current elective membership in the same slot");
    }

    @Test
    void foreignProgramAndForeignCourseAreRejectedFromCollegeElectiveConfiguration() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/electives/admin/slots")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"programId\":" + PROGRAM_B + ",\"semesterNumber\":5,"
                                + "\"academicYear\":\"2026-27\",\"name\":\"Foreign Slot\"}"))
                .andExpect(status().isNotFound());

        long slotId = createSlot(1);
        mvc.perform(post("/api/v1/electives/admin/slots/" + slotId + "/offerings")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"courseId\":" + COURSE_B + ",\"capacity\":30}"))
                .andExpect(status().isNotFound());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from elective_offering where slot_id = ? and course_id = ?",
                Integer.class, slotId, COURSE_B));
    }

    @Test
    void learnerFromAnotherCollegeIsReportedRejectedAndNeverAddedToRoster() throws Exception {
        seedBase();
        long slotId = createSlot(1);
        long offeringId = createOffering(slotId, COURSE_A, 30);
        Long groupId = jdbc.queryForObject(
                "select group_id from elective_offering where id = ?", Long.class, offeringId);

        String response = mvc.perform(post("/api/v1/electives/admin/offerings/" + offeringId + "/allocate")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"learnerIds\":[" + LEARNER_B + "]}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        // Production wording is "Student not found" (ElectiveService.learnerEligibilityError), the same for a missing and a foreign learner.
        assertTrue(response.contains("Student not found"), response);
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from lms_group_member where group_id = ? and member_id = ?",
                Integer.class, groupId, LEARNER_B));
    }

    @Test
    void learnerCannotReachElectiveAdminSurface() throws Exception {
        seedBase();
        String learner = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));

        mvc.perform(get("/api/v1/electives/admin/slots")
                        .header("Authorization", "Bearer " + learner))
                .andExpect(status().isForbidden());
    }
}
