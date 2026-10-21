package com._42students.lms.dto.request;

import lombok.Data;

@Data
public class FeatureFlagUpdateRequest {
    private String module; // any key in ModuleFeatureCatalog, e.g. "projects" | "placements" | "courses"

    // Boxed deliberately, not a primitive boolean: a request body that omits this field must be
    // rejected (see SuperAdminFeatureController.update), not silently deserialize to false and
    // disable a module nobody asked to disable.
    private Boolean enabled;
}
