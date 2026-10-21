package com._42students.lms.integration;

import com._42students.lms.model.Job;
import com._42students.lms.repository.JobRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Learner placement profile and request self-service boundaries.
 */
@Transactional
@Rollback
class LearnerPlacementSelfServiceMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 105801;
    private static final int COLLEGE_B = 105802;
    private static final int FACULTY_A = 105811;
    private static final int LEARNER_A = 105821;
    private static final int LEARNER_OTHER = 105822;
    private static final int LEARNER_FOREIGN = 105823;
    private static final int APP_A = 105831;
    private static final int APP_OTHER = 105832;

    @Autowired
    private JobRepository jobRepository;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Learner Placement Self Service A");
        seedCollege(COLLEGE_B, "Learner Placement Self Service B");
        seedFaculty(FACULTY_A, COLLEGE_A, "PlacementFaculty");
        seedLearner(LEARNER_A, COLLEGE_A, "PlacementSelfLearner");
        seedLearner(LEARNER_OTHER, COLLEGE_A, "PlacementOtherLearner");
        seedLearner(LEARNER_FOREIGN, COLLEGE_B, "PlacementForeignLearner");

        for (int collegeId : new int[]{COLLEGE_A, COLLEGE_B}) {
            jdbc.update("insert ignore into app_setting (scope_type, scope_id, setting_key, setting_value, is_deleted) "
                    + "values ('COLLEGE', ?, 'module.placements.enabled', 'true', 0)", collegeId);
        }
        for (int learnerId : new int[]{LEARNER_A, LEARNER_OTHER, LEARNER_FOREIGN}) {
            int collegeId = learnerId == LEARNER_FOREIGN ? COLLEGE_B : COLLEGE_A;
            jdbc.update("insert into placement_eligibility "
                    + "(college_id, scope_type, scope_id, status, decided_by_type, decided_at) "
                    + "values (?, 'LEARNER', ?, 'ELIGIBLE', 'ADMIN', now())", collegeId, learnerId);
        }
    }

    private String learnerToken(int learnerId, int collegeId) {
        return accessToken(learnerPrincipal(learnerId, collegeId));
    }

    private Job job(int collegeId, String title) {
        Job j = new Job();
        j.setJobTitle(title);
        j.setCompanyName("Self Service Corp");
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

    private void application(int id, int jobId, int learnerId) {
        jdbc.update("insert into job_application "
                        + "(id, application_status, applied_at, organization_id, pap_requested, source, status_updated_at, "
                        + "job_id, learner_id, version, is_deleted) "
                        + "values (?, 'APPLIED', now(), 1, 0, 'INTERNAL', now(), ?, ?, 0, 0)",
                id, jobId, learnerId);
    }

    @Test
    void academicRecordReturnsOnlyAuthenticatedLearnersVerifiedRecord() throws Exception {
        seedBase();
        jdbc.update("insert into learner_academic_record "
                        + "(learner_id, cgpa, tenth_pct, twelfth_pct, gap_years, is_lateral_entry, passing_year, source, import_batch_id, imported_at) "
                        + "values (?, ?, 91.0, 92.0, 0, 0, 2027, 'VERIFIED', 'integration-batch', now())",
                LEARNER_A, new BigDecimal("8.75"));
        jdbc.update("insert into learner_academic_record "
                        + "(learner_id, cgpa, gap_years, is_lateral_entry, source) "
                        + "values (?, 9.90, 0, 0, 'VERIFIED')",
                LEARNER_OTHER);

        String body = mvc.perform(get("/api/v1/learner/profile/academic-record")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_A, COLLEGE_A)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("\"learnerId\":" + LEARNER_A), body);
        assertTrue(body.contains("8.75"), body);
        assertTrue(body.contains("VERIFIED"), body);
        assertTrue(!body.contains("9.90"), body);
        assertTrue(!body.contains(String.valueOf(LEARNER_OTHER)), body);
    }

    @Test
    void missingAcademicRecordReturnsSelfReportedEmptyShellWithoutCreatingDatabaseRow() throws Exception {
        seedBase();

        String body = mvc.perform(get("/api/v1/learner/profile/academic-record")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_A, COLLEGE_A)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("\"learnerId\":" + LEARNER_A), body);
        assertTrue(body.contains("\"source\":\"SELF\""), body);
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from learner_academic_record where learner_id = ?",
                Integer.class, LEARNER_A));
    }

    @Test
    void learnerCreatesCorrectionRequestAndMineReturnsOnlyOwnRequests() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/learner/requests")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_A, COLLEGE_A))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"CORRECTION\",\"payload\":{\"field\":\"cgpa\",\"expected\":\"8.9\"},"
                                + "\"reason\":\"Verified marks need correction\"}"))
                .andExpect(status().isCreated());

        jdbc.update("insert into student_request "
                        + "(learner_id, type, status, reason, created_at) "
                        + "values (?, 'CORRECTION', 'PENDING', 'Other learner request', now())",
                LEARNER_OTHER);

        assertEquals(1, jdbc.queryForObject(
                "select count(*) from student_request where learner_id = ? and type = 'CORRECTION'",
                Integer.class, LEARNER_A));

        String mine = mvc.perform(get("/api/v1/learner/requests/mine")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_A, COLLEGE_A)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(mine.contains("Verified marks need correction"), mine);
        assertTrue(!mine.contains("Other learner request"), mine);
    }

    @Test
    void invalidRequestTypeIsRejectedWithoutQueueRow() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/learner/requests")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_A, COLLEGE_A))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"ARBITRARY_ADMIN_ACTION\",\"reason\":\"attack\"}"))
                .andExpect(status().isBadRequest());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from student_request where learner_id = ?",
                Integer.class, LEARNER_A));
    }

    @Test
    void learnerCannotRaiseRequestAgainstAnotherLearnersApplication() throws Exception {
        seedBase();
        Job ownCollegeJob = job(COLLEGE_A, "Ownership Request Drive");
        application(APP_OTHER, ownCollegeJob.getId(), LEARNER_OTHER);

        mvc.perform(post("/api/v1/learner/requests")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_A, COLLEGE_A))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"WITHDRAWAL\",\"jobId\":" + ownCollegeJob.getId()
                                + ",\"applicationId\":" + APP_OTHER + ",\"reason\":\"IDOR attack\"}"))
                .andExpect(status().isNotFound());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from student_request where learner_id = ?",
                Integer.class, LEARNER_A));
    }

    @Test
    void learnerCannotRaiseRequestAgainstForeignCollegeJob() throws Exception {
        seedBase();
        Job foreignJob = job(COLLEGE_B, "Foreign Request Drive");

        mvc.perform(post("/api/v1/learner/requests")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_A, COLLEGE_A))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"OFFER_EXTENSION\",\"jobId\":" + foreignJob.getId()
                                + ",\"reason\":\"Must not cross college\"}"))
                .andExpect(status().isNotFound());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from student_request where learner_id = ?",
                Integer.class, LEARNER_A));
    }

    @Test
    void facultyCannotUseLearnerPlacementProfileOrRequestSurface() throws Exception {
        seedBase();
        String faculty = accessToken(facultyPrincipal(FACULTY_A, "LECTURER", COLLEGE_A));

        mvc.perform(get("/api/v1/learner/profile/academic-record")
                        .header("Authorization", "Bearer " + faculty))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/learner/requests/mine")
                        .header("Authorization", "Bearer " + faculty))
                .andExpect(status().isForbidden());
    }
}
