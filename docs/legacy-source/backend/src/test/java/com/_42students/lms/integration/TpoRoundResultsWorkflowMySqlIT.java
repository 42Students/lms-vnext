package com._42students.lms.integration;

import com._42students.lms.model.Job;
import com._42students.lms.model.tpo.JobRound;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.repository.tpo.JobRoundRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
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
 * Staged round-result integration: results stay private/pending until the placement cell applies
 * them, corrected uploads supersede stale rows, and applying results moves the application through
 * the real transition service.
 */
@Transactional
@Rollback
class TpoRoundResultsWorkflowMySqlIT extends AbstractMySqlHttpIT {

    @javax.persistence.PersistenceContext
    private javax.persistence.EntityManager flushEntityManager;

    /**
     * This class runs inside one rolled-back test transaction, so JPA writes made by the request stay in
     * the shared persistence context until flushed; flush (and clear, as a new request would start with an
     * empty context) before reading them back through JdbcTemplate.
     */
    private void flushJpa() {
        flushEntityManager.flush();
        flushEntityManager.clear();
    }

    private static final int COLLEGE_A = 102601;
    private static final int COLLEGE_B = 102602;
    private static final int TPO_A = 102611;
    private static final int LEARNER_A = 102621;
    private static final int LEARNER_B = 102622;
    private static final int APP_A = 102631;
    private static final int APP_B = 102632;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private JobRoundRepository jobRoundRepository;

    private void seedBase() {
        seedCollege(COLLEGE_A, "TPO Results College A");
        seedCollege(COLLEGE_B, "TPO Results College B");
        seedFaculty(TPO_A, COLLEGE_A, "ResultsOfficer");
        jdbc.update("update faculty set faculty_type = 14 where id = ?", TPO_A);
        seedLearner(LEARNER_A, COLLEGE_A, "ResultsLearnerA");
        seedLearner(LEARNER_B, COLLEGE_B, "ResultsLearnerB");
    }

    private String tpoToken() {
        return accessToken(facultyPrincipal(TPO_A, "TPO", COLLEGE_A));
    }

    private Job createJob(int collegeId, String title) {
        Job job = new Job();
        job.setJobTitle(title);
        job.setCompanyName("Results Integration Corp");
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

    private JobRound createRound(int jobId, String kind, String name) {
        JobRound round = new JobRound();
        round.setJobId(jobId);
        round.setSeq(1);
        round.setKind(kind);
        round.setName(name);
        round.setStatus("PENDING");
        return jobRoundRepository.saveAndFlush(round);
    }

    private void seedApplication(int appId, int jobId, int learnerId) {
        jdbc.update("insert into job_application "
                        + "(id, application_status, applied_at, organization_id, pap_requested, source, "
                        + "status_updated_at, job_id, learner_id, version, is_deleted) "
                        + "values (?, 'APPLIED', now(), 1, 0, 'INTERNAL', now(), ?, ?, 0, 0)",
                appId, jobId, learnerId);
    }

    private long stage(long roundId, int appId, String outcome, Integer rank, Double score) throws Exception {
        String body = "{\"applicationId\":" + appId + ",\"outcome\":\"" + outcome + "\""
                + (rank == null ? "" : ",\"waitlistRank\":" + rank)
                + (score == null ? "" : ",\"score\":" + score)
                + ",\"reasonCategory\":\"TECHNICAL\",\"comment\":\"integration result\",\"source\":\"TPO\"}";
        mvc.perform(post("/api/v1/tpo/rounds/" + roundId + "/results")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());
        flushJpa();

        Long id = jdbc.queryForObject(
                "select id from round_result where round_id = ? and application_id = ? order by id desc limit 1",
                Long.class, roundId, appId);
        assertNotNull(id);
        return id;
    }

    @Test
    void stagedResultPersistsAndAppearsInPendingWithoutChangingApplication() throws Exception {
        seedBase();
        Job job = createJob(COLLEGE_A, "Pending Result Engineer");
        JobRound round = createRound(job.getId(), "TEST", "Aptitude");
        seedApplication(APP_A, job.getId(), LEARNER_A);

        long resultId = stage(round.getId(), APP_A, "PASS", null, 82.5);

        assertEquals("PASS", jdbc.queryForObject(
                "select outcome from round_result where id = ?", String.class, resultId));
        assertEquals("TPO", jdbc.queryForObject(
                "select source from round_result where id = ?", String.class, resultId));
        assertEquals("APPLIED", jdbc.queryForObject(
                "select application_status from job_application where id = ?", String.class, APP_A));

        String pending = mvc.perform(get("/api/v1/tpo/rounds/" + round.getId() + "/results/pending")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        flushJpa();
        assertTrue(pending.contains("\"id\":" + resultId), pending);
    }

    @Test
    void correctedResultSupersedesEarlierPendingRow() throws Exception {
        seedBase();
        Job job = createJob(COLLEGE_A, "Corrected Result Engineer");
        JobRound round = createRound(job.getId(), "TEST", "Assessment");
        seedApplication(APP_A, job.getId(), LEARNER_A);

        long first = stage(round.getId(), APP_A, "FAIL", null, 20.0);
        long second = stage(round.getId(), APP_A, "PASS", null, 91.0);

        assertEquals(second, jdbc.queryForObject(
                "select superseded_by from round_result where id = ?", Long.class, first));

        String pending = mvc.perform(get("/api/v1/tpo/rounds/" + round.getId() + "/results/pending")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        flushJpa();
        assertTrue(pending.contains("\"id\":" + second), pending);
        assertTrue(!pending.contains("\"id\":" + first), pending);
    }

    @Test
    void applyingPassMovesAppliedCandidateThroughShortlistIntoAssessmentAndCompletesRound() throws Exception {
        seedBase();
        Job job = createJob(COLLEGE_A, "Pass Result Engineer");
        JobRound round = createRound(job.getId(), "TEST", "Technical Test");
        seedApplication(APP_A, job.getId(), LEARNER_A);
        long resultId = stage(round.getId(), APP_A, "PASS", null, 88.0);

        String response = mvc.perform(post("/api/v1/tpo/rounds/" + round.getId() + "/results/apply")
                        .param("notify", "false")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isAccepted())
                .andReturn().getResponse().getContentAsString();
        flushJpa();
        assertTrue(response.contains("\"applied\":1"), response);

        assertEquals("ASSESSMENT", jdbc.queryForObject(
                "select application_status from job_application where id = ?", String.class, APP_A));
        assertEquals(round.getId(), jdbc.queryForObject(
                "select current_round_id from job_application where id = ?", Long.class, APP_A));
        assertNotNull(jdbc.queryForObject(
                "select applied_at from round_result where id = ?", java.sql.Timestamp.class, resultId));
        assertEquals("COMPLETED", jdbc.queryForObject(
                "select status from job_round where id = ?", String.class, round.getId()));
    }

    @Test
    void applyingFailRejectsCandidateWithRoundSpecificStudentReason() throws Exception {
        seedBase();
        Job job = createJob(COLLEGE_A, "Fail Result Engineer");
        JobRound round = createRound(job.getId(), "INTERVIEW", "Final Interview");
        seedApplication(APP_A, job.getId(), LEARNER_A);
        stage(round.getId(), APP_A, "FAIL", null, 35.0);

        mvc.perform(post("/api/v1/tpo/rounds/" + round.getId() + "/results/apply")
                        .param("notify", "false")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isAccepted());
        flushJpa();

        assertEquals("REJECTED", jdbc.queryForObject(
                "select application_status from job_application where id = ?", String.class, APP_A));
        assertEquals("Not cleared: Final Interview", jdbc.queryForObject(
                "select rejection_reason from job_application where id = ?", String.class, APP_A));
    }

    @Test
    void resultCannotBeStagedForApplicationFromAnotherJobOrCollege() throws Exception {
        seedBase();
        Job own = createJob(COLLEGE_A, "Own Round Engineer");
        Job foreign = createJob(COLLEGE_B, "Foreign Application Engineer");
        JobRound ownRound = createRound(own.getId(), "TEST", "Own Test");
        seedApplication(APP_B, foreign.getId(), LEARNER_B);

        mvc.perform(post("/api/v1/tpo/rounds/" + ownRound.getId() + "/results")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"applicationId\":" + APP_B + ",\"outcome\":\"PASS\",\"source\":\"TPO\"}"))
                .andExpect(status().isNotFound());
        flushJpa();

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from round_result where round_id = ?",
                Integer.class, ownRound.getId()));
    }

    @Test
    void learnerCannotStageOrApplyPlacementResults() throws Exception {
        seedBase();
        Job job = createJob(COLLEGE_A, "Result Role Fence Engineer");
        JobRound round = createRound(job.getId(), "TEST", "Role Fence Test");
        seedApplication(APP_A, job.getId(), LEARNER_A);
        String learner = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));

        mvc.perform(post("/api/v1/tpo/rounds/" + round.getId() + "/results")
                        .header("Authorization", "Bearer " + learner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"applicationId\":" + APP_A + ",\"outcome\":\"PASS\",\"source\":\"TPO\"}"))
                .andExpect(status().isForbidden());
        flushJpa();

        mvc.perform(post("/api/v1/tpo/rounds/" + round.getId() + "/results/apply")
                        .header("Authorization", "Bearer " + learner))
                .andExpect(status().isForbidden());
        flushJpa();
    }
}
