package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class AssignmentSubmissionAssetDTO {
    private String id;
    private String type;
    private String title;
    private String link;
    private String uploadReceiptId;
    private FileDTO fileDTO;
}
