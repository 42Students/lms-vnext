package com._42students.lms.model;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** The placement cell's internal reason never leaves the server inside an application (learner endpoints return the entity). */
class JobApplicationInternalReasonJsonTest {

    @Test
    void internalReasonAndNotesAreNeverSerialised() throws Exception {
        JobApplication a = new JobApplication();
        a.setRejectionReason("Not shortlisted");
        a.setInternalReason("Weak resume");
        a.setInternalNotes("Called twice");
        String json = new ObjectMapper().registerModule(new JavaTimeModule()).writeValueAsString(a);
        assertTrue(json.contains("Not shortlisted"), "the student's own wording is kept");
        assertFalse(json.contains("Weak resume"));
        assertFalse(json.contains("Called twice"));
    }
}
