package com._42students.lms.service.tpo;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** Audit detail lines read as written: "1 students" and stored codes were shown on the Audit page. */
class AuditDetailWordsTest {
    @Test
    void oneOfAnythingIsSingular() {
        assertEquals("1 student put back", TpoAuditService.singular("1 students put back"));
        assertEquals("1 batch, 1 class", TpoAuditService.singular("1 batches, 1 classes"));
        assertEquals("11 students, 21 rows, 2.1 rows", TpoAuditService.singular("11 students, 21 rows, 2.1 rows"));
        assertEquals("Reject: 1 student", TpoAuditService.singular("Reject: 1 students"));
    }

    @Test
    void recruiterStagesAreWords() {
        assertEquals("\"Not now\"", TpoRecruiterLeadsHubService.stageWord("NOT_NOW"));
        assertEquals("\"Contacted\"", TpoRecruiterLeadsHubService.stageWord("CONTACTED"));
    }
}
