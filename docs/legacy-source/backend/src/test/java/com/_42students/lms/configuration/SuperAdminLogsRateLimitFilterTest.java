package com._42students.lms.configuration;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SuperAdminLogsRateLimitFilterTest {
    @Test
    void logResponsesAreAlwaysMarkedNoStore() throws Exception {
        SuperAdminLogsRateLimitFilter filter = new SuperAdminLogsRateLimitFilter();
        MockHttpServletRequest request = new MockHttpServletRequest(
                "POST", "/api/v1/superadmin/logs/query");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertEquals("no-store, private, max-age=0", response.getHeader("Cache-Control"));
        assertEquals("no-cache", response.getHeader("Pragma"));
    }

    @Test
    void unrelatedEndpointsAreNotTouched() throws Exception {
        SuperAdminLogsRateLimitFilter filter = new SuperAdminLogsRateLimitFilter();
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/courses");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertEquals(null, response.getHeader("Cache-Control"));
    }
}
