package com._42students.lms.util;

import java.util.List;
import java.util.Map;

/**
 * Qualification Validation and Normalization Utility
 * 
 * Enforces qualification invariants:
 * 1. Exactly ONE primary qualification (isRecentEducation = true)
 * 2. Normalizes GPA/grades into standard format
 * 3. Validates conflicting flags
 * 4. Rejects inconsistent qualification sets
 */
public class QualificationValidator {
    
    /**
     * Validate qualification invariants
     * 
     * @param qualificationsList List of qualification maps from JSON
     * @param applicationId Application ID for error messages
     * @throws IllegalArgumentException if invariants are violated
     */
    /** SM-24: Maximum number of qualifications allowed per application */
    private static final int MAX_QUALIFICATIONS = 20;

    public static void validateQualifications(List<Map<String, Object>> qualificationsList, Integer applicationId) {
        if (qualificationsList == null || qualificationsList.isEmpty()) {
            throw new IllegalArgumentException(
                    String.format("QUALIFICATION VALIDATION FAILED: No qualifications found for application ID %d. " +
                            "At least one qualification is required.", applicationId));
        }

        // SM-24: Prevent adversarial applications with excessive qualification entries
        if (qualificationsList.size() > MAX_QUALIFICATIONS) {
            throw new IllegalArgumentException(
                    String.format("QUALIFICATION VALIDATION FAILED: Too many qualifications (%d) for application ID %d. " +
                            "Maximum allowed is %d.", qualificationsList.size(), applicationId, MAX_QUALIFICATIONS));
        }
        
        // INVARIANT 1: Exactly ONE primary qualification (isRecentEducation = true)
        long primaryCount = qualificationsList.stream()
                .mapToLong(qual -> {
                    Object recentEducation = qual.get("isRecentEducation");
                    if (recentEducation == null) {
                        return 0;
                    }
                    // Handle boolean and string "true"/"false"
                    if (recentEducation instanceof Boolean) {
                        return ((Boolean) recentEducation) ? 1 : 0;
                    }
                    if (recentEducation instanceof String) {
                        return Boolean.parseBoolean((String) recentEducation) ? 1 : 0;
                    }
                    return 0;
                })
                .sum();
        
        if (primaryCount == 0) {
            throw new IllegalArgumentException(
                    String.format("QUALIFICATION VALIDATION FAILED: No primary qualification found for application ID %d. " +
                            "Exactly ONE qualification must have isRecentEducation = true.", applicationId));
        }
        
        if (primaryCount > 1) {
            throw new IllegalArgumentException(
                    String.format("QUALIFICATION VALIDATION FAILED: Multiple primary qualifications found (%d) for application ID %d. " +
                            "Exactly ONE qualification must have isRecentEducation = true.", primaryCount, applicationId));
        }
        
        // INVARIANT 2: Validate conflicting flags (isCurrentlyPursuing vs endYear)
        for (Map<String, Object> qual : qualificationsList) {
            Object isCurrentlyPursuing = qual.get("isCurrentlyPursuing");
            Object endYear = qual.get("endYear");
            
            boolean isPursuing = false;
            if (isCurrentlyPursuing instanceof Boolean) {
                isPursuing = (Boolean) isCurrentlyPursuing;
            } else if (isCurrentlyPursuing instanceof String) {
                isPursuing = Boolean.parseBoolean((String) isCurrentlyPursuing);
            }
            
            // If isCurrentlyPursuing = true, endYear should be null, empty, or future year
            if (isPursuing && endYear != null && !endYear.toString().trim().isEmpty()) {
                try {
                    int endYearInt = Integer.parseInt(endYear.toString().trim());
                    int currentYear = java.time.Year.now().getValue();
                    if (endYearInt < currentYear) {
                        throw new IllegalArgumentException(
                                String.format("QUALIFICATION VALIDATION FAILED: Qualification with isCurrentlyPursuing = true " +
                                        "has endYear (%d) in the past for application ID %d. " +
                                        "Currently pursuing qualifications must have null, empty, or future endYear.", 
                                        endYearInt, applicationId));
                    }
                } catch (NumberFormatException e) {
                    // Invalid year format - will be caught elsewhere or ignored
                }
            }
            
            // INVARIANT 3: isRecentEducation = true should typically be the highest education level
            // (UG, PG, PhD) - but we don't enforce this strictly, just warn
            Object isRecent = qual.get("isRecentEducation");
            boolean isRecentEducation = false;
            if (isRecent instanceof Boolean) {
                isRecentEducation = (Boolean) isRecent;
            } else if (isRecent instanceof String) {
                isRecentEducation = Boolean.parseBoolean((String) isRecent);
            }
            
            if (isRecentEducation) {
                String educationType = getStringValue(qual, "educationType");
                if (educationType != null) {
                    String upperType = educationType.toUpperCase();
                    if (upperType.equals("10TH") || upperType.equals("12TH")) {
                        // Warning: Primary qualification is typically UG or higher
                        // We allow this but it's unusual
                    }
                }
            }
        }
    }
    
    /**
     * Normalize grade value to standard internal format
     * 
     * @param grade Original grade value (can be "8.5", "85%", "A+", etc.)
     * @param gradingType Grading type (CGPA, Percentage, Grade, GPA)
     * @return Normalized grade string
     */
    public static String normalizeGrade(String grade, String gradingType) {
        if (grade == null || grade.trim().isEmpty()) {
            return null;
        }
        
        String normalizedGrade = grade.trim();
        String upperGradingType = gradingType != null ? gradingType.toUpperCase() : "";
        
        // Remove percentage sign if present and grading type is Percentage
        if (upperGradingType.contains("PERCENTAGE") || upperGradingType.contains("%")) {
            normalizedGrade = normalizedGrade.replace("%", "").trim();
            try {
                // Validate it's a valid number between 0-100
                double percentage = Double.parseDouble(normalizedGrade);
                if (percentage < 0 || percentage > 100) {
                    throw new IllegalArgumentException(
                            String.format("Invalid percentage grade: %s. Must be between 0 and 100.", normalizedGrade));
                }
            } catch (NumberFormatException e) {
                // Invalid number - keep as is, will be caught during parsing
            }
        }
        
        // Normalize CGPA/GPA: Ensure it's a number between 0-10 (typical scale)
        if (upperGradingType.contains("CGPA") || upperGradingType.contains("GPA")) {
            try {
                double cgpa = Double.parseDouble(normalizedGrade);
                if (cgpa < 0 || cgpa > 10) {
                    // Log warning but don't reject - some systems use different scales
                    // Could be normalized to 0-10 scale if needed
                }
            } catch (NumberFormatException e) {
                // Not a number - keep as is (might be a grade like "A+")
            }
        }
        
        // Grade type: Keep as-is (A+, A, B+, etc.)
        // No normalization needed for letter grades
        
        return normalizedGrade;
    }
    
    /**
     * Helper to safely get string value from map
     */
    private static String getStringValue(Map<String, Object> map, String key) {
        if (map == null || !map.containsKey(key)) {
            return null;
        }
        Object value = map.get(key);
        return value != null ? value.toString() : null;
    }
}


