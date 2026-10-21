package com._42students.lms.dto.projects;

import lombok.Data;

@Data
public class ProjectDeliveryEventDTO {
    private Integer id;
    private Integer projectId;
    private Integer deliveryId;
    private String action;
    private String status;
    private Integer actorId;
    private String actorName;
    private String actorType;
    private String notes;
    private String attachmentUrl;
    private String feedback;
    private String reviewNotes;
    private String submissionLink;
    private String submissionFileUrl;
    private String submissionType;
    private Integer revisionCount;
    private String createdAt;
}
