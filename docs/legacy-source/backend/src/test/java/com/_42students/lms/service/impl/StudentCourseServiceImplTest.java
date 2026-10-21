package com._42students.lms.service.impl;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * Covers normalizeAcademicYearStart in isolation -- the fix for a real prod bug found while
 * auditing why a student's course cards showed "Not assigned" for every instructor: batch.
 * academic_year and faculty_teaching_assignment.academic_year have never agreed on one format
 * ("2026-27" vs. "2026-2027" vs. a bare "2026"), and the plain String.equals() check that used to
 * gate getStudentCourses()'s instructor lookup silently dropped every assignment whose format
 * didn't happen to match byte-for-byte. Confirmed against real prod data: class 9 / batch
 * "2026-2027" has 18 correctly-scoped faculty_teaching_assignment rows, all stored as "2026-27" --
 * zero of which the old check ever matched.
 */
class StudentCourseServiceImplTest {

    @Test
    @DisplayName("short and long academic-year formats for the same year normalize to the same value")
    void sameYearDifferentFormatsNormalizeEqual() {
        assertEquals(
            StudentCourseServiceImpl.normalizeAcademicYearStart("2026-27"),
            StudentCourseServiceImpl.normalizeAcademicYearStart("2026-2027")
        );
        assertEquals(
            StudentCourseServiceImpl.normalizeAcademicYearStart("2026-27"),
            StudentCourseServiceImpl.normalizeAcademicYearStart("2026")
        );
        assertEquals("2026", StudentCourseServiceImpl.normalizeAcademicYearStart("2026-27"));
        assertEquals("2026", StudentCourseServiceImpl.normalizeAcademicYearStart("2026-2027"));
    }

    @Test
    @DisplayName("different academic years never normalize to the same value")
    void differentYearsStayDifferent() {
        String y2025 = StudentCourseServiceImpl.normalizeAcademicYearStart("2025-26");
        String y2026 = StudentCourseServiceImpl.normalizeAcademicYearStart("2026-27");
        org.junit.jupiter.api.Assertions.assertNotEquals(y2025, y2026);
    }

    @Test
    @DisplayName("null, blank and non-numeric-prefix values normalize to null rather than a hard mismatch")
    void malformedValuesNormalizeToNull() {
        assertNull(StudentCourseServiceImpl.normalizeAcademicYearStart(null));
        assertNull(StudentCourseServiceImpl.normalizeAcademicYearStart(""));
        assertNull(StudentCourseServiceImpl.normalizeAcademicYearStart("  "));
        assertNull(StudentCourseServiceImpl.normalizeAcademicYearStart("N/A"));
        assertNull(StudentCourseServiceImpl.normalizeAcademicYearStart("26"));
    }

    @Test
    @DisplayName("leading/trailing whitespace is tolerated")
    void whitespaceIsTrimmed() {
        assertEquals("2026", StudentCourseServiceImpl.normalizeAcademicYearStart("  2026-27  "));
    }
}
