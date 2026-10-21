package com._42students.lms.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO containing access and refresh tokens.
 * Used internally when generating tokens.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TokenPair {
    
    /**
     * Short-lived access token for API authentication
     */
    @JsonProperty("accessToken")
    private String accessToken;

    /**
     * Long-lived refresh token for obtaining new access tokens
     */
    @JsonProperty("refreshToken")
    private String refreshToken;

    /**
     * JWT ID (jti) of the refresh token for blocklist tracking
     */
    @JsonProperty("refreshTokenJti")
    private String refreshTokenJti;

    /**
     * Access token expiration time in seconds
     */
    @JsonProperty("expiresIn")
    private long expiresIn;
}

