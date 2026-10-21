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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * TPO student-request decision queue integration.
 */
@Transactional
@Rollback
class TpoRequestDecisionMySqlIT extends AbstractMySqlHttpIT {

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

    private static final int COLLEGE_A = 104001;
    private static final int COLLEGE_B = 104002;
    private static final int TPO_A = 104011;
    private static final int LEARNER_A = 104021;
    private static final int LEARNER_B = 104022;
    private static final int APP_A = 104031;

    @Autowired
    private JobRepository jobRepository;

    private void seedBase() {
        seedCollege(COLLEGE_A, "TPO Requests College A");
        seedCollege(COLLEGE_B, "TPO Requests College B");
        seedFaculty(TPO_A, COLLEGE_A, "RequestOfficer");
        jdbc.update("update faculty set faculty_type = 14 where id = ?", TPO_A);
        seedLearner(LEARNER_A, COLLEGE_A, "RequestLearnerA");
        seedLearner(LEARNER_B, COLLEGE_B, "RequestLearnerB");
    }

    private String tpoToken() {
        return accessToken(facultyPrincipal(TPO_A, "TPO", COLLEGE_A));
    }

    private Job createJob() {
        Job j = new Job();
        j.setJobTitle("Request Workflow Engineer");
        j.setCompanyName("Request Integration Corp");
        j.setOrganizationId(1);
        j.setCollegeId(COLLEGE_A);
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

    private long seedWithdrawalRequest(int learnerId, Integer jobId, Integer appId) {
        jdbc.update("insert into student_request "
                        + "(learner_id, type, job_id, application_id, status, reason, created_at) "
                        + "values (?, 'WITHDRAWAL', ?, ?, 'PENDING', 'Need to withdraw', now())",
                learnerId, jobId, appId);
        return jdbc.queryForObject(
                "select id from student_request where learner_id = ? order by id desc limit 1",
                Long.class, learnerId);
    }

    @Test
    void pendingQueueIsCollegeScoped() throws Exception {
        seedBase();
        long own = seedWithdrawalRequest(LEARNER_A, null, null);
        long foreign = seedWithdrawalRequest(LEARNER_B, null, null);

        String body = mvc.perform(get("/api/v1/tpo/requests/pending")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        flushJpa();

        org.junit.jupiter.api.Assertions.assertTrue(body.contains("\"id\":" + own), body);
        org.junit.jupiter.api.Assertions.assertTrue(!body.contains("\"id\":" + foreign), body);
    }

    @Test
    void approvingWithdrawalMovesApplicationToWithdrawnAndRecordsDecision() throws Exception {
        seedBase();
        Job job = createJob();
        jdbc.update("insert into job_application "
                        + "(id, application_status, applied_at, organization_id, pap_requested, source, status_updated_at, job_id, learner_id, version, is_deleted) "
                        + "values (?, 'APPLIED', now(), 1, 0, 'INTERNAL', now(), ?, ?, 0, 0)",
                APP_A, job.getId(), LEARNER_A);
        long requestId = seedWithdrawalRequest(LEARNER_A, job.getId(), APP_A);

        mvc.perform(post("/api/v1/tpo/requests/" + requestId + "/decide")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"approve\":true,\"reason\":\"Approved by placement cell\"}"))
                .andExpect(status().isOk());
        flushJpa();

        assertEquals("APPROVED", jdbc.queryForObject(
                "select status from student_request where id = ?", String.class, requestId));
        assertEquals(TPO_A, jdbc.queryForObject(
                "select decided_by from student_request where id = ?", Integer.class, requestId));
        assertNotNull(jdbc.queryForObject(
                "select decided_at from student_request where id = ?", java.sql.Timestamp.class, requestId));
        assertEquals("WITHDRAWN", jdbc.queryForObject(
                "select application_status from job_application where id = ?", String.class, APP_A));
        assertEquals("TPO_APPROVED", jdbc.queryForObject(
                "select withdrawal_reason from job_application where id = ?", String.class, APP_A));
    }

    @Test
    void rejectingWithdrawalLeavesApplicationStateUntouched() throws Exception {
        seedBase();
        Job job = createJob();
        jdbc.update("insert into job_application "
                        + "(id, application_status, applied_at, organization_id, pap_requested, source, status_updated_at, job_id, learner_id, version, is_deleted) "
                        + "values (?, 'APPLIED', now(), 1, 0, 'INTERNAL', now(), ?, ?, 0, 0)",
                APP_A, job.getId(), LEARNER_A);
        long requestId = seedWithdrawalRequest(LEARNER_A, job.getId(), APP_A);

        mvc.perform(post("/api/v1/tpo/requests/" + requestId + "/decide")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"approve\":false,\"reason\":\"Participation required\"}"))
                .andExpect(status().isOk());
        flushJpa();

        assertEquals("REJECTED", jdbc.queryForObject(
                "select status from student_request where id = ?", String.class, requestId));
        assertEquals("APPLIED", jdbc.queryForObject(
                "select application_status from job_application where id = ?", String.class, APP_A));
    }

    @Test
    void tpoCannotDecideRequestOwnedByLearnerInSiblingCollege() throws Exception {
        seedBase();
        long requestId = seedWithdrawalRequest(LEARNER_B, null, null);

        mvc.perform(post("/api/v1/tpo/requests/" + requestId + "/decide")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"approve\":true,\"reason\":\"Attack\"}"))
                .andExpect(status().isNotFound());
        flushJpa();

        assertEquals("PENDING", jdbc.queryForObject(
                "select status from student_request where id = ?", String.class, requestId));
    }

    @Test
    void learnerCannotUseTpoRequestDecisionQueue() throws Exception {
        seedBase();
        long requestId = seedWithdrawalRequest(LEARNER_A, null, null);
        String learner = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));

        mvc.perform(get("/api/v1/tpo/requests/pending")
                        .header("Authorization", "Bearer " + learner))
                .andExpect(status().isForbidden());
        flushJpa();

        mvc.perform(post("/api/v1/tpo/requests/" + requestId + "/decide")
                        .header("Authorization", "Bearer " + learner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"approve\":true}"))
                .andExpect(status().isForbidden());
        flushJpa();

        assertEquals("PENDING", jdbc.queryForObject(
                "select status from student_request where id = ?", String.class, requestId));
    }
}
