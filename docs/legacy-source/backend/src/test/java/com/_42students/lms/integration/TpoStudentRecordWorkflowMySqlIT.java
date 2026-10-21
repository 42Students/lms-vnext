package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * TPO student-record corrections and debarment lifecycle.
 */
@Transactional
@Rollback
class TpoStudentRecordWorkflowMySqlIT extends AbstractMySqlHttpIT {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * This class is @Transactional, so each MockMvc request joins the test transaction and never
     * commits; Hibernate writes dirty entities only on commit or before an overlapping JPQL query.
     * Flush first so raw-JDBC assertions see what a committed production request would have written.
     */
    private <T> T flushedQuery(String sql, Class<T> type, Object... args) {
        entityManager.flush();
        return jdbc.queryForObject(sql, type, args);
    }

    private static final int COLLEGE_A = 106401;
    private static final int COLLEGE_B = 106402;
    private static final int TPO_A = 106411;
    private static final int LEARNER_A = 106421;
    private static final int LEARNER_B = 106422;
    private static final int LEARNER_FOREIGN = 106423;

    private void seedBase() {
        seedCollege(COLLEGE_A, "TPO Student College A");
        seedCollege(COLLEGE_B, "TPO Student College B");
        seedFaculty(TPO_A, COLLEGE_A, "StudentOfficer");
        jdbc.update("update faculty set faculty_type = 14 where id = ?", TPO_A);
        seedLearner(LEARNER_A, COLLEGE_A, "StudentA");
        seedLearner(LEARNER_B, COLLEGE_A, "StudentB");
        seedLearner(LEARNER_FOREIGN, COLLEGE_B, "StudentForeign");
    }

    private String tpoToken() {
        return accessToken(facultyPrincipal(TPO_A, "TPO", COLLEGE_A));
    }

    @Test
    void tpoStudentListIsCollegeScoped() throws Exception {
        seedBase();

        String body = mvc.perform(get("/api/v1/tpo/students")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("StudentA"), body);
        assertTrue(body.contains("StudentB"), body);
        assertTrue(!body.contains("StudentForeign"), body);
    }

    @Test
    void tpoUpsertsVerifiedAcademicRecordForOwnLearner() throws Exception {
        seedBase();

        mvc.perform(put("/api/v1/tpo/students/" + LEARNER_A + "/academic-record")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"cgpa\":8.92,\"tenthPct\":94.0,\"twelfthPct\":93.0,"
                                + "\"gapYears\":0,\"passingYear\":2027,\"gender\":\"M\"}"))
                .andExpect(status().isOk());

        assertEquals("VERIFIED", flushedQuery(
                "select source from learner_academic_record where learner_id = ?",
                String.class, LEARNER_A));
        assertEquals("8.92", flushedQuery(
                "select cast(cgpa as char) from learner_academic_record where learner_id = ?",
                String.class, LEARNER_A));
        assertNotNull(flushedQuery(
                "select imported_at from learner_academic_record where learner_id = ?",
                java.sql.Timestamp.class, LEARNER_A));
    }

    @Test
    void tpoCannotModifyForeignCollegeAcademicRecord() throws Exception {
        seedBase();

        mvc.perform(put("/api/v1/tpo/students/" + LEARNER_FOREIGN + "/academic-record")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"cgpa\":9.99}"))
                .andExpect(status().isNotFound());

        assertEquals(0, flushedQuery(
                "select count(*) from learner_academic_record where learner_id = ?",
                Integer.class, LEARNER_FOREIGN));
    }

    @Test
    void debarmentPersistsReasonLimitAndCreatorThenAppearsInActiveList() throws Exception {
        seedBase();
        LocalDate until = LocalDate.now().plusDays(14);

        mvc.perform(post("/api/v1/tpo/students/" + LEARNER_A + "/debar")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Missed mandatory drive\",\"untilDate\":\"" + until + "\",\"untilDrives\":2}"))
                .andExpect(status().isCreated());

        Long id = flushedQuery(
                "select id from placement_debarment where learner_id = ? order by id desc limit 1",
                Long.class, LEARNER_A);
        assertNotNull(id);
        assertEquals("Missed mandatory drive", flushedQuery(
                "select reason from placement_debarment where id = ?", String.class, id));
        assertEquals(2, flushedQuery(
                "select until_drives from placement_debarment where id = ?", Integer.class, id));
        assertEquals(TPO_A, flushedQuery(
                "select created_by from placement_debarment where id = ?", Integer.class, id));

        String active = mvc.perform(get("/api/v1/tpo/students/" + LEARNER_A + "/debarments")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(active.contains("Missed mandatory drive"), active);
    }

    @Test
    void liftDebarmentRemovesItFromActiveListAndStoresReason() throws Exception {
        seedBase();
        jdbc.update("insert into placement_debarment "
                + "(learner_id, reason, until_drives, drives_counted, created_by, created_at) "
                + "values (?, 'Temporary debarment', 3, 0, ?, now())", LEARNER_A, TPO_A);
        Long id = flushedQuery(
                "select id from placement_debarment where learner_id = ? order by id desc limit 1",
                Long.class, LEARNER_A);

        mvc.perform(post("/api/v1/tpo/students/debarments/" + id + "/lift")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Appeal accepted\"}"))
                .andExpect(status().isNoContent());

        assertNotNull(flushedQuery(
                "select lifted_at from placement_debarment where id = ?", java.sql.Timestamp.class, id));
        assertEquals("Appeal accepted", flushedQuery(
                "select lifted_reason from placement_debarment where id = ?", String.class, id));

        String active = mvc.perform(get("/api/v1/tpo/students/" + LEARNER_A + "/debarments")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(!active.contains("Temporary debarment"), active);
    }

    @Test
    void tpoCannotLiftForeignLearnersDebarmentAndLearnerCannotUseTpoStudentAdmin() throws Exception {
        seedBase();
        jdbc.update("insert into placement_debarment "
                + "(learner_id, reason, until_drives, drives_counted, created_at) "
                + "values (?, 'Foreign debarment', 2, 0, now())", LEARNER_FOREIGN);
        Long foreignId = flushedQuery(
                "select id from placement_debarment where learner_id = ? order by id desc limit 1",
                Long.class, LEARNER_FOREIGN);

        mvc.perform(post("/api/v1/tpo/students/debarments/" + foreignId + "/lift")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"attack\"}"))
                .andExpect(status().isNotFound());

        String learner = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));
        mvc.perform(get("/api/v1/tpo/students")
                        .header("Authorization", "Bearer " + learner))
                .andExpect(status().isForbidden());

        assertEquals(0, flushedQuery(
                "select count(*) from placement_debarment where id = ? and lifted_at is not null",
                Integer.class, foreignId));
    }
}
