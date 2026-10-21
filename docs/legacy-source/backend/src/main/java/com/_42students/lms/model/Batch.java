package com._42students.lms.model;

import com._42students.lms.enums.StatusType;
import lombok.Data;

import javax.persistence.*;
import java.io.Serializable;
import java.util.Date;

@Data
@Entity
@Table(name = "batch")
public class Batch implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "batch_name")
    private String batchName;

    @Column(name = "program_id")
    private Long programId;

    @Column(name = "start_date")
    private Date startDate;

    @Column(name = "end_date")
    private Date endDate;

    @Column(name = "current_students")
    private int currentStudents;

    @Column(name = "current_semester")
    private Integer currentSemester = 1; // Which semester this batch is currently in

    @Column(name = "academic_year")
    private String academicYear; // "2024-25"

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private StatusType status;

    @Column(name = "created_at")
    private Date createdAt;

    @Column(name = "updated_at")
    private Date updatedAt;
    
    // Constructors

    public Batch() {
    }

    public Batch(String batchName, Long programId, Date startDate, Date endDate,
                 int currentStudents, StatusType status, Date createdAt, Date updatedAt) {
        this.batchName = batchName;
        this.programId = programId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.currentStudents = currentStudents;
        this.currentSemester = 1;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Integer getCurrentSemester() {
        return currentSemester != null ? currentSemester : 1;
    }

    public void setCurrentSemester(Integer currentSemester) {
        this.currentSemester = currentSemester;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getBatchName() {
        return batchName;
    }

    public void setBatchName(String batchName) {
        this.batchName = batchName;
    }

    public Long getProgramId() {
        return programId;
    }

    public void setProgramId(Long programId) {
        this.programId = programId;
    }

    public Date getStartDate() {
        return startDate;
    }

    public void setStartDate(Date startDate) {
        this.startDate = startDate;
    }

    public Date getEndDate() {
        return endDate;
    }

    public void setEndDate(Date endDate) {
        this.endDate = endDate;
    }

    public int getCurrentStudents() {
        return currentStudents;
    }

    public void setCurrentStudents(int currentStudents) {
        this.currentStudents = currentStudents;
    }

    public StatusType getStatus() {
        return status;
    }

    public void setStatus(StatusType status) {
        this.status = status;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }
}

