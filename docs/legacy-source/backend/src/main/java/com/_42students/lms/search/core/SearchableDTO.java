package com._42students.lms.search.core;

/**
 * Marker interface for DTOs that can be searched using GenericSearchCache
 * 
 * Any DTO implementing this interface can be used with the generic search engine.
 */
public interface SearchableDTO {
    /**
     * Get a unique identifier for this item
     * @return Unique ID (usually Integer or String)
     */
    Object getId();
    
    /**
     * Get the primary display name for this item
     * @return Display name
     */
    String getDisplayName();
}


