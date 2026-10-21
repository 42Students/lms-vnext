package com._42students.lms.integration;

import com._42students.lms.model.Job;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.search.applications.JobApplicationSearchCache;
import com._42students.lms.search.jobs.JobSearchCache;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Organization isolation for the placement v2 search caches.
 */
class PlacementSearchScopeMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 109901;
    private static final int COLLEGE_B = 109902;
    private static final int ADMIN_A = 109911;
    private static final int LEARNER_A = 109921;
    private static final int LEARNER_B = 109922;
    private static final int APP_A = 109931;
    private static final int APP_B = 109932;

    @Autowired
    private JobRepository jobs;

    @Autowired
    private JobSearchCache jobCache;

    @Autowired
    private JobApplicationSearchCache applicationCache;

    private final List<Integer> jobIds = new ArrayList<>();

    @AfterEach
    void cleanup() {
        jdbc.update("delete from job_application where id in (?, ?)", APP_A, APP_B);
        for (Integer id : jobIds) {
            jdbc.update("delete from job where id = ?", id);
        }
        jdbc.update("delete from app_setting where scope_type = 'COLLEGE' and scope_id = ? "
                + "and setting_key = 'module.placements.enabled'", COLLEGE_A);
        jdbc.update("delete from learner where id in (?, ?)", LEARNER_A, LEARNER_B);
        jdbc.update("delete from faculty where id = ?", ADMIN_A);
        jdbc.update("delete from college where id in (?, ?)", COLLEGE_A, COLLEGE_B);
        jobIds.clear();
        jobCache.refresh();
        applicationCache.refresh();
    }

    private void seedBase() {
        seedCollege(COLLEGE_A, "Search Placement Org One");
        jdbc.update("insert into college (id, name, org_id, is_deleted) "
                + "values (?, 'Search Placement Org Two', 2, 0)", COLLEGE_B);
        seedFaculty(ADMIN_A, COLLEGE_A, "PlacementSearchAdmin");
        seedLearner(LEARNER_A, COLLEGE_A, "PlacementSearchOwn");
        jdbc.update("insert into learner "
                + "(id, college_id, organization_id, first_name, last_name, roll_number, contact_mail, contact_mobile, "
                + "department, token_version, version, is_deleted, user_type) "
                + "values (?, ?, 2, 'PlacementSearchForeign', 'Integration', ?, ?, '9899999922', "
                + "'CSE', 0, 0, 0, 'LEARNER')",
                LEARNER_B, COLLEGE_B, "R" + LEARNER_B, "foreign-placement-search@example.test");
        jdbc.update("insert ignore into app_setting "
                + "(scope_type, scope_id, setting_key, setting_value, is_deleted) "
                + "values ('COLLEGE', ?, 'module.placements.enabled', 'true', 0)", COLLEGE_A);
    }

    private Job job(int orgId, int collegeId, String title, String type) {
        Job j = new Job();
        j.setJobTitle(title);
        j.setCompanyName("Search Scope Corp");
        j.setOrganizationId(orgId);
        j.setCollegeId(collegeId);
        j.setJobType(type);
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

    private void application(int id, Job job, int learnerId, int orgId) {
        jdbc.update("insert into job_application "
                        + "(id, application_status, applied_at, organization_id, pap_requested, source, status_updated_at, "
                        + "job_id, learner_id, version, is_deleted) "
                        + "values (?, 'APPLIED', now(), ?, 0, 'INTERNAL', now(), ?, ?, 0, 0)",
                id, orgId, job.getId(), learnerId);
    }

    private String adminToken() {
        return accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));
    }

    @Test
    void jobSearchAndExistsStayInsideAuthenticatedOrganization() throws Exception {
        seedBase();
        job(1, COLLEGE_A, "Own Organization Role", "OWN_TYPE");
        job(2, COLLEGE_B, "Foreign Secret Role", "FOREIGN_SECRET_TYPE");
        jobCache.refresh();

        String search = mvc.perform(get("/api/v2/jobs/search")
                        .param("query", "Role")
                        .param("limit", "50")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(search.contains("Own Organization Role"), search);
        assertTrue(!search.contains("Foreign Secret Role"), search);

        String exists = mvc.perform(get("/api/v2/jobs/exists/{jobTitle}", "Foreign Secret Role")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(exists.contains("false"), exists);
    }

    @Test
    void jobCategoriesCannotRevealForeignOrganizationJobTypes() throws Exception {
        seedBase();
        job(1, COLLEGE_A, "Own Category Role", "OWN_TYPE");
        job(2, COLLEGE_B, "Foreign Category Role", "FOREIGN_SECRET_TYPE");
        jobCache.refresh();

        String body = mvc.perform(get("/api/v2/jobs/categories")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("OWN_TYPE"), body);
        assertTrue(!body.contains("FOREIGN_SECRET_TYPE"), body);
    }

    @Test
    void jobApplicationSearchAndStatsStayInsideAuthenticatedOrganization() throws Exception {
        seedBase();
        Job own = job(1, COLLEGE_A, "Own Applications Role", "OWN_TYPE");
        Job foreign = job(2, COLLEGE_B, "Foreign Applications Role", "FOREIGN_TYPE");
        application(APP_A, own, LEARNER_A, 1);
        application(APP_B, foreign, LEARNER_B, 2);
        applicationCache.refresh();

        String search = mvc.perform(get("/api/v2/job-applications/search")
                        .param("query", "PlacementSearch")
                        .param("limit", "50")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(search.contains("PlacementSearchOwn"), search);
        assertTrue(!search.contains("PlacementSearchForeign"), search);

        String stats = mvc.perform(get("/api/v2/job-applications/stats")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(stats.contains("\"totalApplications\":1"), stats);
    }

    @Test
    void scopedCallerCannotOverrideOrganizationIdWithQueryParameter() throws Exception {
        seedBase();
        job(1, COLLEGE_A, "Own Query Param Role", "OWN_TYPE");
        job(2, COLLEGE_B, "Foreign Query Param Role", "FOREIGN_TYPE");
        jobCache.refresh();

        String body = mvc.perform(get("/api/v2/jobs/stats")
                        .param("organizationId", "2")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("\"organizationId\":1"), body);
    }
}
