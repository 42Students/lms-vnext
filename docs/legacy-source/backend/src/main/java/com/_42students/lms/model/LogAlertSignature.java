package com._42students.lms.model;

import lombok.Data;

import javax.persistence.*;
import java.time.Instant;

/**
 * One row per distinct error "shape" seen in a given environment's logs (see LogSignatureUtil for
 * how a raw log entry is normalized into signature_hash). Lets the alerting poller tell "this
 * exact kind of error has never happened before" from "this is the 40th time this one has fired" --
 * the single highest-signal distinction for someone triaging alerts alone.
 */
@Data
@Entity(name = "log_alert_signature")
@Table(name = "log_alert_signature")
public class LogAlertSignature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "environment", nullable = false)
    private String environment;

    @Column(name = "signature_hash", nullable = false)
    private String signatureHash;

    @Column(name = "sample_message")
    private String sampleMessage;

    @Column(name = "first_seen_at", nullable = false)
    private Instant firstSeenAt;

    @Column(name = "last_seen_at", nullable = false)
    private Instant lastSeenAt;

    @Column(name = "occurrence_count", nullable = false)
    private long occurrenceCount = 1;

    @Column(name = "muted", nullable = false)
    private boolean muted = false;

    /** Triage decision: OPEN (default), FIXED (see fixedInCommit) or EXPECTED (benign, also muted). */
    @Column(name = "fix_status", nullable = false)
    private String fixStatus = "OPEN";

    @Column(name = "fixed_in_commit")
    private String fixedInCommit;

    @Column(name = "fixed_at")
    private Instant fixedAt;

    @Column(name = "status_note")
    private String statusNote;

    @Column(name = "muted_reason")
    private String mutedReason;

    /** Tracker issue (public id) that covers this error, when one was created from the Logs page. */
    @Column(name = "issue_public_id")
    private String issuePublicId;

    /** Release that produced the most recent occurrence -- see the "commit" field on log lines. */
    @Column(name = "last_seen_commit")
    private String lastSeenCommit;

    /** Set when an error marked FIXED occurred again; cleared by the next status change. */
    @Column(name = "regressed_at")
    private Instant regressedAt;

    @Column(name = "sample_path")
    private String samplePath;
}
