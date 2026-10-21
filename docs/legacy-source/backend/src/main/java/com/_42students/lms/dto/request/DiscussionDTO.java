package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class DiscussionDTO {
    private int lessonContentId;
    @NotBlank(message = "Content cannot be empty")
    @Size(max = 5000, message = "Content cannot exceed 5000 characters")
    private String contentText;
    private int sequence;
    private int userId;
    private String userName;
    private String profileName;
}

