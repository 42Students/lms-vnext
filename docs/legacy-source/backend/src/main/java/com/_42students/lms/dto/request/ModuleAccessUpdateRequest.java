package com._42students.lms.dto.request;

import lombok.Data;

/**
 * One module's setting at one node in the hierarchy.
 *
 * <p>Every field is boxed on purpose. {@code enabled == null} is meaningful — it means "clear the
 * override at this node so it inherits again", which is a distinct third state from true/false and
 * is why the UI control is tri-state rather than a switch. {@code locked == null} likewise means
 * "leave the lock as it is", so a value change never silently unlocks a level.
 */
@Data
public class ModuleAccessUpdateRequest {
    private String scopeType;   // LEARNER | CLASS | BATCH | PROGRAM | DEPARTMENT | COLLEGE | ORGANIZATION | GLOBAL
    private Integer scopeId;    // null only for GLOBAL
    private String module;      // a ModuleFeatureCatalog key: projects | placements | courses
    private Boolean enabled;    // null = inherit (clear the override)
    private Boolean locked;     // null = leave unchanged; super-admin only
}
