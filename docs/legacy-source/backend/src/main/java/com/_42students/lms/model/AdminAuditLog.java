package com._42students.lms.model;

import lombok.Data;
import org.hibernate.annotations.Type;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Entity
@Table(name = "admin_audit_log",
        indexes = {
                @Index(name = "idx_audit_created_at", columnList = "created_at"),
                @Index(name = "idx_audit_actor", columnList = "actor_user_id, actor_user_type"),
                @Index(name = "idx_audit_scope", columnList = "organization_id, college_id"),
                @Index(name = "idx_audit_action", columnList = "action_key")
        })
public class AdminAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_user_id")
    private Integer actorUserId;

    @Column(name = "actor_user_type", length = 20)
    private String actorUserType;

    @Column(name = "actor_contact_mobile", length = 32)
    private String actorContactMobile;

    @Column(name = "action_key", length = 100, nullable = false)
    private String actionKey;

    @Column(name = "entity_type", length = 60)
    private String entityType;

    @Column(name = "entity_id", length = 60)
    private String entityId;

    @Column(name = "organization_id")
    private Integer organizationId;

    @Column(name = "college_id")
    private Integer collegeId;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "user_agent", length = 512)
    private String userAgent;

    @Column(name = "payload_json", columnDefinition = "json")
    @Type(type = "json")
    private Map<String, Object> payloadJson;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}


