package com._42students.lms.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple in-memory rate limiting service for authentication endpoints
 * Tracks attempts per email/IP to prevent brute force attacks
 *
 * <p><b>KNOWN LIMITATION (per-replica, not global):</b> {@code emailAttempts}, {@code ipAttempts},
 * and {@code customAttempts} below are plain instance-level {@link ConcurrentHashMap}s, private to
 * this JVM. This service currently runs with 2 replicas in every environment (see
 * k8s/*&#47;lms-be.yaml, {@code replicas: 2}), and a caller's requests are not guaranteed to be
 * routed to the same pod. The effective ceiling a caller can actually achieve is therefore up to
 * {@code limit * <replica count>} attempts per window (e.g. currently up to 10/window for email,
 * 20/window for IP, with 2 replicas), not a hard global cap of {@code limit}.
 *
 * <p>No shared/distributed store (Redis or otherwise) currently exists anywhere in this codebase
 * (verified: no {@code spring.redis.*} config in any application*.properties, no Redis client
 * dependency in pom.xml, and the only existing {@code @EnableCaching} setup —
 * {@link com._42students.lms.config.CacheConfig} — uses local Caffeine, not a distributed cache).
 * Fixing this properly requires introducing new shared-state infrastructure (e.g. Redis with
 * INCR+TTL), which is out of scope for a low-risk fix pass. Tracked as a known gap rather than
 * silently assumed to be a hard cap.
 */
@Service
@Slf4j
public class RateLimitingService {

    private static class AttemptRecord {
        int count;
        long firstAttemptTime;
        long lastAttemptTime;
    }

    // Store attempts per email
    private final Map<String, AttemptRecord> emailAttempts = new ConcurrentHashMap<>();

    // Store attempts per IP
    private final Map<String, AttemptRecord> ipAttempts = new ConcurrentHashMap<>();

    // Store attempts per custom key (for slug-based rate limiting, etc.)
    private final Map<String, AttemptRecord> customAttempts = new ConcurrentHashMap<>();

    // Rate limit configuration
    private static final int MAX_ATTEMPTS_PER_EMAIL = 5; // Max 5 attempts per email
    private static final int MAX_ATTEMPTS_PER_IP = 10; // Max 10 attempts per IP
    private static final long WINDOW_MINUTES = 15; // 15 minute window
    private static final long WINDOW_MS = WINDOW_MINUTES * 60 * 1000;

    /**
     * Check if email is rate limited
     * @param email Email address
     * @return true if rate limited, false otherwise
     */
    public boolean isEmailRateLimited(String email) {
        String emailLower = email.toLowerCase().trim();
        AttemptRecord record = emailAttempts.get(emailLower);
        
        if (record == null) {
            return false;
        }

        long now = System.currentTimeMillis();
        
        // Reset if window expired
        if (now - record.firstAttemptTime > WINDOW_MS) {
            emailAttempts.remove(emailLower);
            return false;
        }

        // Check if exceeded max attempts
        if (record.count >= MAX_ATTEMPTS_PER_EMAIL) {
            log.warn("Rate limit exceeded for email: {} ({} attempts in {} minutes)", 
                    emailLower, record.count, WINDOW_MINUTES);
            return true;
        }

        return false;
    }

    /**
     * Record an attempt for email
     * @param email Email address
     */
    public void recordEmailAttempt(String email) {
        String emailLower = email.toLowerCase().trim();
        long now = System.currentTimeMillis();
        
        emailAttempts.compute(emailLower, (key, record) -> {
            if (record == null || (now - record.firstAttemptTime > WINDOW_MS)) {
                // New record or expired window
                AttemptRecord newRecord = new AttemptRecord();
                newRecord.count = 1;
                newRecord.firstAttemptTime = now;
                newRecord.lastAttemptTime = now;
                return newRecord;
            } else {
                // Increment existing record
                record.count++;
                record.lastAttemptTime = now;
                return record;
            }
        });
    }

    /**
     * Check if IP is rate limited
     * @param ip IP address
     * @return true if rate limited, false otherwise
     */
    public boolean isIpRateLimited(String ip) {
        AttemptRecord record = ipAttempts.get(ip);
        
        if (record == null) {
            return false;
        }

        long now = System.currentTimeMillis();
        
        // Reset if window expired
        if (now - record.firstAttemptTime > WINDOW_MS) {
            ipAttempts.remove(ip);
            return false;
        }

        // Check if exceeded max attempts
        if (record.count >= MAX_ATTEMPTS_PER_IP) {
            log.warn("Rate limit exceeded for IP: {} ({} attempts in {} minutes)", 
                    ip, record.count, WINDOW_MINUTES);
            return true;
        }

        return false;
    }

    /**
     * Record an attempt for IP
     * @param ip IP address
     */
    public void recordIpAttempt(String ip) {
        long now = System.currentTimeMillis();
        
        ipAttempts.compute(ip, (key, record) -> {
            if (record == null || (now - record.firstAttemptTime > WINDOW_MS)) {
                // New record or expired window
                AttemptRecord newRecord = new AttemptRecord();
                newRecord.count = 1;
                newRecord.firstAttemptTime = now;
                newRecord.lastAttemptTime = now;
                return newRecord;
            } else {
                // Increment existing record
                record.count++;
                record.lastAttemptTime = now;
                return record;
            }
        });
    }

    /**
     * Get remaining attempts for email
     * @param email Email address
     * @return Remaining attempts
     */
    public int getRemainingEmailAttempts(String email) {
        String emailLower = email.toLowerCase().trim();
        AttemptRecord record = emailAttempts.get(emailLower);
        
        if (record == null) {
            return MAX_ATTEMPTS_PER_EMAIL;
        }

        long now = System.currentTimeMillis();
        if (now - record.firstAttemptTime > WINDOW_MS) {
            return MAX_ATTEMPTS_PER_EMAIL;
        }

        return Math.max(0, MAX_ATTEMPTS_PER_EMAIL - record.count);
    }

    /**
     * Reset attempts for email (e.g., after successful login)
     * @param email Email address
     */
    public void resetEmailAttempts(String email) {
        String emailLower = email.toLowerCase().trim();
        emailAttempts.remove(emailLower);
    }

    /**
     * Check if a custom key is rate limited
     * @param key Custom key (e.g., slug, endpoint)
     * @param maxAttempts Maximum attempts allowed
     * @param windowSeconds Time window in seconds
     * @return true if rate limited, false otherwise
     */
    public boolean isRateLimited(String key, int maxAttempts, long windowSeconds) {
        AttemptRecord record = customAttempts.get(key);
        
        if (record == null) {
            return false;
        }

        long now = System.currentTimeMillis();
        long windowMs = windowSeconds * 1000;
        
        // Reset if window expired
        if (now - record.firstAttemptTime > windowMs) {
            customAttempts.remove(key);
            return false;
        }

        // Check if exceeded max attempts
        if (record.count >= maxAttempts) {
            log.warn("Rate limit exceeded for key: {} ({} attempts in {} seconds)", 
                    key, record.count, windowSeconds);
            return true;
        }

        return false;
    }

    /**
     * Record an attempt for a custom key
     * @param key Custom key
     * @param maxAttempts Maximum attempts allowed
     * @param windowSeconds Time window in seconds
     */
    public void recordAttempt(String key, int maxAttempts, long windowSeconds) {
        long now = System.currentTimeMillis();
        long windowMs = windowSeconds * 1000;
        
        customAttempts.compute(key, (k, record) -> {
            if (record == null || (now - record.firstAttemptTime > windowMs)) {
                // New record or expired window
                AttemptRecord newRecord = new AttemptRecord();
                newRecord.count = 1;
                newRecord.firstAttemptTime = now;
                newRecord.lastAttemptTime = now;
                return newRecord;
            } else {
                // Increment existing record
                record.count++;
                record.lastAttemptTime = now;
                return record;
            }
        });
    }

    /**
     * Clear a custom key's rate-limit record. W3 in the super-admin audit: "A student can't log
     * in... no admin-triggered OTP resend, password reset, or lockout clear exists at any layer."
     * This app is OTP-only (no passwords), so "password reset" doesn't apply, and the OTP itself
     * is regenerated fresh on every self-service send -- the actual blocker is the rate limit, so
     * clearing it is what actually unblocks the student (they can then request their own OTP).
     */
    public void clearAttempts(String key) {
        customAttempts.remove(key);
    }

    /**
     * Get client IP from request
     * @param request HttpServletRequest
     * @return IP address
     */
    public static String getClientIp(javax.servlet.http.HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // Handle multiple IPs in X-Forwarded-For
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}


