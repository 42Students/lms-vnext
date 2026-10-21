package com._42students.lms.integration;

import com._42students.lms.model.Job;
import com._42students.lms.repository.JobRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * Two-tab offer acceptance races. The durable invariant is one accepted placement per learner.
 */
class PlacementOfferConcurrencyMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE = 109201;
    private static final int LEARNER = 109211;
    private static final int APP_A = 109221;
    private static final int APP_B = 109222;

    @Autowired
    private JobRepository jobs;

    private final List<Integer> jobIds = new ArrayList<>();

    @AfterEach
    void cleanup() {
        jdbc.update("delete from notification where application_id in (?, ?)", APP_A, APP_B);
        jdbc.update("delete from job_offer where application_id in (?, ?)", APP_A, APP_B);
        jdbc.update("delete from job_application_status_history where application_id in (?, ?)", APP_A, APP_B);
        jdbc.update("delete from interview where job_application_id in (?, ?)", APP_A, APP_B);
        jdbc.update("delete from job_application where id in (?, ?)", APP_A, APP_B);
        for (Integer jobId : jobIds) {
            jdbc.update("delete from job_round where job_id = ?", jobId);
            jdbc.update("delete from job where id = ?", jobId);
        }
        jdbc.update("delete from placement_eligibility where college_id = ?", COLLEGE);
        jdbc.update("delete from tpo_bell where college_id = ?", COLLEGE);
        jdbc.update("delete from tpo_audit_log where college_id = ?", COLLEGE);
        jdbc.update("delete from app_setting where scope_type = 'COLLEGE' and scope_id = ?", COLLEGE);
        jdbc.update("delete from learner where id = ?", LEARNER);
        jdbc.update("delete from college where id = ?", COLLEGE);
        jobIds.clear();
    }

    private void seedBase() {
        seedCollege(COLLEGE, "Offer Race College");
        seedLearner(LEARNER, COLLEGE, "OfferRaceLearner");
        // Learner placement endpoints are fenced to placement-Eligible learners (PlacementAccessFilter).
        makePlacementEligible(LEARNER, COLLEGE);
    }

    private Job job(String title) {
        Job j = new Job();
        j.setJobTitle(title);
        j.setCompanyName("Offer Race Corp");
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
        Job saved = jobs.saveAndFlush(j);
        jobIds.add(saved.getId());
        return saved;
    }

    private void application(int id, int jobId) {
        jdbc.update("insert into job_application "
                        + "(id, application_status, applied_at, organization_id, pap_requested, source, status_updated_at, "
                        + "job_id, learner_id, version, is_deleted, offer_letter_url, offer_letter_sent_at) "
                        + "values (?, 'OFFERED', now(), 1, 0, 'INTERNAL', now(), ?, ?, 0, 0, "
                        + "'https://files.example.test/offer.pdf', now())",
                id, jobId, LEARNER);
    }

    private long offer(int applicationId) {
        jdbc.update("insert into job_offer "
                        + "(application_id, kind, role_option_name, ctc_lpa, status, created_by_type, created_at, updated_at, version) "
                        + "values (?, 'OFFER', 'Engineer', 9.50, 'RELEASED', 'TPO', now(), now(), 0)",
                applicationId);
        return jdbc.queryForObject(
                "select id from job_offer where application_id = ? order by id desc limit 1",
                Long.class, applicationId);
    }

    @Test
    void twoDifferentOffersAcceptedAtSameTimeLeaveExactlyOneHiredApplication() throws Exception {
        seedBase();
        Job a = job("Race Offer A");
        Job b = job("Race Offer B");
        application(APP_A, a.getId());
        application(APP_B, b.getId());
        long offerA = offer(APP_A);
        long offerB = offer(APP_B);
        String token = accessToken(learnerPrincipal(LEARNER, COLLEGE));

        List<Integer> statuses = runTogether(List.of(
                acceptRequest(offerA, token),
                acceptRequest(offerB, token)));

        assertEquals(1, statuses.stream().filter(s -> s == 200).count(),
                "only one concurrent offer acceptance may report success: " + statuses);
        assertTrue(statuses.stream().noneMatch(s -> s >= 500),
                "losing race must be a controlled client conflict, never a 5xx: " + statuses);
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from job_application where learner_id = ? and application_status = 'HIRED' and is_deleted = 0",
                Integer.class, LEARNER));
        assertTrue(jdbc.queryForObject(
                "select count(*) from job_application where learner_id = ? and application_status in ('REJECTED','WITHDRAWN')",
                Integer.class, LEARNER) >= 1);
    }

    @Test
    void doubleClickAcceptOnSameOfferCannotApplyTransitionTwice() throws Exception {
        seedBase();
        Job a = job("Same Offer Double Click");
        application(APP_A, a.getId());
        long offerId = offer(APP_A);
        String token = accessToken(learnerPrincipal(LEARNER, COLLEGE));

        List<Integer> statuses = runTogether(List.of(
                acceptRequest(offerId, token),
                acceptRequest(offerId, token)));

        assertEquals(1, statuses.stream().filter(s -> s == 200).count(),
                "one request wins; the stale duplicate must not also report success: " + statuses);
        assertTrue(statuses.stream().noneMatch(s -> s >= 500),
                "duplicate submission must resolve as a controlled 4xx conflict: " + statuses);
        assertEquals("HIRED", jdbc.queryForObject(
                "select application_status from job_application where id = ?", String.class, APP_A));
        assertEquals("ACCEPTED", jdbc.queryForObject(
                "select status from job_offer where id = ?", String.class, offerId));
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from job_application where id = ? and application_status = 'HIRED'",
                Integer.class, APP_A));
    }

    private MockHttpServletRequestBuilder acceptRequest(long offerId, String token) {
        return post("/api/v1/learner/offers/" + offerId + "/respond")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"accept\":true}");
    }

    private List<Integer> runTogether(List<MockHttpServletRequestBuilder> requests) throws Exception {
        CountDownLatch ready = new CountDownLatch(requests.size());
        CountDownLatch fire = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(requests.size());
        try {
            List<Future<Integer>> futures = new ArrayList<>();
            for (MockHttpServletRequestBuilder request : requests) {
                futures.add(pool.submit(() -> {
                    ready.countDown();
                    if (!fire.await(5, TimeUnit.SECONDS)) {
                        throw new IllegalStateException("race start timeout");
                    }
                    return mvc.perform(request).andReturn().getResponse().getStatus();
                }));
            }
            assertTrue(ready.await(5, TimeUnit.SECONDS));
            fire.countDown();

            List<Integer> statuses = new ArrayList<>();
            for (Future<Integer> future : futures) {
                statuses.add(future.get(20, TimeUnit.SECONDS));
            }
            return statuses;
        } finally {
            pool.shutdownNow();
        }
    }
}
