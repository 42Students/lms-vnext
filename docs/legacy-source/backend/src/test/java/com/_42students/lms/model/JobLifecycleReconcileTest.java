package com._42students.lms.model;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** A job written through the legacy admin pages (isDraft/isActive only) must not read stale in the TPO portal. */
class JobLifecycleReconcileTest {

    private static Job reconciled(String lifecycle, boolean draft, boolean active) throws Exception {
        Job job = new Job();
        job.setLifecycleStatus(lifecycle);
        job.setIsDraft(draft);
        job.setIsActive(active);
        Method hook = Job.class.getDeclaredMethod("reconcileLifecycleWithLegacyFlags");
        hook.setAccessible(true);
        hook.invoke(job);
        return job;
    }

    @Test void legacyDraftDefaultingToPublishedBecomesDraft() throws Exception {
        assertEquals("DRAFT", reconciled("PUBLISHED", true, true).getLifecycleStatus());
    }

    @Test void legacyClosedJobBecomesClosed() throws Exception {
        assertEquals("CLOSED", reconciled("PUBLISHED", false, false).getLifecycleStatus());
    }

    @Test void legacyPublishedJobStaysPublished() throws Exception {
        assertEquals("PUBLISHED", reconciled("PUBLISHED", false, true).getLifecycleStatus());
    }

    @Test void tpoOnlyStatesAreKeptWhenTheFlagsAgree() throws Exception {
        assertEquals("REQUEST", reconciled("REQUEST", true, true).getLifecycleStatus());
        assertEquals("SENT_BACK", reconciled("SENT_BACK", true, true).getLifecycleStatus());
        assertEquals("CANCELLED", reconciled("CANCELLED", false, false).getLifecycleStatus());
    }

    @Test void republishingLegacyDraftMovesPastDraft() throws Exception {
        // Admin flips is_draft off on a job that was DRAFT: it must become PUBLISHED, not stay DRAFT.
        assertEquals("PUBLISHED", reconciled("DRAFT", false, true).getLifecycleStatus());
    }
}
