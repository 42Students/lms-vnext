package com._42students.lms.integration;

import com._42students.lms.model.Job;
import com._42students.lms.repository.JobRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
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
 * Learner round schedule ownership, confirmation and reschedule-request lifecycle.
 */
@Transactional
@Rollback
class LearnerScheduleWorkflowMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE = 106001;
    private static final int FACULTY = 106011;
    private static final int LEARNER_A = 106021;
    private static final int LEARNER_B = 106022;
    private static final int APP_A = 106031;
    private static final int APP_B = 106032;
    private static final long ROUND_A = 106041L;
    private static final long ROUND_B = 106042L;
    private static final long SLOT_A = 106051L;
    private static final long SLOT_B = 106052L;

    @Autowired
    private JobRepository jobRepository;

    private void seedBase() {
        seedCollege(COLLEGE, "Learner Schedule College");
        seedFaculty(FACULTY, COLLEGE, "ScheduleFaculty");
        seedLearner(LEARNER_A, COLLEGE, "ScheduleLearnerA");
        seedLearner(LEARNER_B, COLLEGE, "ScheduleLearnerB");

        jdbc.update("insert ignore into app_setting (scope_type, scope_id, setting_key, setting_value, is_deleted) "
                + "values ('COLLEGE', ?, 'module.placements.enabled', 'true', 0)", COLLEGE);
        for (int learnerId : new int[]{LEARNER_A, LEARNER_B}) {
            jdbc.update("insert into placement_eligibility "
                    + "(college_id, scope_type, scope_id, status, decided_by_type, decided_at) "
                    + "values (?, 'LEARNER', ?, 'ELIGIBLE', 'ADMIN', now())", COLLEGE, learnerId);
        }

        Job jobA = job("Schedule Drive A");
        Job jobB = job("Schedule Drive B");
        application(APP_A, jobA.getId(), LEARNER_A);
        application(APP_B, jobB.getId(), LEARNER_B);

        jdbc.update("insert into job_round "
                        + "(id, job_id, seq, kind, name, mode, scheduled_date, venue, status, created_at, updated_at) "
                        + "values (?, ?, 1, 'INTERVIEW', 'Interview A', 'ON_CAMPUS', ?, 'Room A', 'SCHEDULED', now(), now())",
                ROUND_A, jobA.getId(), java.sql.Timestamp.valueOf(LocalDateTime.now().plusDays(2)));
        jdbc.update("insert into job_round "
                        + "(id, job_id, seq, kind, name, mode, scheduled_date, venue, status, created_at, updated_at) "
                        + "values (?, ?, 1, 'INTERVIEW', 'Interview B', 'ON_CAMPUS', ?, 'Room B', 'SCHEDULED', now(), now())",
                ROUND_B, jobB.getId(), java.sql.Timestamp.valueOf(LocalDateTime.now().plusDays(3)));

        jdbc.update("insert into round_slot "
                        + "(id, round_id, starts_at, ends_at, room, capacity, proposed_by, status) "
                        + "values (?, ?, ?, ?, 'Room A', 2, 'TPO', 'CONFIRMED')",
                SLOT_A, ROUND_A,
                java.sql.Timestamp.valueOf(LocalDateTime.now().plusDays(2).withHour(10).withMinute(0)),
                java.sql.Timestamp.valueOf(LocalDateTime.now().plusDays(2).withHour(11).withMinute(0)));
        jdbc.update("insert into round_slot "
                        + "(id, round_id, starts_at, ends_at, room, capacity, proposed_by, status) "
                        + "values (?, ?, ?, ?, 'Room B', 2, 'TPO', 'CONFIRMED')",
                SLOT_B, ROUND_B,
                java.sql.Timestamp.valueOf(LocalDateTime.now().plusDays(3).withHour(10).withMinute(0)),
                java.sql.Timestamp.valueOf(LocalDateTime.now().plusDays(3).withHour(11).withMinute(0)));

        jdbc.update("insert into round_assignment (round_id, application_id, slot_id, room, notified_at) "
                + "values (?, ?, ?, 'Room A', now())", ROUND_A, APP_A, SLOT_A);
        jdbc.update("insert into round_assignment (round_id, application_id, slot_id, room, notified_at) "
                + "values (?, ?, ?, 'Room B', now())", ROUND_B, APP_B, SLOT_B);
    }

    private Job job(String title) {
        Job j = new Job();
        j.setJobTitle(title);
        j.setCompanyName("Schedule Integration Corp");
        j.setOrganizationId(1);
        j.setCollegeId(COLLEGE);
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

    private String learnerToken(int learnerId) {
        return accessToken(learnerPrincipal(learnerId, COLLEGE));
    }

    @Test
    void learnerScheduleReturnsOnlyAuthenticatedLearnersAssignments() throws Exception {
        seedBase();

        String body = mvc.perform(get("/api/v1/learner/schedule")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_A)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("Interview A"), body);
        assertTrue(body.contains("Schedule Drive A"), body);
        assertTrue(!body.contains("Interview B"), body);
        assertTrue(!body.contains("Schedule Drive B"), body);
    }

    @Test
    void learnerConfirmSetsConfirmationTimestampOnlyOnOwnRoundAssignment() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/learner/schedule/rounds/" + ROUND_A + "/confirm")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_A)))
                .andExpect(status().isOk());

        assertNotNull(jdbc.queryForObject(
                "select student_confirmed_at from round_assignment where round_id = ? and application_id = ?",
                java.sql.Timestamp.class, ROUND_A, APP_A));
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from round_assignment where round_id = ? and application_id = ? and student_confirmed_at is not null",
                Integer.class, ROUND_B, APP_B));
    }

    @Test
    void learnerCannotConfirmRoundAssignedOnlyToAnotherLearner() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/learner/schedule/rounds/" + ROUND_B + "/confirm")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_A)))
                // Another learner's round is answered exactly like a missing one (TpoExceptionAdvice: "Not found" -> 404).
                .andExpect(status().isNotFound());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from round_assignment where round_id = ? and student_confirmed_at is not null",
                Integer.class, ROUND_B));
    }

    @Test
    void learnerCreatesRescheduleRequestOnlyForRoundBelongingToOwnApplication() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/learner/schedule/rounds/" + ROUND_A + "/reschedule-request")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_A))
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Medical appointment\",\"preferredTimes\":\"After 2 PM\"}"))
                .andExpect(status().isOk());

        assertEquals(1, jdbc.queryForObject(
                "select count(*) from reschedule_request where round_id = ? and application_id = ? and status = 'PENDING'",
                Integer.class, ROUND_A, APP_A));
        assertEquals("Medical appointment", jdbc.queryForObject(
                "select reason from reschedule_request where round_id = ? and application_id = ?",
                String.class, ROUND_A, APP_A));
    }

    @Test
    void learnerCannotCreateRescheduleRequestForAnotherLearnersRound() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/learner/schedule/rounds/" + ROUND_B + "/reschedule-request")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_A))
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"IDOR\",\"preferredTimes\":\"Any\"}"))
                // Another learner's round is answered exactly like a missing one (TpoExceptionAdvice: "Not found" -> 404).
                .andExpect(status().isNotFound());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from reschedule_request where round_id = ?",
                Integer.class, ROUND_B));
    }

    @Test
    void facultyCannotUseLearnerScheduleSurface() throws Exception {
        seedBase();
        String faculty = accessToken(facultyPrincipal(FACULTY, "LECTURER", COLLEGE));

        mvc.perform(get("/api/v1/learner/schedule")
                        .header("Authorization", "Bearer " + faculty))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/learner/schedule/rounds/" + ROUND_A + "/confirm")
                        .header("Authorization", "Bearer " + faculty))
                .andExpect(status().isForbidden());
    }
}
