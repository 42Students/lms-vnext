package com._42students.lms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CollegeFeatureFlagsDTO {
    private Integer collegeId;
    private String collegeName;
    /**
     * Kept alongside {@link #modules} so existing callers that read these two by name keep
     * working unchanged; both are also present as entries in the map.
     */
    private boolean projectsEnabled;
    private boolean placementsEnabled;

    /** Every module in ModuleFeatureCatalog, keyed by module key. Absent setting = enabled. */
    private java.util.Map<String, Boolean> modules;

    /** Hierarchically effective decision and inherited lock for each optional module. */
    private java.util.Map<String, java.util.Map<String, Object>> moduleDetails;

    /** Preserve the established five-argument constructor for existing integrations/tests. */
    public CollegeFeatureFlagsDTO(Integer collegeId, String collegeName, boolean projectsEnabled,
                                  boolean placementsEnabled, java.util.Map<String, Boolean> modules) {
        this.collegeId = collegeId;
        this.collegeName = collegeName;
        this.projectsEnabled = projectsEnabled;
        this.placementsEnabled = placementsEnabled;
        this.modules = modules;
    }
}
