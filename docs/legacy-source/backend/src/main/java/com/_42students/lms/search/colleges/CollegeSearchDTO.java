package com._42students.lms.search.colleges;

import com._42students.lms.search.core.SearchableDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight DTO for college search
 * Used for fast in-memory search without database queries
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollegeSearchDTO implements SearchableDTO {

    private Integer id;
    private String name;
    private String logo;
    private String uniqueId;
    private String addressLine1;
    private String addressLine2;
    private String landmark;
    private String city;
    private String state;
    private String country;
    private String pinCode;
    private Integer collegeChairId;
    private Integer collegeViceChairId;
    private Integer orgId;

    @Override
    public Object getId() {
        return id;
    }

    @Override
    public String getDisplayName() {
        // Prefer name, fallback to uniqueId
        return name != null ? name : uniqueId;
    }

    /**
     * Get searchable text (all fields combined)
     */
    public String getSearchableText() {
        StringBuilder sb = new StringBuilder();
        if (name != null) sb.append(name).append(" ");
        if (uniqueId != null) sb.append(uniqueId).append(" ");
        if (city != null) sb.append(city).append(" ");
        if (state != null) sb.append(state).append(" ");
        if (country != null) sb.append(country).append(" ");
        if (addressLine1 != null) sb.append(addressLine1).append(" ");
        if (addressLine2 != null) sb.append(addressLine2).append(" ");
        if (landmark != null) sb.append(landmark).append(" ");
        return sb.toString().trim();
    }
}

