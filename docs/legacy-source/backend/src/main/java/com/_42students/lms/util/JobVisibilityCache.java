package com._42students.lms.util;

import com._42students.lms.model.Job;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Job Visibility Cache
 * STALE VISIBILITY FIX: Caches job visibility per learner hierarchy to prevent stale data.
 * 
 * Cache Key Format: "visibility:{organizationId}:{classId}:{batchId}:{programId}"
 * - Hierarchy included to ensure cache invalidation on hierarchy updates
 * - Organization ID included to scope cache by organization
 * 
 * TTL: Entries expire after CACHE_TTL_MS (5 minutes) because visibility results
 * depend on time-sensitive fields (applicationDeadline). Without TTL, a cached "visible"
 * result would persist after the deadline passes.
 * 
 * Cache Invalidation Triggers:
 * 1. Learner onboarding (hierarchy set for first time)
 * 2. Learner hierarchy updates (class/batch/program changes)
 * 3. Job targeting changes (job update invalidates org cache)
 * 4. TTL expiration (automatic, 5 minutes)
 */
@Component
@Slf4j
public class JobVisibilityCache {

    private static final long CACHE_TTL_MS = 5 * 60 * 1000L;

    private static class CacheEntry {
        final List<Job> jobs;
        final long createdAt;

        CacheEntry(List<Job> jobs) {
            this.jobs = jobs;
            this.createdAt = System.currentTimeMillis();
        }

        boolean isExpired() {
            return System.currentTimeMillis() - createdAt > CACHE_TTL_MS;
        }
    }

    private final Map<String, CacheEntry> visibilityCache = new ConcurrentHashMap<>();

    /**
     * Generate cache key from learner hierarchy.
     * collegeId is included because matchesHierarchicalTargeting gates college-scoped jobs on
     * it — two learners sharing org:class:batch:program but different collegeId used to share
     * one cache entry, and a learner whose collegeId changed without their class/program also
     * changing wasn't detected as a hierarchy change at all (see invalidateForHierarchy callers
     * in LearnerServiceImpl), so a college transfer could serve a stale/wrong-college visible-job
     * list for up to the cache TTL.
     */
    public String generateCacheKey(Integer organizationId, Integer collegeId, Integer classId, Integer batchId, Integer programId) {
        return String.format("visibility:%d:%s:%s:%s:%s",
                organizationId != null ? organizationId : "null",
                collegeId != null ? collegeId : "null",
                classId != null ? classId : "null",
                batchId != null ? batchId : "null",
                programId != null ? programId : "null");
    }

    /**
     * Get cached visible jobs for a learner hierarchy.
     * Returns null if not cached or if TTL has expired.
     */
    public List<Job> getCachedVisibleJobs(Integer organizationId, Integer collegeId, Integer classId, Integer batchId, Integer programId) {
        String cacheKey = generateCacheKey(organizationId, collegeId, classId, batchId, programId);
        CacheEntry entry = visibilityCache.get(cacheKey);
        if (entry == null) return null;
        if (entry.isExpired()) {
            visibilityCache.remove(cacheKey);
            log.debug("Cache EXPIRED for visibility key: {}", cacheKey);
            return null;
        }
        log.debug("Cache HIT for visibility key: {}", cacheKey);
        return entry.jobs;
    }

    /**
     * Cache visible jobs for a learner hierarchy (with TTL).
     */
    public void cacheVisibleJobs(Integer organizationId, Integer collegeId, Integer classId, Integer batchId, Integer programId, List<Job> jobs) {
        String cacheKey = generateCacheKey(organizationId, collegeId, classId, batchId, programId);
        visibilityCache.put(cacheKey, new CacheEntry(new ArrayList<>(jobs)));
        log.debug("Cached {} visible jobs for key: {}", jobs.size(), cacheKey);
    }

    /**
     * Invalidate cache for a specific learner hierarchy
     * Called when:
     * - Learner hierarchy is updated (class/batch/program/college changed)
     * - Learner is onboarded (hierarchy set for first time)
     *
     * @param organizationId Organization ID
     * @param collegeId College ID (nullable)
     * @param classId Class ID (nullable)
     * @param batchId Batch ID (nullable)
     * @param programId Program ID (nullable)
     */
    public void invalidateForHierarchy(Integer organizationId, Integer collegeId, Integer classId, Integer batchId, Integer programId) {
        String cacheKey = generateCacheKey(organizationId, collegeId, classId, batchId, programId);
        CacheEntry removed = visibilityCache.remove(cacheKey);
        if (removed != null) {
            log.info("Cache INVALIDATED for key: {} (removed {} jobs)", cacheKey, removed.jobs.size());
        } else {
            log.debug("Cache key {} not found for invalidation (may not have been cached yet)", cacheKey);
        }
    }

    /**
     * Invalidate all cache entries for an organization.
     * Called when organization-wide changes occur (e.g., job create/update/delete).
     */
    public void invalidateForOrganization(Integer organizationId) {
        Set<String> keysToRemove = visibilityCache.keySet().stream()
                .filter(key -> key.startsWith("visibility:" + organizationId + ":"))
                .collect(Collectors.toSet());
        
        keysToRemove.forEach(key -> {
            CacheEntry removed = visibilityCache.remove(key);
            log.debug("Cache INVALIDATED for key: {} (removed {} jobs)", key, removed != null ? removed.jobs.size() : 0);
        });
        
        if (!keysToRemove.isEmpty()) {
            log.info("Cache INVALIDATED for organization {} (removed {} cache entries)", organizationId, keysToRemove.size());
        }
    }

    /**
     * Clear entire cache (use with caution - typically for testing or maintenance)
     */
    public void clearAll() {
        int size = visibilityCache.size();
        visibilityCache.clear();
        log.info("Cache CLEARED (removed {} entries)", size);
    }

    /**
     * Get cache size (for monitoring/debugging)
     * 
     * @return Number of cache entries
     */
    public int getCacheSize() {
        return visibilityCache.size();
    }
}


