package com._42students.lms.model.tpo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.vladmihalcea.hibernate.type.json.JsonType;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.TypeDef;
import org.hibernate.annotations.TypeDefs;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import java.time.LocalDateTime;

/**
 * One queued notification. A 30-second send_after gives Undo its honest window; cascading
 * actions (offer release, accept, cancel, close) are never queued this way — they use
 * confirm-with-preview instead and send immediately. See TPO V1 - Locked.docx §1.
 */
@Entity
@Table(name = "notification_outbox")
@TypeDefs({@TypeDef(name = "json", typeClass = JsonType.class)})
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
@Getter
@Setter
public class NotificationOutboxEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event", nullable = false)
    private String event;

    /** LEARNER|recruiter|FACULTY */
    @Column(name = "recipient_type", nullable = false)
    private String recipientType;

    @Column(name = "recipient_id", nullable = false)
    private Integer recipientId;

    /** APP|EMAIL|SMS */
    @Column(name = "channel", nullable = false)
    private String channel;

    @Type(type = "json")
    @Column(name = "payload_json", columnDefinition = "json")
    private Object payloadJson;

    @Column(name = "send_after", nullable = false)
    private LocalDateTime sendAfter;

    /** PENDING|SENT|CANCELLED|FAILED */
    @Column(name = "status", nullable = false)
    private String status = "PENDING";

    @Column(name = "undo_group_id")
    private String undoGroupId;

    @Column(name = "claimed_at")
    private LocalDateTime claimedAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "failure_reason")
    private String failureReason;

    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
