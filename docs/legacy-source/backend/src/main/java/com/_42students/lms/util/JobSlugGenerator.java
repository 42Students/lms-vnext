package com._42students.lms.util;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

/**
 * Utility class to generate unique, URL-safe slugs for jobs.
 * Generates random strings for external job links.
 */
@Component
public class JobSlugGenerator {
    
    private static final SecureRandom random = new SecureRandom();
    private static final String ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_!@#$%&*";
    private static final int SLUG_LENGTH = 16; // Length of random part (excluding prefix)
    
    /**
     * Generate a unique slug for a job.
     * Format: smr-{random16chars}
     * Example: smr-X9k!m@n3#q$w%r
     * 
     * @return A unique URL-safe slug
     */
    public String generateSlug() {
        StringBuilder slug = new StringBuilder("smr-");
        
        for (int i = 0; i < SLUG_LENGTH; i++) {
            int index = random.nextInt(ALPHABET.length());
            slug.append(ALPHABET.charAt(index));
        }
        
        return slug.toString();
    }
    
    /**
     * Validate if a string is a valid job slug format.
     * 
     * @param slug The slug to validate
     * @return true if valid, false otherwise
     */
    public boolean isValidSlug(String slug) {
        if (slug == null || slug.length() < 4) {
            return false;
        }
        // Should start with "smr-" and contain only allowed characters
        return slug.startsWith("smr-") && 
               slug.length() <= 32 && 
               slug.matches("^smr-[A-Za-z0-9\\-_!@#$%&*]+$");
    }
}


