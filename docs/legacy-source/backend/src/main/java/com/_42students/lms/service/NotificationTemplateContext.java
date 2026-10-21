package com._42students.lms.service;

/**
 * Notification Template Context
 * Determines which template table to use
 */
public enum NotificationTemplateContext {
    LMS("lms", "Default templates for college tenants");
    
    private final String code;
    private final String description;
    
    NotificationTemplateContext(String code, String description) {
        this.code = code;
        this.description = description;
    }
    
    public String getCode() {
        return code;
    }
    
    public String getDescription() {
        return description;
    }
    
    /**
     * Parse from string (case-insensitive)
     */
    public static NotificationTemplateContext fromString(String value) {
        if (value == null) {
            return LMS; // Default
        }
        String upper = value.toUpperCase();
        if ("LMS".equals(upper)) {
            return LMS;
        }
        return LMS;
    }
}


