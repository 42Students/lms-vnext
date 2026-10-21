package com._42students.lms.util;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/** Course link compatibility and generated identifier contracts. */
class CourseSlugBoundaryRegressionTest {
    private final CourseSlugGenerator generator = new CourseSlugGenerator();

    @Test void nullSlugIsRejected() { assertFalse(generator.isValidSlug(null)); }
    @Test void emptySlugIsRejected() { assertFalse(generator.isValidSlug("")); }
    @Test void prefixWithoutIdentifierIsRejected() { assertFalse(generator.isValidSlug("crs-")); }
    @Test void wrongPrefixIsRejected() { assertFalse(generator.isValidSlug("job-abc")); }
    @Test void uppercasePrefixIsRejected() { assertFalse(generator.isValidSlug("CRS-abc")); }
    @Test void validShortLegacySlugIsAccepted() { assertTrue(generator.isValidSlug("crs-a")); }
    @Test void legacyHyphenatedSlugIsAccepted() { assertTrue(generator.isValidSlug("crs-intro-to-java")); }
    @Test void digitsInSlugAreAccepted() { assertTrue(generator.isValidSlug("crs-java17")); }
    @Test void uppercaseIdentifierIsAccepted() { assertTrue(generator.isValidSlug("crs-ABC")); }
    @Test void underscoreIsRejected() { assertFalse(generator.isValidSlug("crs-a_b")); }
    @Test void spaceIsRejected() { assertFalse(generator.isValidSlug("crs-a b")); }
    @Test void slashIsRejected() { assertFalse(generator.isValidSlug("crs-a/b")); }
    @Test void queryDelimiterIsRejected() { assertFalse(generator.isValidSlug("crs-a?b")); }
    @Test void fragmentDelimiterIsRejected() { assertFalse(generator.isValidSlug("crs-a#b")); }
    @Test void percentEncodingIsRejected() { assertFalse(generator.isValidSlug("crs-a%20b")); }
    @Test void nonAsciiIdentifierIsRejected() { assertFalse(generator.isValidSlug("crs-café")); }
    @Test void maximumLengthSlugIsAccepted() { assertTrue(generator.isValidSlug("crs-" + "a".repeat(60))); }
    @Test void oversizedSlugIsRejected() { assertFalse(generator.isValidSlug("crs-" + "a".repeat(61))); }
    @Test void generatedSlugHasExpectedPrefix() { assertTrue(generator.generateSlug().startsWith("crs-")); }
    @Test void generatedSlugHasExpectedLength() { assertEquals(36, generator.generateSlug().length()); }
    @Test void generatedSlugPassesValidation() { assertTrue(generator.isValidSlug(generator.generateSlug())); }
    @Test void generatedSlugUsesAlphanumericSuffix() { assertTrue(generator.generateSlug().matches("crs-[A-Za-z0-9]{32}")); }
    @Test void customPrefixIsPreserved() { assertTrue(generator.generateSlugWithPrefix("migration").startsWith("migration-")); }
    @Test void customPrefixDoesNotDoubleSeparator() { assertTrue(generator.generateSlugWithPrefix("migration-").matches("migration-[A-Za-z0-9]{32}")); }
    @Test void customPrefixAddsExactly32RandomCharacters() { assertEquals(39, generator.generateSlugWithPrefix("legacy").length()); }
}
