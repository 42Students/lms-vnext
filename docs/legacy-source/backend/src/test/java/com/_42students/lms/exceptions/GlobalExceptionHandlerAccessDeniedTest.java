package com._42students.lms.exceptions;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.context.request.ServletWebRequest;

import javax.servlet.http.HttpServletRequest;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

/** Unit coverage for the public, intentionally scoped AccessDeniedException message contract. */
class GlobalExceptionHandlerAccessDeniedTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("AccessDeniedException returns 403 with the scoped denial reason")
    void handleAccessDenied_returns403() {
        AccessDeniedException ex = new AccessDeniedException("Access denied to this college");
        ServletWebRequest request = new ServletWebRequest(mock(HttpServletRequest.class));

        ResponseEntity<Object> response = handler.handleAccessDenied(ex, request);

        assertNotNull(response);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof com._42students.lms.dto.response.Response);
        com._42students.lms.dto.response.Response<?> body = (com._42students.lms.dto.response.Response<?>) response.getBody();
        assertEquals(HttpStatus.FORBIDDEN.name(), body.getStatus());
        assertEquals("Access denied to this college", body.getMessage());
        assertNull(body.getData());
    }

    @Test
    @DisplayName("missing AccessDeniedException reason uses the generic denial message")
    void handleAccessDenied_nullMessageFallsBack() {
        ServletWebRequest request = new ServletWebRequest(mock(HttpServletRequest.class));
        ResponseEntity<Object> response = handler.handleAccessDenied(new AccessDeniedException(null), request);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        com._42students.lms.dto.response.Response<?> body =
                (com._42students.lms.dto.response.Response<?>) response.getBody();
        assertEquals("Access denied", body.getMessage());
        assertNull(body.getData());
    }
}
