package com._42students.lms.util;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

/**
 * Utility class to generate unique, URL-safe slugs for courses.
 * Generated slugs use only alphanumeric characters, but validation also accepts
 * legacy hyphenated slugs already stored in production.
 */
@Component
public class CourseSlugGenerator {
    
    private static final SecureRandom random = new SecureRandom();
    private static final String ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private static final int SLUG_LENGTH = 32; // Length of random part
    
    /**
     * Generate a unique slug for a course.
     * Format: crs-{randomString}
     * Example: crs-X9kMn3QwRtYuVwXz
     * 
     * @return A unique URL-safe slug
     */
    public String generateSlug() {
        StringBuilder slug = new StringBuilder("crs-");
        
        for (int i = 0; i < SLUG_LENGTH; i++) {
            int index = random.nextInt(ALPHABET.length());
            slug.append(ALPHABET.charAt(index));
        }
        
        return slug.toString();
    }
    
    /**
     * Generate a slug with a specific prefix (useful for migration or testing).
     * 
     * @param prefix The prefix to use
     * @return A unique slug with the specified prefix
     */
    public String generateSlugWithPrefix(String prefix) {
        StringBuilder slug = new StringBuilder(prefix);
        if (!slug.toString().endsWith("-")) {
            slug.append("-");
        }
        
        for (int i = 0; i < SLUG_LENGTH; i++) {
            int index = random.nextInt(ALPHABET.length());
            slug.append(ALPHABET.charAt(index));
        }
        
        return slug.toString();
    }
    
    /**
     * Validate if a string is a valid course slug format.
     * 
     * @param slug The slug to validate
     * @return true if valid, false otherwise
     */
    public boolean isValidSlug(String slug) {
        if (slug == null || slug.length() < 4) {
            return false;
        }
        // Should start with "crs-" and contain only URL-safe characters.
        // Support legacy hyphenated slugs already present in production data.
        return slug.startsWith("crs-") && 
               slug.length() <= 64 && 
               slug.matches("^crs-[A-Za-z0-9-]+$");
    }
}


