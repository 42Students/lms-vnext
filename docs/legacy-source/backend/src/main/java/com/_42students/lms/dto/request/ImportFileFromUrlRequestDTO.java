package com._42students.lms.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
public class ImportFileFromUrlRequestDTO {

    @NotBlank(message = "url is required")
    @Size(max = 2048)
    @JsonProperty("url")
    private String url;

    @NotBlank(message = "folder is required")
    @Size(max = 80)
    @JsonProperty("folder")
    private String folder;

    @Size(max = 40)
    @JsonProperty("type")
    private String type;

    @JsonProperty("userId")
    private Integer userId;

    @JsonProperty("courseId")
    private Integer courseId;

    @JsonProperty("classId")
    private Integer classId;

    @JsonProperty("lessonContentId")
    private Integer lessonContentId;
}
