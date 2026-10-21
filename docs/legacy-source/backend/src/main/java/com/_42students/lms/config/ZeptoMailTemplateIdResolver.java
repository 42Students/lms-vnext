package com._42students.lms.config;

import com._42students.lms.enums.NotificationEvent;
import com._42students.lms.util.NotificationEventRegistry;
import javax.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * Resolves ZeptoMail template ID by NotificationEvent from application.properties.
 * Uses keys zepto.template.&lt;templateKey&gt; (e.g. zepto.template.job.application.confirmation).
 */
@Component
@Slf4j
public class ZeptoMailTemplateIdResolver {

    private static final String DEFAULT_PLACEHOLDER = "TEMP_ID_PLACEHOLDER";

    private final Environment environment;

    public ZeptoMailTemplateIdResolver(Environment environment) {
        this.environment = environment;
    }

    /**
     * Validate template IDs at startup and warn about missing/placeholder values.
     * This ensures admins are aware that transactional emails will NOT be sent.
     */
    @PostConstruct
    public void validateTemplateIds() {
        int placeholderCount = 0;
        for (NotificationEvent event : NotificationEvent.values()) {
            String key = NotificationEventRegistry.getZeptoPropertyKey(event);
            String value = environment.getProperty(key);
            if (value == null || value.isBlank() || DEFAULT_PLACEHOLDER.equals(value.trim())) {
                placeholderCount++;
                log.warn("MISSING TEMPLATE: ZeptoMail template ID not configured for event '{}' (property: {}). " +
                        "Emails for this event will NOT be sent.", event.name(), key);
            }
        }
        if (placeholderCount > 0) {
            log.error("STARTUP WARNING: {} ZeptoMail template ID(s) are missing or set to TEMP_ID_PLACEHOLDER. " +
                    "Transactional emails for these events will be silently skipped. " +
                    "Configure them in application.properties before deploying to production.", placeholderCount);
        } else {
            log.info("All ZeptoMail template IDs are configured.");
        }
    }

    /**
     * Get ZeptoMail template ID for the given event.
     * Reads from application.properties via NotificationEventRegistry.getZeptoPropertyKey(event).
     */
    public String getTemplateId(NotificationEvent event) {
        if (event == null) return DEFAULT_PLACEHOLDER;
        String key = NotificationEventRegistry.getZeptoPropertyKey(event);
        String value = environment.getProperty(key);
        return value != null && !value.isBlank() ? value.trim() : DEFAULT_PLACEHOLDER;
    }
}

