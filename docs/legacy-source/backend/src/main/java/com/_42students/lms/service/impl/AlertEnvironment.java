package com._42students.lms.service.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Which environment this backend's alerts are about (13 Oct 2026). Alerts, the daily digest and the deploy health monitor read the
 * logs of the environment they run in, and every Telegram message from a non-production backend starts with "[dev]". They used
 * to read production's logs wherever they ran, so a dev backend with the Telegram keys would have repeated every prod alert.
 */
@Component
public class AlertEnvironment {

    private final boolean production;

    public AlertEnvironment(@Value("${STAGE:}") String stage) {
        this.production = "prod".equalsIgnoreCase(stage == null ? "" : stage.trim());
    }

    /** The environment name the log queries and alert signatures use: PRODUCTION or DEVELOPMENT. */
    public String name() {
        return production ? "PRODUCTION" : "DEVELOPMENT";
    }

    public boolean isProduction() {
        return production;
    }

    /** Put in front of every Telegram message: nothing on production, "[dev] " anywhere else. */
    public String tag() {
        return production ? "" : "[dev] ";
    }
}
