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
 * One course offered inside a slot. Binds three things that already exist on their own: the
 * course, an lms_group (kind ELECTIVE) whose ACTIVE members are the enrolled learners, and a
 * GROUP_BACKED class that every class-keyed surface uses. Enrolment is the group membership.
 */
@Entity
@Table(name = "elective_offering")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
@Getter
@Setter
public class ElectiveOffering {

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_ARCHIVED = "ARCHIVED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "slot_id", nullable = false)
    private Long slotId;

    @Column(name = "course_id", nullable = false)
    private Integer courseId;

    @Column(name = "group_id", nullable = false, unique = true)
    private Long groupId;

    @Column(name = "backed_class_id", nullable = false, unique = true)
    private Integer backedClassId;

    @Column(name = "capacity")
    private Integer capacity;

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
