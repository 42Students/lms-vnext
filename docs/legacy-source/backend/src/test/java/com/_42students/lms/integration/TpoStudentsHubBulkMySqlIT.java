package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * High-signal integration for the TPO Students Hub bulk/admin surface.
 */
@Transactional
@Rollback
class TpoStudentsHubBulkMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 107001;
    private static final int COLLEGE_B = 107002;
    private static final int TPO_A = 107011;
    private static final int LEARNER_A = 107021;
    private static final int LEARNER_B = 107022;
    private static final int LEARNER_FOREIGN = 107023;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Students Hub College A");
        seedCollege(COLLEGE_B, "Students Hub College B");
        seedFaculty(TPO_A, COLLEGE_A, "StudentsHubOfficer");
        jdbc.update("update faculty set faculty_type = 14 where id = ?", TPO_A);
        seedLearner(LEARNER_A, COLLEGE_A, "HubLearnerA");
        seedLearner(LEARNER_B, COLLEGE_A, "HubLearnerB");
        seedLearner(LEARNER_FOREIGN, COLLEGE_B, "HubForeign");
        jdbc.update("update learner set roll_number = 'HUBA001' where id = ?", LEARNER_A);
        jdbc.update("update learner set roll_number = 'HUBA002' where id = ?", LEARNER_B);
        jdbc.update("update learner set roll_number = 'HUBB001' where id = ?", LEARNER_FOREIGN);
    }

    private String tpoToken() {
        return accessToken(facultyPrincipal(TPO_A, "TPO", COLLEGE_A));
    }

    @Test
    void tableAndDetailStayInsideAuthenticatedCollege() throws Exception {
        seedBase();

        String table = mvc.perform(get("/api/v1/tpo/students/table")
                        .param("everyone", "true")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(table.contains("HubLearnerA"), table);
        assertTrue(table.contains("HubLearnerB"), table);
        assertTrue(!table.contains("HubForeign"), table);

        mvc.perform(get("/api/v1/tpo/students/" + LEARNER_A + "/detail")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk());

        mvc.perform(get("/api/v1/tpo/students/" + LEARNER_FOREIGN + "/detail")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isNotFound());
    }

    @Test
    void singleAndBulkNotesPersistCreatorWhileMixedForeignBulkFailsBeforeMutation() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/tpo/students/" + LEARNER_A + "/notes")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"note\":\"Single integration note\"}"))
                .andExpect(status().isOk());

        mvc.perform(post("/api/v1/tpo/students/bulk/note")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"learnerIds\":[" + LEARNER_A + "," + LEARNER_B + "],"
                                + "\"note\":\"Bulk integration note\"}"))
                .andExpect(status().isOk());

        assertEquals(3, jdbc.queryForObject(
                "select count(*) from tpo_student_note where college_id = ?",
                Integer.class, COLLEGE_A));
        assertEquals(3, jdbc.queryForObject(
                "select count(*) from tpo_student_note where college_id = ? and created_by = ?",
                Integer.class, COLLEGE_A, TPO_A));

        mvc.perform(post("/api/v1/tpo/students/bulk/note")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"learnerIds\":[" + LEARNER_A + "," + LEARNER_FOREIGN + "],"
                                + "\"note\":\"Must not partially apply\"}"))
                .andExpect(status().isNotFound());

        assertEquals(3, jdbc.queryForObject(
                "select count(*) from tpo_student_note where college_id = ?",
                Integer.class, COLLEGE_A));
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from tpo_student_note where learner_id = ?",
                Integer.class, LEARNER_FOREIGN));
    }

    @Test
    void bulkDebarCreatesOneActiveDebarmentPerUniqueLearnerAndValidatesPolicy() throws Exception {
        seedBase();
        LocalDate until = LocalDate.now().plusDays(10);

        String body = mvc.perform(post("/api/v1/tpo/students/bulk/debar")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"learnerIds\":[" + LEARNER_A + "," + LEARNER_B + "," + LEARNER_A + "],"
                                + "\"reason\":\"Missed mandatory process\",\"untilDate\":\"" + until + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(body.contains("\"debarred\":2"), body);

        assertEquals(2, jdbc.queryForObject(
                "select count(*) from placement_debarment where learner_id in (?, ?) and lifted_at is null",
                Integer.class, LEARNER_A, LEARNER_B));

        mvc.perform(post("/api/v1/tpo/students/bulk/debar")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"learnerIds\":[" + LEARNER_A + "],\"reason\":\" \","
                                + "\"untilDate\":\"" + LocalDate.now().plusDays(2) + "\"}"))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/api/v1/tpo/students/bulk/debar")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"learnerIds\":[" + LEARNER_A + "],\"reason\":\"Past date\","
                                + "\"untilDate\":\"" + LocalDate.now().minusDays(1) + "\"}"))
                .andExpect(status().isBadRequest());

        assertEquals(2, jdbc.queryForObject(
                "select count(*) from placement_debarment where learner_id in (?, ?)",
                Integer.class, LEARNER_A, LEARNER_B));
    }

    @Test
    void academicImportPreviewReportsUnknownRollAndCommitFailsClosedUntilRowsAreClean() throws Exception {
        seedBase();
        String mixed = "{\"rows\":["
                + "{\"roll\":\"HUBA001\",\"cgpa\":8.66,\"tenthPct\":91.0,\"passingYear\":2027},"
                + "{\"roll\":\"UNKNOWN-ROLL\",\"cgpa\":9.1}]}";

        String preview = mvc.perform(post("/api/v1/tpo/students/academic-import/preview")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mixed))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(preview.contains("HUBA001"), preview);
        assertTrue(preview.contains("UNKNOWN-ROLL"), preview);
        assertTrue(preview.contains("No student with this roll"), preview);

        mvc.perform(post("/api/v1/tpo/students/academic-import")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mixed))
                .andExpect(status().isConflict());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from learner_academic_record where learner_id = ?",
                Integer.class, LEARNER_A));

        mvc.perform(post("/api/v1/tpo/students/academic-import")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rows\":[{\"roll\":\"HUBA001\",\"cgpa\":8.66,"
                                + "\"tenthPct\":91.0,\"passingYear\":2027,\"batch\":\"2027\"}]}"))
                .andExpect(status().isOk());

        assertEquals("VERIFIED", jdbc.queryForObject(
                "select source from learner_academic_record where learner_id = ?",
                String.class, LEARNER_A));
        assertNotNull(jdbc.queryForObject(
                "select import_batch_id from learner_academic_record where learner_id = ?",
                String.class, LEARNER_A));
        assertEquals("2027", jdbc.queryForObject(
                "select batch from learner_academic_record where learner_id = ?",
                String.class, LEARNER_A));
    }

    @Test
    void requestsQueueIsCollegeScopedAndPendingOnlyByDefault() throws Exception {
        seedBase();
        jdbc.update("insert into student_request (learner_id, type, status, reason, created_at) "
                + "values (?, 'CORRECTION', 'PENDING', 'Own pending request', now())", LEARNER_A);
        jdbc.update("insert into student_request (learner_id, type, status, reason, decision_reason, decided_by, decided_at, created_at) "
                + "values (?, 'CORRECTION', 'APPROVED', 'Own decided request', 'done', ?, now(), now())",
                LEARNER_B, TPO_A);
        jdbc.update("insert into student_request (learner_id, type, status, reason, created_at) "
                + "values (?, 'CORRECTION', 'PENDING', 'Foreign pending request', now())", LEARNER_FOREIGN);

        String pending = mvc.perform(get("/api/v1/tpo/students/requests-queue")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(pending.contains("Own pending request"), pending);
        assertTrue(!pending.contains("Own decided request"), pending);
        assertTrue(!pending.contains("Foreign pending request"), pending);

        String all = mvc.perform(get("/api/v1/tpo/students/requests-queue")
                        .param("includeDecided", "true")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(all.contains("Own pending request"), all);
        assertTrue(all.contains("Own decided request"), all);
        assertTrue(!all.contains("Foreign pending request"), all);
    }

    @Test
    void learnerCannotUseStudentsHubAdminOrBulkEndpoints() throws Exception {
        seedBase();
        String learner = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));

        mvc.perform(get("/api/v1/tpo/students/table")
                        .header("Authorization", "Bearer " + learner))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/tpo/students/bulk/note")
                        .header("Authorization", "Bearer " + learner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"learnerIds\":[" + LEARNER_A + "],\"note\":\"attack\"}"))
                .andExpect(status().isForbidden());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from tpo_student_note where learner_id = ?",
                Integer.class, LEARNER_A));
    }
}
