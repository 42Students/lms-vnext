package com._42students.lms.model;

import lombok.Data;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityListeners;
import javax.persistence.Table;
import java.time.LocalDateTime;

import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Data
@Entity(name = "assignment_upload_receipt")
@Table(name = "assignment_upload_receipt")
@EntityListeners(AuditingEntityListener.class)
public class AssignmentUploadReceipt extends BaseModel {
    @Column(name = "receipt_id", nullable = false, unique = true, length = 64)
    private String receiptId;

    @Column(name = "storage_key", nullable = false, length = 1024)
    private String storageKey;

    @Column(name = "public_url", length = 2048)
    private String publicUrl;

    @Column(name = "folder", length = 80)
    private String folder;

    @Column(name = "upload_type", length = 80)
    private String uploadType;

    @Column(name = "owner_user_id", nullable = false)
    private Integer ownerUserId;

    @Column(name = "owner_user_type", length = 40)
    private String ownerUserType;

    @Column(name = "lesson_content_id")
    private Integer lessonContentId;

    @Column(name = "declared_content_type", length = 255)
    private String declaredContentType;

    @Column(name = "declared_content_length")
    private Long declaredContentLength;

    @Column(name = "actual_content_type", length = 255)
    private String actualContentType;

    @Column(name = "actual_content_length")
    private Long actualContentLength;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "consumed_at")
    private LocalDateTime consumedAt;

    @Column(name = "student_assignment_id")
    private Integer studentAssignmentId;
}
