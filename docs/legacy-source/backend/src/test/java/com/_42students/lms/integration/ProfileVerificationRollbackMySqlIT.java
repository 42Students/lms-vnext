package com._42students.lms.integration;

import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.NotificationOutboxService;
import com._42students.lms.service.tpo.ProfileVerificationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.SpyBean;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;

/**
 * Fault injection across profile decision + history + notification outbox.
 */
class ProfileVerificationRollbackMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE = 109501;
    private static final int ADMIN = 109511;
    private static final int LEARNER = 109521;

    @Autowired
    private ProfileVerificationService verification;

    @SpyBean
    private NotificationOutboxService outbox;

    @AfterEach
    void cleanup() {
        jdbc.update("delete from notification_outbox where recipient_type = 'LEARNER' and recipient_id = ?", LEARNER);
        jdbc.update("delete from profile_verification_event where learner_id = ?", LEARNER);
        jdbc.update("delete from profile_verification where learner_id = ?", LEARNER);
        jdbc.update("delete from learner_academic_record where learner_id = ?", LEARNER);
        jdbc.update("delete from learner where id = ?", LEARNER);
        jdbc.update("delete from faculty where id = ?", ADMIN);
        jdbc.update("delete from college where id = ?", COLLEGE);
    }

    private UserPrincipal seedSubmittedIdentity() {
        seedCollege(COLLEGE, "Verification Rollback College");
        seedFaculty(ADMIN, COLLEGE, "VerificationRollbackAdmin");
        seedLearner(LEARNER, COLLEGE, "VerificationRollbackLearner");
        jdbc.update("insert into profile_verification "
                        + "(learner_id, section, status, submitted_snapshot, submitted_at) "
                        + "values (?, 'IDENTITY', 'SUBMITTED', "
                        + "JSON_OBJECT('aadhaarNumber','********1234','aadhaarDocument','private-doc:test/aadhaar.pdf'), now())",
                LEARNER);
        return facultyPrincipal(ADMIN, "ADMIN", COLLEGE);
    }

    private void makeOutboxFail() {
        doThrow(new RuntimeException("synthetic outbox failure"))
                .when(outbox).enqueue(
                        anyString(), anyString(), anyInt(), anyString(), any(), any(), anyBoolean());
    }

    @Test
    void verifyDecisionRollsBackWhenOutboxEnqueueFails() {
        UserPrincipal admin = seedSubmittedIdentity();
        makeOutboxFail();

        assertThrows(RuntimeException.class,
                () -> verification.verify(admin, COLLEGE, LEARNER, ProfileVerificationService.IDENTITY));

        assertEquals("SUBMITTED", jdbc.queryForObject(
                "select status from profile_verification where learner_id = ? and section = 'IDENTITY'",
                String.class, LEARNER));
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from profile_verification_event "
                        + "where learner_id = ? and section = 'IDENTITY' and action = 'VERIFIED'",
                Integer.class, LEARNER));
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from notification_outbox where recipient_type = 'LEARNER' and recipient_id = ?",
                Integer.class, LEARNER));
    }

    @Test
    void sendBackDecisionRollsBackWhenOutboxEnqueueFails() {
        UserPrincipal admin = seedSubmittedIdentity();
        makeOutboxFail();

        assertThrows(RuntimeException.class,
                () -> verification.sendBack(
                        admin, COLLEGE, LEARNER, ProfileVerificationService.IDENTITY,
                        "Please upload a clearer document"));

        assertEquals("SUBMITTED", jdbc.queryForObject(
                "select status from profile_verification where learner_id = ? and section = 'IDENTITY'",
                String.class, LEARNER));
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from profile_verification_event "
                        + "where learner_id = ? and section = 'IDENTITY' and action = 'SENT_BACK'",
                Integer.class, LEARNER));
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from notification_outbox where recipient_type = 'LEARNER' and recipient_id = ?",
                Integer.class, LEARNER));
    }
}
