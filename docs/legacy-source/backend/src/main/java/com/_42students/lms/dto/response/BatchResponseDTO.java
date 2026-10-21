package com._42students.lms.dto.response;

import com._42students.lms.model.Batch;
import lombok.Data;

import java.util.Date;

@Data
public class BatchResponseDTO {
    private Long id;
    private String batchName;
    private Long programId;
    private String programName;
    private Date startDate;
    private Date endDate;
    private int currentStudents;
    private int classCount;
    private Integer currentSemester;
    private String academicYear;
    private String status;
    private Date createdAt;
    private Date updatedAt;

    public BatchResponseDTO(Batch batch) {
        this.id = batch.getId();
        this.batchName = batch.getBatchName();
        this.programId = batch.getProgramId();
        this.startDate = batch.getStartDate();
        this.endDate = batch.getEndDate();
        // Batch.currentStudents is a legacy cached column and can be stale. BatchService enriches
        // every admin/API response from learner.class_id -> class.batch_id instead.
        this.currentStudents = 0;
        this.classCount = 0;
        this.currentSemester = batch.getCurrentSemester() != null ? batch.getCurrentSemester() : 1;
        this.academicYear = batch.getAcademicYear();
        this.status = batch.getStatus() != null ? batch.getStatus().toString() : "ACTIVE";
        this.createdAt = batch.getCreatedAt();
        this.updatedAt = batch.getUpdatedAt();
    }

    public BatchResponseDTO(Batch batch, String programName) {
        this(batch);
        this.programName = programName;
    }
}

