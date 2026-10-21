package com._42students.lms.validation;

import com._42students.lms.service.tpo.TpoDriveServiceCtcAccess;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** 14 Oct 2026 (found seeding dev): a stipend-only internship's pay line was refused, so the drive could not be saved. */
class CtcRangeValidatorStipendTest {

    private final CtcRangeValidator v = new CtcRangeValidator();

    @Test
    void theStipendLineTheDriveBuildsIsAccepted() {
        assertTrue(v.isValid(TpoDriveServiceCtcAccess.stipendLine(25000), null));
        assertTrue(v.isValid(TpoDriveServiceCtcAccess.stipendLine(120000), null));
        assertTrue(v.isValid("₹8,500 a month", null));
    }

    @Test
    void theOtherFormsStillWorkAndJunkIsStillRefused() {
        assertTrue(v.isValid("6-10 LPA", null));
        assertTrue(v.isValid("7 LPA", null));
        assertTrue(v.isValid(null, null));
        assertFalse(v.isValid("a lot", null));
        assertFalse(v.isValid("₹ a month", null));
    }
}
