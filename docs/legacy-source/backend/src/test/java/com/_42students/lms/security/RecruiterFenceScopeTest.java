package com._42students.lms.security;

import com._42students.lms.security.RecruiterFenceFilter.Scope;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * recruiter V2: one college per session. A recruiter's token is issued for one college and the fence, not
 * each controller, keeps it there. A college-less ("hub") token is only an account chooser.
 */
class RecruiterFenceScopeTest {

    private static final Integer NSRIT = 6;

    @Test
    void aCollegeSessionReachesItsOwnCollegeUnderTheCollegePrefix() {
        assertEquals(Scope.OK, RecruiterFenceFilter.scopeFor("/api/v1/recruiter/colleges/6/drives", NSRIT));
        assertEquals(Scope.OK, RecruiterFenceFilter.scopeFor("/api/v1/recruiter/colleges/6", NSRIT));
        assertEquals(Scope.OK, RecruiterFenceFilter.scopeFor("/api/v1/recruiter/colleges/6/drives/12/applicants/", NSRIT));
    }

    @Test
    void aCollegeSessionAskingForAnotherCollegeIsTreatedAsNotFound() {
        assertEquals(Scope.OTHER_COLLEGE, RecruiterFenceFilter.scopeFor("/api/v1/recruiter/colleges/7/drives", NSRIT));
        assertEquals(Scope.OTHER_COLLEGE, RecruiterFenceFilter.scopeFor("/api/v1/recruiter/colleges/7", NSRIT));
        assertEquals(Scope.OTHER_COLLEGE, RecruiterFenceFilter.scopeFor("/api/v1/recruiter/colleges/7/overview", NSRIT));
    }

    @Test
    void collegeIdsThatMerelyStartWithTheSessionIdAreOtherColleges() {
        assertEquals(Scope.OTHER_COLLEGE, RecruiterFenceFilter.scopeFor("/api/v1/recruiter/colleges/61/drives", NSRIT));
        assertEquals(Scope.OTHER_COLLEGE, RecruiterFenceFilter.scopeFor("/api/v1/recruiter/colleges/6x/drives", NSRIT));
        assertEquals(Scope.OTHER_COLLEGE, RecruiterFenceFilter.scopeFor("/api/v1/recruiter/colleges/06/drives", NSRIT));
    }

    @Test
    void pendingInvitationsNameOtherCollegesSoOnlyTheHubSeesThem() {
        assertEquals(Scope.OTHER_COLLEGE, RecruiterFenceFilter.scopeFor("/api/v1/recruiter/pending-invites", NSRIT));
        assertEquals(Scope.OTHER_COLLEGE, RecruiterFenceFilter.scopeFor("/api/v1/recruiter/pending-invites/7/accept", NSRIT));
        assertEquals(Scope.OK, RecruiterFenceFilter.scopeFor("/api/v1/recruiter/pending-invites", null));
        assertEquals(Scope.OK, RecruiterFenceFilter.scopeFor("/api/v1/recruiter/pending-invites/7/accept", null));
    }

    @Test
    void theCollegeLessHubSessionIsOnlyAnAccountChooser() {
        assertEquals(Scope.OK, RecruiterFenceFilter.scopeFor("/api/v1/recruiter/me", null));
        assertEquals(Scope.OK, RecruiterFenceFilter.scopeFor("/api/v1/recruiter/me/", null));
        for (String path : new String[]{
                "/api/v1/recruiter/home", "/api/v1/recruiter/colleges", "/api/v1/recruiter/colleges/6/drives", "/api/v1/recruiter/colleges/6/overview",
                "/api/v1/recruiter/messages/threads", "/api/v1/recruiter/plan-drive", "/api/v1/recruiter/drive-groups", "/api/v1/recruiter/drive-groups/3",
                "/api/v1/recruiter"}) {
            assertEquals(Scope.COLLEGE_REQUIRED, RecruiterFenceFilter.scopeFor(path, null), path);
        }
    }

    @Test
    void sessionLifecycleAndPublicPathsAreNotScoped() {
        for (Integer college : new Integer[]{null, NSRIT}) {
            assertEquals(Scope.OK, RecruiterFenceFilter.scopeFor("/api/v1/auth/refresh", college));
            assertEquals(Scope.OK, RecruiterFenceFilter.scopeFor("/api/v1/auth/memberships", college));
            assertEquals(Scope.OK, RecruiterFenceFilter.scopeFor("/api/v1/public/hr-invite/abc", college));
        }
    }

    @Test
    void selfEndpointsOfACollegeSessionStayReachable() {
        assertEquals(Scope.OK, RecruiterFenceFilter.scopeFor("/api/v1/recruiter/me", NSRIT));
        assertEquals(Scope.OK, RecruiterFenceFilter.scopeFor("/api/v1/recruiter/home", NSRIT));
        assertEquals(Scope.OK, RecruiterFenceFilter.scopeFor("/api/v1/recruiter/messages/threads", NSRIT));
        assertEquals(Scope.OK, RecruiterFenceFilter.scopeFor("/api/v1/recruiter/drive-groups", NSRIT));
    }

    @Test
    void pathShapesThatCouldConfuseTheCollegeIdAreNeverTreatedAsTheSessionCollege() {
        for (String path : new String[]{
                "/api/v1/recruiter/colleges/6.json/drives", "/api/v1/recruiter/colleges/6%2f/drives", "/api/v1/recruiter/colleges/+6/drives",
                "/api/v1/recruiter/colleges/-6/drives", "/api/v1/recruiter/colleges//drives", "/api/v1/recruiter/colleges/abc/drives", "/api/v1/recruiter/colleges/6,7/drives"}) {
            assertEquals(Scope.OTHER_COLLEGE, RecruiterFenceFilter.scopeFor(path, NSRIT), path);
        }
        // the plain list endpoint is scoped by the controller itself (it only ever returns the session's college)
        assertEquals(Scope.OK, RecruiterFenceFilter.scopeFor("/api/v1/recruiter/colleges", NSRIT));
    }

    @Test
    void theNewWorkspaceEndpointsAreCollegeScoped() {
        for (String tail : new String[]{"today", "calendar", "company", "team", "reports", "drives/9/offers", "drives/9/notes", "drives/9/notes/A000000001"}) {
            assertEquals(Scope.OK, RecruiterFenceFilter.scopeFor("/api/v1/recruiter/colleges/6/" + tail, NSRIT), tail);
            assertEquals(Scope.OTHER_COLLEGE, RecruiterFenceFilter.scopeFor("/api/v1/recruiter/colleges/7/" + tail, NSRIT), tail);
            assertEquals(Scope.COLLEGE_REQUIRED, RecruiterFenceFilter.scopeFor("/api/v1/recruiter/colleges/6/" + tail, null), tail);
        }
        assertEquals(Scope.OK, RecruiterFenceFilter.scopeFor("/api/v1/recruiter/notifications", NSRIT));
        assertEquals(Scope.COLLEGE_REQUIRED, RecruiterFenceFilter.scopeFor("/api/v1/recruiter/notifications", null), "the bell is college data");
    }
}
