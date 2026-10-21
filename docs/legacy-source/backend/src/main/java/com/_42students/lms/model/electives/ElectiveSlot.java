package com._42students.lms.model.electives;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.persistence.Version;
import java.time.LocalDateTime;

/**
 * A basket a learner picks from: "Professional Elective 1, semester 5". Holds one or more
 * {@link ElectiveOffering}s; {@code maxPick} says how many of them one learner may be in.
 */
@Entity
@Table(name = "elective_slot")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
@Getter
@Setter
public class ElectiveSlot {

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_ARCHIVED = "ARCHIVED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @Column(name = "program_id", nullable = false)
    private Integer programId;

    @Column(name = "semester_number", nullable = false)
    private Integer semesterNumber;

    @Column(name = "academic_year", length = 20)
    private String academicYear;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "credits", nullable = false)
    private Integer credits = 3;

    @Column(name = "min_pick", nullable = false)
    private Integer minPick = 1;

    @Column(name = "max_pick", nullable = false)
    private Integer maxPick = 1;

    @Column(name = "status", nullable = false, length = 20)
    private String status = STATUS_ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;
}
