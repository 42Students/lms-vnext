package com._42students.lms.service.tpo;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/** An academic import row with a value no student could have is shown as needing a fix, never saved. */
class AcademicImportValuesTest {
    @Test
    void outOfRangeAndNonNumbersAreRefusedInWords() {
        assertNull(TpoStudentsReadService.badAcademicValue(Map.of("cgpa", "8.4", "tenthPct", "91%", "passingYear", "2026")));
        assertEquals("CGPA must be between 0 and 10", TpoStudentsReadService.badAcademicValue(Map.of("cgpa", "84")));
        assertEquals("12th % must be between 0 and 100", TpoStudentsReadService.badAcademicValue(Map.of("twelfthPct", "120")));
        assertEquals("10th % is not a number", TpoStudentsReadService.badAcademicValue(Map.of("tenthPct", "abc")));
        assertEquals("Passing year must be between 1980 and 2100", TpoStudentsReadService.badAcademicValue(Map.of("passingYear", "26")));
    }
}
