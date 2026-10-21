package com._42students.lms.model.groups;

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
import javax.persistence.UniqueConstraint;
import javax.persistence.Version;
import java.time.LocalDateTime;

/**
 * One person's membership in one group. Exactly one row per (group, member) for all time: leaving
 * sets {@code state=REMOVED} rather than deleting, so the row keeps its lock and history.
 */
@Entity
@Table(name = "lms_group_member",
        uniqueConstraints = @UniqueConstraint(name = "uk_lms_group_member", columnNames = {"group_id", "member_type", "member_id"}))
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
@Getter
@Setter
public class LmsGroupMember {

    public static final String TYPE_LEARNER = "LEARNER";

    public static final String STATE_REQUESTED = "REQUESTED";
    public static final String STATE_ACTIVE = "ACTIVE";
    public static final String STATE_WAITLISTED = "WAITLISTED";
    public static final String STATE_REMOVED = "REMOVED";

    public static final String SOURCE_MANUAL = "MANUAL";
    public static final String SOURCE_CSV = "CSV";
    public static final String SOURCE_RULE = "RULE";
    public static final String SOURCE_SELF = "SELF";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_id", nullable = false)
    private Long groupId;

    @Column(name = "member_type", nullable = false, length = 20)
    private String memberType = TYPE_LEARNER;

    @Column(name = "member_id", nullable = false)
    private Integer memberId;

    @Column(name = "state", nullable = false, length = 20)
    private String state;

    @Column(name = "source", nullable = false, length = 20)
    private String source;

    @Column(name = "is_locked", nullable = false)
    private Boolean isLocked = false;

    @Column(name = "waitlist_position")
    private Integer waitlistPosition;

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    public boolean isCurrent() {
        return !STATE_REMOVED.equals(state);
    }
}
