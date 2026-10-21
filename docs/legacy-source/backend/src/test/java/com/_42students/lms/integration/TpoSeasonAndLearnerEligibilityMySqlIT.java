package com._42students.lms.integration;

import com._42students.lms.model.Job;
import com._42students.lms.repository.JobRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Placement seasons plus learner-side eligibility/rules visibility.
 */
@Transactional
@Rollback
class TpoSeasonAndLearnerEligibilityMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 107201;
    private static final int COLLEGE_B = 107202;
    private static final int TPO_A = 107211;
    private static final int LEARNER_A = 107221;
    private static final int LEARNER_B = 107222;

    @Autowired
    private JobRepository jobRepository;

    /** The class-level transaction spans MockMvc calls; JdbcTemplate reads do not auto-flush JPA updates. */
    @javax.persistence.PersistenceContext
    private javax.persistence.EntityManager entityManager;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Season Eligibility College A");
        seedCollege(COLLEGE_B, "Season Eligibility College B");
        seedFaculty(TPO_A, COLLEGE_A, "SeasonOfficer");
        jdbc.update("update faculty set faculty_type = 14 where id = ?", TPO_A);
        seedLearner(LEARNER_A, COLLEGE_A, "EligibilityLearnerA");
        seedLearner(LEARNER_B, COLLEGE_B, "EligibilityLearnerB");

        for (int collegeId : new int[]{COLLEGE_A, COLLEGE_B}) {
            jdbc.update("insert ignore into app_setting (scope_type, scope_id, setting_key, setting_value, is_deleted) "
                    + "values ('COLLEGE', ?, 'module.placements.enabled', 'true', 0)", collegeId);
        }
        jdbc.update("insert into placement_eligibility "
                + "(college_id, scope_type, scope_id, status, decided_by_type, decided_at) "
                + "values (?, 'LEARNER', ?, 'ELIGIBLE', 'ADMIN', now())", COLLEGE_A, LEARNER_A);
        jdbc.update("insert into placement_eligibility "
                + "(college_id, scope_type, scope_id, status, decided_by_type, decided_at) "
                + "values (?, 'LEARNER', ?, 'ELIGIBLE', 'ADMIN', now())", COLLEGE_B, LEARNER_B);
    }

    private String tpoToken() {
        return accessToken(facultyPrincipal(TPO_A, "TPO", COLLEGE_A));
    }

    private String learnerToken() {
        return accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));
    }

    private Job job(int collegeId, String title) {
        Job j = new Job();
        j.setJobTitle(title);
        j.setCompanyName("Eligibility Integration Corp");
        j.setOrganizationId(1);
        j.setCollegeId(collegeId);
        j.setIsActive(true);
        j.setIsDraft(false);
        j.setScreeningVersion("v1");
        j.setVisibilityType("INTERNAL_ONLY");
        j.setLifecycleStatus("PUBLISHED");
        j.setDriveMode("ON_CAMPUS");
        j.setRecordedOutside(true);
        j.setCountsAsPlaced(true);
        j.setRequiresExternalRegistration(false);
        j.setResultsAutoApply(false);
        j.setIsDeleted(false);
        return jobRepository.saveAndFlush(j);
    }

    @Test
    void tpoStartsSeasonAndListsOnlyOwnCollegeSeasons() throws Exception {
        seedBase();
        jdbc.update("insert into placement_season "
                + "(college_id, name, start_date, is_registration_open, is_current, version, created_at, updated_at) "
                + "values (?, 'Foreign Season', curdate(), 0, 1, 0, now(), now())", COLLEGE_B);

        mvc.perform(post("/api/v1/tpo/season")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"2027 Placements\",\"startDate\":\"2026-10-01\",\"endDate\":\"2027-08-31\"}"))
                .andExpect(status().isCreated());

        String list = mvc.perform(get("/api/v1/tpo/season")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(list.contains("2027 Placements"), list);
        assertTrue(!list.contains("Foreign Season"), list);
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from placement_season where college_id = ? and name = '2027 Placements'",
                Integer.class, COLLEGE_A));
    }

    @Test
    void currentSeasonAutoCreatesOnlyForAuthenticatedCollegeWhenNoneExists() throws Exception {
        seedBase();

        String body = mvc.perform(get("/api/v1/tpo/season/current")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("Current season"), body);
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from placement_season where college_id = ? and name = 'Current season'",
                Integer.class, COLLEGE_A));
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from placement_season where college_id = ?",
                Integer.class, COLLEGE_B));
    }

    @Test
    void openRegistrationPersistsDeadlineAndForeignSeasonIsNotAddressable() throws Exception {
        seedBase();
        jdbc.update("insert into placement_season "
                + "(college_id, name, start_date, is_registration_open, is_current, version, created_at, updated_at) "
                + "values (?, 'Own Season', curdate(), 0, 1, 0, now(), now())", COLLEGE_A);
        Long ownId = jdbc.queryForObject(
                "select id from placement_season where college_id = ? and name = 'Own Season'",
                Long.class, COLLEGE_A);
        jdbc.update("insert into placement_season "
                + "(college_id, name, start_date, is_registration_open, is_current, version, created_at, updated_at) "
                + "values (?, 'Other Season', curdate(), 0, 1, 0, now(), now())", COLLEGE_B);
        Long foreignId = jdbc.queryForObject(
                "select id from placement_season where college_id = ? and name = 'Other Season'",
                Long.class, COLLEGE_B);

        LocalDateTime deadline = LocalDateTime.now().plusDays(5).withNano(0);
        mvc.perform(post("/api/v1/tpo/season/" + ownId + "/open-registration")
                        .param("deadline", deadline.toString())
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk());
        entityManager.flush();

        assertEquals(1, jdbc.queryForObject(
                "select is_registration_open from placement_season where id = ?", Integer.class, ownId));
        assertNotNull(jdbc.queryForObject(
                "select registration_deadline from placement_season where id = ?",
                java.sql.Timestamp.class, ownId));

        mvc.perform(post("/api/v1/tpo/season/" + foreignId + "/open-registration")
                        .param("deadline", deadline.toString())
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isNotFound());
        entityManager.flush();

        assertEquals(0, jdbc.queryForObject(
                "select is_registration_open from placement_season where id = ?", Integer.class, foreignId));
    }

    @Test
    void learnerEligibilityEvaluatesOwnCollegePublishedDrive() throws Exception {
        seedBase();
        Job own = job(COLLEGE_A, "Eligible Drive");

        String body = mvc.perform(get("/api/v1/learner/drives/" + own.getId() + "/eligibility")
                        .header("Authorization", "Bearer " + learnerToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("eligible"), body.toLowerCase());
    }

    @Test
    void learnerCannotProbeForeignCollegeDriveEligibility() throws Exception {
        seedBase();
        Job foreign = job(COLLEGE_B, "Foreign Eligibility Drive");

        mvc.perform(get("/api/v1/learner/drives/" + foreign.getId() + "/eligibility")
                        .header("Authorization", "Bearer " + learnerToken()))
                .andExpect(status().isNotFound());
    }

    @Test
    void learnerPlacementRulesReflectOwnCollegeSettings() throws Exception {
        seedBase();
        jdbc.update("insert into college_placement_rules "
                + "(college_id, counts_as_placed_at, max_held_offers, uplift_pct, min_response_hours, version) "
                + "values (?, 'OFFER_ACCEPTED', 2, 55, 72, 0)", COLLEGE_A);

        String body = mvc.perform(get("/api/v1/learner/drives/placement-rules")
                        .header("Authorization", "Bearer " + learnerToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("\"countsAsPlacedAt\":\"OFFER_ACCEPTED\""), body);
        assertTrue(body.contains("\"maxHeldOffers\":2"), body);
        assertTrue(body.contains("\"upliftPct\":55"), body);
        assertTrue(body.contains("\"minResponseHours\":72"), body);
    }

    @Test
    void companyPreviewRequiresLearnerToHaveAppliedToVisibleDrive() throws Exception {
        seedBase();
        Job own = job(COLLEGE_A, "Preview Drive");

        mvc.perform(get("/api/v1/learner/drives/" + own.getId() + "/company-preview")
                        .header("Authorization", "Bearer " + learnerToken()))
                .andExpect(status().isNotFound());
    }
}
