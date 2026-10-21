package com._42students.lms.config;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class CanonicalResourceFileRouteGuardTest {
    private static final String KEY = "org-1/college-2/lesson-content/class-8/user-42/abc.pdf";

    @Test
    void newResourcesCannotBeReadOrDeletedThroughGenericKeyRoutes() {
        assertTrue(CanonicalResourceFileRouteGuard.forbidGenericFileRoute("GET", KEY));
        assertTrue(CanonicalResourceFileRouteGuard.forbidGenericFileRoute("GET", "https://files.example/storagelms/" + KEY + "?token=1"));
        assertTrue(CanonicalResourceFileRouteGuard.forbidGenericFileRoute("DELETE", KEY));
        assertTrue(CanonicalResourceFileRouteGuard.forbidGenericFileRoute("GET", "org-1/college-2/lesson-content/course-9/user-0/abc.pdf"));
        assertTrue(CanonicalResourceFileRouteGuard.forbidGenericFileRoute("GET", "org-1/college-2/lesson-content/course-9/class-8/user-42/abc.pdf"));
        assertTrue(CanonicalResourceFileRouteGuard.forbidGenericFileRoute("DELETE", "org-1/college-2/lesson-content/course-9/class-8/user-42/abc.pdf"));
    }

    @Test
    void oldReadersRemainAndAllLessonObjectsAreProtectedFromGenericDeletion() {
        assertFalse(CanonicalResourceFileRouteGuard.forbidGenericFileRoute("GET", "lesson-content/old-lecture.pdf"));
        assertFalse(CanonicalResourceFileRouteGuard.forbidGenericFileRoute("GET", "org-1/college-2/lesson-content/legacy.pdf"));
        assertTrue(CanonicalResourceFileRouteGuard.forbidGenericFileRoute("DELETE", "lesson-content/old-lecture.pdf"));
        assertTrue(CanonicalResourceFileRouteGuard.forbidGenericFileRoute("DELETE", "org-1/college-2/lesson-content/legacy.pdf"));
        assertFalse(CanonicalResourceFileRouteGuard.forbidGenericFileRoute("DELETE", "org-1/college-2/profile-images/user-3/avatar.jpg"));
        assertFalse(CanonicalResourceFileRouteGuard.forbidGenericFileRoute("GET", null));
    }
}
