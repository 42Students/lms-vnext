package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Placement-cell settings that feed eligibility and offer-state decisions.
 */
@Transactional
@Rollback
class TpoSettingsWorkflowMySqlIT extends AbstractMySqlHttpIT {

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

    private static final int COLLEGE_A = 106201;
    private static final int COLLEGE_B = 106202;
    private static final int TPO_A = 106211;
    private static final int TPO_B = 106212;
    private static final int LEARNER_A = 106221;

    private void seedBase() {
        seedCollege(COLLEGE_A, "TPO Settings College A");
        seedCollege(COLLEGE_B, "TPO Settings College B");
        seedFaculty(TPO_A, COLLEGE_A, "SettingsTpoA");
        seedFaculty(TPO_B, COLLEGE_B, "SettingsTpoB");
        jdbc.update("update faculty set faculty_type = 14 where id in (?, ?)", TPO_A, TPO_B);
        seedLearner(LEARNER_A, COLLEGE_A, "SettingsLearner");
    }

    private String tpoToken(int facultyId, int collegeId) {
        return accessToken(facultyPrincipal(facultyId, "TPO", collegeId));
    }

    @Test
    void placementRulesReturnSafeDefaultsWithoutCreatingRow() throws Exception {
        seedBase();

        String body = mvc.perform(get("/api/v1/tpo/settings/placement-rules")
                        .header("Authorization", "Bearer " + tpoToken(TPO_A, COLLEGE_A)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("\"countsAsPlacedAt\":\"OFFER_RELEASED\""), body);
        assertTrue(body.contains("\"maxHeldOffers\":1"), body);
        assertTrue(body.contains("\"upliftPct\":40"), body);
        assertTrue(body.contains("\"minResponseHours\":48"), body);
        assertEquals(0, flushedQuery(
                "select count(*) from college_placement_rules where college_id = ?",
                Integer.class, COLLEGE_A));
    }

    @Test
    void tpoPersistsPlacementRulesForOwnCollegeOnly() throws Exception {
        seedBase();

        mvc.perform(put("/api/v1/tpo/settings/placement-rules")
                        .header("Authorization", "Bearer " + tpoToken(TPO_A, COLLEGE_A))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"countsAsPlacedAt\":\"OFFER_ACCEPTED\",\"maxHeldOffers\":2,"
                                + "\"upliftPct\":60,\"minResponseHours\":72}"))
                .andExpect(status().isOk());

        assertEquals("OFFER_ACCEPTED", flushedQuery(
                "select counts_as_placed_at from college_placement_rules where college_id = ?",
                String.class, COLLEGE_A));
        assertEquals(2, flushedQuery(
                "select max_held_offers from college_placement_rules where college_id = ?",
                Integer.class, COLLEGE_A));
        assertEquals(60, flushedQuery(
                "select uplift_pct from college_placement_rules where college_id = ?",
                Integer.class, COLLEGE_A));
        assertEquals(72, flushedQuery(
                "select min_response_hours from college_placement_rules where college_id = ?",
                Integer.class, COLLEGE_A));
        assertEquals(0, flushedQuery(
                "select count(*) from college_placement_rules where college_id = ?",
                Integer.class, COLLEGE_B));
    }

    @Test
    void companyVisibilityBodyCannotSpoofTargetCollege() throws Exception {
        seedBase();

        mvc.perform(put("/api/v1/tpo/settings/what-companies-see")
                        .header("Authorization", "Bearer " + tpoToken(TPO_A, COLLEGE_A))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"collegeId\":" + COLLEGE_B + ",\"showCgpaExact\":true,"
                                + "\"showTenthTwelfth\":false,\"showProjectLinks\":true,"
                                + "\"showAssessmentScores\":true,\"showAttendance\":true}"))
                .andExpect(status().isOk());

        assertEquals(1, flushedQuery(
                "select count(*) from college_what_companies_see where college_id = ?",
                Integer.class, COLLEGE_A));
        assertEquals(0, flushedQuery(
                "select count(*) from college_what_companies_see where college_id = ?",
                Integer.class, COLLEGE_B));
        assertEquals(1, flushedQuery(
                "select show_cgpa_exact from college_what_companies_see where college_id = ?",
                Integer.class, COLLEGE_A));
        assertEquals(0, flushedQuery(
                "select show_tenth_twelfth from college_what_companies_see where college_id = ?",
                Integer.class, COLLEGE_A));
    }

    @Test
    void settingsReadsAreIsolatedByAuthenticatedCollege() throws Exception {
        seedBase();
        jdbc.update("insert into college_placement_rules "
                        + "(college_id, counts_as_placed_at, max_held_offers, uplift_pct, min_response_hours, version) "
                        + "values (?, 'OFFER_ACCEPTED', 3, 75, 96, 0)",
                COLLEGE_A);

        String a = mvc.perform(get("/api/v1/tpo/settings/placement-rules")
                        .header("Authorization", "Bearer " + tpoToken(TPO_A, COLLEGE_A)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(a.contains("\"maxHeldOffers\":3"), a);

        String b = mvc.perform(get("/api/v1/tpo/settings/placement-rules")
                        .header("Authorization", "Bearer " + tpoToken(TPO_B, COLLEGE_B)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(b.contains("\"maxHeldOffers\":1"), b);
        assertTrue(!b.contains("\"maxHeldOffers\":3"), b);
    }

    @Test
    void learnerCannotReadOrMutatePlacementCellSettings() throws Exception {
        seedBase();
        String learner = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));

        mvc.perform(get("/api/v1/tpo/settings/placement-rules")
                        .header("Authorization", "Bearer " + learner))
                .andExpect(status().isForbidden());

        mvc.perform(put("/api/v1/tpo/settings/placement-rules")
                        .header("Authorization", "Bearer " + learner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"maxHeldOffers\":99}"))
                .andExpect(status().isForbidden());

        assertEquals(0, flushedQuery(
                "select count(*) from college_placement_rules where college_id = ?",
                Integer.class, COLLEGE_A));
    }
}
