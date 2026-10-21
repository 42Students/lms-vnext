package com._42students.lms.integration;

import com._42students.lms.model.Job;
import com._42students.lms.repository.JobRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * TPO offer truth-path integration: selection -> letter -> verified release -> withdrawal.
 */
@Transactional
@Rollback
class TpoOfferWorkflowMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 102401;
    private static final int COLLEGE_B = 102402;
    private static final int TPO_A = 102411;
    private static final int LEARNER_A = 102421;
    private static final int LEARNER_B = 102422;
    private static final int APP_A = 102431;
    private static final int APP_B = 102432;

    @Autowired
    private JobRepository jobRepository;

    /**
     * The class-level transaction spans the MockMvc calls, so JPA updates made by TpoOfferService sit
     * in the shared persistence context until flushed; JdbcTemplate reads do not trigger an auto-flush.
     */
    @javax.persistence.PersistenceContext
    private javax.persistence.EntityManager entityManager;

    private void seedBase() {
        seedCollege(COLLEGE_A, "TPO Offer College A");
        seedCollege(COLLEGE_B, "TPO Offer College B");
        seedFaculty(TPO_A, COLLEGE_A, "OfferOfficer");
        jdbc.update("update faculty set faculty_type = 14 where id = ?", TPO_A);
        seedLearner(LEARNER_A, COLLEGE_A, "OfferLearnerA");
        seedLearner(LEARNER_B, COLLEGE_B, "OfferLearnerB");
    }

    private String tpoToken() {
        return accessToken(facultyPrincipal(TPO_A, "TPO", COLLEGE_A));
    }

    private Job createPublishedJob(int collegeId, String title) {
        Job job = new Job();
        job.setJobTitle(title);
        job.setCompanyName("Offer Integration Corp");
        job.setOrganizationId(1);
        job.setCollegeId(collegeId);
        job.setIsActive(true);
        job.setIsDraft(false);
        job.setScreeningVersion("v1");
        job.setVisibilityType("INTERNAL_ONLY");
        job.setLifecycleStatus("PUBLISHED");
        job.setDriveMode("ON_CAMPUS");
        job.setRecordedOutside(true);
        job.setCountsAsPlaced(true);
        job.setRequiresExternalRegistration(false);
        job.setResultsAutoApply(false);
        job.setIsDeleted(false);
        return jobRepository.saveAndFlush(job);
    }

    private void seedApplication(int appId, int jobId, int learnerId) {
        jdbc.update("insert into job_application "
                        + "(id, application_status, applied_at, organization_id, pap_requested, source, "
                        + "status_updated_at, job_id, learner_id, version, is_deleted) "
                        + "values (?, 'APPLIED', now(), 1, 0, 'INTERNAL', now(), ?, ?, 0, 0)",
                appId, jobId, learnerId);
    }

    private long recordSelection(int appId) throws Exception {
        mvc.perform(post("/api/v1/tpo/offers/record-selection")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"applicationId\":" + appId + ",\"roleOptionName\":\"Software Engineer\","
                                + "\"ctcLpa\":8.5,\"kind\":\"OFFER\"}"))
                .andExpect(status().isCreated());

        Long offerId = jdbc.queryForObject(
                "select id from job_offer where application_id = ? order by id desc limit 1",
                Long.class, appId);
        assertNotNull(offerId);
        return offerId;
    }

    @Test
    void selectionLetterAndVerificationReleaseOfferAndMoveApplicationToOffered() throws Exception {
        seedBase();
        Job job = createPublishedJob(COLLEGE_A, "Release Flow Engineer");
        seedApplication(APP_A, job.getId(), LEARNER_A);
        long offerId = recordSelection(APP_A);

        assertEquals("SELECTED", jdbc.queryForObject(
                "select status from job_offer where id = ?", String.class, offerId));

        mvc.perform(post("/api/v1/tpo/offers/" + offerId + "/letter")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"letterUrl\":\"https://files.example.test/offer.pdf\"}"))
                .andExpect(status().isOk());

        mvc.perform(post("/api/v1/tpo/offers/" + offerId + "/verify-and-release")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk());

        entityManager.flush();
        assertEquals("RELEASED", jdbc.queryForObject(
                "select status from job_offer where id = ?", String.class, offerId));
        assertEquals("https://files.example.test/offer.pdf", jdbc.queryForObject(
                "select letter_url from job_offer where id = ?", String.class, offerId));
        assertNotNull(jdbc.queryForObject(
                "select respond_by from job_offer where id = ?", java.sql.Timestamp.class, offerId));
        assertEquals("OFFERED", jdbc.queryForObject(
                "select application_status from job_application where id = ?", String.class, APP_A));
    }

    @Test
    void withdrawingReleasedOfferUnplacesApplicationToRejectedTruthfully() throws Exception {
        seedBase();
        Job job = createPublishedJob(COLLEGE_A, "Withdraw Flow Engineer");
        seedApplication(APP_A, job.getId(), LEARNER_A);
        long offerId = recordSelection(APP_A);

        mvc.perform(post("/api/v1/tpo/offers/" + offerId + "/verify-and-release")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk());

        mvc.perform(post("/api/v1/tpo/offers/" + offerId + "/withdraw")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Headcount frozen\"}"))
                .andExpect(status().isOk());

        entityManager.flush();
        assertEquals("WITHDRAWN", jdbc.queryForObject(
                "select status from job_offer where id = ?", String.class, offerId));
        assertEquals("Headcount frozen", jdbc.queryForObject(
                "select revoke_reason from job_offer where id = ?", String.class, offerId));
        assertEquals("REJECTED", jdbc.queryForObject(
                "select application_status from job_application where id = ?", String.class, APP_A));
        assertEquals("Offer withdrawn by the company", jdbc.queryForObject(
                "select rejection_reason from job_application where id = ?", String.class, APP_A));
    }

    @Test
    void tpoCannotOperateOnSiblingCollegeOffer() throws Exception {
        seedBase();
        Job foreign = createPublishedJob(COLLEGE_B, "Foreign Offer Engineer");
        seedApplication(APP_B, foreign.getId(), LEARNER_B);
        jdbc.update("insert into job_offer "
                        + "(id, application_id, kind, ctc_lpa, status, created_by_type, version, created_at, updated_at) "
                        + "values (102441, ?, 'OFFER', 7.5, 'SELECTED', 'TPO', 0, now(), now())",
                APP_B);

        mvc.perform(post("/api/v1/tpo/offers/102441/verify-and-release")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isNotFound());

        assertEquals("SELECTED", jdbc.queryForObject(
                "select status from job_offer where id = 102441", String.class));
        assertEquals("APPLIED", jdbc.queryForObject(
                "select application_status from job_application where id = ?", String.class, APP_B));
    }

    @Test
    void learnerCannotRecordSelections() throws Exception {
        seedBase();
        Job job = createPublishedJob(COLLEGE_A, "Role Fence Engineer");
        seedApplication(APP_A, job.getId(), LEARNER_A);

        mvc.perform(post("/api/v1/tpo/offers/record-selection")
                        .header("Authorization", "Bearer " + accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"applicationId\":" + APP_A + ",\"ctcLpa\":8.0,\"kind\":\"OFFER\"}"))
                .andExpect(status().isForbidden());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from job_offer where application_id = ?",
                Integer.class, APP_A));
    }
}
