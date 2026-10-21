package com._42students.lms.exceptions;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.*;

/** A typed value longer than its column reads as "too long" (400), not as a conflict with an existing record (409). */
class DataTooLongMessageTest {
    @Test
    void tooLongIsTheUsersToShorten() {
        GlobalExceptionHandler h = new GlobalExceptionHandler();
        ResponseEntity<Object> r = h.handleDataIntegrityViolation(
                new DataIntegrityViolationException("x", new SQLException("Data truncation: Data too long for column 'revoke_reason' at row 1")), null);
        assertEquals(HttpStatus.BAD_REQUEST, r.getStatusCode());
        ResponseEntity<Object> dup = h.handleDataIntegrityViolation(
                new DataIntegrityViolationException("x", new SQLException("Duplicate entry 'a' for key 'uk_x'")), null);
        assertEquals(HttpStatus.CONFLICT, dup.getStatusCode());
    }
}
