package com._42students.lms.configuration;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.*;

class BugTrackerRateLimitFilterTest {
    @Test
    void trackerResponsesAreNoStoreAndIssueCreationIsRateLimited() throws Exception {
        BugTrackerRateLimitFilter filter = new BugTrackerRateLimitFilter();

        for (int i = 0; i < 30; i++) {
            MockHttpServletRequest request = createRequest();
            MockHttpServletResponse response = new MockHttpServletResponse();
            filter.doFilter(request, response, new MockFilterChain());
            assertEquals(200, response.getStatus());
            assertTrue(response.getHeader("Cache-Control").contains("no-store"));
        }

        MockHttpServletResponse blocked = new MockHttpServletResponse();
        filter.doFilter(createRequest(), blocked, new MockFilterChain());
        assertEquals(429, blocked.getStatus());
        assertTrue(blocked.getContentAsString().contains("Too many tracker write requests"));
    }

    @Test
    void attachmentWritesHaveTheirOwnHigherRateLimitBucket() throws Exception {
        BugTrackerRateLimitFilter filter = new BugTrackerRateLimitFilter();

        for (int i = 0; i < 120; i++) {
            MockHttpServletRequest request = attachmentRequest();
            MockHttpServletResponse response = new MockHttpServletResponse();
            filter.doFilter(request, response, new MockFilterChain());
            assertEquals(200, response.getStatus());
        }

        MockHttpServletResponse blocked = new MockHttpServletResponse();
        filter.doFilter(attachmentRequest(), blocked, new MockFilterChain());
        assertEquals(429, blocked.getStatus());
        assertTrue(blocked.getContentAsString().contains("Too many tracker write requests"));
    }

    @Test
    void unrelatedEndpointsAreUntouched() throws Exception {
        BugTrackerRateLimitFilter filter = new BugTrackerRateLimitFilter();
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/courses");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertNull(response.getHeader("Cache-Control"));
        assertEquals(200, response.getStatus());
    }

    private MockHttpServletRequest createRequest() {
        MockHttpServletRequest request =
                new MockHttpServletRequest("POST", "/api/v1/public/bug-tracker/issues");
        request.setRemoteAddr("203.0.113.10");
        return request;
    }

    private MockHttpServletRequest attachmentRequest() {
        MockHttpServletRequest request =
                new MockHttpServletRequest(
                        "POST",
                        "/api/v1/public/bug-tracker/issues/LMS-0042/attachments/presign");
        request.setRemoteAddr("203.0.113.20");
        return request;
    }
}
