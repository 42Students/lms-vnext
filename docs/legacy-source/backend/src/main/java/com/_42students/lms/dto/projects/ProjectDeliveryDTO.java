package com._42students.lms.dto.projects;

import lombok.Data;

import java.util.List;

@Data
public class ProjectDeliveryDTO {
    private Integer id;
    private Integer projectId;
    private String status;
    private String snapshot;
    private String summary;
    private String submissionType;
    private String submissionLink;
    private String submissionFileUrl;
    private String notes;
    private String feedback;
    private String reviewNotes;
    private String attachmentUrl;
    private String fileName;
    private Long fileSize;
    private String fileMimeType;
    private String storageKey;
    private String sourceUrl;
    private java.util.List<java.util.Map<String, Object>> attachments;
    private Integer revisionCount;
    private Long version;
    private String draftSavedAt;
    private Integer draftSavedById;
    private String draftSavedByName;
    private String submittedAt;
    private Integer submittedById;
    private String submittedByName;
    private String submittedByType;
    private String reviewStatus;
    private String reviewedAt;
    private Integer reviewedById;
    private String reviewedByName;
    private String reviewedByType;
    private String lastUpdatedAt;
    private Integer lastUpdatedById;
    private String lastUpdatedByName;
    private String lastUpdatedByType;
    private String lockedAt;
    private Integer lockedById;
    private String lockedByName;
    private List<ProjectDeliveryEventDTO> history;
}
