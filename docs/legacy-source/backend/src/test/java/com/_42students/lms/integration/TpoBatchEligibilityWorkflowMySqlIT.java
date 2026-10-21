package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Placement batch/rules/eligibility integration including undo semantics.
 */
@Transactional
@Rollback
class TpoBatchEligibilityWorkflowMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 106801;
    private static final int COLLEGE_B = 106802;
    private static final int TPO_A = 106811;
    private static final int LEARNER_A = 106821;
    private static final int LEARNER_FOREIGN = 106822;
    private static final int DEPT_A = 106831;
    private static final int DEPT_B = 106832;
    private static final int PROGRAM_A = 106841;
    private static final int PROGRAM_B = 106842;
    private static final long BATCH_A = 106851L;
    private static final long BATCH_B = 106852L;
    private static final int CLASS_A = 106861;
    private static final int CLASS_B = 106862;

    private void seedBase() {
        seedCollege(COLLEGE_A, "TPO Batch College A");
        seedCollege(COLLEGE_B, "TPO Batch College B");
        seedFaculty(TPO_A, COLLEGE_A, "BatchOfficer");
        jdbc.update("update faculty set faculty_type = 14 where id = ?", TPO_A);
        seedLearner(LEARNER_A, COLLEGE_A, "BatchLearnerA");
        seedLearner(LEARNER_FOREIGN, COLLEGE_B, "BatchLearnerForeign");
        seedDepartment(DEPT_A, COLLEGE_A, "Batch Dept A");
        seedDepartment(DEPT_B, COLLEGE_B, "Batch Dept B");

        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Batch Program A', ?, 4, 0)",
                PROGRAM_A, DEPT_A);
        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Batch Program B', ?, 4, 0)",
                PROGRAM_B, DEPT_B);
        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (?, 'Placement Batch A', ?, 1, 1, '2026-27', 'ACTIVE', now(), now())", BATCH_A, PROGRAM_A);
        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (?, 'Placement Batch B', ?, 1, 1, '2026-27', 'ACTIVE', now(), now())", BATCH_B, PROGRAM_B);
        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Batch Section A', ?, ?, 60, 0, 'SECTION', 0)", CLASS_A, PROGRAM_A, BATCH_A);
        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Batch Section B', ?, ?, 60, 0, 'SECTION', 0)", CLASS_B, PROGRAM_B, BATCH_B);
        jdbc.update("update learner set program_id = ?, class_id = ? where id = ?", PROGRAM_A, CLASS_A, LEARNER_A);
        jdbc.update("update learner set program_id = ?, class_id = ? where id = ?", PROGRAM_B, CLASS_B, LEARNER_FOREIGN);
    }

    private String tpoToken() {
        return accessToken(facultyPrincipal(TPO_A, "TPO", COLLEGE_A));
    }

    @Test
    void batchOverviewContainsOwnCollegeBatchAndExcludesSiblingCollegeBatch() throws Exception {
        seedBase();

        String body = mvc.perform(get("/api/v1/tpo/batches")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("Placement Batch A"), body);
        assertTrue(!body.contains("Placement Batch B"), body);

        mvc.perform(get("/api/v1/tpo/batches/" + BATCH_B)
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isNotFound());
    }

    @Test
    void batchSpecificRulesPersistAndEffectiveViewReflectsOverrides() throws Exception {
        seedBase();

        String body = mvc.perform(put("/api/v1/tpo/batches/" + BATCH_A + "/rules")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"countsAsPlacedAt\":\"OFFER_ACCEPTED\",\"maxHeldOffers\":2,"
                                + "\"upliftPct\":65,\"minResponseHours\":72}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String json = jdbc.queryForObject(
                "select cast(rules_json as char) from placement_batch where batch_id = ?",
                String.class, BATCH_A);
        assertTrue(json.contains("OFFER_ACCEPTED"), json);
        assertTrue(json.contains("65"), json);
        assertTrue(body.contains("\"maxHeldOffers\":2"), body);
        assertTrue(body.contains("\"minResponseHours\":72"), body);
    }

    @Test
    void invalidBatchRuleIsRejectedWithoutPersistingCustomRules() throws Exception {
        seedBase();

        mvc.perform(put("/api/v1/tpo/batches/" + BATCH_A + "/rules")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"maxHeldOffers\":99,\"upliftPct\":999}"))
                .andExpect(status().isBadRequest());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from placement_batch where batch_id = ? and rules_json is not null",
                Integer.class, BATCH_A));
    }

    @Test
    void batchDeadlineAndFinishedStateRejectPastDeadlineThenPersistFutureLifecycle() throws Exception {
        seedBase();

        mvc.perform(put("/api/v1/tpo/batches/" + BATCH_A)
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"setDeadline\":true,\"registrationDeadline\":\""
                                + LocalDateTime.now().minusHours(1).withNano(0) + "\"}"))
                .andExpect(status().isBadRequest());

        LocalDateTime future = LocalDateTime.now().plusDays(5).withNano(0);
        mvc.perform(put("/api/v1/tpo/batches/" + BATCH_A)
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"setDeadline\":true,\"registrationDeadline\":\"" + future
                                + "\",\"finished\":true}"))
                .andExpect(status().isOk());

        // Read back as the LocalDateTime the service writes (BatchRegistrationService binds a LocalDateTime): a
        // java.sql.Timestamp read is shifted by the driver whenever the JVM zone differs from the connection's UTC.
        assertEquals(future, jdbc.queryForObject(
                "select registration_deadline from placement_batch where batch_id = ?",
                LocalDateTime.class, BATCH_A));
        assertNotNull(jdbc.queryForObject(
                "select finished_at from placement_batch where batch_id = ?",
                java.sql.Timestamp.class, BATCH_A));

        mvc.perform(put("/api/v1/tpo/batches/" + BATCH_A)
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"setDeadline\":false,\"finished\":false}"))
                .andExpect(status().isOk());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from placement_batch where batch_id = ? and finished_at is not null",
                Integer.class, BATCH_A));
    }

    @Test
    void eligibilityDecisionCreatesUndoableEventAndUndoRestoresNotDecided() throws Exception {
        seedBase();

        String decision = mvc.perform(post("/api/v1/tpo/eligibility")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"changes\":[{\"scopeType\":\"LEARNER\",\"scopeId\":" + LEARNER_A
                                + ",\"status\":\"INELIGIBLE\",\"reason\":\"Placement policy\"}]}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(decision.contains("\"changed\":1"), decision);

        String actionId = jdbc.queryForObject(
                "select action_id from placement_eligibility_event where college_id = ? order by id desc limit 1",
                String.class, COLLEGE_A);
        assertNotNull(actionId);
        assertEquals("INELIGIBLE", jdbc.queryForObject(
                "select status from placement_eligibility where scope_type = 'LEARNER' and scope_id = ?",
                String.class, LEARNER_A));

        String last = mvc.perform(get("/api/v1/tpo/eligibility/last-action")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(last.contains(actionId), last);

        mvc.perform(post("/api/v1/tpo/eligibility/undo")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"actionId\":\"" + actionId + "\"}"))
                .andExpect(status().isOk());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from placement_eligibility where scope_type = 'LEARNER' and scope_id = ?",
                Integer.class, LEARNER_A));
        assertNotNull(jdbc.queryForObject(
                "select undone_at from placement_eligibility_event where action_id = ?",
                java.sql.Timestamp.class, actionId));
    }

    @Test
    void eligibilityCannotTargetForeignLearnerAndLearnerCannotUseTpoBatchAdmin() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/tpo/eligibility")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"changes\":[{\"scopeType\":\"LEARNER\",\"scopeId\":" + LEARNER_FOREIGN
                                + ",\"status\":\"ELIGIBLE\"}]}"))
                .andExpect(status().isNotFound());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from placement_eligibility where scope_id = ?",
                Integer.class, LEARNER_FOREIGN));

        mvc.perform(get("/api/v1/tpo/batches")
                        .header("Authorization", "Bearer " + accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A))))
                .andExpect(status().isForbidden());
    }
}
