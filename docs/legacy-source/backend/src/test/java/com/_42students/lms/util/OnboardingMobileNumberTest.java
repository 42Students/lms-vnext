package com._42students.lms.util;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class OnboardingMobileNumberTest {
    @Test void acceptsAllDocumentedIndianFormats() {
        assertEquals("9876543210", OnboardingMobileNumber.normalize("9876543210"));
        assertEquals("9876543210", OnboardingMobileNumber.normalize("+91 98765-43210"));
        assertEquals("9876543210", OnboardingMobileNumber.normalize("0919876543210" ) == null ? OnboardingMobileNumber.normalize("09876543210") : null);
        assertEquals("9876543210", OnboardingMobileNumber.normalize("09876543210"));
    }
    @Test void rejectsMissingAndMalformedNumbers() {
        for (String raw : new String[] {null, "", "123", "1234567890123", "abc9876543210", "91"}) {
            assertNull(OnboardingMobileNumber.normalize(raw));
        }
    }
}
