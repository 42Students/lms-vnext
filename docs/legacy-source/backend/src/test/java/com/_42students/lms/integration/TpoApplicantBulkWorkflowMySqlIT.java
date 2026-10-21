package com._42students.lms.integration;

import com._42students.lms.model.Job;
import com._42students.lms.repository.JobRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * TPO bulk applicant operations against the real transition/history stack.
 */
@Transactional
@Rollback
class TpoApplicantBulkWorkflowMySqlIT extends AbstractMySqlHttpIT {

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

    private static final int COLLEGE_A = 103801;
    private static final int COLLEGE_B = 103802;
    private static final int TPO_A = 103811;
    private static final int LEARNER_A = 103821;
    private static final int LEARNER_B = 103822;
    private static final int LEARNER_FOREIGN = 103823;
    private static final int APP_A = 103831;
    private static final int APP_B = 103832;
    private static final int APP_FOREIGN = 103833;

    @Autowired
    private JobRepository jobRepository;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Applicant Bulk College A");
        seedCollege(COLLEGE_B, "Applicant Bulk College B");
        seedFaculty(TPO_A, COLLEGE_A, "ApplicantOfficer");
        jdbc.update("update faculty set faculty_type = 14 where id = ?", TPO_A);
        seedLearner(LEARNER_A, COLLEGE_A, "ApplicantA");
        seedLearner(LEARNER_B, COLLEGE_A, "ApplicantB");
        seedLearner(LEARNER_FOREIGN, COLLEGE_B, "ApplicantForeign");
    }

    private String tpoToken() {
        return accessToken(facultyPrincipal(TPO_A, "TPO", COLLEGE_A));
    }

    private Job createJob(int collegeId, String title) {
        Job j = new Job();
        j.setJobTitle(title);
        j.setCompanyName("Bulk Integration Corp");
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

    private void seedApplication(int id, int jobId, int learnerId) {
        jdbc.update("insert into job_application "
                        + "(id, application_status, applied_at, organization_id, pap_requested, source, "
                        + "status_updated_at, job_id, learner_id, version, is_deleted) "
                        + "values (?, 'APPLIED', now(), 1, 0, 'INTERNAL', now(), ?, ?, 0, 0)",
                id, jobId, learnerId);
    }

    @Test
    void tpoListsOwnDriveApplicantsAndCannotListSiblingCollegeDrive() throws Exception {
        seedBase();
        Job own = createJob(COLLEGE_A, "Own Applicant Drive");
        Job foreign = createJob(COLLEGE_B, "Foreign Applicant Drive");
        seedApplication(APP_A, own.getId(), LEARNER_A);
        seedApplication(APP_FOREIGN, foreign.getId(), LEARNER_FOREIGN);

        String body = mvc.perform(get("/api/v1/tpo/drives/" + own.getId() + "/applicants")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        flushJpa();
        assertTrue(body.contains(String.valueOf(APP_A)), body);
        assertTrue(!body.contains(String.valueOf(APP_FOREIGN)), body);

        mvc.perform(get("/api/v1/tpo/drives/" + foreign.getId() + "/applicants")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isNotFound());
        flushJpa();
    }

    @Test
    void bulkMoveTransitionsEverySelectedApplicantAndWritesHistory() throws Exception {
        seedBase();
        Job job = createJob(COLLEGE_A, "Bulk Move Drive");
        seedApplication(APP_A, job.getId(), LEARNER_A);
        seedApplication(APP_B, job.getId(), LEARNER_B);

        String body = mvc.perform(post("/api/v1/tpo/drives/" + job.getId() + "/applicants/bulk-move")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"applicationIds\":[" + APP_A + "," + APP_B + "],\"newStatus\":\"SHORTLISTED\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        flushJpa();

        assertTrue(body.contains("undoGroupId"), body);
        assertEquals("SHORTLISTED", jdbc.queryForObject(
                "select application_status from job_application where id = ?", String.class, APP_A));
        assertEquals("SHORTLISTED", jdbc.queryForObject(
                "select application_status from job_application where id = ?", String.class, APP_B));
        assertEquals(2, jdbc.queryForObject(
                "select count(*) from job_application_status_history where application_id in (?, ?) and new_status = 'SHORTLISTED'",
                Integer.class, APP_A, APP_B));
    }

    @Test
    void bulkRejectUsesStudentSafeReasonAndRetainsInternalReason() throws Exception {
        seedBase();
        Job job = createJob(COLLEGE_A, "Bulk Reject Drive");
        seedApplication(APP_A, job.getId(), LEARNER_A);

        mvc.perform(post("/api/v1/tpo/drives/" + job.getId() + "/applicants/bulk-reject")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"applicationIds\":[" + APP_A + "],\"internalReason\":\"Company cutoff\"}"))
                .andExpect(status().isOk());
        flushJpa();

        assertEquals("REJECTED", jdbc.queryForObject(
                "select application_status from job_application where id = ?", String.class, APP_A));
        assertEquals("Not shortlisted", jdbc.queryForObject(
                "select rejection_reason from job_application where id = ?", String.class, APP_A));
        assertEquals("Company cutoff", jdbc.queryForObject(
                "select internal_reason from job_application where id = ?", String.class, APP_A));
    }

    @Test
    void craftedBulkRequestCannotIncludeApplicationFromAnotherDriveOrCollege() throws Exception {
        seedBase();
        Job own = createJob(COLLEGE_A, "Own Bulk Drive");
        Job foreign = createJob(COLLEGE_B, "Foreign Bulk Drive");
        seedApplication(APP_A, own.getId(), LEARNER_A);
        seedApplication(APP_FOREIGN, foreign.getId(), LEARNER_FOREIGN);

        mvc.perform(post("/api/v1/tpo/drives/" + own.getId() + "/applicants/bulk-move")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"applicationIds\":[" + APP_A + "," + APP_FOREIGN + "],\"newStatus\":\"SHORTLISTED\"}"))
                .andExpect(status().isNotFound());
        flushJpa();

        assertEquals("APPLIED", jdbc.queryForObject(
                "select application_status from job_application where id = ?", String.class, APP_A));
        assertEquals("APPLIED", jdbc.queryForObject(
                "select application_status from job_application where id = ?", String.class, APP_FOREIGN));
    }

    @Test
    void learnerCannotUseApplicantBulkOperations() throws Exception {
        seedBase();
        Job job = createJob(COLLEGE_A, "Applicant Role Fence");
        seedApplication(APP_A, job.getId(), LEARNER_A);

        mvc.perform(post("/api/v1/tpo/drives/" + job.getId() + "/applicants/bulk-move")
                        .header("Authorization", "Bearer " + accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"applicationIds\":[" + APP_A + "],\"newStatus\":\"SHORTLISTED\"}"))
                .andExpect(status().isForbidden());
        flushJpa();

        assertEquals("APPLIED", jdbc.queryForObject(
                "select application_status from job_application where id = ?", String.class, APP_A));
    }
}
