package com._42students.lms.security;

import com._42students.lms.service.tpo.PlacementEligibilityService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Level 1 (the college has Placements) and Level 2 (the student is Eligible) in front of every placement API. */
class PlacementAccessFilterTest {

    private final PlacementEligibilityService eligibility = mock(PlacementEligibilityService.class);
    private final SecurityContextUtil security = mock(SecurityContextUtil.class);
    private final PlacementAccessFilter filter = new PlacementAccessFilter(eligibility, security);

    private int call(UserPrincipal who, String path) throws Exception {
        when(security.getAuthenticatedUserPrincipal()).thenReturn(who);
        MockHttpServletRequest req = new MockHttpServletRequest("GET", path);
        MockHttpServletResponse res = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();
        filter.doFilter(req, res, chain);
        return chain.getRequest() != null ? 200 : res.getStatus();
    }

    private static UserPrincipal learner() { return new UserPrincipal(501, "LEARNER", null, 1, 6, 0); }
    private static UserPrincipal tpo() { return new UserPrincipal(77, "FACULTY", "TPO", 1, 6, 0); }
    private static UserPrincipal recruiter() { return new UserPrincipal(9, "RECRUITER", null, null, 6, 0); }

    @Test
    void aStudentUsesPlacementsOnlyWhenTheCollegeHasItAndTheyAreEligible() throws Exception {
        when(eligibility.collegeHasPlacements(6)).thenReturn(true);
        when(eligibility.learnerInPlacements(501, 6)).thenReturn(false);
        assertEquals(403, call(learner(), "/api/v1/learner/drives"));
        assertEquals(403, call(learner(), "/api/v2/jobs/12"));
        assertEquals(200, call(learner(), "/api/v1/courses"), "other modules are untouched");
        assertEquals(200, call(learner(), "/api/v1/learner/drivesx"), "only whole path segments match");

        when(eligibility.learnerInPlacements(501, 6)).thenReturn(true);
        assertEquals(200, call(learner(), "/api/v1/learner/drives"));

        when(eligibility.collegeHasPlacements(6)).thenReturn(false);
        assertEquals(403, call(learner(), "/api/v1/learner/drives"), "the college switch closes it for everyone");
    }

    @Test
    void theCollegeSwitchClosesThePlacementCellAndRecruiters() throws Exception {
        when(eligibility.collegeHasPlacements(6)).thenReturn(false);
        assertEquals(403, call(tpo(), "/api/v1/tpo/home"));
        assertEquals(403, call(recruiter(), "/api/v1/recruiter/colleges/6/drives"));
        assertEquals(403, call(recruiter(), "/api/v1/recruiter/home"));
        assertEquals(200, call(recruiter(), "/api/v1/recruiter/me"), "a recruiter can still reach their account and switch college");
        assertEquals(200, call(recruiter(), "/api/v1/recruiter/notifications"));

        when(eligibility.collegeHasPlacements(6)).thenReturn(true);
        assertEquals(200, call(tpo(), "/api/v1/tpo/home"));
        assertEquals(200, call(recruiter(), "/api/v1/recruiter/home"));
    }

    @Test
    void onlyAStudentReachesTheStudentsOwnPlacementPages() throws Exception {
        when(eligibility.collegeHasPlacements(6)).thenReturn(true);
        assertEquals(403, call(tpo(), "/api/v1/learner/profile/academic-record"), "a faculty id is not a learner id");
        assertEquals(403, call(tpo(), "/api/v1/learner/requests/mine"));
        assertEquals(403, call(recruiter(), "/api/v1/learner/offers/3/respond"));
        assertEquals(200, call(tpo(), "/api/v2/jobs/12"), "shared job APIs keep their own checks");
    }

    @Test
    void superAdminAndAnonymousRequestsAreLeftToTheirOwnChecks() throws Exception {
        assertEquals(200, call(new UserPrincipal(0, "FACULTY", "ADMIN", null, null, 0), "/api/v1/tpo/home"));
        assertEquals(200, call(null, "/api/v1/learner/drives"));
        verify(eligibility, never()).collegeHasPlacements(any());
    }
}
