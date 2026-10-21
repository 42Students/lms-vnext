package com._42students.lms.service.recruiter;

import java.util.Set;

/**
 * Capability names a recruiter can hold per college grant. A grant with no capabilities lets the recruiter log
 * in and see that college, nothing else. Each future recruiter feature adds one constant here and checks
 * it through {@link RecruiterAccessService#requireCollege}; no migration is needed.
 *
 * Only names listed in {@link #KNOWN} can be granted, so a typo cannot silently grant nothing.
 */
public final class RecruiterCapability {

    /** See the college's student overview (counts and bands only, never names). */
    public static final String COLLEGE_OVERVIEW = "COLLEGE_OVERVIEW";
    /** Send a drive request to the college's TPO. */
    public static final String DRIVE_REQUEST = "DRIVE_REQUEST";
    /** Work on their own drives: see shared applicants, send results and slots, send the selection list, message the placement cell. */
    public static final String DRIVE_WORK = "DRIVE_WORK";

    /** Every grantable capability. */
    public static final Set<String> KNOWN = Set.of(COLLEGE_OVERVIEW, DRIVE_REQUEST, DRIVE_WORK);

    /** What a TPO invite grants: enough to see the college and ask for a drive, nothing about individuals. */
    public static final Set<String> INVITE_DEFAULT = KNOWN;

    private RecruiterCapability() {
    }

    public static boolean isKnown(String capability) {
        return capability != null && KNOWN.contains(capability);
    }
}
