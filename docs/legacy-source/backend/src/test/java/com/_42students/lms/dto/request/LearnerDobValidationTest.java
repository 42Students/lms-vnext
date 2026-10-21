package com._42students.lms.dto.request;

import org.junit.jupiter.api.Test;

import javax.validation.Validation;
import javax.validation.Validator;

import static org.junit.jupiter.api.Assertions.*;

/** Registering or editing a student without a date of birth failed: the form sent "". */
class LearnerDobValidationTest {
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private boolean dobOk(String dob) {
        LearnerDTO dto = new LearnerDTO();
        dto.setDob(dob);
        return validator.validateProperty(dto, "dob").isEmpty();
    }

    @Test
    void blankAndMissingDobAreAccepted() {
        assertTrue(dobOk(""));
        assertTrue(dobOk(null));
        assertTrue(dobOk("2005-08-21"));
    }

    @Test
    void wrongFormatIsStillRejected() {
        assertFalse(dobOk("21-08-2005"));
    }
}
