package com._42students.lms.controller.tpo;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Locale;
import java.util.Map;

/**
 * One place that turns the TPO package's business exceptions into quiet client errors.
 *
 * Why this exists: TpoAccessGuard (and the services) report "not yours / does not exist" as
 * IllegalArgumentException("Not found"). Only some controllers had a local handler for that; the
 * rest fell through to GlobalExceptionHandler, which logs it as an unhandled ERROR, and production
 * log alerting pages the team for every stale or foreign id. A missing or foreign record is a
 * normal 404, not an incident. Runs before the global handler and only for controller.tpo.
 */
@RestControllerAdvice(basePackages = "com._42students.lms.controller.tpo")
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TpoExceptionAdvice {

    /** "Not found" / "Drive not found" -> 404 (same body whether missing or another college's); other rejections -> 400. */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> rejected(IllegalArgumentException e) {
        String message = e.getMessage() == null ? "Bad request" : e.getMessage();
        boolean notFound = message.toLowerCase(Locale.ROOT).contains("not found");
        return ResponseEntity.status(notFound ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST).body(Map.of("error", message));
    }

    /** A state conflict (e.g. an offer that cannot be reversed any more) -> 409. */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> conflict(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage() == null ? "Conflict" : e.getMessage()));
    }
}
