package com._42students.lms.model.groups;

import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import java.time.LocalDateTime;

/** Append-only record of every membership state change. Never updated, never deleted. */
@Entity
@Table(name = "lms_group_member_event")
@Getter
@Setter
public class LmsGroupMemberEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_id", nullable = false)
    private Long groupId;

    @Column(name = "member_type", nullable = false, length = 20)
    private String memberType;

    @Column(name = "member_id", nullable = false)
    private Integer memberId;

    @Column(name = "from_state", length = 20)
    private String fromState;

    @Column(name = "to_state", nullable = false, length = 20)
    private String toState;

    @Column(name = "source", nullable = false, length = 20)
    private String source;

    @Column(name = "actor_type", length = 20)
    private String actorType;

    @Column(name = "actor_id")
    private Integer actorId;

    @Column(name = "reason", length = 500)
    private String reason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
