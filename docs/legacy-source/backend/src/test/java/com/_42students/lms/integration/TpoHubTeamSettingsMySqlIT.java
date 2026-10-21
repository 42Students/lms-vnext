package com._42students.lms.integration;

import com._42students.lms.model.Job;
import com._42students.lms.repository.JobRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * TPO hub team/settings/preferences/saved-view administration.
 */
@Transactional
@Rollback
class TpoHubTeamSettingsMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 107801;
    private static final int COLLEGE_B = 107802;
    private static final int TPO_A = 107811;
    private static final int FACULTY_A = 107812;
    private static final int FACULTY_REASSIGN = 107813;
    private static final int FACULTY_FOREIGN = 107814;
    private static final int LEARNER_A = 107821;
    private static final int LEARNER_APPLIED = 107822;
    private static final int LEARNER_FOREIGN = 107823;

    @Autowired
    private JobRepository jobRepository;

    private void seedBase() {
        seedCollege(COLLEGE_A, "TPO Hub Team College A");
        seedCollege(COLLEGE_B, "TPO Hub Team College B");
        seedFaculty(TPO_A, COLLEGE_A, "HubTeamOfficer");
        seedFaculty(FACULTY_A, COLLEGE_A, "HubTeamFaculty");
        seedFaculty(FACULTY_REASSIGN, COLLEGE_A, "HubTeamReassign");
        seedFaculty(FACULTY_FOREIGN, COLLEGE_B, "HubTeamForeign");
        jdbc.update("update faculty set faculty_type = 14 where id = ?", TPO_A);
        seedLearner(LEARNER_A, COLLEGE_A, "CoordinatorLearner");
        seedLearner(LEARNER_APPLIED, COLLEGE_A, "AppliedCoordinator");
        seedLearner(LEARNER_FOREIGN, COLLEGE_B, "ForeignCoordinator");
    }

    private String tpoToken() {
        return accessToken(facultyPrincipal(TPO_A, "TPO", COLLEGE_A));
    }

    private Job job(String title) {
        Job j = new Job();
        j.setJobTitle(title);
        j.setCompanyName("Hub Team Corp");
        j.setOrganizationId(1);
        j.setCollegeId(COLLEGE_A);
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

    /** The team is TPO admins only: coordinator roles were removed on 9 Oct 2026. */
    @Test
    void tpoAddsATpoAdminButRefusesCoordinatorRolesAndForeignFaculty() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/tpo/team")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"facultyId\":" + FACULTY_A + ",\"role\":\"TPO_ADMIN\"}"))
                .andExpect(status().isOk());
        assertEquals("TPO_ADMIN", jdbc.queryForObject(
                "select role from tpo_team_member where college_id = ? and faculty_id = ?",
                String.class, COLLEGE_A, FACULTY_A));

        mvc.perform(post("/api/v1/tpo/team")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"facultyId\":" + FACULTY_A + ",\"role\":\"FACULTY_COORDINATOR\"}"))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/api/v1/tpo/team")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"facultyId\":" + FACULTY_FOREIGN + ",\"role\":\"TPO_ADMIN\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void removingMemberWithOwnedWorkRequiresReassignmentAndMovesOwnershipAtomically() throws Exception {
        seedBase();
        mvc.perform(post("/api/v1/tpo/team")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"facultyId\":" + FACULTY_A + ",\"role\":\"TPO_ADMIN\"}"))
                .andExpect(status().isOk());

        jdbc.update("insert into recruiter_lead "
                + "(college_id, name, email_norm, owner_faculty_id, manual_stage, source, created_at, updated_at) "
                + "values (?, 'Owned Lead', 'owned-lead@example.com', ?, 'NEW', 'MANUAL', now(), now())",
                COLLEGE_A, FACULTY_A);
        Job j = job("Owned Team Drive");
        jdbc.update("update job set owner_faculty_id = ? where id = ?", FACULTY_A, j.getId());

        mvc.perform(post("/api/v1/tpo/team/" + FACULTY_A + "/remove")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isConflict());

        mvc.perform(post("/api/v1/tpo/team")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"facultyId\":" + FACULTY_REASSIGN + ",\"role\":\"TPO_ADMIN\"}"))
                .andExpect(status().isOk());

        mvc.perform(post("/api/v1/tpo/team/" + FACULTY_A + "/remove")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reassignTo\":" + FACULTY_REASSIGN + "}"))
                .andExpect(status().isOk());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from tpo_team_member where college_id = ? and faculty_id = ?",
                Integer.class, COLLEGE_A, FACULTY_A));
        assertEquals(FACULTY_REASSIGN, jdbc.queryForObject(
                "select owner_faculty_id from recruiter_lead where college_id = ? and email_norm = 'owned-lead@example.com'",
                Integer.class, COLLEGE_A));
        assertEquals(FACULTY_REASSIGN, jdbc.queryForObject(
                "select owner_faculty_id from job where id = ?", Integer.class, j.getId()));
    }

    @Test
    void collegeSettingsSaveNormalizesTrustedDomainsAndRejectsFreeMailOrUnsafeCaps() throws Exception {
        seedBase();

        mvc.perform(put("/api/v1/tpo/settings/college")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"smsMonthlyCap\":1200,\"trustedDomains\":[\"@Example.COM\",\"careers.example.org\"],"
                                + "\"prepThresholdPct\":70,\"recruiterDriveNeedsApproval\":false,\"recruiterAccessMonths\":12}"))
                .andExpect(status().isOk());

        String domains = jdbc.queryForObject(
                "select cast(trusted_domains_json as char) from tpo_college_settings where college_id = ?",
                String.class, COLLEGE_A);
        assertTrue(domains.contains("example.com"), domains);
        assertTrue(domains.contains("careers.example.org"), domains);
        assertEquals(1200, jdbc.queryForObject(
                "select sms_monthly_cap from tpo_college_settings where college_id = ?",
                Integer.class, COLLEGE_A));
        assertEquals(70, jdbc.queryForObject(
                "select prep_threshold_pct from tpo_college_settings where college_id = ?",
                Integer.class, COLLEGE_A));

        mvc.perform(put("/api/v1/tpo/settings/college")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"trustedDomains\":[\"gmail.com\"]}"))
                .andExpect(status().isBadRequest());

        mvc.perform(put("/api/v1/tpo/settings/college")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"smsMonthlyCap\":100001}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void personalPreferencesRoundTripOnlyForAuthenticatedTpo() throws Exception {
        seedBase();

        mvc.perform(put("/api/v1/tpo/my-preferences")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"morningDigest\":true,\"recruiterMessages\":false,\"unknown\":true}"))
                .andExpect(status().isOk());

        String body = mvc.perform(get("/api/v1/tpo/my-preferences")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("\"morningDigest\":true"), body);
        assertTrue(body.contains("\"recruiterMessages\":false"), body);
        assertTrue(!body.contains("unknown"), body);
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from tpo_user_prefs where faculty_id = ?",
                Integer.class, TPO_A));
    }

    @Test
    void savedViewsAreOwnedByCollegeAndFacultyAndInvalidScopeIsRejected() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/tpo/views")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"scope\":\"STUDENTS\",\"name\":\"Needs follow-up\","
                                + "\"filters\":{\"registration\":\"PLACEMENTS\"}}"))
                .andExpect(status().isOk());

        Long id = jdbc.queryForObject(
                "select id from tpo_saved_view where college_id = ? and faculty_id = ? and name = 'Needs follow-up'",
                Long.class, COLLEGE_A, TPO_A);

        String body = mvc.perform(get("/api/v1/tpo/views")
                        .param("scope", "STUDENTS")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(body.contains("Needs follow-up"), body);

        mvc.perform(post("/api/v1/tpo/views")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"scope\":\"ROOT_DATABASE\",\"name\":\"Bad view\",\"filters\":{}}"))
                .andExpect(status().isBadRequest());

        mvc.perform(delete("/api/v1/tpo/views/" + id)
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from tpo_saved_view where id = ?", Integer.class, id));
    }
}
