package com._42students.lms.service.tpo;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertFalse;

/** 19 Oct 2026: one rule for "applied earlier counts as registered" (RegistrationRule); no query keeps its own copy. */
class RegistrationRuleGuardTest {

    @Test
    void noQueryCountsAnyApplicationEverAsRegistered() throws Exception {
        String old = "(CASE WHEN EXISTS (SELECT 1 FROM job_application ax WHERE ax.learner_id = l.id AND (ax.is_deleted = 0 OR ax.is_deleted IS NULL)) THEN 'PLACEMENTS' END)";
        try (Stream<Path> files = Files.walk(Path.of("src/main/java"))) {
            for (Path f : files.filter(p -> p.toString().endsWith(".java")).toList()) {
                assertFalse(Files.readString(f).contains(old), f + ": use RegistrationRule.APPLIED_EARLIER");
            }
        }
    }
}
