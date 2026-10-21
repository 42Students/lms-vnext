package com._42students.lms.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** A student who applied themselves had no company-facing id, so the recruiter could not name them in a result or selection. */
class JobApplicationPublicRefTest {
    @Test
    void everySavedApplicationGetsAnIdAndKeepsAGivenOne() {
        JobApplication a = new JobApplication();
        a.assignPublicRef();
        assertTrue(a.getPublicRef().matches("A[0-9A-F]{10}"), a.getPublicRef());

        JobApplication b = new JobApplication();
        b.setPublicRef("A0000000001");
        b.assignPublicRef();
        assertEquals("A0000000001", b.getPublicRef());
    }
}
