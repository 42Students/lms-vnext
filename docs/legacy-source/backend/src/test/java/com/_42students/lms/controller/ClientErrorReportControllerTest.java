package com._42students.lms.controller;

import com._42students.lms.dto.request.ClientErrorReportRequest;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ClientErrorReportControllerTest {

    private SecurityContextUtil securityContextUtil;
    private ClientErrorReportController controller;
    private UserPrincipal learner;

    @BeforeEach
    void setup() {
        securityContextUtil = mock(SecurityContextUtil.class);
        controller = new ClientErrorReportController(securityContextUtil);
        learner = new UserPrincipal(42, "LEARNER", null, 1, 2, 0);
    }

    private ClientErrorReportRequest request(String type, String message) {
        ClientErrorReportRequest r = new ClientErrorReportRequest();
        r.setType(type);
        r.setMessage(message);
        r.setPage("/dashboard/course/55");
        return r;
    }

    @Test
    void rejectsAnUnauthenticatedCaller() {
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(null);
        var response = controller.report(request("JS_ERROR", "boom"));
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void rejectsAMissingBody() {
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);
        var response = controller.report(null);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void rejectsABlankMessage() {
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);
        var response = controller.report(request("JS_ERROR", "   "));
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void acceptsAWellFormedReport() {
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);
        var response = controller.report(request("JS_ERROR", "TypeError: x is not a function"));
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void anUnrecognizedTypeFallsBackToJsErrorRatherThanRejecting() {
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);
        var response = controller.report(request("something_made_up", "boom"));
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void acceptsAVideoPlaybackFailureReport() {
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);
        var response = controller.report(request("VIDEO_PLAYBACK_FAILURE", "Video failed to play (code 4): https://cdn.example.com/lesson.mp4"));
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void acceptsAFileUploadFailureReportWithEndpointAndStatus() {
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);
        ClientErrorReportRequest r = request("FILE_UPLOAD_FAILURE", "Upload failed: resume.pdf");
        r.setEndpoint("presign-upload");
        r.setStatusCode(500);
        var response = controller.report(r);
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void restoresMdcAfterLogging() {
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);
        org.slf4j.MDC.put("httpPath", "/api/v1/client-errors/report");
        org.slf4j.MDC.put("httpMethod", "POST");

        controller.report(request("JS_ERROR", "boom"));

        assertEquals("/api/v1/client-errors/report", org.slf4j.MDC.get("httpPath"));
        assertEquals("POST", org.slf4j.MDC.get("httpMethod"));
        org.slf4j.MDC.clear();
    }

    @Test
    void aTwentyFirstReportInOneMinuteFromTheSameAccountIsRateLimited() {
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);
        for (int i = 0; i < 20; i++) {
            assertEquals(HttpStatus.OK, controller.report(request("JS_ERROR", "boom " + i)).getStatusCode());
        }
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, controller.report(request("JS_ERROR", "one too many")).getStatusCode());
    }

    @Test
    void differentAccountsHaveIndependentRateLimits() {
        UserPrincipal other = new UserPrincipal(99, "LEARNER", null, 1, 2, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);
        for (int i = 0; i < 20; i++) {
            controller.report(request("JS_ERROR", "boom " + i));
        }
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(other);
        assertEquals(HttpStatus.OK, controller.report(request("JS_ERROR", "fresh account")).getStatusCode());
    }
}
