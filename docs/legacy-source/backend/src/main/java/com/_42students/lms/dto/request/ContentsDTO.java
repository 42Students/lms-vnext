package com._42students.lms.dto.request;

import com._42students.lms.enums.ContentType;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import javax.validation.constraints.*;

@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class ContentsDTO {
    //private long id;
    @NotNull
    private ContentType contentType;
    @NotBlank @Size(max = 255)
    private String contentTitle;
    private ContentDataDTO contentDataDTO;
//    private String createdOn;
//    private String updatedOn;
    private boolean active;
    private boolean enabled;
    private int lessonId;
    private int classScheduleId;
    private long sequence;
    private long points;
}

