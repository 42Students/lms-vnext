package com._42students.lms.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import javax.validation.constraints.*;

/**
 * Request DTO for token refresh and logout endpoints.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RefreshRequest {

    /**
     * The refresh token to use for getting new access token
     * or to invalidate on logout.
     */
    @NotBlank
    @JsonProperty("refreshToken")
    private String refreshToken;
}

