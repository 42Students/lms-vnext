package com._42students.lms.controller;

import com._42students.lms.dto.request.ClientErrorReportRequest;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Receives frontend-observed errors (uncaught JS exceptions, console.error calls, failed API
 * responses, failed resource loads, mid-action auth failures) and logs them through the exact same
 * pipeline as backend errors: same JSON log format, same stdout -> Cloud Logging path, same
 * LogAlertingService poller (which watches severity>=ERROR under this container regardless of
 * where the error text says it originated), same Logs page. No new infrastructure needed -- a
 * frontend error becomes a backend log entry the moment it's reported here.
 *
 * <p>Requires authentication (any logged-in role) rather than being public: this is what lets an
 * account/role be attached to the report without trusting anything the client claims about who it
 * is, and it means only real logged-in sessions can generate volume here, not anonymous traffic.
 */
@Slf4j
@RestController
public class ClientErrorReportController {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "JS_ERROR", "UNHANDLED_REJECTION", "CONSOLE_ERROR", "API_FAILURE",
            "RESOURCE_LOAD_FAILURE", "AUTH_FAILURE", "VIDEO_PLAYBACK_FAILURE", "FILE_UPLOAD_FAILURE");

    /** One learner spamming this (a broken render loop throwing repeatedly, say) shouldn't be able to flood the Logs pipeline. */
    private static final int MAX_REPORTS_PER_MINUTE = 20;
    private static final long WINDOW_MS = 60_000L;
    private final ConcurrentHashMap<Integer, Window> rateWindows = new ConcurrentHashMap<>();

    private final SecurityContextUtil securityContextUtil;

    public ClientErrorReportController(SecurityContextUtil securityContextUtil) {
        this.securityContextUtil = securityContextUtil;
    }

    @PostMapping("/api/v1/client-errors/report")
    public ResponseEntity<Void> report(@RequestBody(required = false) ClientErrorReportRequest request) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (request == null || isBlank(request.getMessage())) {
            return ResponseEntity.badRequest().build();
        }
        if (isRateLimited(principal.getId())) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }

        String type = ALLOWED_TYPES.contains(request.getType()) ? request.getType() : "JS_ERROR";
        String page = truncate(request.getPage(), 500);
        String originalHttpPath = MDC.get("httpPath");
        String originalHttpMethod = MDC.get("httpMethod");
        try {
            // Reuse httpPath/httpMethod (already part of every log line's fixed JSON schema) to
            // carry the browser's page and this report's type -- rather than the reporting
            // endpoint's own path/method, which RequestCorrelationFilter already set them to and
            // which would tell an operator nothing about where in the app this actually happened.
            MDC.put("httpPath", page == null ? "(no page)" : page);
            MDC.put("httpMethod", type);
            log.error(buildMessage(request, principal));
        } finally {
            MDC.put("httpPath", originalHttpPath == null ? "" : originalHttpPath);
            MDC.put("httpMethod", originalHttpMethod == null ? "" : originalHttpMethod);
        }
        return ResponseEntity.ok().build();
    }

    private String buildMessage(ClientErrorReportRequest request, UserPrincipal principal) {
        StringBuilder sb = new StringBuilder();
        sb.append("[Frontend] ").append(truncate(request.getMessage(), 1000));
        if (("API_FAILURE".equals(request.getType()) || "FILE_UPLOAD_FAILURE".equals(request.getType()))
                && request.getEndpoint() != null) {
            sb.append(" | endpoint=").append(truncate(request.getEndpoint(), 300))
                    .append(" status=").append(request.getStatusCode());
        }
        sb.append(" | account=").append(principal.getId()).append('/').append(principal.getUserType());
        if (request.getBrowser() != null) sb.append(" | browser=").append(truncate(request.getBrowser(), 200));
        if (request.getViewport() != null) sb.append(" | viewport=").append(truncate(request.getViewport(), 32));
        if (request.getBuildVersion() != null) sb.append(" | build=").append(truncate(request.getBuildVersion(), 64));
        if (request.getStack() != null) sb.append("\nStack: ").append(truncate(request.getStack(), 3000));
        return sb.toString();
    }

    private boolean isRateLimited(Integer accountId) {
        if (accountId == null) return false;
        if (rateWindows.size() > 50_000) rateWindows.clear();
        Window window = rateWindows.computeIfAbsent(accountId, ignored -> new Window());
        long now = System.currentTimeMillis();
        if (now - window.start.get() > WINDOW_MS) {
            window.start.set(now);
            window.count.set(0);
        }
        return window.count.incrementAndGet() > MAX_REPORTS_PER_MINUTE;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String truncate(String value, int max) {
        if (value == null) return null;
        return value.length() <= max ? value : value.substring(0, max) + "…";
    }

    private static final class Window {
        private final AtomicLong start = new AtomicLong(System.currentTimeMillis());
        private final AtomicInteger count = new AtomicInteger();
    }
}
