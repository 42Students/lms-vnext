package com._42students.lms.common;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class MarksConversionTest {

    private static BigDecimal pct(String grade, String type, String max, String rule) { return MarksConversion.toPercent(grade, type, max, rule); }

    @Test
    void aPercentageStaysAndACgpaIsConvertedWithTheCollegesRule() {
        assertEquals(new BigDecimal("86.00"), pct("86", "Percentage", "100", null));
        assertEquals(new BigDecimal("87.40"), pct("9.2", "CGPA", "10", null), "CBSE / AICTE: CGPA x 9.5 by default");
        assertEquals(new BigDecimal("87.00"), pct("9.2", "CGPA", "10", "MINUS_0_5_X10"), "JNTU");
        assertEquals(new BigDecimal("84.50"), pct("9.2", "CGPA", "10", "MINUS_0_75_X10"), "VTU");
        assertEquals(new BigDecimal("92.00"), pct("9.2", "CGPA", "10", "X10"));
    }

    @Test
    void aGpaOutOfAnotherMaximumIsAPlainRatio() {
        assertEquals(new BigDecimal("87.50"), pct("3.5", "GPA", "4", null));
    }

    @Test
    void letterGradesAndTyposHaveNoPercentage() {
        assertNull(pct("A1", "Grade", null, null));
        assertNull(pct("86", "CGPA", "10", null), "86 out of 10 is a typo");
        assertNull(pct("", "Percentage", null, null));
        assertEquals(new BigDecimal("100.00"), pct("10", "CGPA", "10", "X10"));
    }

    @Test
    void theMarkIsShownAsEarned() {
        assertEquals("9.2 CGPA", MarksConversion.shown("9.2", "CGPA", "10"));
        assertEquals("86%", MarksConversion.shown("86", "Percentage", "100"));
        assertEquals("3.5 / 4 GPA", MarksConversion.shown("3.5", "GPA", "4"));
        assertEquals("A1", MarksConversion.shown("A1", "Grade", null));
    }

    /** Entries as students really type them (seen in the college data). */
    @Test
    void realWorldEntriesStillGiveASensiblePercentage() {
        assertEquals(new BigDecimal("88.35"), pct("9.3", "CGPA", "9.3", null), "the mark typed as its own maximum counts out of 10");
        assertEquals(new BigDecimal("76.95"), pct("8.1", "CGPA", "8,1", null));
        assertEquals("9.3 CGPA", MarksConversion.shown("9.3", "CGPA", "9.3"));
        assertEquals(new BigDecimal("93.40"), pct("934", "Percentage", "1000", null), "marks out of 1000 typed as a percentage");
        assertEquals("934 / 1000", MarksConversion.shown("934", "Percentage", "1000"));
        assertNull(pct("934", "Percentage", "100", null));
        assertEquals(new BigDecimal("80.00"), pct("80", "Percentage", "80%", null));
        assertEquals(new BigDecimal("85.50"), pct("9", "Grade", "10", null), "CBSE grade point typed as a grade");
        assertEquals(new BigDecimal("85.00"), pct("8,5", "CGPA", null, "X10"));
    }

    @Test
    void theDegreeReadsShort() {
        assertEquals("B.Tech · CSE", com._42students.lms.service.tpo.AcademicMarksService.degreeText("BTECH", "Computer Science &amp; Engineering (CSE)"));
        assertEquals("B.Com", com._42students.lms.service.tpo.AcademicMarksService.degreeText("BCOM", "General"));
        assertEquals("M.Tech · Structural", com._42students.lms.service.tpo.AcademicMarksService.degreeText("MTECH", "Structural"));
    }

    @Test
    void whatCountsAsConvertedAndAsACgpa() {
        assertTrue(MarksConversion.converted("934", "Percentage"));
        assertFalse(MarksConversion.converted("86", "Percentage"));
        assertTrue(MarksConversion.converted("9.2", "CGPA"));
        assertEquals(new BigDecimal("8.4"), MarksConversion.cgpaOutOf10("8.4", "CGPA", "10"));
        assertNull(MarksConversion.cgpaOutOf10("90", "CGPA", "10"), "a typo is not a CGPA");
        assertNull(MarksConversion.cgpaOutOf10("3.5", "CGPA", "4"));
        assertNull(MarksConversion.cgpaOutOf10("80", "Percentage", "100"));
    }
}
