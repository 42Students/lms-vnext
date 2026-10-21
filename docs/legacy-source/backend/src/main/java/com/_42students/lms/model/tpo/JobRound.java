package com._42students.lms.model.tpo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import java.time.LocalDateTime;

/** One round of a drive: talk, test, vendor test, GD or interview, in order. */
@Entity
@Table(name = "job_round")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
@Getter
@Setter
public class JobRound {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_id", nullable = false)
    private Integer jobId;

    @Column(name = "seq", nullable = false)
    private Integer seq;

    /** TALK|TEST|VENDOR_TEST|GD|INTERVIEW */
    @Column(name = "kind", nullable = false)
    private String kind;

    @Column(name = "name", nullable = false)
    private String name;

    /** ON_CAMPUS|VIRTUAL */
    @Column(name = "mode")
    private String mode;

    /** Null = "to be decided". */
    @Column(name = "scheduled_date")
    private LocalDateTime scheduledDate;

    @Column(name = "venue")
    private String venue;

    @Column(name = "meeting_url")
    private String meetingUrl;

    @Column(name = "what_to_bring")
    private String whatToBring;

    @Column(name = "platform")
    private String platform;

    @Column(name = "test_link")
    private String testLink;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "results_due")
    private LocalDateTime resultsDue;

    /** PENDING|SCHEDULED|COMPLETED */
    @Column(name = "status", nullable = false)
    private String status = "PENDING";

    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @org.hibernate.annotations.UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
