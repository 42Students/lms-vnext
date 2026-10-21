package com._42students.lms.config;

import com._42students.lms.service.E2eSeedService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Local/dev convenience: seed DB without needing superadmin auth.
 * Controlled by properties so it never runs unless explicitly enabled.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class E2eSeedRunner {

    @Value("${app.e2e.seed.run-on-startup:false}")
    private boolean runOnStartup;

    private final E2eSeedService e2eSeedService;

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        if (!runOnStartup) return;
        try {
            E2eSeedService.SeedResult result = e2eSeedService.seed();
            log.info("E2E seed completed on startup. testPhones={}", result.getTestPhones());
        } catch (Exception e) {
            log.error("E2E seed failed on startup: {}", e.getMessage(), e);
        }
    }
}


