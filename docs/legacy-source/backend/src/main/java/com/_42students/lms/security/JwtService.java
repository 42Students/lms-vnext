package com._42students.lms.security;

import com._42students.lms.config.JwtConfig;
import com._42students.lms.dto.response.TokenPair;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

/**
 * Service for JWT token generation and validation.
 * Handles access tokens (short-lived) and refresh tokens (long-lived).
 */
@Slf4j
@Service
public class JwtService {

    private final JwtConfig config;
    private SecretKey signingKey;
    private JwtParser parser;

    @Autowired(required = false)
    private Environment environment;

    public JwtService(JwtConfig config) {
        this.config = config;
    }

    @PostConstruct
    public void init() {
        String secret = config.getSecret();
        if (secret == null || secret.isEmpty()) {
            throw new IllegalStateException("JWT secret must be set (e.g. JWT_SECRET)");
        }
        // Fail startup in production if default secret is used
        if (isProductionProfile()) {
            if (JwtConfig.DEFAULT_SECRET_PLACEHOLDER.equals(secret)) {
                throw new IllegalStateException(
                    "Production must not use default JWT secret. Set JWT_SECRET environment variable.");
            }
        } else if (JwtConfig.DEFAULT_SECRET_PLACEHOLDER.equals(secret)) {
            log.warn("WARNING: Using default JWT secret key. Set app.jwt.secret in production!");
        }
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 characters (256 bits) for HS256");
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);

        JwtParserBuilder parserBuilder = Jwts.parserBuilder()
            .setSigningKey(signingKey)
            .setAllowedClockSkewSeconds(config.getClockSkewSeconds())
            .requireIssuer(config.getIssuer());
        if (config.getAudience() != null && !config.getAudience().trim().isEmpty()) {
            parserBuilder.requireAudience(config.getAudience().trim());
        }
        this.parser = parserBuilder.build();
        log.info("JWT Service initialized with issuer: {}", config.getIssuer());
    }

    private boolean isProductionProfile() {
        if (environment == null) return false;
        String[] profiles = environment.getActiveProfiles();
        for (String p : profiles) {
            if ("prod".equalsIgnoreCase(p) || "production".equalsIgnoreCase(p)) return true;
        }
        return false;
    }
    
    /**
     * Generate access and refresh token pair for a user principal.
     */
    public TokenPair generateTokens(UserPrincipal principal) {
        String accessJti = UUID.randomUUID().toString();
        String refreshJti = UUID.randomUUID().toString();
        
        Date now = new Date();
        Date accessExpiry = new Date(now.getTime() + config.getAccessExpirationMs());
        Date refreshExpiry = new Date(now.getTime() + config.getRefreshExpirationMs());
        
        // Build access token with full claims (iss, aud, nbf, iat, exp)
        JwtBuilder accessBuilder = Jwts.builder()
            .setId(accessJti)
            .setSubject(principal.getId().toString())
            .claim("userType", principal.getUserType())
            .claim("facultyType", principal.getFacultyType())
            .claim("orgId", principal.getOrganizationId())
            .claim("collegeId", principal.getCollegeId())
            .claim("tokenVersion", principal.getTokenVersion())
            .claim("superAdmin", principal.isSuperAdmin())
            .claim("type", "access")
            .setIssuer(config.getIssuer())
            .setIssuedAt(now)
            .setNotBefore(now)
            .setExpiration(accessExpiry);
        if (config.getAudience() != null && !config.getAudience().trim().isEmpty()) {
            accessBuilder.claim("aud", config.getAudience().trim());
        }
        String accessToken = accessBuilder.signWith(signingKey, SignatureAlgorithm.HS256).compact();

        // Build refresh token with minimal claims
        JwtBuilder refreshBuilder = Jwts.builder()
            .setId(refreshJti)
            .setSubject(principal.getId().toString())
            .claim("userType", principal.getUserType())
            .claim("orgId", principal.getOrganizationId())
            .claim("collegeId", principal.getCollegeId())
            .claim("tokenVersion", principal.getTokenVersion())
            .claim("superAdmin", principal.isSuperAdmin())
            .claim("type", "refresh")
            .setIssuer(config.getIssuer())
            .setIssuedAt(now)
            .setNotBefore(now)
            .setExpiration(refreshExpiry);
        if (config.getAudience() != null && !config.getAudience().trim().isEmpty()) {
            refreshBuilder.claim("aud", config.getAudience().trim());
        }
        String refreshToken = refreshBuilder.signWith(signingKey, SignatureAlgorithm.HS256).compact();
        
        return new TokenPair(
            accessToken,
            refreshToken,
            refreshJti,
            config.getAccessExpirationMs() / 1000
        );
    }
    
    /**
     * Validate a token and extract claims.
     * @throws ExpiredJwtException if token is expired
     * @throws JwtException if token is invalid
     */
    public Claims validateToken(String token) throws JwtException {
        return parser.parseClaimsJws(token).getBody();
    }
    
    /**
     * Extract JTI (JWT ID) from a token without full validation.
     * Used for blocklist checks.
     */
    public String getJtiFromToken(String token) {
        return validateToken(token).getId();
    }
    
    /**
     * Extract user ID from token claims.
     */
    public Integer getUserIdFromClaims(Claims claims) {
        return Integer.parseInt(claims.getSubject());
    }
    
    /**
     * Extract user type from token claims.
     */
    public String getUserTypeFromClaims(Claims claims) {
        return claims.get("userType", String.class);
    }
    
    /**
     * Extract token version from token claims.
     */
    public Integer getTokenVersionFromClaims(Claims claims) {
        return claims.get("tokenVersion", Integer.class);
    }
    
    /**
     * Check if token is an access token.
     */
    public boolean isAccessToken(Claims claims) {
        return "access".equals(claims.get("type", String.class));
    }
    
    /**
     * Check if token is a refresh token.
     */
    public boolean isRefreshToken(Claims claims) {
        return "refresh".equals(claims.get("type", String.class));
    }
    
    /**
     * Get access token expiration time in seconds.
     */
    public long getAccessTokenExpirationSeconds() {
        return config.getAccessExpirationMs() / 1000;
    }

    public long getRefreshExpirationSeconds() {
        return config.getRefreshExpirationMs() / 1000;
    }

    /**
     * Generate tokens with optional extra claims on the refresh token (e.g. contactMobile for super-admin).
     * Use this when the same claims must be available on refresh (e.g. to rebuild user without DB).
     */
    public TokenPair generateTokens(UserPrincipal principal, Map<String, Object> extraRefreshClaims) {
        String accessJti = UUID.randomUUID().toString();
        String refreshJti = UUID.randomUUID().toString();
        Date now = new Date();
        Date accessExpiry = new Date(now.getTime() + config.getAccessExpirationMs());
        Date refreshExpiry = new Date(now.getTime() + config.getRefreshExpirationMs());

        JwtBuilder accessBuilder = Jwts.builder()
            .setId(accessJti)
            .setSubject(principal.getId().toString())
            .claim("userType", principal.getUserType())
            .claim("facultyType", principal.getFacultyType())
            .claim("orgId", principal.getOrganizationId())
            .claim("collegeId", principal.getCollegeId())
            .claim("tokenVersion", principal.getTokenVersion())
            .claim("superAdmin", principal.isSuperAdmin())
            .claim("type", "access")
            .setIssuer(config.getIssuer())
            .setIssuedAt(now)
            .setNotBefore(now)
            .setExpiration(accessExpiry);
        if (config.getAudience() != null && !config.getAudience().trim().isEmpty()) {
            accessBuilder.claim("aud", config.getAudience().trim());
        }
        String accessToken = accessBuilder.signWith(signingKey, SignatureAlgorithm.HS256).compact();

        JwtBuilder refreshBuilder = Jwts.builder()
            .setId(refreshJti)
            .setSubject(principal.getId().toString())
            .claim("userType", principal.getUserType())
            .claim("orgId", principal.getOrganizationId())
            .claim("collegeId", principal.getCollegeId())
            .claim("tokenVersion", principal.getTokenVersion())
            .claim("superAdmin", principal.isSuperAdmin())
            .claim("type", "refresh")
            .setIssuer(config.getIssuer())
            .setIssuedAt(now)
            .setNotBefore(now)
            .setExpiration(refreshExpiry);
        if (config.getAudience() != null && !config.getAudience().trim().isEmpty()) {
            refreshBuilder.claim("aud", config.getAudience().trim());
        }
        if (extraRefreshClaims != null) {
            for (Map.Entry<String, Object> e : extraRefreshClaims.entrySet()) {
                if (e.getValue() != null) {
                    refreshBuilder.claim(e.getKey(), e.getValue());
                }
            }
        }
        String refreshToken = refreshBuilder.signWith(signingKey, SignatureAlgorithm.HS256).compact();

        return new TokenPair(accessToken, refreshToken, refreshJti, config.getAccessExpirationMs() / 1000);
    }

    /**
     * Generate tokens with extra claims on BOTH the access and refresh token — unlike the
     * (principal, extraRefreshClaims) overload above, which only stamps the refresh token. Used
     * for impersonation (impersonatorId/impersonatorType), where the access token itself needs to
     * carry the claim so JwtAuthenticationFilter can read it on every request, not just on
     * /refresh. AuthController.refreshInternal re-derives these same claims from the refresh
     * token being exchanged and calls this overload again, so a refresh mid-impersonation now
     * carries the impersonator claims forward instead of silently dropping into a plain session.
     */
    public TokenPair generateTokens(UserPrincipal principal, Map<String, Object> extraAccessClaims, Map<String, Object> extraRefreshClaims) {
        String accessJti = UUID.randomUUID().toString();
        String refreshJti = UUID.randomUUID().toString();
        Date now = new Date();
        Date accessExpiry = new Date(now.getTime() + config.getAccessExpirationMs());
        Date refreshExpiry = new Date(now.getTime() + config.getRefreshExpirationMs());

        JwtBuilder accessBuilder = Jwts.builder()
            .setId(accessJti)
            .setSubject(principal.getId().toString())
            .claim("userType", principal.getUserType())
            .claim("facultyType", principal.getFacultyType())
            .claim("orgId", principal.getOrganizationId())
            .claim("collegeId", principal.getCollegeId())
            .claim("tokenVersion", principal.getTokenVersion())
            .claim("superAdmin", principal.isSuperAdmin())
            .claim("type", "access")
            .setIssuer(config.getIssuer())
            .setIssuedAt(now)
            .setNotBefore(now)
            .setExpiration(accessExpiry);
        if (config.getAudience() != null && !config.getAudience().trim().isEmpty()) {
            accessBuilder.claim("aud", config.getAudience().trim());
        }
        if (extraAccessClaims != null) {
            for (Map.Entry<String, Object> e : extraAccessClaims.entrySet()) {
                if (e.getValue() != null) {
                    accessBuilder.claim(e.getKey(), e.getValue());
                }
            }
        }
        String accessToken = accessBuilder.signWith(signingKey, SignatureAlgorithm.HS256).compact();

        JwtBuilder refreshBuilder = Jwts.builder()
            .setId(refreshJti)
            .setSubject(principal.getId().toString())
            .claim("userType", principal.getUserType())
            .claim("orgId", principal.getOrganizationId())
            .claim("collegeId", principal.getCollegeId())
            .claim("tokenVersion", principal.getTokenVersion())
            .claim("superAdmin", principal.isSuperAdmin())
            .claim("type", "refresh")
            .setIssuer(config.getIssuer())
            .setIssuedAt(now)
            .setNotBefore(now)
            .setExpiration(refreshExpiry);
        if (config.getAudience() != null && !config.getAudience().trim().isEmpty()) {
            refreshBuilder.claim("aud", config.getAudience().trim());
        }
        if (extraRefreshClaims != null) {
            for (Map.Entry<String, Object> e : extraRefreshClaims.entrySet()) {
                if (e.getValue() != null) {
                    refreshBuilder.claim(e.getKey(), e.getValue());
                }
            }
        }
        String refreshToken = refreshBuilder.signWith(signingKey, SignatureAlgorithm.HS256).compact();

        return new TokenPair(accessToken, refreshToken, refreshJti, config.getAccessExpirationMs() / 1000);
    }

    /**
     * Get optional string claim from token (e.g. contactMobile for super-admin refresh).
     */
    public String getStringClaim(Claims claims, String name) {
        try {
            Object v = claims.get(name);
            return v == null ? null : v.toString();
        } catch (Exception e) {
            return null;
        }
    }
}

