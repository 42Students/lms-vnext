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
import javax.persistence.Version;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * A season is a filter, never a mode: starting a new one never closes drives (several seasons
 * can be open at once — real placement seasons overlap). See TPO V1 - Locked.docx §9.
 */
@Entity
@Table(name = "placement_season")
@TypeDefs({@TypeDef(name = "json", typeClass = JsonType.class)})
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
@Getter
@Setter
public class PlacementSeason {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "registration_deadline")
    private LocalDateTime registrationDeadline;

    @Column(name = "is_registration_open", nullable = false)
    private Boolean isRegistrationOpen = false;

    /** Array of {date, label} exam/blocked dates for the season. */
    @Type(type = "json")
    @Column(name = "blocked_dates", columnDefinition = "json")
    private Object blockedDates;

    @Column(name = "is_current", nullable = false)
    private Boolean isCurrent = true;

    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @org.hibernate.annotations.UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;
}
