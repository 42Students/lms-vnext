package com._42students.lms.service.tpo;

import java.util.List;

/**
 * What a drive offers (docs/tpo-ux/BATCHES-AND-ELIGIBILITY-DESIGN.md, "Rules"). Stored as the label in job.job_type, which older
 * screens already show. An Internship offer never counts as placed; Internship + full-time counts once it is a full-time offer.
 */
public final class JobTypes {
    private JobTypes() {}

    public static final String FULL_TIME = "Full-time";
    public static final String INTERNSHIP = "Internship";
    public static final String INTERNSHIP_FULL_TIME = "Internship + full-time";
    public static final String CONTRACT = "Contract";
    public static final String APPRENTICESHIP = "Apprenticeship";
    public static final List<String> ALL = List.of(FULL_TIME, INTERNSHIP, INTERNSHIP_FULL_TIME, CONTRACT, APPRENTICESHIP);

    /**
     * Built-in types and whether their offers count as placed. Fixed: a college can hide a built-in type but never rename
     * it or change this answer (its own types are in JobTypeService). Internship + full-time counts: what is recorded as the
     * offer is the full-time one.
     */
    public static final java.util.Map<String, Boolean> BUILTIN_COUNTS_AS_PLACED = java.util.Map.of(
            FULL_TIME, true, INTERNSHIP, false, INTERNSHIP_FULL_TIME, true, CONTRACT, true, APPRENTICESHIP, true);

    /** The fixed answer for a built-in type (any case), or null when the name is not a built-in type. */
    public static Boolean builtinCountsAsPlaced(String name) {
        if (name == null) return null;
        for (String t : ALL) if (t.equalsIgnoreCase(name.trim())) return BUILTIN_COUNTS_AS_PLACED.get(t);
        return null;
    }

    /** A known type by its label (any case), or null for blank; anything else is refused. */
    public static String normalize(String raw) {
        if (raw == null || raw.isBlank()) return null;
        for (String t : ALL) if (t.equalsIgnoreCase(raw.trim())) return t;
        throw new IllegalArgumentException("Job type must be one of " + String.join(", ", ALL));
    }
}
