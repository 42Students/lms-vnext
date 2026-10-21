package com._42students.lms.configuration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Adds a safe correlation id and minimal request context to every backend log entry.
 *
 * Deliberately excluded from MDC/logging:
 *  - query strings
 *  - request/response bodies
 *  - Authorization/cookie headers
 *  - user tokens or credentials
 *
 * The correlation id is returned as X-Request-ID so operators can search one request
 * across controller/service/repository log lines in Cloud Logging.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestCorrelationFilter extends OncePerRequestFilter {
    public static final String REQUEST_ID_HEADER = "X-Request-ID";

    private static final Logger log = LoggerFactory.getLogger(RequestCorrelationFilter.class);
    private static final Pattern SAFE_REQUEST_ID =
            Pattern.compile("^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$");

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        String requestId = resolveRequestId(request.getHeader(REQUEST_ID_HEADER));
        String method = safeMethod(request.getMethod());
        String path = safePath(request);
        long startedNanos = System.nanoTime();
        Throwable failure = null;

        MDC.put("requestId", requestId);
        MDC.put("httpMethod", method);
        MDC.put("httpPath", path);
        response.setHeader(REQUEST_ID_HEADER, requestId);

        try {
            filterChain.doFilter(request, response);
        } catch (IOException | ServletException | RuntimeException ex) {
            failure = ex;
            throw ex;
        } finally {
            long durationMs = Math.max(0L, (System.nanoTime() - startedNanos) / 1_000_000L);
            int status = response.getStatus();
            int effectiveStatus = failure != null && status < 400 ? 500 : status;

            MDC.put("httpStatus", Integer.toString(effectiveStatus));
            MDC.put("durationMs", Long.toString(durationMs));

            if (isClientAbort(failure)) {
                // The client closed the connection before the response finished writing (tab
                // closed, navigated away, request cancelled) -- not a server-side failure.
                log.debug("http.request.client_aborted", failure);
            } else if (failure != null) {
                log.error("http.request.exception", failure);
            } else if (effectiveStatus >= 500) {
                log.error("http.request.failed");
            } else if (shouldLogClientWarning(effectiveStatus)) {
                log.warn("http.request.client_error");
            } else if (shouldLogSlow(path, durationMs)) {
                log.warn("http.request.slow");
            }

            RequestLogContext.clear();
            MDC.remove("durationMs");
            MDC.remove("httpStatus");
            MDC.remove("httpPath");
            MDC.remove("httpMethod");
            MDC.remove("requestId");
        }
    }

    static String resolveRequestId(String incoming) {
        if (incoming != null) {
            String candidate = incoming.trim();
            if (SAFE_REQUEST_ID.matcher(candidate).matches()) {
                return candidate;
            }
        }
        return UUID.randomUUID().toString();
    }

    static boolean shouldLogClientWarning(int status) {
        return status == 400 || status == 409 || status == 422 || status == 429;
    }

    static final long SLOW_REQUEST_MS = Long.getLong("lms.log.slow-request-ms", 3000L);

    /** Successful but slow requests are worth a WARN; long-lived streams and the logs tooling itself are not. */
    static boolean shouldLogSlow(String path, long durationMs) {
        if (durationMs < SLOW_REQUEST_MS || path == null) return false;
        return !path.endsWith("/subscribe") && !path.startsWith("/api/v1/superadmin/logs");
    }

    private static boolean isClientAbort(Throwable failure) {
        return failure instanceof org.apache.catalina.connector.ClientAbortException;
    }

    private String safePath(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri == null || uri.isBlank()) return "/";

        String contextPath = request.getContextPath();
        if (contextPath != null && !contextPath.isBlank() && uri.startsWith(contextPath)) {
            uri = uri.substring(contextPath.length());
        }
        if (uri.isBlank()) return "/";
        return uri.length() <= 1000 ? uri : uri.substring(0, 1000);
    }

    private String safeMethod(String method) {
        if (method == null || method.isBlank()) return "UNKNOWN";
        String normalized = method.trim().toUpperCase();
        return normalized.length() <= 16 ? normalized : normalized.substring(0, 16);
    }
}
