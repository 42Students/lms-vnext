package com._42students.lms.util;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/**
 * Utility class for validating and normalizing job application sources.
 * Simplified to only track INTERNAL (LMS students) vs EXTERNAL (placements page).
 */
public class JobApplicationSourceValidator {
    
    /**
     * Allowed source values for job applications
     */
    private static final List<String> ALLOWED_SOURCES = Arrays.asList(
        "INTERNAL",
        "EXTERNAL"
    );
    
    /**
     * Default source for external applications (placements page)
     */
    private static final String DEFAULT_SOURCE = "EXTERNAL";
    
    /**
     * Validates and normalizes a source value.
     * 
     * @param source The source value to validate
     * @return Normalized source (uppercase, from allowed list) or DEFAULT_SOURCE if invalid
     */
    public static String validateAndNormalize(String source) {
        if (source == null || source.trim().isEmpty()) {
            return DEFAULT_SOURCE;
        }
        
        // Normalize to uppercase
        String normalized = source.trim().toUpperCase(Locale.ENGLISH);
        
        // Check if it's in the allowed list
        if (ALLOWED_SOURCES.contains(normalized)) {
            return normalized;
        }
        
        // If not in allowed list, return default (EXTERNAL)
        return DEFAULT_SOURCE;
    }
    
    /**
     * Checks if a source is valid (in allowed list).
     * 
     * @param source The source to check
     * @return true if valid, false otherwise
     */
    public static boolean isValidSource(String source) {
        if (source == null || source.trim().isEmpty()) {
            return false;
        }
        return ALLOWED_SOURCES.contains(source.trim().toUpperCase(Locale.ENGLISH));
    }
    
    /**
     * Gets the list of allowed sources.
     * 
     * @return List of allowed source values
     */
    public static List<String> getAllowedSources() {
        return ALLOWED_SOURCES;
    }
}



