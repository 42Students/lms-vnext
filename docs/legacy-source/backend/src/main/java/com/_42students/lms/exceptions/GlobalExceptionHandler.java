package com._42students.lms.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import com._42students.lms.dto.response.Response;

import org.springframework.web.util.NestedServletException;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler  {

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<Object> handleExceptions( CustomException exception, WebRequest webRequest) {
        Response<Object> response = new Response<>(String.valueOf(exception.getReturnStatus().value()), exception.getMessage(), null);
        return new ResponseEntity<>(response,exception.getReturnStatus());
    }

    /**
     * Handle access denied (403) from AccessControlService.
     * Returns the exception message when present (e.g. "Access denied to this course") so the client can show a useful reason.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Object> handleAccessDenied(AccessDeniedException ex, WebRequest request) {
        String message = (ex.getMessage() != null && !ex.getMessage().isEmpty()) ? ex.getMessage() : "Access denied";
        Response<Object> response = new Response<>(HttpStatus.FORBIDDEN.name(), message, null);
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    /**
     * Catch-all for optimistic locking conflicts (@Version mismatch) that reach the controller
     * layer without going through one of the service's dedicated ...WithLockHandling wrappers.
     * Without this, a stray direct repository.save() on a versioned entity would surface as an
     * opaque 500 instead of a clean, retryable 409.
     */
    @ExceptionHandler(org.springframework.orm.ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<Object> handleOptimisticLockingFailure(org.springframework.orm.ObjectOptimisticLockingFailureException ex, WebRequest request) {
        Response<Object> response = new Response<>(HttpStatus.CONFLICT.name(), "This record was modified by someone else. Please refresh and try again.", null);
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    /**
     * MySQL picked this transaction as a deadlock victim (or a lock wait timed out) because another request was writing
     * the same rows at the same moment - e.g. two creates of the same unique host, where the duplicate-key check and the
     * gap locks of the other insert collide. The whole transaction was rolled back, nothing was written, and the request
     * can simply be retried: that is a conflict with a concurrent change (409, like the optimistic-lock case above), not
     * a server fault. It used to fall through to the generic handler as a 500.
     */
    @ExceptionHandler(org.springframework.dao.PessimisticLockingFailureException.class)
    public ResponseEntity<Object> handlePessimisticLockingFailure(org.springframework.dao.PessimisticLockingFailureException ex, WebRequest request) {
        logger.warn("Concurrent write conflict (lock/deadlock), transaction rolled back: " + ex.getMostSpecificCause().getMessage());
        Response<Object> response = new Response<>(HttpStatus.CONFLICT.name(), "This record was being changed at the same time. Please refresh and try again.", null);
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    /**
     * A uniqueness constraint rejected the write.
     *
     * <p>Audit 3.13 added real unique indexes behind the course/lesson duplicate-name checks,
     * which until then were SELECT-then-INSERT races with nothing enforcing them. The check still
     * runs first and still returns its own friendly 409 in the ordinary case; this handler exists
     * for the race the check cannot win — two concurrent creates that both pass it.
     *
     * <p>It has to live here rather than in the service, because those services are
     * {@code @Transactional}: a constraint violation marks the transaction rollback-only, so
     * catching it inside would produce an UnexpectedRollbackException at commit rather than a
     * clean response. Above the transaction boundary is the only place this can be translated.
     *
     * <p>Named constraints get a specific message; anything else gets a generic one rather than
     * echoing a raw SQL error, which would leak table and column names.
     */
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<Object> handleDataIntegrityViolation(
            org.springframework.dao.DataIntegrityViolationException ex, WebRequest request) {
        String detail = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : "";
        String lowered = detail != null ? detail.toLowerCase(java.util.Locale.ROOT) : "";
        String message;
        if (lowered.contains("ux_course_dept_name_active")) {
            message = "A course with this name already exists in this department.";
        } else if (lowered.contains("ux_course_dept_short_title_active")) {
            message = "A course with this short title already exists in this department.";
        } else if (lowered.contains("ux_lesson_course_name_active")) {
            message = "A lesson with this name already exists in this course.";
        } else if (lowered.contains("data too long for column")) {
            // A typed value longer than its column (a reason, a note, a name) is the user's to shorten, not a conflict with a record.
            return new ResponseEntity<>(new Response<>(HttpStatus.BAD_REQUEST.name(), "One of the values is too long. Shorten it and try again.", null), HttpStatus.BAD_REQUEST);
        } else {
            message = "That change conflicts with an existing record. Please refresh and try again.";
        }
        return new ResponseEntity<>(new Response<>(HttpStatus.CONFLICT.name(), message, null), HttpStatus.CONFLICT);
    }

    /**
     * Handle NullPointerExceptions that reach the controller/service layer unguarded — most
     * commonly caused by a missing or malformed @RequestBody (a literal JSON `null` deserializes
     * to a Java null, and a subsequent getter call on it throws). Returns a clean, generic 400
     * instead of letting the NPE's raw message (e.g. "Cannot invoke X because Y is null", which
     * can leak internal field/method names) surface to the client.
     */
    @ExceptionHandler(NullPointerException.class)
    public ResponseEntity<Object> handleNullPointerException(NullPointerException ex, WebRequest request) {
        logger.error("Unhandled NullPointerException (likely missing/malformed request body)", ex);
        Response<Object> response = new Response<>(HttpStatus.BAD_REQUEST.name(), "Request body is missing or malformed", null);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * The client closed the connection before the response finished writing (tab closed,
     * navigated away, request cancelled) -- not a server-side failure. This was falling through
     * to the generic handler below and logging at ERROR on every occurrence, which paged on a
     * client's own disconnect rather than an actual application bug.
     */
    @ExceptionHandler(org.apache.catalina.connector.ClientAbortException.class)
    public ResponseEntity<Object> handleClientAbort(org.apache.catalina.connector.ClientAbortException ex, WebRequest request) {
        logger.debug("Client aborted the connection before the response completed", ex);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    /**
     * Handle unhandled exceptions. Logs the full error internally but returns a generic message
     * to the client to avoid leaking internal stack traces or implementation details.
     * Exceptions that carry user-facing messages (e.g. IllegalArgumentException from business logic)
     * are passed through; all others return a generic 500.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleGenericException(Exception ex, WebRequest request) {
        Throwable cause = ex instanceof NestedServletException ? ex.getCause() : ex;
        Throwable effective = cause != null ? cause : ex;
        // A ResponseStatusException with a 4xx status is a deliberate refusal ("Quiz deadline has
        // passed", "Lesson content not found"), not a crash. Logging those as ERROR "Unhandled
        // exception" with a stack trace put them in the daily alert digest as new error types.
        if (effective instanceof org.springframework.web.server.ResponseStatusException
                && ((org.springframework.web.server.ResponseStatusException) effective).getStatus().is4xxClientError()) {
            logger.warn("Request refused: " + effective.getMessage());
        } else {
            // Log full details server-side only
            logger.error("Unhandled exception: " + effective.getMessage(), effective);
        }
        // Pass through user-facing messages from business logic exceptions
        boolean isUserFacing = effective instanceof IllegalArgumentException
                || effective instanceof IllegalStateException
                || effective instanceof org.springframework.web.server.ResponseStatusException;
        String message = isUserFacing && effective.getMessage() != null
                ? effective.getMessage()
                : "An unexpected error occurred";
        HttpStatus status;
        if (effective instanceof org.springframework.web.server.ResponseStatusException) {
            status = ((org.springframework.web.server.ResponseStatusException) effective).getStatus();
        } else if (effective instanceof IllegalArgumentException) {
            // IllegalArgumentException is how business logic reports a rejected request (bad input,
            // scheduling conflicts, etc.) - it is a client-fault, not a server-fault, so it must not
            // read as a 500. IllegalStateException is left mapped to 500 below: by existing convention
            // (see SemesterControllerErrorSemanticsTest) it signals an unexpected/broken server state,
            // not a validation failure.
            status = HttpStatus.BAD_REQUEST;
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }
        Response<Object> response = new Response<>(status.name(), message, null);
        return new ResponseEntity<>(response, status);
    }

    /**
     * A request body that doesn't fit the expected shape (a word where a date belongs, a string
     * where a number belongs). The base class answered with an empty 400 and logged nothing, so
     * prod showed only "Request failed with status 400" and no way to tell which field was wrong
     * (mentor task edits on project 3, 3 Oct). Name the field and log the cause.
     */
    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(
            org.springframework.http.converter.HttpMessageNotReadableException ex,
            org.springframework.http.HttpHeaders headers,
            HttpStatus status,
            WebRequest request) {
        String field = null;
        Throwable cause = ex.getMostSpecificCause();
        if (ex.getCause() instanceof com.fasterxml.jackson.databind.JsonMappingException) {
            field = ((com.fasterxml.jackson.databind.JsonMappingException) ex.getCause()).getPath().stream()
                    .map(ref -> ref.getFieldName() != null ? ref.getFieldName() : "[" + ref.getIndex() + "]")
                    .collect(Collectors.joining("."));
        }
        logger.warn("Unreadable request body" + (field != null && !field.isEmpty() ? " at field '" + field + "'" : "")
                + ": " + (cause != null ? cause.getMessage() : ex.getMessage()));
        String message = field != null && !field.isEmpty()
                ? "The value sent for '" + field + "' is not in the right format."
                : "The request could not be read. Refresh the page and try again.";
        return new ResponseEntity<>(new Response<>(HttpStatus.BAD_REQUEST.name(), message, null), HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle validation errors from @Valid annotations
     * Provides user-friendly error messages for validation failures
     */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            org.springframework.http.HttpHeaders headers,
            HttpStatus status,
            WebRequest request) {
        
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        // Create a user-friendly error message
        String errorMessage = errors.entrySet().stream()
                .map(entry -> entry.getKey() + ": " + entry.getValue())
                .collect(Collectors.joining(", "));
        
        Response<Object> response = new Response<>(
                "error",
                "Validation failed: " + errorMessage,
                errors
        );
        
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
}
