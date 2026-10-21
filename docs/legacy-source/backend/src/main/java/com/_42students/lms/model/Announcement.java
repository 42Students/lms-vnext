package com._42students.lms.model;

import com._42students.lms.enums.AnnouncementType;
import com._42students.lms.enums.FacultyType;
import lombok.Data;

import javax.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "announcements")
public class Announcement implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "receiver_type")
    @Enumerated(EnumType.STRING)
    private AnnouncementType receiverType;

    @Column(name = "receiver_value")
    private Long receiverValue;

    @Column(name = "title")
    private String title;

    @Column(name = "message")
    private String message;

    @Column(name = "sender_type")
    private String senderType;

    @Column(name = "sender_id")
    private Long senderId;

    @Column(updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt; 

    @Column(name = "is_deleted")
    private Boolean isDeleted;

    /**
     * Part B: schedule / expiry / pin. All three were absent entirely -- an announcement was
     * visible the instant it was created, forever, in creation order.
     *
     * <p>NULL {@code scheduledAt} = visible immediately; NULL {@code expiresAt} = never expires,
     * so every pre-existing row keeps exactly its old behaviour. The window is enforced in the
     * recipient-facing repository queries only -- admin listings still show scheduled and expired
     * rows, or an admin could not manage the announcement they just scheduled.
     */
    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "is_pinned", nullable = false)
    private Boolean isPinned = false;

    // Constructors, getters, setters
}

