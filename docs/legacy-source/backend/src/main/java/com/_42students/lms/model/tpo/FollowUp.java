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

@Entity
@Table(name = "follow_up")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
@Getter
@Setter
public class FollowUp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recruiter_lead_id", nullable = false)
    private Long recruiterLeadId;

    @Column(name = "due_at", nullable = false)
    private LocalDateTime dueAt;

    @Column(name = "owner_faculty_id")
    private Integer ownerFacultyId;

    @Column(name = "note")
    private String note;

    @Column(name = "done_at")
    private LocalDateTime doneAt;

    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
