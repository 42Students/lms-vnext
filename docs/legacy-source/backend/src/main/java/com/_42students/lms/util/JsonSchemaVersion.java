package com._42students.lms.util;

/**
 * JSON Schema Version Constants
 * 
 * Prevents schema drift by versioning academic_data and career_data JSON structures.
 * Each version defines the expected schema structure for parsing.
 */
public class JsonSchemaVersion {
    
    /**
     * Current supported schema versions
     */
    public static final int ACADEMIC_DATA_SCHEMA_VERSION_1 = 1;
    public static final int CAREER_DATA_SCHEMA_VERSION_1 = 1;
    
    /**
     * Current latest supported versions
     */
    public static final int LATEST_ACADEMIC_DATA_SCHEMA_VERSION = ACADEMIC_DATA_SCHEMA_VERSION_1;
    public static final int LATEST_CAREER_DATA_SCHEMA_VERSION = CAREER_DATA_SCHEMA_VERSION_1;
    
    /**
     * Default schema version for existing records (backward compatibility)
     */
    public static final int DEFAULT_SCHEMA_VERSION = 1;
    
    /**
     * Schema version field name in JSON
     */
    public static final String SCHEMA_VERSION_FIELD = "schemaVersion";
    
    private JsonSchemaVersion() {
        // Utility class - prevent instantiation
    }
    
    /**
     * Validate if schema version is supported for academic_data
     */
    public static boolean isSupportedAcademicDataVersion(int version) {
        return version == ACADEMIC_DATA_SCHEMA_VERSION_1;
    }
    
    /**
     * Validate if schema version is supported for career_data
     */
    public static boolean isSupportedCareerDataVersion(int version) {
        return version == CAREER_DATA_SCHEMA_VERSION_1;
    }
    
    /**
     * Get schema version from JSON map, defaulting to 1 if not present
     */
    public static int getSchemaVersion(java.util.Map<String, Object> jsonData) {
        if (jsonData == null) {
            return DEFAULT_SCHEMA_VERSION;
        }
        
        Object versionObj = jsonData.get(SCHEMA_VERSION_FIELD);
        if (versionObj == null) {
            return DEFAULT_SCHEMA_VERSION;
        }
        
        // Handle different number types
        if (versionObj instanceof Number) {
            return ((Number) versionObj).intValue();
        }
        
        try {
            return Integer.parseInt(String.valueOf(versionObj));
        } catch (NumberFormatException e) {
            return DEFAULT_SCHEMA_VERSION;
        }
    }
}


