package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.util.List;

@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
@Data
public class StudentAssignmentDTO {
    //private String assignmentName;
    private int submissionId;
    @NotNull
    @Min(1)
    private int lessonContentId;
    private String htmlContent;
    private FileDTO fileDTO;
    private String uploadReceiptId;
    private String submissionType;
    private String submissionLink;
    private List<AssignmentSubmissionAssetDTO> submissionAssets;
    @NotNull
    private int studentId;
    // pointsObtained intentionally removed — always calculated server-side, never trusted from client
    /** AQ-11: stamped by server at submission time — not trusted from client */
    private Integer semesterNumber;
    //private String gradingDate;
    //private long points;
    //private String submissionDate;
} 

