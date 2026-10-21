package com._42students.lms.controller.groups;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Map;

/** Same contract as TpoExceptionAdvice: "not found" -> 404, other rejections -> 400, state conflicts -> 409. */
@RestControllerAdvice(basePackages = "com._42students.lms.controller.groups")
@Order(Ordered.HIGHEST_PRECEDENCE)
public class GroupExceptionAdvice {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> rejected(IllegalArgumentException e) {
        String message = e.getMessage() == null ? "Bad request" : e.getMessage();
        boolean notFound = message.toLowerCase(Locale.ROOT).contains("not found");
        return ResponseEntity.status(notFound ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST).body(Map.of("error", message));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> conflict(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage() == null ? "Conflict" : e.getMessage()));
    }

    /** Two requests for the same member raced past the existence check; the unique key kept one. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> duplicate(DataIntegrityViolationException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Already a member; refresh and try again"));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> status(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatus()).body(Map.of("error", e.getReason() == null ? e.getStatus().getReasonPhrase() : e.getReason()));
    }
}
