package com._42students.lms.integration;

import com._42students.lms.model.Job;
import com._42students.lms.repository.JobRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Final residual controller families that did not already have stronger direct integration evidence:
 * admin quiz oversight, SMS operations, company administration and interview college narrowing.
 */
@Transactional
@Rollback
class ResidualAdminPlacementMySqlIT extends AbstractMySqlHttpIT {

    @javax.persistence.PersistenceContext
    private javax.persistence.EntityManager entityManager;

    private static final int COLLEGE_A = 109201;
    private static final int COLLEGE_B = 109202;
    private static final int ADMIN_A = 109211;
    private static final int LEARNER_A = 109221;
    private static final int LEARNER_B = 109222;
    private static final int DEPT_A = 109231;
    private static final int DEPT_B = 109232;
    private static final int COURSE_A = 109241;
    private static final int COURSE_B = 109242;
    private static final int APP_A = 109251;
    private static final int APP_B = 109252;
    private static final int INTERVIEW_A = 109261;
    private static final int INTERVIEW_B = 109262;

    @Autowired
    private JobRepository jobRepository;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Residual Admin College A");
        seedCollege(COLLEGE_B, "Residual Admin College B");
        seedFaculty(ADMIN_A, COLLEGE_A, "ResidualAdmin");
        seedLearner(LEARNER_A, COLLEGE_A, "ResidualLearnerA");
        seedLearner(LEARNER_B, COLLEGE_B, "ResidualLearnerB");
        seedDepartment(DEPT_A, COLLEGE_A, "Residual Dept A");
        seedDepartment(DEPT_B, COLLEGE_B, "Residual Dept B");

        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'RQA', ?, 'Residual Quiz Course A', 0, 1, 1, 1, 'residual-quiz-a-it', 0, 0)", COURSE_A, DEPT_A);
        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'RQB', ?, 'Residual Quiz Course B', 0, 1, 1, 1, 'residual-quiz-b-it', 0, 0)", COURSE_B, DEPT_B);

        for (int college : new int[]{COLLEGE_A, COLLEGE_B}) {
            jdbc.update("insert ignore into app_setting (scope_type, scope_id, setting_key, setting_value, is_deleted) "
                    + "values ('COLLEGE', ?, 'module.placements.enabled', 'true', 0)", college);
        }
    }

    private String adminToken() {
        return accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));
    }

    private void quiz(int id, int courseId, String title, String state) {
        jdbc.update("insert into quizzes "
                        + "(id, lesson_id, course_id, title, description, status, max_attempts, total_points, "
                        + "active, enabled, is_grade_published, shuffle_questions, shuffle_options, is_deleted) "
                        + "values (?, 0, ?, ?, 'Residual quiz', ?, 1, 10, 1, 1, 0, 0, 0, 0)",
                id, courseId, title, state);
    }

    private Job job(int collegeId, String title) {
        Job j = new Job();
        j.setJobTitle(title);
        j.setCompanyName("Residual Hiring Corp");
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

    private void applicationAndInterview(int appId, int interviewId, int learnerId, int jobId) {
        jdbc.update("insert into job_application "
                        + "(id, application_status, applied_at, organization_id, pap_requested, source, status_updated_at, "
                        + "job_id, learner_id, version, is_deleted) "
                        + "values (?, 'INTERVIEW', now(), 1, 0, 'INTERNAL', now(), ?, ?, 0, 0)",
                appId, jobId, learnerId);
        jdbc.update("insert into interview "
                        + "(id, organization_id, job_id, job_application_id, learner_id, interview_type, interview_status, "
                        + "scheduled_date, duration_minutes, version, is_deleted) "
                        + "values (?, 1, ?, ?, ?, 'TECHNICAL', 'SCHEDULED', ?, 60, 0, 0)",
                interviewId, jobId, appId, learnerId, Timestamp.valueOf(LocalDateTime.now().plusDays(2)));
    }

    @Test
    void adminQuizOversightShowsDraftAndPublishedOwnCollegeButNeverSiblingCollege() throws Exception {
        seedBase();
        quiz(109271, COURSE_A, "Own Draft Quiz", "DRAFT");
        quiz(109272, COURSE_A, "Own Published Quiz", "PUBLISHED");
        quiz(109273, COURSE_B, "Foreign Quiz Secret", "PUBLISHED");

        String body = mvc.perform(get("/api/v1/admin/quizzes")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("Own Draft Quiz"), body);
        assertTrue(body.contains("Own Published Quiz"), body);
        assertTrue(!body.contains("Foreign Quiz Secret"), body);
    }

    @Test
    void learnerCannotUseAdminQuizOversightOrSpoofCollegeId() throws Exception {
        seedBase();
        quiz(109274, COURSE_A, "Admin Only Quiz", "DRAFT");
        String learner = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));

        mvc.perform(get("/api/v1/admin/quizzes")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + learner))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/v1/admin/quizzes")
                        .param("collegeId", String.valueOf(COLLEGE_B))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isForbidden());
    }

    @Test
    void superAdminSmsLogSearchNormalizesFullNumberToLastFourAndPurpose() throws Exception {
        seedBase();
        jdbc.update("insert into sms_delivery_log "
                + "(purpose, recipient_suffix, status, provider_message_id, college_id, created_at) "
                + "values ('attendance.absence', '3210', 'SENT', 'provider-a', ?, now())", COLLEGE_A);
        jdbc.update("insert into sms_delivery_log "
                + "(purpose, recipient_suffix, status, provider_message_id, college_id, created_at) "
                + "values ('otp', '9999', 'FAILED', null, ?, now())", COLLEGE_B);

        String body = mvc.perform(get("/api/v1/admin/sms-log")
                        .param("recipientSuffix", "9876543210")
                        .param("purpose", "attendance.absence")
                        .header("Authorization", "Bearer " + accessToken(superAdminPrincipal())))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("3210"), body);
        assertTrue(body.contains("attendance.absence"), body);
        assertTrue(body.contains("operator accepted"), body);
        assertTrue(!body.contains("9999"), body);
        assertTrue(!body.contains("9876543210"), body);
    }

    @Test
    void collegeAdminAndLearnerCannotReadGlobalSmsDeliveryLog() throws Exception {
        seedBase();

        mvc.perform(get("/api/v1/admin/sms-log")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/v1/admin/sms-log")
                        .header("Authorization", "Bearer " + accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A))))
                .andExpect(status().isForbidden());
    }

    @Test
    void companyCreateListDeleteRestoreRoundTripIsCollegeScoped() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/admin/companies")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Residual Company\",\"website\":\"https://example.test\"}"))
                .andExpect(status().isCreated());

        Integer id = jdbc.queryForObject(
                "select id from company where college_id = ? and name = 'Residual Company'",
                Integer.class, COLLEGE_A);

        String list = mvc.perform(get("/api/v1/admin/companies")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(list.contains("Residual Company"), list);

        mvc.perform(delete("/api/v1/admin/companies/" + id)
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());
        assertEquals(1, jdbc.queryForObject("select is_deleted from company where id = ?", Integer.class, id));

        mvc.perform(post("/api/v1/admin/companies/" + id + "/restore")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());
        // The restore is a JPA save inside the test transaction: flush it before reading with plain JDBC.
        entityManager.flush();
        assertEquals(0, jdbc.queryForObject("select is_deleted from company where id = ?", Integer.class, id));
    }

    @Test
    void editingACompanyIsAuditedAsAnUpdateOnlyAndARestoreAsARestore() throws Exception {
        // College admin audit CA-H02: every edit used to write COMPANY_UPDATE and a false COMPANY_RESTORE.
        seedBase();
        mvc.perform(post("/api/v1/admin/companies")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Audited Company\",\"website\":\"https://example.test\"}"))
                .andExpect(status().isCreated());
        Integer id = jdbc.queryForObject(
                "select id from company where college_id = ? and name = 'Audited Company'", Integer.class, COLLEGE_A);

        mvc.perform(put("/api/v1/admin/companies/" + id)
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"industry\":\"Software\"}"))
                .andExpect(status().isOk());
        entityManager.flush();
        assertEquals(1, auditCount("COMPANY_UPDATE", id));
        assertEquals(0, auditCount("COMPANY_RESTORE", id));

        mvc.perform(delete("/api/v1/admin/companies/" + id)
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/admin/companies/" + id + "/restore")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());
        entityManager.flush();
        assertEquals(1, auditCount("COMPANY_UPDATE", id));
        assertEquals(1, auditCount("COMPANY_RESTORE", id));
    }

    private int auditCount(String actionKey, Integer companyId) {
        return jdbc.queryForObject(
                "select count(*) from admin_audit_log where action_key = ? and entity_type = 'company' and entity_id = ?",
                Integer.class, actionKey, String.valueOf(companyId));
    }

    @Test
    void companyAdminCannotReadOrCreateAgainstSiblingCollege() throws Exception {
        seedBase();
        jdbc.update("insert into company "
                + "(id, name, college_id, organization_id, is_deleted) "
                + "values (109281, 'Foreign Company Secret', ?, 1, 0)", COLLEGE_B);

        mvc.perform(get("/api/v1/admin/companies/109281")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isNotFound());

        mvc.perform(post("/api/v1/admin/companies")
                        .param("collegeId", String.valueOf(COLLEGE_B))
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Foreign Create Attack\"}"))
                .andExpect(status().isForbidden());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from company where name = 'Foreign Create Attack'",
                Integer.class));
    }

    @Test
    void collegeAdminCanReadOwnInterviewButSameOrganizationSiblingCollegeInterviewIsForbidden() throws Exception {
        seedBase();
        Job own = job(COLLEGE_A, "Own Interview Drive");
        Job foreign = job(COLLEGE_B, "Foreign Interview Drive");
        applicationAndInterview(APP_A, INTERVIEW_A, LEARNER_A, own.getId());
        applicationAndInterview(APP_B, INTERVIEW_B, LEARNER_B, foreign.getId());

        String ownBody = mvc.perform(get("/api/v1/interviews/" + INTERVIEW_A + "/organization/1")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(ownBody.contains("Own Interview Drive") || ownBody.contains(String.valueOf(INTERVIEW_A)), ownBody);

        mvc.perform(get("/api/v1/interviews/" + INTERVIEW_B + "/organization/1")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isForbidden());
    }

    @Test
    void learnerCannotUseAdminInterviewByIdEndpoint() throws Exception {
        seedBase();
        Job own = job(COLLEGE_A, "Learner Interview Drive");
        applicationAndInterview(APP_A, INTERVIEW_A, LEARNER_A, own.getId());

        mvc.perform(get("/api/v1/interviews/" + INTERVIEW_A + "/organization/1")
                        .header("Authorization", "Bearer " + accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A))))
                .andExpect(status().isForbidden());
    }
}
