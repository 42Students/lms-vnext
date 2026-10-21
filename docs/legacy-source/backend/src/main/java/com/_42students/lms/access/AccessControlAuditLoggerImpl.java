package com._42students.lms.access;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Production-grade structured audit logger for access control.
 * Logs in a parseable format (e.g. for SIEM); can be replaced with a writer to audit store.
 */
@Component
@Slf4j
public class AccessControlAuditLoggerImpl implements AccessControlAuditLogger {

    private static final String AUDIT_PREFIX = "ACCESS_AUDIT";

    @Override
    public void log(Integer userId, String userType, String action, String resourceType, Object resourceId, boolean allowed, String reason) {
        String ts = Instant.now().toString();
        String idStr = resourceId != null ? String.valueOf(resourceId) : "";
        // Structured one-line format: timestamp | userId | userType | action | resourceType | resourceId | allowed | reason
        log.info("{} ts={} userId={} userType={} action={} resourceType={} resourceId={} allowed={} reason={}",
                AUDIT_PREFIX, ts, userId, userType, action, resourceType, idStr, allowed, reason != null ? reason : "");
    }
}

