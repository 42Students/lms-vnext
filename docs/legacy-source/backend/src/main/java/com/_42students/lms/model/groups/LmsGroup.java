package com._42students.lms.model.groups;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.vladmihalcea.hibernate.type.json.JsonType;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.TypeDef;
import org.hibernate.annotations.TypeDefs;
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
 * A named set of people, for a purpose. The kernel stores {@code kind} and {@code configJson}
 * opaquely: features (electives, CRT, transport, ...) own their meaning and reference the group by
 * id from their own tables. See docs/groups/GROUPS-KERNEL.md.
 */
@Entity
@Table(name = "lms_group")
@TypeDefs({@TypeDef(name = "json", typeClass = JsonType.class)})
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
@Getter
@Setter
public class LmsGroup {

    public static final String SCOPE_COLLEGE = "COLLEGE";
    public static final String SCOPE_PLATFORM = "PLATFORM";

    public static final String STATUS_DRAFT = "DRAFT";
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_CLOSED = "CLOSED";
    public static final String STATUS_ARCHIVED = "ARCHIVED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "kind", nullable = false, length = 40)
    private String kind;

    @Column(name = "owner_scope", nullable = false, length = 20)
    private String ownerScope = SCOPE_COLLEGE;

    @Column(name = "college_id")
    private Integer collegeId;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "status", nullable = false, length = 20)
    private String status = STATUS_DRAFT;

    /** NULL = unlimited. */
    @Column(name = "capacity")
    private Integer capacity;

    /** Denormalised; changed only through the atomic claim/release queries on the repository. */
    @Column(name = "active_count", nullable = false)
    private Integer activeCount = 0;

    @Column(name = "self_join_open_from")
    private LocalDateTime selfJoinOpenFrom;

    @Column(name = "self_join_open_until")
    private LocalDateTime selfJoinOpenUntil;

    @Column(name = "academic_year", length = 20)
    private String academicYear;

    @Column(name = "semester_number")
    private Integer semesterNumber;

    @Type(type = "json")
    @Column(name = "config_json", columnDefinition = "json")
    private Object configJson;

    @Column(name = "created_by_type", length = 20)
    private String createdByType;

    @Column(name = "created_by_id")
    private Integer createdById;

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

    public boolean isPlatformOwned() {
        return collegeId == null;
    }

    public boolean isUnlimited() {
        return capacity == null;
    }

    public Integer seatsLeft() {
        if (capacity == null) return null;
        int left = capacity - (activeCount == null ? 0 : activeCount);
        return Math.max(left, 0);
    }
}
