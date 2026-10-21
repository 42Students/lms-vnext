package com._42students.lms.validation;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;
import java.util.regex.Pattern;

public class CtcRangeValidator implements ConstraintValidator<ValidCtcRange, String> {

    // Pattern for LPA format: e.g., "6-10 LPA", "5-8 LPA"
    private static final Pattern LPA_PATTERN = Pattern.compile("^\\d+(\\.\\d+)?-\\d+(\\.\\d+)?\\s*LPA$");

    // Pattern for amount format: e.g., "500000-800000", "600000-1000000"
    private static final Pattern AMOUNT_PATTERN = Pattern.compile("^\\d{5,7}-\\d{5,7}$");

    // Pattern for single value: e.g., "6 LPA", "500000"
    private static final Pattern SINGLE_LPA_PATTERN = Pattern.compile("^\\d+(\\.\\d+)?\\s*LPA$");
    private static final Pattern SINGLE_AMOUNT_PATTERN = Pattern.compile("^\\d{5,7}$");
    // A stipend-only internship's pay line (TpoDriveService.ctcRangeOf, V221), e.g. "Rs-sign 25,000 a month". It was refused here, so
    // such a drive could not be created or saved at all (found seeding dev, 14 Oct 2026).
    private static final Pattern STIPEND_PATTERN = Pattern.compile("^₹\\d{1,3}(,\\d{2,3})* a month$");

    @Override
    public void initialize(ValidCtcRange constraintAnnotation) {
        // No initialization needed
    }

    @Override
    public boolean isValid(String ctcRange, ConstraintValidatorContext context) {
        if (ctcRange == null || ctcRange.trim().isEmpty()) {
            return true; // Allow null/empty - let @NotBlank handle required validation
        }

        String trimmedRange = ctcRange.trim();

        // Check if it matches any of the valid patterns
        return LPA_PATTERN.matcher(trimmedRange).matches() ||
               AMOUNT_PATTERN.matcher(trimmedRange).matches() ||
               SINGLE_LPA_PATTERN.matcher(trimmedRange).matches() ||
               SINGLE_AMOUNT_PATTERN.matcher(trimmedRange).matches() ||
               STIPEND_PATTERN.matcher(trimmedRange).matches();
    }
}


