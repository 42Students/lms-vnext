package com._42students.lms.configuration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Writes one stable line when the application finishes starting. The Logs page reads these lines
 * back as deploy markers (which commit went live and when), so the message text is a contract:
 * GcpCloudLoggingService looks for exactly {@value #MESSAGE}.
 */
@Component
@Slf4j
public class DeployMarkerLogger {
    public static final String MESSAGE = "app.started";

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        log.info(MESSAGE);
    }

    public static String commit() {
        String value = System.getenv("GIT_COMMIT_SHA");
        return value == null || value.isBlank() ? "unknown" : value.trim();
    }
}
