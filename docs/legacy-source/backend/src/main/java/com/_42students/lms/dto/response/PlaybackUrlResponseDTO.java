package com._42students.lms.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response for video playback URL endpoints.
 * Contains a short-lived presigned URL and its expiry in seconds.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlaybackUrlResponseDTO {

    @JsonProperty("url")
    private String url;

    @JsonProperty("expiresInSeconds")
    private long expiresInSeconds;
}

