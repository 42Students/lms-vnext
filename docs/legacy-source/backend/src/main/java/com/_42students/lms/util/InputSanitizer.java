package com._42students.lms.util;

import org.springframework.web.util.HtmlUtils;

/**
 * Utility class for input sanitization to prevent XSS attacks
 */
public class InputSanitizer {
    
    /**
     * Sanitize string input by HTML escaping
     * Prevents XSS attacks by escaping HTML special characters
     * 
     * @param input The input string to sanitize
     * @return Sanitized string with HTML characters escaped, or null if input is null
     */
    public static String sanitize(String input) {
        if (input == null) {
            return null;
        }
        // Trim whitespace
        String trimmed = input.trim();
        // HTML escape to prevent XSS
        return HtmlUtils.htmlEscape(trimmed);
    }
    
    /**
     * Sanitize string input but preserve newlines
     * Useful for textarea inputs where newlines should be preserved
     * 
     * @param input The input string to sanitize
     * @return Sanitized string with HTML characters escaped, or null if input is null
     */
    public static String sanitizePreserveNewlines(String input) {
        if (input == null) {
            return null;
        }
        // HTML escape to prevent XSS
        return HtmlUtils.htmlEscape(input);
    }
    
    /**
     * Sanitize email input
     * Removes whitespace and converts to lowercase
     * 
     * @param email The email to sanitize
     * @return Sanitized email, or null if input is null
     */
    public static String sanitizeEmail(String email) {
        if (email == null) {
            return null;
        }
        return email.trim().toLowerCase();
    }
    
    /**
     * Sanitize phone number input
     * Removes whitespace and non-digit characters (except +)
     * 
     * @param phone The phone number to sanitize
     * @return Sanitized phone number, or null if input is null
     */
    public static String sanitizePhone(String phone) {
        if (phone == null) {
            return null;
        }
        // Remove all whitespace
        String cleaned = phone.trim().replaceAll("\\s+", "");
        // Keep only digits and + sign
        return cleaned.replaceAll("[^0-9+]", "");
    }
    
    /**
     * Sanitize URL input
     * Basic validation and sanitization for URLs
     * 
     * @param url The URL to sanitize
     * @return Sanitized URL, or null if input is null
     */
    public static String sanitizeUrl(String url) {
        if (url == null) {
            return null;
        }
        String trimmed = url.trim();
        // Basic URL validation - must start with http:// or https://
        if (!trimmed.isEmpty() && !trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
            // If it doesn't start with http/https, don't modify it (might be relative path)
            // Just escape HTML
            return HtmlUtils.htmlEscape(trimmed);
        }
        return HtmlUtils.htmlEscape(trimmed);
    }
}


