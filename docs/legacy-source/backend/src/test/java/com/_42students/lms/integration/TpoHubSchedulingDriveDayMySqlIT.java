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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * TPO hub scheduling and drive-day mutation paths.
 */
@Transactional
@Rollback
class TpoHubSchedulingDriveDayMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 107601;
    private static final int COLLEGE_B = 107602;
    private static final int TPO_A = 107611;
    private static final int LEARNER_A = 107621;
    private static final int LEARNER_B = 107622;
    private static final int APP_A = 107631;
    private static final int APP_B = 107632;
    private static final long ROUND_A = 107641L;
    private static final long ROUND_B = 107642L;

    @Autowired
    private JobRepository jobRepository;

    private void seedBase() {
        seedCollege(COLLEGE_A, "TPO Hub Schedule College A");
        seedCollege(COLLEGE_B, "TPO Hub Schedule College B");
        seedFaculty(TPO_A, COLLEGE_A, "HubScheduleOfficer");
        jdbc.update("update faculty set faculty_type = 14 where id = ?", TPO_A);
        seedLearner(LEARNER_A, COLLEGE_A, "HubScheduleLearnerA");
        seedLearner(LEARNER_B, COLLEGE_B, "HubScheduleLearnerB");

        Job a = job(COLLEGE_A, "Hub Schedule Drive A");
        Job b = job(COLLEGE_B, "Hub Schedule Drive B");
        application(APP_A, a.getId(), LEARNER_A);
        application(APP_B, b.getId(), LEARNER_B);

        jdbc.update("insert into job_round "
                        + "(id, job_id, seq, kind, name, mode, scheduled_date, venue, status, created_at, updated_at) "
                        + "values (?, ?, 1, 'INTERVIEW', 'Hub Interview A', 'ON_CAMPUS', now(), 'Hall A', 'SCHEDULED', now(), now())",
                ROUND_A, a.getId());
        jdbc.update("insert into job_round "
                        + "(id, job_id, seq, kind, name, mode, scheduled_date, venue, status, created_at, updated_at) "
                        + "values (?, ?, 1, 'INTERVIEW', 'Hub Interview B', 'ON_CAMPUS', now(), 'Hall B', 'SCHEDULED', now(), now())",
                ROUND_B, b.getId());
    }

    private String tpoToken() {
        return accessToken(facultyPrincipal(TPO_A, "TPO", COLLEGE_A));
    }

    private Job job(int collegeId, String title) {
        Job j = new Job();
        j.setJobTitle(title);
        j.setCompanyName("Hub Schedule Corp");
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

    private void application(int id, int jobId, int learnerId) {
        jdbc.update("insert into job_application "
                        + "(id, application_status, applied_at, organization_id, pap_requested, source, status_updated_at, "
                        + "job_id, learner_id, version, is_deleted) "
                        + "values (?, 'INTERVIEW', now(), 1, 0, 'INTERNAL', now(), ?, ?, 0, 0)",
                id, jobId, learnerId);
    }

    @Test
    void tpoProposesAndListsConfirmedSlotWhileInvalidTimeRangeIsRejected() throws Exception {
        seedBase();
        LocalDateTime start = LocalDateTime.now().plusHours(2).withNano(0);
        LocalDateTime end = start.plusHours(1);

        mvc.perform(post("/api/v1/tpo/rounds/" + ROUND_A + "/slots")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slots\":[{\"startsAt\":\"" + start + "\",\"endsAt\":\"" + end
                                + "\",\"room\":\"Room 101\",\"capacity\":2}]}"))
                .andExpect(status().isOk());

        String body = mvc.perform(get("/api/v1/tpo/rounds/" + ROUND_A + "/slots")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(body.contains("Room 101"), body);
        assertTrue(body.contains("CONFIRMED"), body);

        mvc.perform(post("/api/v1/tpo/rounds/" + ROUND_A + "/slots")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slots\":[{\"startsAt\":\"" + end + "\",\"endsAt\":\"" + start + "\"}]}"))
                .andExpect(status().isBadRequest());

        assertEquals(1, jdbc.queryForObject(
                "select count(*) from round_slot where round_id = ?", Integer.class, ROUND_A));
    }

    @Test
    void assignmentCommitBooksApplicantAndBookedSlotCannotBeDeleted() throws Exception {
        seedBase();
        jdbc.update("insert into round_slot "
                + "(round_id, starts_at, ends_at, room, capacity, proposed_by, status) "
                + "values (?, ?, ?, 'Panel A', 1, 'TPO', 'CONFIRMED')",
                ROUND_A,
                java.sql.Timestamp.valueOf(LocalDateTime.now().plusHours(2)),
                java.sql.Timestamp.valueOf(LocalDateTime.now().plusHours(3)));
        Long slotId = jdbc.queryForObject(
                "select id from round_slot where round_id = ? order by id desc limit 1",
                Long.class, ROUND_A);

        mvc.perform(post("/api/v1/tpo/rounds/" + ROUND_A + "/assignment")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"placed\":[{\"applicationId\":" + APP_A + ",\"slotId\":" + slotId
                                + ",\"room\":\"Panel A\"}],\"notify\":false}"))
                .andExpect(status().isOk());

        assertEquals(slotId, jdbc.queryForObject(
                "select slot_id from round_assignment where round_id = ? and application_id = ?",
                Long.class, ROUND_A, APP_A));

        mvc.perform(delete("/api/v1/tpo/rounds/" + ROUND_A + "/slots/" + slotId)
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isConflict());

        assertEquals(1, jdbc.queryForObject(
                "select count(*) from round_slot where id = ?", Integer.class, slotId));
    }

    @Test
    void driveDayRosterAndSearchStayInsideCollegeRoundScope() throws Exception {
        seedBase();

        String roster = mvc.perform(get("/api/v1/tpo/drive-day/" + ROUND_A + "/roster")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(roster.contains("HubScheduleLearnerA"), roster);
        assertTrue(!roster.contains("HubScheduleLearnerB"), roster);

        String search = mvc.perform(get("/api/v1/tpo/drive-day/" + ROUND_A + "/search")
                        .param("q", "HubScheduleLearnerA")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(search.contains("HubScheduleLearnerA"), search);

        mvc.perform(get("/api/v1/tpo/drive-day/" + ROUND_B + "/roster")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isNotFound());
    }

    @Test
    void driveDayMarkPersistsAttendanceAndRejectsUnknownState() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/tpo/drive-day/" + ROUND_A + "/mark")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"applicationId\":" + APP_A + ",\"status\":\"PRESENT\",\"room\":\"Hall A\"}"))
                .andExpect(status().isOk());

        assertEquals("PRESENT", jdbc.queryForObject(
                "select status from round_attendance where round_id = ? and application_id = ?",
                String.class, ROUND_A, APP_A));

        mvc.perform(post("/api/v1/tpo/drive-day/" + ROUND_A + "/mark")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"applicationId\":" + APP_A + ",\"status\":\"TELEPORTED\"}"))
                .andExpect(status().isBadRequest());

        assertEquals("PRESENT", jdbc.queryForObject(
                "select status from round_attendance where round_id = ? and application_id = ?",
                String.class, ROUND_A, APP_A));
    }

    @Test
    void tpoDecidesOwnRescheduleRequestAndForeignRequestCannotBeTouched() throws Exception {
        seedBase();
        jdbc.update("insert into reschedule_request "
                + "(round_id, application_id, reason, preferred_times, status, created_at) "
                + "values (?, ?, 'Need later slot', 'After lunch', 'PENDING', now())", ROUND_A, APP_A);
        Long ownRequest = jdbc.queryForObject(
                "select id from reschedule_request where round_id = ? order by id desc limit 1",
                Long.class, ROUND_A);

        mvc.perform(post("/api/v1/tpo/reschedule-requests/" + ownRequest + "/decide")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"decision\":\"KEEP\",\"reply\":\"Keep the existing time\"}"))
                .andExpect(status().isOk());

        assertEquals("KEPT", jdbc.queryForObject(
                "select status from reschedule_request where id = ?", String.class, ownRequest));
        assertEquals(TPO_A, jdbc.queryForObject(
                "select decided_by from reschedule_request where id = ?", Integer.class, ownRequest));

        jdbc.update("insert into reschedule_request "
                + "(round_id, application_id, reason, status, created_at) "
                + "values (?, ?, 'Foreign request', 'PENDING', now())", ROUND_B, APP_B);
        Long foreignRequest = jdbc.queryForObject(
                "select id from reschedule_request where round_id = ? order by id desc limit 1",
                Long.class, ROUND_B);

        mvc.perform(post("/api/v1/tpo/reschedule-requests/" + foreignRequest + "/decide")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"decision\":\"KEEP\"}"))
                .andExpect(status().isNotFound());

        assertEquals("PENDING", jdbc.queryForObject(
                "select status from reschedule_request where id = ?", String.class, foreignRequest));
    }

    @Test
    void learnerCannotUseTpoHubSchedulingOrDriveDayEndpoints() throws Exception {
        seedBase();
        String learner = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));

        mvc.perform(get("/api/v1/tpo/rounds/" + ROUND_A + "/slots")
                        .header("Authorization", "Bearer " + learner))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/tpo/drive-day/" + ROUND_A + "/mark")
                        .header("Authorization", "Bearer " + learner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"applicationId\":" + APP_A + ",\"status\":\"PRESENT\"}"))
                .andExpect(status().isForbidden());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from round_attendance where round_id = ?",
                Integer.class, ROUND_A));
    }
}
