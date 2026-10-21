package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Learner placement-registration state machine: module + eligibility + invited batch window.
 */
@Transactional
@Rollback
class LearnerRegistrationWorkflowMySqlIT extends AbstractMySqlHttpIT {

    @javax.persistence.PersistenceContext
    private javax.persistence.EntityManager entityManager;

    /** The class is @Transactional: flush pending JPA writes so plain-JDBC checks see what a committed request wrote. */
    private org.springframework.jdbc.core.JdbcTemplate flushed() {
        entityManager.flush();
        return jdbc;
    }

    private static final int COLLEGE = 104801;
    private static final int FACULTY = 104811;
    private static final int LEARNER = 104821;
    private static final int LEARNER_INELIGIBLE = 104822;
    private static final int DEPT = 104831;
    private static final int PROGRAM = 104841;
    private static final long BATCH = 104851L;
    private static final int CLASS_ID = 104861;

    private void seedBase(boolean openWindow) {
        seedCollege(COLLEGE, "Registration College");
        seedFaculty(FACULTY, COLLEGE, "RegistrationFaculty");
        seedLearner(LEARNER, COLLEGE, "RegistrationLearner");
        seedLearner(LEARNER_INELIGIBLE, COLLEGE, "IneligibleLearner");
        seedDepartment(DEPT, COLLEGE, "Registration Dept");
        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Registration Program', ?, 4, 0)",
                PROGRAM, DEPT);
        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (?, 'Registration Batch', ?, 0, 1, '2026-27', 'ACTIVE', now(), now())", BATCH, PROGRAM);
        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Registration Section', ?, ?, 60, 0, 'SECTION', 0)", CLASS_ID, PROGRAM, BATCH);
        jdbc.update("update learner set program_id = ?, class_id = ? where id in (?, ?)",
                PROGRAM, CLASS_ID, LEARNER, LEARNER_INELIGIBLE);

        jdbc.update("insert ignore into app_setting (scope_type, scope_id, setting_key, setting_value, is_deleted) "
                + "values ('COLLEGE', ?, 'module.placements.enabled', 'true', 0)", COLLEGE);
        jdbc.update("insert into placement_eligibility "
                + "(college_id, scope_type, scope_id, status, decided_by_type, decided_at) "
                + "values (?, 'LEARNER', ?, 'ELIGIBLE', 'ADMIN', now())", COLLEGE, LEARNER);
        jdbc.update("insert into placement_eligibility "
                + "(college_id, scope_type, scope_id, status, reason, decided_by_type, decided_at) "
                + "values (?, 'LEARNER', ?, 'INELIGIBLE', 'Integration exclusion', 'ADMIN', now())",
                COLLEGE, LEARNER_INELIGIBLE);

        if (openWindow) {
            jdbc.update("insert into placement_batch "
                            + "(batch_id, college_id, registration_deadline, invited_at, created_at, updated_at) "
                            + "values (?, ?, ?, now(), now(), now())",
                    BATCH, COLLEGE, java.sql.Timestamp.valueOf(LocalDateTime.now().plusDays(3)));
        } else {
            jdbc.update("insert into placement_batch "
                            + "(batch_id, college_id, registration_deadline, invited_at, created_at, updated_at) "
                            + "values (?, ?, ?, now(), now(), now())",
                    BATCH, COLLEGE, java.sql.Timestamp.valueOf(LocalDateTime.now().minusHours(1)));
        }
    }

    private String learnerToken() {
        return accessToken(learnerPrincipal(LEARNER, COLLEGE));
    }

    @Test
    void openEligibleLearnerRegistersForPlacementsWithConsent() throws Exception {
        seedBase(true);

        mvc.perform(post("/api/v1/learner/registration")
                        .param("choice", "PLACEMENTS")
                        .param("consent", "true")
                        .header("Authorization", "Bearer " + learnerToken()))
                .andExpect(status().isOk());

        Long id = flushed().queryForObject(
                "select id from placement_registration where learner_id = ?",
                Long.class, LEARNER);
        assertNotNull(id);
        assertEquals("PLACEMENTS", flushed().queryForObject(
                "select choice from placement_registration where id = ?", String.class, id));
        assertEquals("SELF", flushed().queryForObject(
                "select source from placement_registration where id = ?", String.class, id));
        assertEquals("v1", flushed().queryForObject(
                "select consent_version from placement_registration where id = ?", String.class, id));
        assertNotNull(flushed().queryForObject(
                "select consent_at from placement_registration where id = ?", java.sql.Timestamp.class, id));
    }

    @Test
    void placementsRegistrationWithoutConsentIsRefusedAndSavesNothing() throws Exception {
        seedBase(true);
        mvc.perform(post("/api/v1/learner/registration")
                        .param("choice", "PLACEMENTS")
                        .header("Authorization", "Bearer " + learnerToken()))
                .andExpect(status().isBadRequest());
        org.junit.jupiter.api.Assertions.assertEquals(0, flushed().queryForObject(
                "select count(*) from placement_registration where learner_id = ?", Integer.class, LEARNER));
    }

    @Test
    void registrationGetReturnsCurrentLearnersOwnChoiceOnly() throws Exception {
        seedBase(true);
        mvc.perform(post("/api/v1/learner/registration")
                        .param("choice", "HIGHER_STUDIES")
                        .header("Authorization", "Bearer " + learnerToken()))
                .andExpect(status().isOk());

        String body = mvc.perform(get("/api/v1/learner/registration")
                        .header("Authorization", "Bearer " + learnerToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        org.junit.jupiter.api.Assertions.assertTrue(body.contains("HIGHER_STUDIES"), body);
        org.junit.jupiter.api.Assertions.assertTrue(body.contains(String.valueOf(LEARNER)), body);
    }

    @Test
    void changingChoiceWithinOpenWindowUpdatesSameSeasonRowInsteadOfDuplicating() throws Exception {
        seedBase(true);

        mvc.perform(post("/api/v1/learner/registration")
                        .param("choice", "PLACEMENTS")
                        .param("consent", "true")
                        .header("Authorization", "Bearer " + learnerToken()))
                .andExpect(status().isOk());
        Long firstId = flushed().queryForObject(
                "select id from placement_registration where learner_id = ?",
                Long.class, LEARNER);

        mvc.perform(post("/api/v1/learner/registration")
                        .param("choice", "NOT_INTERESTED")
                        .header("Authorization", "Bearer " + learnerToken()))
                .andExpect(status().isOk());

        assertEquals(1, flushed().queryForObject(
                "select count(*) from placement_registration where learner_id = ?",
                Integer.class, LEARNER));
        assertEquals(firstId, flushed().queryForObject(
                "select id from placement_registration where learner_id = ?",
                Long.class, LEARNER));
        assertEquals("NOT_INTERESTED", flushed().queryForObject(
                "select choice from placement_registration where learner_id = ?",
                String.class, LEARNER));
    }

    @Test
    void expiredBatchWindowRejectsRegistrationWithoutPersistingChoice() throws Exception {
        seedBase(false);

        mvc.perform(post("/api/v1/learner/registration")
                        .param("choice", "PLACEMENTS")
                        .param("consent", "true")
                        .header("Authorization", "Bearer " + learnerToken()))
                .andExpect(status().isConflict());

        assertEquals(0, flushed().queryForObject(
                "select count(*) from placement_registration where learner_id = ?",
                Integer.class, LEARNER));
    }

    @Test
    void existingRegistrationCannotBeChangedAfterWindowExpires() throws Exception {
        seedBase(true);

        mvc.perform(post("/api/v1/learner/registration")
                        .param("choice", "PLACEMENTS")
                        .param("consent", "true")
                        .header("Authorization", "Bearer " + learnerToken()))
                .andExpect(status().isOk());

        jdbc.update("update placement_batch set registration_deadline = ? where batch_id = ?",
                java.sql.Timestamp.valueOf(LocalDateTime.now().minusMinutes(1)), BATCH);

        mvc.perform(post("/api/v1/learner/registration")
                        .param("choice", "NOT_INTERESTED")
                        .header("Authorization", "Bearer " + learnerToken()))
                .andExpect(status().isConflict());

        assertEquals("PLACEMENTS", flushed().queryForObject(
                "select choice from placement_registration where learner_id = ?",
                String.class, LEARNER));
        assertEquals(1, flushed().queryForObject(
                "select count(*) from placement_registration where learner_id = ?",
                Integer.class, LEARNER));
    }

    @Test
    void placementAccessFilterBlocksIneligibleLearnerBeforeRegistrationController() throws Exception {
        seedBase(true);

        mvc.perform(post("/api/v1/learner/registration")
                        .param("choice", "PLACEMENTS")
                        .param("consent", "true")
                        .header("Authorization", "Bearer "
                                + accessToken(learnerPrincipal(LEARNER_INELIGIBLE, COLLEGE))))
                .andExpect(status().isForbidden());

        assertEquals(0, flushed().queryForObject(
                "select count(*) from placement_registration where learner_id = ?",
                Integer.class, LEARNER_INELIGIBLE));
    }

    @Test
    void facultyCannotUseLearnerRegistrationSurface() throws Exception {
        seedBase(true);

        mvc.perform(get("/api/v1/learner/registration")
                        .header("Authorization", "Bearer "
                                + accessToken(facultyPrincipal(FACULTY, "LECTURER", COLLEGE))))
                .andExpect(status().isForbidden());
    }
}
