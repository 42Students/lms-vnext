package com._42students.lms.exceptions;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.server.ResponseStatusException;

import javax.servlet.http.HttpServletRequest;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

/**
 * Covers handleGenericException's status-code mapping. IllegalArgumentException is how business
 * logic (e.g. ClassScheduleServiceImpl scheduling conflicts) reports a rejected request - it must
 * read as a client error (400), not a server fault (500), which is what a faculty member scheduling
 * a class into a real conflict was previously seeing. IllegalStateException stays mapped to 500 by
 * existing convention (see SemesterControllerErrorSemanticsTest).
 */
class GlobalExceptionHandlerGenericExceptionTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    private ServletWebRequest request() {
        return new ServletWebRequest(mock(HttpServletRequest.class));
    }

    @Test
    @DisplayName("IllegalArgumentException maps to 400, not 500")
    void illegalArgumentException_returns400() {
        ResponseEntity<Object> response = handler.handleGenericException(
                new IllegalArgumentException("Faculty scheduling conflict: already booked"), request());

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        com._42students.lms.dto.response.Response<?> body =
                (com._42students.lms.dto.response.Response<?>) response.getBody();
        assertEquals(HttpStatus.BAD_REQUEST.name(), body.getStatus());
        assertEquals("Faculty scheduling conflict: already booked", body.getMessage());
    }

    @Test
    @DisplayName("IllegalStateException still maps to 500 (unexpected/server-side failure convention)")
    void illegalStateException_returns500() {
        ResponseEntity<Object> response = handler.handleGenericException(
                new IllegalStateException("database unavailable"), request());

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        com._42students.lms.dto.response.Response<?> body =
                (com._42students.lms.dto.response.Response<?>) response.getBody();
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR.name(), body.getStatus());
        assertEquals("database unavailable", body.getMessage());
    }

    @Test
    @DisplayName("ResponseStatusException keeps carrying its own explicit status")
    void responseStatusException_keepsOwnStatus() {
        ResponseEntity<Object> response = handler.handleGenericException(
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Semester not found"), request());

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    @DisplayName("An unrecognized exception type still maps to a generic 500")
    void otherException_returns500WithGenericMessage() {
        ResponseEntity<Object> response = handler.handleGenericException(
                new RuntimeException("some internal detail"), request());

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        com._42students.lms.dto.response.Response<?> body =
                (com._42students.lms.dto.response.Response<?>) response.getBody();
        assertEquals("An unexpected error occurred", body.getMessage());
    }
}
