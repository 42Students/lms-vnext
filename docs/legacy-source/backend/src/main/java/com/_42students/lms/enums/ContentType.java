package com._42students.lms.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ContentType {
    // QUIZ is created through the dedicated Quiz system, not lesson-content writes.
    ASSIGNMENT("assignment"),
    VIDEO("video"),
    YOUTUBE("youtube"),
    /** Canonical lesson Resource: FILE/LINK materials live in content_data.resource_materials. */
    RESOURCE("resource"),
    LIVE_CLASS("live class");

    /** Names removed by migration V163; recognised only so an old client gets a clear 400. */
    private static final java.util.Set<String> RETIRED_TYPES =
            java.util.Set.of("lecture", "ppt", "pdf", "byo content", "byo", "google meet");

    private final String contentType;

    ContentType(String contentType) {
        this.contentType = contentType;
    }

    @JsonValue
    public String getContentType() {
        return contentType;
    }

    @JsonCreator
    public static ContentType fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("content_type is required");
        }
        String normalized = value.toLowerCase().trim();
        for (ContentType type : ContentType.values()) {
            if (type.contentType.equals(normalized)) {
                return type;
            }
        }
        if (RETIRED_TYPES.contains(normalized.replace('_', ' '))) {
            throw new IllegalArgumentException("Content type '" + value + "' has been retired. "
                + "Use RESOURCE for files, links and notes, or LIVE_CLASS for sessions.");
        }
        try {
            return ContentType.valueOf(value.toUpperCase().replace(" ", "_"));
        } catch (IllegalArgumentException e) {
            String valid = "assignment, video, youtube, resource, live class";
            throw new IllegalArgumentException(
                "Unknown content type: '" + value + "'. Valid types: " + valid);
        }
    }
}
