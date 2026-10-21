package com._42students.lms.model;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * A record that an SMS was attempted, and what the provider said about it.
 *
 * <p>Audit 4.4: the send result was already known — BulkSMSApps returns a MessageId on success —
 * and was written to the application log and nowhere else. When a parent asks why they were never
 * told their child was absent, nobody could answer from the product.
 *
 * <p>Deliberately holds neither the message body nor the full phone number: these messages name a
 * child, a course and a time, and this table is read by more people and kept longer than the send
 * path itself. See V134 for the reasoning.
 */
@Data
@Entity
@Table(name = "sms_delivery_log")
public class SmsDeliveryLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /** attendance.absence, attendance.correction, otp, job.update. */
    @Column(name = "purpose", nullable = false, length = 64)
    private String purpose;

    /** Last four digits of the recipient's number. */
    @Column(name = "recipient_suffix", length = 8)
    private String recipientSuffix;

    /**
     * SENT once the operator accepted the message, FAILED otherwise.
     *
     * <p>Acceptance is not proof it reached a handset — the provider does not report that — so
     * nothing here should be presented to an admin as "delivered".
     */
    @Column(name = "status", nullable = false, length = 16)
    private String status;

    @Column(name = "provider_message_id", length = 64)
    private String providerMessageId;

    @Column(name = "error_summary", length = 500)
    private String errorSummary;

    @Column(name = "college_id")
    private Integer collegeId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
