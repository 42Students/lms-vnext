package com._42students.lms.integration;

import com._42students.lms.model.Job;
import com._42students.lms.repository.JobRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Core state-changing paths of the TPO drive workspace.
 */
@Transactional
@Rollback
class TpoWorkspaceCoreMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 106601;
    private static final int COLLEGE_B = 106602;
    private static final int TPO_A = 106611;
    private static final int LEARNER_A = 106621;
    private static final int LEARNER_FOREIGN = 106622;
    private static final int APP_A = 106631;

    @Autowired
    private JobRepository jobRepository;

    // Every MockMvc request joins this test's transaction, so JPA writes still pending at the end of a request (a real
    // request would flush them on commit) must be flushed before JDBC assertions read the table.
    @javax.persistence.PersistenceContext
    private javax.persistence.EntityManager entityManager;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Workspace College A");
        seedCollege(COLLEGE_B, "Workspace College B");
        seedFaculty(TPO_A, COLLEGE_A, "WorkspaceOfficer");
        jdbc.update("update faculty set faculty_type = 14 where id = ?", TPO_A);
        seedLearner(LEARNER_A, COLLEGE_A, "WorkspaceLearner");
        seedLearner(LEARNER_FOREIGN, COLLEGE_B, "WorkspaceForeign");
    }

    private String tpoToken() {
        return accessToken(facultyPrincipal(TPO_A, "TPO", COLLEGE_A));
    }

    private Job job(int collegeId, String title) {
        Job j = new Job();
        j.setJobTitle(title);
        j.setCompanyName("Workspace Integration Corp");
        j.setJobDescription("Workspace integration drive");
        j.setOrganizationId(1);
        j.setCollegeId(collegeId);
        j.setCreatedBy(TPO_A);
        j.setOwnerFacultyId(TPO_A);
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

    private void application(int jobId) {
        jdbc.update("insert into job_application "
                        + "(id, application_status, applied_at, organization_id, pap_requested, source, status_updated_at, "
                        + "job_id, learner_id, version, is_deleted) "
                        + "values (?, 'APPLIED', now(), 1, 0, 'INTERNAL', now(), ?, ?, 0, 0)",
                APP_A, jobId, LEARNER_A);
    }

    @Test
    void workspaceReadsOwnDriveButCannotEnumerateSiblingCollegeDrive() throws Exception {
        seedBase();
        Job own = job(COLLEGE_A, "Own Workspace Drive");
        Job foreign = job(COLLEGE_B, "Foreign Workspace Drive");
        application(own.getId());

        String applicants = mvc.perform(get("/api/v1/tpo/drives/" + own.getId() + "/workspace/applicants")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(applicants.contains(String.valueOf(APP_A)), applicants);

        mvc.perform(get("/api/v1/tpo/drives/" + foreign.getId() + "/workspace/summary")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isNotFound());
    }

    @Test
    void roundCreateReorderAndDeletePersistCoherentSequence() throws Exception {
        seedBase();
        Job j = job(COLLEGE_A, "Round Workspace Drive");

        for (String name : new String[]{"Aptitude", "Interview"}) {
            mvc.perform(post("/api/v1/tpo/drives/" + j.getId() + "/rounds")
                            .header("Authorization", "Bearer " + tpoToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"kind\":\"" + ("Aptitude".equals(name) ? "TEST" : "INTERVIEW")
                                    + "\",\"name\":\"" + name + "\",\"mode\":\"ON_CAMPUS\"}"))
                    .andExpect(status().isCreated());
        }

        java.util.List<Long> ids = jdbc.queryForList(
                "select id from job_round where job_id = ? order by seq", Long.class, j.getId());
        assertEquals(2, ids.size());

        mvc.perform(post("/api/v1/tpo/drives/" + j.getId() + "/rounds/reorder")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderedIds\":[" + ids.get(1) + "," + ids.get(0) + "]}"))
                .andExpect(status().isOk());

        assertEquals(ids.get(1), jdbc.queryForObject(
                "select id from job_round where job_id = ? and seq = 1", Long.class, j.getId()));

        mvc.perform(delete("/api/v1/tpo/drives/" + j.getId() + "/rounds/" + ids.get(1))
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isNoContent());
        entityManager.flush();

        assertEquals(1, jdbc.queryForObject(
                "select count(*) from job_round where job_id = ?", Integer.class, j.getId()));
        assertEquals(1, jdbc.queryForObject(
                "select seq from job_round where job_id = ?", Integer.class, j.getId()));
    }

    @Test
    void eligibilityOverrideCanBeSetReplacedAndRemovedButNotForForeignLearner() throws Exception {
        seedBase();
        Job j = job(COLLEGE_A, "Override Workspace Drive");

        mvc.perform(post("/api/v1/tpo/drives/" + j.getId() + "/overrides")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"learnerId\":" + LEARNER_A + ",\"type\":\"INCLUDE\","
                                + "\"reason\":\"Company approved exception\"}"))
                .andExpect(status().isOk());

        assertEquals("INCLUDE", jdbc.queryForObject(
                "select override_type from job_eligibility_override where job_id = ? and learner_id = ?",
                String.class, j.getId(), LEARNER_A));

        mvc.perform(post("/api/v1/tpo/drives/" + j.getId() + "/overrides")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"learnerId\":" + LEARNER_A + ",\"type\":\"EXCLUDE\","
                                + "\"reason\":\"Company changed decision\"}"))
                .andExpect(status().isOk());
        assertEquals("EXCLUDE", jdbc.queryForObject(
                "select override_type from job_eligibility_override where job_id = ? and learner_id = ?",
                String.class, j.getId(), LEARNER_A));

        mvc.perform(post("/api/v1/tpo/drives/" + j.getId() + "/overrides")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"learnerId\":" + LEARNER_FOREIGN + ",\"type\":\"INCLUDE\","
                                + "\"reason\":\"Tenant attack\"}"))
                .andExpect(status().isNotFound());

        mvc.perform(delete("/api/v1/tpo/drives/" + j.getId() + "/overrides/" + LEARNER_A)
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk());
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from job_eligibility_override where job_id = ? and learner_id = ?",
                Integer.class, j.getId(), LEARNER_A));
    }

    @Test
    void autoApplyTogglePersistsPerDriveWithoutTouchingSiblingDrive() throws Exception {
        seedBase();
        Job first = job(COLLEGE_A, "Auto Apply A");
        Job second = job(COLLEGE_A, "Auto Apply B");

        mvc.perform(post("/api/v1/tpo/drives/" + first.getId() + "/auto-apply")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\":true}"))
                .andExpect(status().isOk());

        assertEquals(1, jdbc.queryForObject(
                "select results_auto_apply from job where id = ?", Integer.class, first.getId()));
        assertEquals(0, jdbc.queryForObject(
                "select results_auto_apply from job where id = ?", Integer.class, second.getId()));
    }

    @Test
    void cloneCreatesFreshDraftInSameTenantCopiesRoundsButClearsSchedule() throws Exception {
        seedBase();
        Job source = job(COLLEGE_A, "Source Clone Drive");
        jdbc.update("insert into job_round "
                + "(job_id, seq, kind, name, mode, scheduled_date, venue, status, created_at, updated_at) "
                + "values (?, 1, 'INTERVIEW', 'Final Interview', 'ON_CAMPUS', now(), 'Hall A', 'SCHEDULED', now(), now())",
                source.getId());

        mvc.perform(post("/api/v1/tpo/drives/" + source.getId() + "/clone")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isCreated());

        Integer copyId = jdbc.queryForObject(
                "select id from job where college_id = ? and job_title = ? order by id desc limit 1",
                Integer.class, COLLEGE_A, "Source Clone Drive");
        assertNotEquals(source.getId(), copyId);
        assertEquals("DRAFT", jdbc.queryForObject(
                "select lifecycle_status from job where id = ?", String.class, copyId));
        assertEquals(TPO_A, jdbc.queryForObject(
                "select owner_faculty_id from job where id = ?", Integer.class, copyId));
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from job_round where job_id = ?", Integer.class, copyId));
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from job_round where job_id = ? and scheduled_date is not null",
                Integer.class, copyId));
    }

    @Test
    void cloneLeavesFinishedBatchesPastYearsAndRecordedOutsideBehindAndSaysSo() throws Exception {
        seedBase();
        int thisYear = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Kolkata")).getYear();
        jdbc.update("insert into placement_batch (batch_id, college_id, finished_at, created_at, updated_at) values (990101, ?, now(), now(), now())", COLLEGE_A);
        jdbc.update("insert into placement_batch (batch_id, college_id, created_at, updated_at) values (990102, ?, now(), now())", COLLEGE_A);
        Job source = job(COLLEGE_A, "Clone Leftovers Drive"); // recorded outside, published
        jdbc.update("update job set eligibility_json = ? where id = ?",
                "{\"batchIds\":[990101,990102],\"passingYears\":[" + (thisYear - 1) + "," + thisYear + "],\"minCgpa\":7.0}", source.getId());

        String body = mvc.perform(post("/api/v1/tpo/drives/" + source.getId() + "/clone")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        com.fasterxml.jackson.databind.JsonNode out = new com.fasterxml.jackson.databind.ObjectMapper().readTree(body);
        int copyId = out.get("id").asInt();
        assertEquals(1, out.get("droppedBatches").asInt(), "the finished batch is left out and the TPO is told");
        assertEquals(thisYear - 1, out.get("droppedPassingYears").get(0).asInt(), "last year's passing year is left out");
        assertTrue(out.get("wasRecordedOutside").asBoolean());
        assertEquals("Workspace Integration Corp · Clone Leftovers Drive", out.get("sourceName").asText());

        String elig = jdbc.queryForObject("select eligibility_json from job where id = ?", String.class, copyId);
        com.fasterxml.jackson.databind.JsonNode e = new com.fasterxml.jackson.databind.ObjectMapper().readTree(elig);
        assertEquals(1, e.get("batchIds").size());
        assertEquals(990102, e.get("batchIds").get(0).asInt(), "the batch still in placements stays");
        assertEquals(thisYear, e.get("passingYears").get(0).asInt());
        assertEquals(7.0, e.get("minCgpa").asDouble(), "the rest of the eligibility is copied");
        assertEquals(0, jdbc.queryForObject("select count(*) from job where id = ? and recorded_outside = 1", Integer.class, copyId),
                "a copy is a normal drive, never 'recorded outside'");
        assertEquals(1, jdbc.queryForObject("select count(*) from job where id = ? and is_active = 1 and is_draft = 1", Integer.class, copyId),
                "the copy starts as an active draft, like a drive made on the form");
        assertEquals(1, jdbc.queryForObject("select count(*) from tpo_audit_log where entity_id = ? and action = 'DRIVE_CLONED' and detail like 'Copied from Workspace Integration Corp%'",
                Integer.class, copyId));
    }

    @Test
    void aDraftNobodyAppliedToCanBeDeletedAndAClosedDriveCannotBeEdited() throws Exception {
        seedBase();
        Job draft = job(COLLEGE_A, "Stray Draft Drive");
        jdbc.update("update job set lifecycle_status = 'DRAFT', is_draft = 1 where id = ?", draft.getId());
        mvc.perform(delete("/api/v1/tpo/drives/" + draft.getId()).header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk());
        assertEquals(1, jdbc.queryForObject("select count(*) from job where id = ? and is_deleted = 1", Integer.class, draft.getId()));

        Job live = job(COLLEGE_A, "Live Drive Not Deletable"); // published
        mvc.perform(delete("/api/v1/tpo/drives/" + live.getId()).header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().is4xxClientError());
        assertEquals(0, jdbc.queryForObject("select count(*) from job where id = ? and is_deleted = 1", Integer.class, live.getId()));

        Job closed = job(COLLEGE_A, "Closed Drive Frozen");
        jdbc.update("update job set lifecycle_status = 'CLOSED', is_active = 0 where id = ?", closed.getId());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/tpo/drives/" + closed.getId())
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"companyName\":\"Workspace Integration Corp\",\"jobTitle\":\"Renamed After Closing\"}"))
                .andExpect(status().is4xxClientError());
        assertEquals("Closed Drive Frozen", jdbc.queryForObject("select job_title from job where id = ?", String.class, closed.getId()));
    }

    @Test
    void learnerCannotUseTpoWorkspaceMutationSurface() throws Exception {
        seedBase();
        Job j = job(COLLEGE_A, "Workspace Role Fence");
        String learner = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));

        mvc.perform(post("/api/v1/tpo/drives/" + j.getId() + "/auto-apply")
                        .header("Authorization", "Bearer " + learner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\":true}"))
                .andExpect(status().isForbidden());

        assertEquals(0, jdbc.queryForObject(
                "select results_auto_apply from job where id = ?", Integer.class, j.getId()));
    }
}
