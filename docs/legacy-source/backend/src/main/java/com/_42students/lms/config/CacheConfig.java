package com._42students.lms.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Cache configuration for high-performance skills search
 * Uses Caffeine for in-memory caching with automatic expiration
 */
@Configuration
@EnableCaching
public class CacheConfig {
    
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
            "skillSearch",      // Search results cache
            "popularSkills",    // Popular skills cache
            "allActiveSkills",  // All skills for fuzzy matching
            "skillCategories",  // Categories cache
            "skillById"         // Individual skill cache
        );
        
        cacheManager.setCaffeine(Caffeine.newBuilder()
            .maximumSize(2000)                          // Max 2000 cache entries
            .expireAfterWrite(Duration.ofMinutes(15))   // Expire after 15 minutes
            .expireAfterAccess(Duration.ofMinutes(10))  // Expire if not accessed for 10 minutes
            .recordStats());                            // Enable stats for monitoring
        
        return cacheManager;
    }
}


