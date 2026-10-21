package com._42students.lms.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for JWT authentication.
 * Values are loaded from application.properties with prefix "jwt."
 */
@Data
@Component
@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {
    
    /**
     * Secret key for signing JWTs (min 256 bits for HS256).
     * For production: set via environment (e.g. JWT_SECRET) or prod-specific yaml; do not use the default value.
     */
    private String secret;
    
    /**
     * Access token expiration time in milliseconds (default: 15 minutes)
     */
    private long accessExpirationMs = 900000;
    
    /**
     * Refresh token expiration time in milliseconds (default: 3 days)
     */
    private long refreshExpirationMs = 259200000;
    
    /**
     * Clock skew tolerance in seconds for token validation
     */
    private int clockSkewSeconds = 30;
    
    /**
     * Token issuer identifier
     */
    private String issuer = "42lms";

    /**
     * Optional audience for tokens. If set, tokens will include "aud" claim and validation will require it.
     */
    private String audience;

    /**
     * Default secret value used in application.properties. Used to detect production misconfiguration.
     */
    public static final String DEFAULT_SECRET_PLACEHOLDER = "42lms-jwt-secret-key-change-in-production-min-256-bits";
}

