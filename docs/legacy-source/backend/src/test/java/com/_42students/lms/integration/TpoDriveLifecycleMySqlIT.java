package com._42students.lms.integration;

import com._42students.lms.model.Job;
import com._42students.lms.repository.JobRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Placement-cell drive lifecycle integration: draft -> publish -> deadline changes -> cancel,
 * including applicant cascade and tenant/role fences.
 */
@Transactional
@Rollback
class TpoDriveLifecycleMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 102201;
    private static final int COLLEGE_B = 102202;
    private static final int TPO_A = 102211;
    private static final int LEARNER_A = 102221;
    private static final int LEARNER_B = 102222;

    @Autowired
    private JobRepository jobRepository;

    /**
     * The class-level transaction spans the MockMvc calls, so JPA updates made by TpoDriveService sit in
     * the shared persistence context until flushed; JdbcTemplate reads do not trigger an auto-flush.
     */
    @javax.persistence.PersistenceContext
    private javax.persistence.EntityManager entityManager;

    private void seedBase() {
        seedCollege(COLLEGE_A, "TPO Drive College A");
        seedCollege(COLLEGE_B, "TPO Drive College B");
        seedFaculty(TPO_A, COLLEGE_A, "PlacementOfficer");
        // TPO is ordinal 14; DB lookup and JWT now agree on the privileged faculty role.
        jdbc.update("update faculty set faculty_type = 14 where id = ?", TPO_A);
        seedLearner(LEARNER_A, COLLEGE_A, "TpoLearnerA");
        seedLearner(LEARNER_B, COLLEGE_B, "TpoLearnerB");
    }

    private String tpoToken() {
        return accessToken(facultyPrincipal(TPO_A, "TPO", COLLEGE_A));
    }

    private String draftBody(boolean withJobType) {
        return "{\"jobTitle\":\"Software Engineer\",\"companyName\":\"Integration Corp\","
                + "\"jobDescription\":\"TPO lifecycle integration drive\","
                + "\"recordedOutside\":true,\"driveMode\":\"ON_CAMPUS\","
                // Publishing also requires pay on at least one role (TpoDriveService.publishBlockers).
                + "\"roleOptions\":[{\"name\":\"Software Engineer\",\"ctcLpa\":8.5}],"
                + (withJobType ? "\"jobType\":\"Full-time\"," : "")
                + "\"applicationDeadline\":\"" + LocalDateTime.now().plusDays(5).withNano(0) + "\"}";
    }

    private int createDraft(boolean withJobType) throws Exception {
        mvc.perform(post("/api/v1/tpo/drives")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(draftBody(withJobType)))
                .andExpect(status().isCreated());
        entityManager.flush();

        Integer id = jdbc.queryForObject(
                "select id from job where college_id = ? and owner_faculty_id = ? order by id desc limit 1",
                Integer.class, COLLEGE_A, TPO_A);
        assertNotNull(id);
        return id;
    }

    @Test
    void tpoCreatesDraftWithOwnerAndTenantScopePersisted() throws Exception {
        seedBase();
        int jobId = createDraft(true);

        assertEquals("DRAFT", jdbc.queryForObject(
                "select lifecycle_status from job where id = ?", String.class, jobId));
        assertEquals(1, jdbc.queryForObject(
                "select is_draft from job where id = ?", Integer.class, jobId));
        assertEquals(1, jdbc.queryForObject(
                "select is_active from job where id = ?", Integer.class, jobId));
        assertEquals(TPO_A, jdbc.queryForObject(
                "select owner_faculty_id from job where id = ?", Integer.class, jobId));
        assertEquals(COLLEGE_A, jdbc.queryForObject(
                "select college_id from job where id = ?", Integer.class, jobId));
    }

    @Test
    void publishingRequiresJobTypeAndValidDraftCanPublish() throws Exception {
        seedBase();
        int missingType = createDraft(false);

        mvc.perform(post("/api/v1/tpo/drives/" + missingType + "/publish")
                        .param("notifyByEmail", "false")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isConflict());
        entityManager.flush();

        assertEquals("DRAFT", jdbc.queryForObject(
                "select lifecycle_status from job where id = ?", String.class, missingType));

        int valid = createDraft(true);
        mvc.perform(post("/api/v1/tpo/drives/" + valid + "/publish")
                        .param("notifyByEmail", "false")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk());
        entityManager.flush();

        assertEquals("PUBLISHED", jdbc.queryForObject(
                "select lifecycle_status from job where id = ?", String.class, valid));
        assertEquals(0, jdbc.queryForObject(
                "select is_draft from job where id = ?", Integer.class, valid));
    }

    @Test
    void extendDeadlinePersistsOnlyLaterDeadline() throws Exception {
        seedBase();
        int jobId = createDraft(true);
        mvc.perform(post("/api/v1/tpo/drives/" + jobId + "/publish")
                        .param("notifyByEmail", "false")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk());
        entityManager.flush();

        LocalDateTime oldDeadline = jdbc.queryForObject(
                "select application_deadline from job where id = ?",
                java.sql.Timestamp.class, jobId).toLocalDateTime();
        LocalDateTime later = oldDeadline.plusDays(3);

        mvc.perform(post("/api/v1/tpo/drives/" + jobId + "/extend-deadline")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newDeadline\":\"" + later.withNano(0) + "\"}"))
                .andExpect(status().isOk());
        entityManager.flush();

        LocalDateTime stored = jdbc.queryForObject(
                "select application_deadline from job where id = ?",
                java.sql.Timestamp.class, jobId).toLocalDateTime();
        assertEquals(later.withNano(0), stored.withNano(0));
    }

    @Test
    void cancelEndsOpenApplicantsAndWritesStatusHistory() throws Exception {
        seedBase();
        int jobId = createDraft(true);
        mvc.perform(post("/api/v1/tpo/drives/" + jobId + "/publish")
                        .param("notifyByEmail", "false")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk());
        entityManager.flush();

        jdbc.update("insert into job_application "
                        + "(id, application_status, applied_at, organization_id, pap_requested, source, "
                        + "status_updated_at, job_id, learner_id, version, is_deleted) "
                        + "values (102251, 'APPLIED', now(), 1, 0, 'INTERNAL', now(), ?, ?, 0, 0)",
                jobId, LEARNER_A);

        mvc.perform(post("/api/v1/tpo/drives/" + jobId + "/cancel")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Company cancelled hiring\"}"))
                .andExpect(status().isOk());
        entityManager.flush();

        assertEquals("CANCELLED", jdbc.queryForObject(
                "select lifecycle_status from job where id = ?", String.class, jobId));
        assertEquals(0, jdbc.queryForObject(
                "select is_active from job where id = ?", Integer.class, jobId));
        assertEquals("REJECTED", jdbc.queryForObject(
                "select application_status from job_application where id = 102251", String.class));
        assertEquals("Drive cancelled", jdbc.queryForObject(
                "select rejection_reason from job_application where id = 102251", String.class));
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from job_application_status_history where application_id = 102251 "
                        + "and old_status = 'APPLIED' and new_status = 'REJECTED'",
                Integer.class));
    }

    @Test
    void cancelledDriveCannotBeRepublishedOrHaveDeadlineExtended() throws Exception {
        seedBase();
        int jobId = createDraft(true);
        mvc.perform(post("/api/v1/tpo/drives/" + jobId + "/publish")
                        .param("notifyByEmail", "false")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk());
        entityManager.flush();

        mvc.perform(post("/api/v1/tpo/drives/" + jobId + "/cancel")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Cancelled for lifecycle test\"}"))
                .andExpect(status().isOk());
        entityManager.flush();

        LocalDateTime oldDeadline = jdbc.queryForObject(
                "select application_deadline from job where id = ?",
                java.sql.Timestamp.class, jobId).toLocalDateTime();

        mvc.perform(post("/api/v1/tpo/drives/" + jobId + "/publish")
                        .param("notifyByEmail", "false")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isConflict());
        entityManager.flush();

        mvc.perform(post("/api/v1/tpo/drives/" + jobId + "/extend-deadline")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newDeadline\":\"" + oldDeadline.plusDays(2).withNano(0) + "\"}"))
                .andExpect(status().isConflict());
        entityManager.flush();

        assertEquals("CANCELLED", jdbc.queryForObject(
                "select lifecycle_status from job where id = ?", String.class, jobId));
        assertEquals(oldDeadline.withNano(0), jdbc.queryForObject(
                "select application_deadline from job where id = ?",
                java.sql.Timestamp.class, jobId).toLocalDateTime().withNano(0));
    }

    @Test
    void draftDriveCannotBeClosedDirectly() throws Exception {
        seedBase();
        int jobId = createDraft(true);

        mvc.perform(post("/api/v1/tpo/drives/" + jobId + "/close")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isConflict());
        entityManager.flush();

        assertEquals("DRAFT", jdbc.queryForObject(
                "select lifecycle_status from job where id = ?", String.class, jobId));
        assertEquals(1, jdbc.queryForObject(
                "select is_active from job where id = ?", Integer.class, jobId));
    }

    @Test
    void closedDriveIsTerminalAndCannotBeCancelledOrExtended() throws Exception {
        seedBase();
        int jobId = createDraft(true);
        mvc.perform(post("/api/v1/tpo/drives/" + jobId + "/publish")
                        .param("notifyByEmail", "false")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk());
        entityManager.flush();

        mvc.perform(post("/api/v1/tpo/drives/" + jobId + "/close")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk());
        entityManager.flush();

        LocalDateTime oldDeadline = jdbc.queryForObject(
                "select application_deadline from job where id = ?",
                java.sql.Timestamp.class, jobId).toLocalDateTime();

        mvc.perform(post("/api/v1/tpo/drives/" + jobId + "/cancel")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Too late\"}"))
                .andExpect(status().isConflict());
        entityManager.flush();

        mvc.perform(post("/api/v1/tpo/drives/" + jobId + "/extend-deadline")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newDeadline\":\"" + oldDeadline.plusDays(1).withNano(0) + "\"}"))
                .andExpect(status().isConflict());
        entityManager.flush();

        assertEquals("CLOSED", jdbc.queryForObject(
                "select lifecycle_status from job where id = ?", String.class, jobId));
        assertEquals(0, jdbc.queryForObject(
                "select is_active from job where id = ?", Integer.class, jobId));
    }

    @Test
    void tpoCannotReadSiblingCollegeDriveById() throws Exception {
        seedBase();
        Job foreign = new Job();
        foreign.setJobTitle("Foreign Drive");
        foreign.setCompanyName("Other College Corp");
        foreign.setOrganizationId(1);
        foreign.setCollegeId(COLLEGE_B);
        foreign.setIsActive(true);
        foreign.setIsDraft(false);
        foreign.setScreeningVersion("v1");
        foreign.setVisibilityType("INTERNAL_ONLY");
        foreign.setLifecycleStatus("PUBLISHED");
        foreign.setDriveMode("ON_CAMPUS");
        foreign.setRecordedOutside(true);
        foreign.setCountsAsPlaced(true);
        foreign.setRequiresExternalRegistration(false);
        foreign.setResultsAutoApply(false);
        foreign.setIsDeleted(false);
        foreign = jobRepository.saveAndFlush(foreign);

        mvc.perform(get("/api/v1/tpo/drives/" + foreign.getId())
                        .header("Authorization", "Bearer " + tpoToken()))
                // TpoExceptionAdvice answers a sibling college's drive exactly like a missing one (404,
                // same body) so drive ids cannot be probed across colleges.
                .andExpect(status().isNotFound());
        entityManager.flush();
    }

    @Test
    void learnerCannotReachPlacementCellDriveManagement() throws Exception {
        seedBase();

        mvc.perform(get("/api/v1/tpo/drives")
                        .header("Authorization", "Bearer " + accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A))))
                .andExpect(status().isForbidden());
        entityManager.flush();
    }
}
