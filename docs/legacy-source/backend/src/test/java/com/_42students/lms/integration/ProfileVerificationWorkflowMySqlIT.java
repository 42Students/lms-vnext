package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Student profile-verification lifecycle through learner submit and college verifier decisions.
 */
@Transactional
@Rollback
class ProfileVerificationWorkflowMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 105001;
    private static final int COLLEGE_B = 105002;
    private static final int ADMIN_A = 105011;
    private static final int TPO_A = 105012;
    private static final int FACULTY_A = 105013;
    private static final int LEARNER_A = 105021;
    private static final int LEARNER_B = 105022;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Profile Verification College A");
        seedCollege(COLLEGE_B, "Profile Verification College B");
        seedFaculty(ADMIN_A, COLLEGE_A, "VerificationAdmin");
        seedFaculty(TPO_A, COLLEGE_A, "VerificationTpo");
        seedFaculty(FACULTY_A, COLLEGE_A, "VerificationFaculty");
        jdbc.update("update faculty set faculty_type = 14 where id = ?", TPO_A);
        seedLearner(LEARNER_A, COLLEGE_A, "VerificationLearnerA");
        seedLearner(LEARNER_B, COLLEGE_B, "VerificationLearnerB");

        jdbc.update("update learner set identity = JSON_OBJECT("
                        + "'aadhaarNumber','123412341234',"
                        + "'aadhaarUpload','org-1/college-" + COLLEGE_A + "/private-docs/user-" + LEARNER_A + "/aadhaar.pdf') "
                        + "where id = ?",
                LEARNER_A);
        jdbc.update("update learner set identity = JSON_OBJECT("
                        + "'panNumber','ABCDE1234F',"
                        + "'panUpload','org-1/college-" + COLLEGE_B + "/private-docs/user-" + LEARNER_B + "/pan.pdf') "
                        + "where id = ?",
                LEARNER_B);
    }

    private String learnerToken() {
        return accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));
    }

    private String adminToken() {
        return accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));
    }

    private void submitIdentity(int learnerId, int collegeId) throws Exception {
        mvc.perform(post("/api/v1/profile/verification/IDENTITY/submit")
                        .header("Authorization", "Bearer "
                                + accessToken(learnerPrincipal(learnerId, collegeId))))
                .andExpect(status().isOk());
    }

    @Test
    void learnerViewMasksIdentityNumberAndReportsReadyBeforeSubmission() throws Exception {
        seedBase();

        String body = mvc.perform(get("/api/v1/profile/verification")
                        .header("Authorization", "Bearer " + learnerToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("IDENTITY"), body);
        assertTrue(body.contains("READY"), body);
        assertTrue(body.contains("********1234"), body);
        assertTrue(!body.contains("123412341234"), body);
    }

    @Test
    void learnerSubmitsCompleteIdentityAndSnapshotPlusAuditEventArePersisted() throws Exception {
        seedBase();
        submitIdentity(LEARNER_A, COLLEGE_A);

        assertEquals("SUBMITTED", jdbc.queryForObject(
                "select status from profile_verification where learner_id = ? and section = 'IDENTITY'",
                String.class, LEARNER_A));
        String snapshot = jdbc.queryForObject(
                "select cast(submitted_snapshot as char) from profile_verification where learner_id = ? and section = 'IDENTITY'",
                String.class, LEARNER_A);
        assertTrue(snapshot.contains("********1234"), snapshot);
        assertTrue(!snapshot.contains("123412341234"), snapshot);
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from profile_verification_event where learner_id = ? and section = 'IDENTITY' and action = 'SUBMITTED'",
                Integer.class, LEARNER_A));
    }

    @Test
    void adminQueueSeesOwnCollegeSubmissionAndVerifyCompletesState() throws Exception {
        seedBase();
        submitIdentity(LEARNER_A, COLLEGE_A);
        submitIdentity(LEARNER_B, COLLEGE_B);

        String queue = mvc.perform(get("/api/v1/profile-verification/queue")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(queue.contains(String.valueOf(LEARNER_A)), queue);
        assertTrue(!queue.contains(String.valueOf(LEARNER_B)), queue);

        mvc.perform(post("/api/v1/profile-verification/students/" + LEARNER_A + "/IDENTITY/verify")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());

        assertEquals("VERIFIED", jdbc.queryForObject(
                "select status from profile_verification where learner_id = ? and section = 'IDENTITY'",
                String.class, LEARNER_A));
        assertNotNull(jdbc.queryForObject(
                "select verified_at from profile_verification where learner_id = ? and section = 'IDENTITY'",
                java.sql.Timestamp.class, LEARNER_A));
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from profile_verification_event where learner_id = ? and action = 'VERIFIED'",
                Integer.class, LEARNER_A));
    }

    @Test
    void adminSendBackFirstSubmissionPersistsReasonAndLearnerSeesSentBackState() throws Exception {
        seedBase();
        submitIdentity(LEARNER_A, COLLEGE_A);

        mvc.perform(post("/api/v1/profile-verification/students/" + LEARNER_A + "/IDENTITY/send-back")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Upload a clearer identity document\"}"))
                .andExpect(status().isOk());

        assertEquals("SENT_BACK", jdbc.queryForObject(
                "select status from profile_verification where learner_id = ? and section = 'IDENTITY'",
                String.class, LEARNER_A));
        assertEquals("Upload a clearer identity document", jdbc.queryForObject(
                "select note from profile_verification where learner_id = ? and section = 'IDENTITY'",
                String.class, LEARNER_A));

        String mine = mvc.perform(get("/api/v1/profile/verification")
                        .header("Authorization", "Bearer " + learnerToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(mine.contains("SENT_BACK"), mine);
        assertTrue(mine.contains("Upload a clearer identity document"), mine);
    }

    @Test
    void sentBackIdentityCanBeResubmittedAndClearsDecisionNote() throws Exception {
        seedBase();
        submitIdentity(LEARNER_A, COLLEGE_A);

        mvc.perform(post("/api/v1/profile-verification/students/" + LEARNER_A + "/IDENTITY/send-back")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Please resubmit the identity document\"}"))
                .andExpect(status().isOk());

        jdbc.update("update learner set identity = JSON_SET(identity, '$.aadhaarUpload', ?) where id = ?",
                "org-1/college-" + COLLEGE_A + "/private-docs/user-" + LEARNER_A + "/aadhaar-v2.pdf",
                LEARNER_A);

        submitIdentity(LEARNER_A, COLLEGE_A);

        assertEquals("SUBMITTED", jdbc.queryForObject(
                "select status from profile_verification where learner_id = ? and section = 'IDENTITY'",
                String.class, LEARNER_A));
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from profile_verification where learner_id = ? and section = 'IDENTITY' and note is not null",
                Integer.class, LEARNER_A));
        assertEquals(2, jdbc.queryForObject(
                "select count(*) from profile_verification_event where learner_id = ? and section = 'IDENTITY' and action = 'SUBMITTED'",
                Integer.class, LEARNER_A));
    }

    @Test
    void verifiedSectionCannotBeVerifiedOrSentBackAgainWithoutNewSubmission() throws Exception {
        seedBase();
        submitIdentity(LEARNER_A, COLLEGE_A);

        mvc.perform(post("/api/v1/profile-verification/students/" + LEARNER_A + "/IDENTITY/verify")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());

        mvc.perform(post("/api/v1/profile-verification/students/" + LEARNER_A + "/IDENTITY/verify")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isConflict());

        mvc.perform(post("/api/v1/profile-verification/students/" + LEARNER_A + "/IDENTITY/send-back")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Late stale action\"}"))
                .andExpect(status().isConflict());

        assertEquals("VERIFIED", jdbc.queryForObject(
                "select status from profile_verification where learner_id = ? and section = 'IDENTITY'",
                String.class, LEARNER_A));
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from profile_verification_event where learner_id = ? and section = 'IDENTITY' and action = 'VERIFIED'",
                Integer.class, LEARNER_A));
    }

    @Test
    void unchangedVerifiedProfileCannotBeResubmittedAsFakeUpdate() throws Exception {
        seedBase();
        submitIdentity(LEARNER_A, COLLEGE_A);

        mvc.perform(post("/api/v1/profile-verification/students/" + LEARNER_A + "/IDENTITY/verify")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());

        mvc.perform(post("/api/v1/profile/verification/IDENTITY/submit")
                        .header("Authorization", "Bearer " + learnerToken()))
                .andExpect(status().isConflict());

        assertEquals("VERIFIED", jdbc.queryForObject(
                "select status from profile_verification where learner_id = ? and section = 'IDENTITY'",
                String.class, LEARNER_A));
    }

    @Test
    void regularFacultyHasNoVerifierAccess() throws Exception {
        seedBase();

        String access = mvc.perform(get("/api/v1/profile-verification/access")
                        .header("Authorization", "Bearer "
                                + accessToken(facultyPrincipal(FACULTY_A, "LECTURER", COLLEGE_A))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(access.contains("\"canVerify\":false"), access);

        mvc.perform(get("/api/v1/profile-verification/queue")
                        .header("Authorization", "Bearer "
                                + accessToken(facultyPrincipal(FACULTY_A, "LECTURER", COLLEGE_A))))
                .andExpect(status().isForbidden());
    }

    @Test
    void collegeAdminCanDisableTpoVerificationAndTpoAccessReflectsItImmediately() throws Exception {
        seedBase();

        mvc.perform(put("/api/v1/profile-verification/settings")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tpoCanVerify\":false}"))
                .andExpect(status().isOk());

        assertEquals(0, jdbc.queryForObject(
                "select tpo_can_verify_profiles from tpo_college_settings where college_id = ?",
                Integer.class, COLLEGE_A));

        String tpoAccess = mvc.perform(get("/api/v1/profile-verification/access")
                        .header("Authorization", "Bearer "
                                + accessToken(facultyPrincipal(TPO_A, "TPO", COLLEGE_A))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(tpoAccess.contains("\"canVerify\":false"), tpoAccess);
    }
}
