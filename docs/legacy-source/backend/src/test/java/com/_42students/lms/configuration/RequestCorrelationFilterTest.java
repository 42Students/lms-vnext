package com._42students.lms.configuration;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

class RequestCorrelationFilterTest {
    private final RequestCorrelationFilter filter = new RequestCorrelationFilter();

    @AfterEach
    void clearMdc() {
        MDC.clear();
    }

    @Test
    void preservesSafeIncomingRequestIdAndReturnsItToCaller() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/courses");
        request.addHeader(RequestCorrelationFilter.REQUEST_ID_HEADER, "client-request-1234");
        request.setQueryString("token=must-never-enter-mdc");
        MockHttpServletResponse response = new MockHttpServletResponse();

        AtomicReference<String> capturedId = new AtomicReference<>();
        AtomicReference<String> capturedPath = new AtomicReference<>();
        AtomicReference<String> capturedMethod = new AtomicReference<>();

        filter.doFilter(request, response, (req, res) -> {
            capturedId.set(MDC.get("requestId"));
            capturedPath.set(MDC.get("httpPath"));
            capturedMethod.set(MDC.get("httpMethod"));
        });

        assertEquals("client-request-1234", capturedId.get());
        assertEquals("client-request-1234", response.getHeader("X-Request-ID"));
        assertEquals("/api/v1/courses", capturedPath.get());
        assertEquals("GET", capturedMethod.get());
        assertFalse(capturedPath.get().contains("token"));
        assertNull(MDC.get("requestId"), "MDC must be cleared before the container reuses the thread");
    }

    @Test
    void replacesUnsafeRequestIdInsteadOfLoggingUntrustedText() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/test");
        request.addHeader(RequestCorrelationFilter.REQUEST_ID_HEADER, "bad");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<String> capturedId = new AtomicReference<>();

        filter.doFilter(request, response, (req, res) -> capturedId.set(MDC.get("requestId")));

        assertNotNull(capturedId.get());
        assertNotEquals("bad", capturedId.get());
        assertTrue(capturedId.get().matches("^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$"));
        assertEquals(capturedId.get(), response.getHeader("X-Request-ID"));
    }

    @Test
    void stripsServletContextFromLoggedPathAndNeverUsesQueryString() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(
                "GET", "/lms-backend/api/v1/projects/workspaces/42");
        request.setContextPath("/lms-backend");
        request.setQueryString("access_token=secret&search=sensitive");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<String> capturedPath = new AtomicReference<>();

        filter.doFilter(request, response, (req, res) -> capturedPath.set(MDC.get("httpPath")));

        assertEquals("/api/v1/projects/workspaces/42", capturedPath.get());
        assertFalse(capturedPath.get().contains("?"));
        assertFalse(capturedPath.get().contains("secret"));
    }

    @Test
    void warnsOnlyForActionableClientStatusesAndNotRoutineAuthOrNotFoundNoise() {
        assertTrue(RequestCorrelationFilter.shouldLogClientWarning(400));
        assertTrue(RequestCorrelationFilter.shouldLogClientWarning(409));
        assertTrue(RequestCorrelationFilter.shouldLogClientWarning(422));
        assertTrue(RequestCorrelationFilter.shouldLogClientWarning(429));

        assertFalse(RequestCorrelationFilter.shouldLogClientWarning(401));
        assertFalse(RequestCorrelationFilter.shouldLogClientWarning(403));
        assertFalse(RequestCorrelationFilter.shouldLogClientWarning(404));
    }

    @Test
    void slowSuccessfulRequestsAreWarnedButStreamsAndLogToolingAreNot() {
        assertTrue(RequestCorrelationFilter.shouldLogSlow("/api/v1/courses", 3500));
        assertFalse(RequestCorrelationFilter.shouldLogSlow("/api/v1/courses", 200));
        assertFalse(RequestCorrelationFilter.shouldLogSlow("/api/v1/notification/subscribe", 600000));
        assertFalse(RequestCorrelationFilter.shouldLogSlow("/api/v1/superadmin/logs/export", 29000));
        assertFalse(RequestCorrelationFilter.shouldLogSlow(null, 9000));
    }
}
