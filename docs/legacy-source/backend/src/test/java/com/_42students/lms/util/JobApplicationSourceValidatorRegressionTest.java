package com._42students.lms.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

/** Regression coverage for the two permitted placement application origins. */
class JobApplicationSourceValidatorRegressionTest {
    @Test void internalApplicationSourceIsPreserved() {
        assertEquals("INTERNAL", JobApplicationSourceValidator.validateAndNormalize("INTERNAL"));
    }

    @Test void externalApplicationSourceIsPreserved() {
        assertEquals("EXTERNAL", JobApplicationSourceValidator.validateAndNormalize("EXTERNAL"));
    }

    @Test void internalSourceIsNormalizedWithoutChangingItsMeaning() {
        assertEquals("INTERNAL", JobApplicationSourceValidator.validateAndNormalize("  internal  "));
        assertTrue(JobApplicationSourceValidator.isValidSource("  internal  "));
    }

    @Test void externalSourceIsNormalizedWithoutChangingItsMeaning() {
        assertEquals("EXTERNAL", JobApplicationSourceValidator.validateAndNormalize("\texternal\n"));
        assertTrue(JobApplicationSourceValidator.isValidSource("\texternal\n"));
    }

    @Test void missingSourceDefaultsToExternalButIsNotAnExplicitlyValidSource() {
        assertEquals("EXTERNAL", JobApplicationSourceValidator.validateAndNormalize(null));
        assertFalse(JobApplicationSourceValidator.isValidSource(null));
    }

    @Test void whitespaceOnlySourceDefaultsToExternalButIsNotValid() {
        assertEquals("EXTERNAL", JobApplicationSourceValidator.validateAndNormalize(" \t\n "));
        assertFalse(JobApplicationSourceValidator.isValidSource(" \t\n "));
    }

    @Test void unknownSourceCannotBecomeAnInternalApplication() {
        assertEquals("EXTERNAL", JobApplicationSourceValidator.validateAndNormalize("PARTNER"));
        assertFalse(JobApplicationSourceValidator.isValidSource("PARTNER"));
    }

    @Test void internalPrefixDoesNotBypassTheExactAllowlist() {
        assertEquals("EXTERNAL", JobApplicationSourceValidator.validateAndNormalize("INTERNAL_ADMIN"));
        assertFalse(JobApplicationSourceValidator.isValidSource("INTERNAL_ADMIN"));
    }

    @Test void allowedSourcesContainOnlyTheTwoDocumentedOrigins() {
        assertEquals(List.of("INTERNAL", "EXTERNAL"), JobApplicationSourceValidator.getAllowedSources());
    }
}
