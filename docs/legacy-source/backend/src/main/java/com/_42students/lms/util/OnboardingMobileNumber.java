package com._42students.lms.util;

/** Indian mobile numbers: accept local, +91 and trunk-prefixed input, persist ten digits. */
public final class OnboardingMobileNumber {
    private OnboardingMobileNumber() {}

    /** Return null for missing, malformed, or non-Indian mobile numbers. */
    public static String normalize(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String trimmed = raw.trim();
        if (!trimmed.matches("[+0-9() .-]+")) return null;
        String digits = trimmed.replaceAll("\\D", "");
        if (digits.length() == 12 && digits.startsWith("91")) digits = digits.substring(2);
        else if (digits.length() == 11 && digits.startsWith("0")) digits = digits.substring(1);
        return digits.matches("[0-9]{10}") ? digits : null;
    }
}
