package com._42students.lms.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for authentication endpoints (login, refresh).
 * Contains user data and JWT tokens.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    
    /**
     * User entity (Faculty or Learner)
     */
    private Object user;
    
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
     * Access token expiration time in seconds
     */
    @JsonProperty("expiresIn")
    private long expiresIn;
    
    /**
     * Create AuthResponse from user and token pair
     */
    public static AuthResponse of(Object user, TokenPair tokens) {
        return new AuthResponse(
            user,
            tokens.getAccessToken(),
            tokens.getRefreshToken(),
            tokens.getExpiresIn()
        );
    }
}

