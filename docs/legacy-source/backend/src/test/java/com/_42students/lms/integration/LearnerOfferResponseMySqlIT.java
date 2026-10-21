package com._42students.lms.integration;

import com._42students.lms.model.Job;
import com._42students.lms.repository.JobRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Learner offer response state machine against real MySQL.
 */
@Transactional
@Rollback
class LearnerOfferResponseMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE = 104201;
    private static final int LEARNER_A = 104221;
    private static final int LEARNER_B = 104222;
    private static final int FACULTY = 104211;
    private static final int APP_A = 104231;
    private static final int APP_OTHER = 104232;
    private static final int APP_B = 104233;

    @Autowired
    private JobRepository jobRepository;

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * This class is @Transactional, so each MockMvc request joins the test transaction and never
     * commits; Hibernate only writes its dirty entities on commit or before an overlapping JPQL query.
     * Flush first so the raw-JDBC assertions see what a committed production request would have written
     * (without this, a decline looked "not persisted" even though the service set every field).
     */
    private <T> T flushedQuery(String sql, Class<T> type, Object... args) {
        entityManager.flush();
        return jdbc.queryForObject(sql, type, args);
    }

    private void seedBase() {
        seedCollege(COLLEGE, "Learner Offer College");
        seedLearner(LEARNER_A, COLLEGE, "OfferLearnerA");
        seedLearner(LEARNER_B, COLLEGE, "OfferLearnerB");
        makePlacementEligible(LEARNER_A, COLLEGE);
        makePlacementEligible(LEARNER_B, COLLEGE);
        seedFaculty(FACULTY, COLLEGE, "OfferFaculty");
    }

    private Job job(String title) {
        Job j = new Job();
        j.setJobTitle(title);
        j.setCompanyName("Learner Offer Corp");
        j.setOrganizationId(1);
        j.setCollegeId(COLLEGE);
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

    private void application(int id, int jobId, int learnerId, String status) {
        jdbc.update("insert into job_application "
                        + "(id, application_status, applied_at, organization_id, pap_requested, source, status_updated_at, "
                        + "job_id, learner_id, version, is_deleted, offer_letter_url, offer_letter_sent_at) "
                        + "values (?, ?, now(), 1, 0, 'INTERNAL', now(), ?, ?, 0, 0, "
                        + "case when ? = 'OFFERED' then 'https://files.example.test/offer.pdf' else null end, "
                        + "case when ? = 'OFFERED' then now() else null end)",
                id, status, jobId, learnerId, status, status);
    }

    private long offer(int appId) {
        jdbc.update("insert into job_offer "
                        + "(application_id, kind, role_option_name, ctc_lpa, status, created_by_type, created_at, updated_at, version) "
                        + "values (?, 'OFFER', 'Engineer', 8.50, 'RELEASED', 'TPO', now(), now(), 0)",
                appId);
        return jdbc.queryForObject(
                "select id from job_offer where application_id = ? order by id desc limit 1",
                Long.class, appId);
    }

    private String learnerToken(int learnerId) {
        return accessToken(learnerPrincipal(learnerId, COLLEGE));
    }

    @Test
    void acceptingOwnReleasedOfferMovesOfferToAcceptedAndApplicationToHired() throws Exception {
        seedBase();
        Job j = job("Accept Flow");
        application(APP_A, j.getId(), LEARNER_A, "OFFERED");
        long offerId = offer(APP_A);

        mvc.perform(post("/api/v1/learner/offers/" + offerId + "/respond")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_A))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accept\":true}"))
                .andExpect(status().isOk());

        assertEquals("ACCEPTED", flushedQuery(
                "select status from job_offer where id = ?", String.class, offerId));
        assertEquals("IN_APP", flushedQuery(
                "select acceptance_channel from job_offer where id = ?", String.class, offerId));
        assertEquals("HIRED", flushedQuery(
                "select application_status from job_application where id = ?", String.class, APP_A));
    }

    @Test
    void acceptingOfferWithdrawsOtherActiveApplicationForSameLearner() throws Exception {
        seedBase();
        Job acceptedJob = job("Accepted Drive");
        Job otherJob = job("Other Active Drive");
        application(APP_A, acceptedJob.getId(), LEARNER_A, "OFFERED");
        application(APP_OTHER, otherJob.getId(), LEARNER_A, "APPLIED");
        long offerId = offer(APP_A);

        mvc.perform(post("/api/v1/learner/offers/" + offerId + "/respond")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_A))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accept\":true}"))
                .andExpect(status().isOk());

        assertEquals("HIRED", flushedQuery(
                "select application_status from job_application where id = ?", String.class, APP_A));
        assertEquals("WITHDRAWN", flushedQuery(
                "select application_status from job_application where id = ?", String.class, APP_OTHER));
    }

    @Test
    void decliningOwnOfferConvergesToRejectedAndClearsOfferLetterFields() throws Exception {
        seedBase();
        Job j = job("Decline Flow");
        application(APP_A, j.getId(), LEARNER_A, "OFFERED");
        long offerId = offer(APP_A);

        mvc.perform(post("/api/v1/learner/offers/" + offerId + "/respond")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_A))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accept\":false}"))
                .andExpect(status().isOk());

        assertEquals("DECLINED", flushedQuery(
                "select status from job_offer where id = ?", String.class, offerId));
        assertEquals("REJECTED", flushedQuery(
                "select application_status from job_application where id = ?", String.class, APP_A));
        assertEquals("Offer declined by candidate", flushedQuery(
                "select rejection_reason from job_application where id = ?", String.class, APP_A));
        assertEquals(0, flushedQuery(
                "select count(*) from job_application where id = ? and offer_letter_url is not null",
                Integer.class, APP_A));
    }

    @Test
    void acceptedOfferCannotBeRespondedToAgainFromStaleClient() throws Exception {
        seedBase();
        Job j = job("Accepted Stale Response Flow");
        application(APP_A, j.getId(), LEARNER_A, "OFFERED");
        long offerId = offer(APP_A);
        String token = learnerToken(LEARNER_A);

        mvc.perform(post("/api/v1/learner/offers/" + offerId + "/respond")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accept\":true}"))
                .andExpect(status().isOk());

        mvc.perform(post("/api/v1/learner/offers/" + offerId + "/respond")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accept\":false}"))
                .andExpect(status().isConflict());

        assertEquals("ACCEPTED", flushedQuery(
                "select status from job_offer where id = ?", String.class, offerId));
        assertEquals("HIRED", flushedQuery(
                "select application_status from job_application where id = ?", String.class, APP_A));
    }

    @Test
    void declinedOfferCannotBeAcceptedLaterFromStaleClient() throws Exception {
        seedBase();
        Job j = job("Declined Stale Response Flow");
        application(APP_A, j.getId(), LEARNER_A, "OFFERED");
        long offerId = offer(APP_A);
        String token = learnerToken(LEARNER_A);

        mvc.perform(post("/api/v1/learner/offers/" + offerId + "/respond")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accept\":false}"))
                .andExpect(status().isOk());

        mvc.perform(post("/api/v1/learner/offers/" + offerId + "/respond")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accept\":true}"))
                .andExpect(status().isConflict());

        assertEquals("DECLINED", flushedQuery(
                "select status from job_offer where id = ?", String.class, offerId));
        assertEquals("REJECTED", flushedQuery(
                "select application_status from job_application where id = ?", String.class, APP_A));
    }

    @Test
    void releasedOfferPastRespondByCannotBeAcceptedDuringSchedulerLagWindow() throws Exception {
        seedBase();
        Job j = job("Expired Response Window");
        application(APP_A, j.getId(), LEARNER_A, "OFFERED");
        long offerId = offer(APP_A);
        jdbc.update("update job_offer set respond_by = ? where id = ?",
                java.sql.Timestamp.valueOf(java.time.LocalDateTime.now().minusMinutes(1)), offerId);

        mvc.perform(post("/api/v1/learner/offers/" + offerId + "/respond")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_A))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accept\":true}"))
                .andExpect(status().isConflict());

        assertEquals("RELEASED", flushedQuery(
                "select status from job_offer where id = ?", String.class, offerId));
        assertEquals("OFFERED", flushedQuery(
                "select application_status from job_application where id = ?", String.class, APP_A));
    }

    @Test
    void learnerCannotRespondToAnotherLearnersOfferEvenWhenOfferIdIsKnown() throws Exception {
        seedBase();
        Job j = job("Ownership Flow");
        application(APP_B, j.getId(), LEARNER_B, "OFFERED");
        long offerId = offer(APP_B);

        mvc.perform(post("/api/v1/learner/offers/" + offerId + "/respond")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_A))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accept\":true}"))
                .andExpect(status().isNotFound());

        assertEquals("RELEASED", flushedQuery(
                "select status from job_offer where id = ?", String.class, offerId));
        assertEquals("OFFERED", flushedQuery(
                "select application_status from job_application where id = ?", String.class, APP_B));
    }

    @Test
    void alreadyHiredElsewhereBlocksSecondOfferAcceptance() throws Exception {
        seedBase();
        Job firstJob = job("Already Hired Drive");
        Job secondJob = job("Second Offer Drive");
        application(APP_OTHER, firstJob.getId(), LEARNER_A, "HIRED");
        application(APP_A, secondJob.getId(), LEARNER_A, "OFFERED");
        long offerId = offer(APP_A);

        mvc.perform(post("/api/v1/learner/offers/" + offerId + "/respond")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_A))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accept\":true}"))
                .andExpect(status().isNotFound());

        assertEquals("HIRED", flushedQuery(
                "select application_status from job_application where id = ?", String.class, APP_OTHER));
        assertEquals("OFFERED", flushedQuery(
                "select application_status from job_application where id = ?", String.class, APP_A));
        assertEquals("RELEASED", flushedQuery(
                "select status from job_offer where id = ?", String.class, offerId));
    }

    @Test
    void facultyCannotUseLearnerOfferResponseSurface() throws Exception {
        seedBase();
        Job j = job("Role Fence Offer");
        application(APP_A, j.getId(), LEARNER_A, "OFFERED");
        long offerId = offer(APP_A);

        mvc.perform(post("/api/v1/learner/offers/" + offerId + "/respond")
                        .header("Authorization", "Bearer " + accessToken(facultyPrincipal(FACULTY, "LECTURER", COLLEGE)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accept\":true}"))
                .andExpect(status().isForbidden());

        assertEquals("RELEASED", flushedQuery(
                "select status from job_offer where id = ?", String.class, offerId));
    }
}
