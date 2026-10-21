package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.util.List;

@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class LessonDTO {
    @NotBlank(message = "Lesson name is required")
    @Size(max = 255, message = "Lesson name must not exceed 255 characters")
    private String lessonName;
    private int courseId;
    private String courseSlug;   // Optional: when set, resolved to courseId on server
    private Boolean active;
    private Boolean enabled;
    private long sequence;
    private List<ContentsDTO> contentsDTOs;
}

