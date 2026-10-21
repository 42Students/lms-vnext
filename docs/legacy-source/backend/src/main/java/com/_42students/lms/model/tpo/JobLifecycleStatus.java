package com._42students.lms.model.tpo;

import java.util.Set;

/**
 * Job.lifecycleStatus. Written only by {@code JobLifecycleService}, which keeps the legacy
 * isDraft/isActive flags in sync so every existing learner-visibility query keeps working.
 */
public final class JobLifecycleStatus {
    public static final String REQUEST = "REQUEST";
    public static final String SENT_BACK = "SENT_BACK";
    public static final String REJECTED = "REJECTED";
    public static final String DRAFT = "DRAFT";
    public static final String PUBLISHED = "PUBLISHED";
    public static final String CLOSED = "CLOSED";
    public static final String CANCELLED = "CANCELLED";

    /** Statuses where is_draft must be true (not learner-visible). */
    public static final Set<String> DRAFT_LIKE = Set.of(REQUEST, SENT_BACK, REJECTED, DRAFT);

    /** Statuses where is_active must be false. */
    public static final Set<String> INACTIVE = Set.of(CLOSED, CANCELLED);

    private JobLifecycleStatus() {
    }
}
