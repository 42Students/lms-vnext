package com._42students.lms.model;

import lombok.Data;

import javax.persistence.*;
import java.time.Instant;

/**
 * Single-row-per-key durable state for the Logs page: where the alerting poller last left off
 * (poll_cursor_at, so a pod restart doesn't re-scan and re-alert on already-seen entries), and
 * when the admin last viewed the page (admin_last_viewed_at, so "what's new" survives a browser
 * refresh or a different device, not just this tab's session).
 */
@Data
@Entity(name = "log_alert_state")
@Table(name = "log_alert_state")
public class LogAlertState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "state_key", nullable = false, unique = true)
    private String stateKey;

    @Column(name = "poll_cursor_at")
    private Instant pollCursorAt;

    @Column(name = "admin_last_viewed_at")
    private Instant adminLastViewedAt;
}
