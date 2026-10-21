package com._42students.lms.service.impl;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class LogSignatureUtilTest {

    @Test
    void sameShapeWithDifferentIdsNormalizesIdentically() {
        String a = LogSignatureUtil.normalize(null, "Learner 42 not found", "/api/v1/learner/42/profile");
        String b = LogSignatureUtil.normalize(null, "Learner 9981 not found", "/api/v1/learner/9981/profile");
        assertEquals(a, b);
        assertEquals(LogSignatureUtil.hash(a), LogSignatureUtil.hash(b));
    }

    @Test
    void differentPathsAreDistinctSignatures() {
        String a = LogSignatureUtil.normalize(null, "Not found", "/api/v1/learner/42/profile");
        String b = LogSignatureUtil.normalize(null, "Not found", "/api/v1/faculty/42/profile");
        assertNotEquals(a, b);
    }

    @Test
    void uuidsAndEmailsAreCollapsed() {
        String a = LogSignatureUtil.normalize(null,
                "Failed to notify user 11111111-2222-3333-4444-555555555555 at a@b.com", null);
        String b = LogSignatureUtil.normalize(null,
                "Failed to notify user 66666666-7777-8888-9999-000000000000 at c@d.com", null);
        assertEquals(a, b);
    }

    @Test
    void hashIsStableAndDeterministic() {
        String normalized = LogSignatureUtil.normalize("NullPointerException", "boom", "/x");
        assertEquals(LogSignatureUtil.hash(normalized), LogSignatureUtil.hash(normalized));
        assertEquals(64, LogSignatureUtil.hash(normalized).length()); // SHA-256 hex
    }

    @Test
    void nullFieldsDoNotThrow() {
        assertDoesNotThrow(() -> LogSignatureUtil.normalize(null, null, null));
    }
}
