package com._42students.lms.controller.electives;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Locale;
import java.util.Map;

/** Same contract as the groups and TPO advices: "not found" -> 404, rejected input -> 400, state conflict -> 409. */
@RestControllerAdvice(basePackages = "com._42students.lms.controller.electives")
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ElectiveExceptionAdvice {

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

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> duplicate(DataIntegrityViolationException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Already exists; refresh and try again"));
    }
}
