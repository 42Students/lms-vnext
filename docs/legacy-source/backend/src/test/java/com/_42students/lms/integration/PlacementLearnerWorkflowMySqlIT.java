package com._42students.lms.integration;

import com._42students.lms.model.Job;
import com._42students.lms.repository.JobRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Learner placement workflow against real MySQL. Pins the single-row application lifecycle:
 * apply -> duplicate/idempotent apply -> withdraw -> reapply/reactivate.
 */
@Transactional
@Rollback
class PlacementLearnerWorkflowMySqlIT extends AbstractMySqlHttpIT {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * This class is @Transactional, so each MockMvc request joins the test transaction and never
     * commits; Hibernate writes dirty entities only on commit or before an overlapping JPQL query.
     * Flush first so raw-JDBC assertions see what a committed production request would have written.
     */
    /** Raw JDBC write mid-test: flush pending JPA writes first and clear afterwards so the shared persistence context does not keep serving stale entities. */
    private int syncedUpdate(String sql, Object... args) {
        entityManager.flush();
        int n = jdbc.update(sql, args);
        entityManager.clear();
        return n;
    }

    private <T> T flushedQuery(String sql, Class<T> type, Object... args) {
        entityManager.flush();
        return jdbc.queryForObject(sql, type, args);
    }

    private static final int COLLEGE_A = 100701;
    private static final int COLLEGE_B = 100702;
    private static final int LEARNER_A = 100721;
    private static final int LEARNER_B = 100722;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private com._42students.lms.security.RateLimitingService rateLimitingService;

    /**
     * Both apply rate limits (JobController's 10/hour, JobServiceImpl's 5/minute) are in-memory and outlive the rolled-back
     * test transaction; these tests apply as the same learner well over five times a minute in total, so the later ones
     * were refused by the limiter rather than by the rule they test. Each test starts from a clean limiter.
     */
    @BeforeEach
    void resetApplyRateLimits() {
        for (int learnerId : new int[]{LEARNER_A, LEARNER_B}) {
            rateLimitingService.clearAttempts("job_apply:" + learnerId);
        }
        @SuppressWarnings("unchecked")
        java.util.Map<Integer, ?> perMinute = (java.util.Map<Integer, ?>) org.springframework.test.util.ReflectionTestUtils
                .getField(com._42students.lms.service.impl.JobServiceImpl.class, "APPLY_TIMESTAMPS_BY_LEARNER");
        perMinute.remove(LEARNER_A);
        perMinute.remove(LEARNER_B);
    }

    private void seedBase() {
        seedCollege(COLLEGE_A, "Placement Workflow College A");
        seedCollege(COLLEGE_B, "Placement Workflow College B");
        seedLearner(LEARNER_A, COLLEGE_A, "PlacementLearnerA");
        seedLearner(LEARNER_B, COLLEGE_B, "PlacementLearnerB");
        // Learner placement endpoints are fenced to placement-Eligible learners (PlacementAccessFilter).
        makePlacementEligible(LEARNER_A, COLLEGE_A);
        makePlacementEligible(LEARNER_B, COLLEGE_B);

        seedDepartment(100731, COLLEGE_A, "Placement Dept A");
        seedDepartment(100732, COLLEGE_B, "Placement Dept B");

        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (100741, 'Placement Program A', 100731, 4, 0)");
        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (100742, 'Placement Program B', 100732, 4, 0)");

        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (100751, 'Placement Batch A', 100741, 0, 1, '2026-27', 'ACTIVE', now(), now())");
        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (100752, 'Placement Batch B', 100742, 0, 1, '2026-27', 'ACTIVE', now(), now())");

        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (100761, 'Placement Section A', 100741, 100751, 60, 0, 'SECTION', 0)");
        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (100762, 'Placement Section B', 100742, 100752, 60, 0, 'SECTION', 0)");

        jdbc.update("update learner set program_id = 100741, class_id = 100761 where id = ?", LEARNER_A);
        jdbc.update("update learner set program_id = 100742, class_id = 100762 where id = ?", LEARNER_B);
    }

    /** Deadlines are stored and compared in UTC (JobServiceImpl.applyToJob), so tests build them from UTC now. */
    private Job createJob(String title, int collegeId, String visibilityType, LocalDateTime deadline) {
        Job job = new Job();
        job.setJobTitle(title);
        job.setCompanyName("Integration Company");
        job.setJobDescription("Production-style API integration job");
        job.setIsActive(true);
        job.setIsDraft(false);
        job.setOrganizationId(1);
        job.setCollegeId(collegeId);
        job.setVisibilityType(visibilityType);
        job.setApplicationDeadline(deadline);
        job.setScreeningVersion("v1");
        job.setDriveMode("ON_CAMPUS");
        job.setLifecycleStatus("PUBLISHED");
        job.setRecordedOutside(false);
        job.setCountsAsPlaced(true);
        job.setRequiresExternalRegistration(false);
        job.setResultsAutoApply(false);
        job.setIsDeleted(false);
        return jobRepository.saveAndFlush(job);
    }

    private String tokenA() {
        return accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));
    }

    @Test
    void applyWithdrawAndReapplyReuseOneApplicationRow() throws Exception {
        seedBase();
        Job job = createJob("Lifecycle Engineer", COLLEGE_A, "INTERNAL_ONLY", LocalDateTime.now(java.time.ZoneOffset.UTC).plusDays(5));

        mvc.perform(post("/api/v1/jobs/" + job.getId() + "/apply/" + LEARNER_A)
                        .header("Authorization", "Bearer " + tokenA()))
                .andExpect(status().isOk());

        Integer applicationId = flushedQuery(
                "select id from job_application where learner_id = ? and job_id = ?",
                Integer.class, LEARNER_A, job.getId());
        assertNotNull(applicationId);
        assertEquals("APPLIED", flushedQuery(
                "select application_status from job_application where id = ?", String.class, applicationId));

        // Repeating apply while active is idempotent: one unique row, still APPLIED.
        mvc.perform(post("/api/v1/jobs/" + job.getId() + "/apply/" + LEARNER_A)
                        .header("Authorization", "Bearer " + tokenA()))
                .andExpect(status().isOk());
        assertEquals(1, flushedQuery(
                "select count(*) from job_application where learner_id = ? and job_id = ?",
                Integer.class, LEARNER_A, job.getId()));

        mvc.perform(post("/api/v1/jobs/applications/" + applicationId + "/withdraw/" + LEARNER_A)
                        .header("Authorization", "Bearer " + tokenA()))
                .andExpect(status().isOk());

        assertEquals("WITHDRAWN", flushedQuery(
                "select application_status from job_application where id = ?", String.class, applicationId));
        assertEquals(1, flushedQuery(
                "select is_deleted from job_application where id = ?", Integer.class, applicationId));

        // Reapply after an APPLIED-stage withdrawal revives the SAME unique row.
        mvc.perform(post("/api/v1/jobs/" + job.getId() + "/apply/" + LEARNER_A)
                        .header("Authorization", "Bearer " + tokenA()))
                .andExpect(status().isOk());

        assertEquals(1, flushedQuery(
                "select count(*) from job_application where learner_id = ? and job_id = ?",
                Integer.class, LEARNER_A, job.getId()));
        assertEquals("APPLIED", flushedQuery(
                "select application_status from job_application where id = ?", String.class, applicationId));
        assertEquals(0, flushedQuery(
                "select is_deleted from job_application where id = ?", Integer.class, applicationId));
    }

    @Test
    void shortlistedWithdrawalCannotBeUsedToRestartSamePipeline() throws Exception {
        seedBase();
        Job job = createJob("Shortlisted Withdrawal Engineer", COLLEGE_A, "INTERNAL_ONLY", LocalDateTime.now(java.time.ZoneOffset.UTC).plusDays(5));

        mvc.perform(post("/api/v1/jobs/" + job.getId() + "/apply/" + LEARNER_A)
                        .header("Authorization", "Bearer " + tokenA()))
                .andExpect(status().isOk());
        Integer applicationId = flushedQuery(
                "select id from job_application where learner_id = ? and job_id = ?",
                Integer.class, LEARNER_A, job.getId());
        syncedUpdate("update job_application set application_status = 'SHORTLISTED' where id = ?", applicationId);

        mvc.perform(post("/api/v1/jobs/applications/" + applicationId + "/withdraw/" + LEARNER_A)
                        .header("Authorization", "Bearer " + tokenA()))
                .andExpect(status().isOk());

        assertEquals("WITHDRAWN", flushedQuery(
                "select application_status from job_application where id = ?", String.class, applicationId));
        assertEquals("SHORTLISTED", flushedQuery(
                "select status_before_withdrawal from job_application where id = ?", String.class, applicationId));
        assertEquals(1, flushedQuery(
                "select is_deleted from job_application where id = ?", Integer.class, applicationId));

        mvc.perform(post("/api/v1/jobs/" + job.getId() + "/apply/" + LEARNER_A)
                        .header("Authorization", "Bearer " + tokenA()))
                .andExpect(status().isBadRequest());

        assertEquals(1, flushedQuery(
                "select count(*) from job_application where learner_id = ? and job_id = ?",
                Integer.class, LEARNER_A, job.getId()));
        assertEquals("WITHDRAWN", flushedQuery(
                "select application_status from job_application where id = ?", String.class, applicationId));
    }

    @Test
    void offeredWithdrawalConvergesToVisibleRejectedOutcomeAndCannotReapply() throws Exception {
        seedBase();
        Job job = createJob("Offered Withdrawal Engineer", COLLEGE_A, "INTERNAL_ONLY", LocalDateTime.now(java.time.ZoneOffset.UTC).plusDays(5));

        mvc.perform(post("/api/v1/jobs/" + job.getId() + "/apply/" + LEARNER_A)
                        .header("Authorization", "Bearer " + tokenA()))
                .andExpect(status().isOk());
        Integer applicationId = flushedQuery(
                "select id from job_application where learner_id = ? and job_id = ?",
                Integer.class, LEARNER_A, job.getId());
        syncedUpdate("update job_application set application_status = 'OFFERED', "
                        + "offer_letter_url = 'https://files.example.test/offer.pdf', offer_letter_sent_at = now() where id = ?",
                applicationId);

        mvc.perform(post("/api/v1/jobs/applications/" + applicationId + "/withdraw/" + LEARNER_A)
                        .header("Authorization", "Bearer " + tokenA()))
                .andExpect(status().isOk());

        assertEquals("REJECTED", flushedQuery(
                "select application_status from job_application where id = ?", String.class, applicationId));
        assertEquals("Offer declined by candidate", flushedQuery(
                "select rejection_reason from job_application where id = ?", String.class, applicationId));
        assertEquals(0, flushedQuery(
                "select is_deleted from job_application where id = ?", Integer.class, applicationId));
        assertEquals(0, flushedQuery(
                "select count(*) from job_application where id = ? and offer_letter_url is not null",
                Integer.class, applicationId));

        mvc.perform(post("/api/v1/jobs/" + job.getId() + "/apply/" + LEARNER_A)
                        .header("Authorization", "Bearer " + tokenA()))
                .andExpect(status().isBadRequest());

        assertEquals("REJECTED", flushedQuery(
                "select application_status from job_application where id = ?", String.class, applicationId));
    }

    @Test
    void learnerCannotApplyUsingAnotherLearnersIdentity() throws Exception {
        seedBase();
        Job job = createJob("Identity Boundary Engineer", COLLEGE_A, "INTERNAL_ONLY", LocalDateTime.now(java.time.ZoneOffset.UTC).plusDays(5));

        mvc.perform(post("/api/v1/jobs/" + job.getId() + "/apply/" + LEARNER_B)
                        .header("Authorization", "Bearer " + tokenA()))
                .andExpect(status().isForbidden());

        assertEquals(0, flushedQuery(
                "select count(*) from job_application where job_id = ?",
                Integer.class, job.getId()));
    }

    @Test
    void learnerCannotApplyToJobTargetedAtAnotherCollege() throws Exception {
        seedBase();
        Job job = createJob("Other College Engineer", COLLEGE_B, "INTERNAL_ONLY", LocalDateTime.now(java.time.ZoneOffset.UTC).plusDays(5));

        mvc.perform(post("/api/v1/jobs/" + job.getId() + "/apply/" + LEARNER_A)
                        .header("Authorization", "Bearer " + tokenA()))
                .andExpect(status().isBadRequest());

        assertEquals(0, flushedQuery(
                "select count(*) from job_application where learner_id = ? and job_id = ?",
                Integer.class, LEARNER_A, job.getId()));
    }

    @Test
    void expiredAndExternalOnlyJobsCannotBeAppliedToById() throws Exception {
        seedBase();
        Job expired = createJob("Expired Engineer", COLLEGE_A, "INTERNAL_ONLY", LocalDateTime.now(java.time.ZoneOffset.UTC).minusMinutes(5));
        Job external = createJob("External Only Engineer", COLLEGE_A, "EXTERNAL_ONLY", LocalDateTime.now(java.time.ZoneOffset.UTC).plusDays(5));

        mvc.perform(post("/api/v1/jobs/" + expired.getId() + "/apply/" + LEARNER_A)
                        .header("Authorization", "Bearer " + tokenA()))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/api/v1/jobs/" + external.getId() + "/apply/" + LEARNER_A)
                        .header("Authorization", "Bearer " + tokenA()))
                .andExpect(status().isBadRequest());

        assertEquals(0, flushedQuery(
                "select count(*) from job_application where learner_id = ?",
                Integer.class, LEARNER_A));
    }
}
