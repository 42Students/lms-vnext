package com._42students.lms.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

/**
 * Request body for POST /api/v1/upload/import-video-from-url.
 * Backend fetches the URL, uploads to R2 under lesson-content/, returns the key.
 */
@Data
public class ImportVideoFromUrlRequestDTO {

    @NotBlank(message = "url is required")
    @Size(max = 2048)
    @JsonProperty("url")
    private String url;
}

