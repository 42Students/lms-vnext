package com._42students.lms.utils;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Validates that content file URLs (e.g. video, pdf) are from allowed storage (e.g. app's R2).
 * Used to prevent arbitrary external URLs in lesson content.
 */
@Component
public class ContentUrlValidator {

    @Value("${r2.public.url:}")
    private String r2PublicUrl;

    /**
     * Normalized base URL with trailing slash for prefix matching.
     */
    private String getNormalizedBase() {
        if (r2PublicUrl == null || r2PublicUrl.trim().isEmpty()) {
            return null;
        }
        String base = r2PublicUrl.trim();
        return base.endsWith("/") ? base : base + "/";
    }

    private static final String[] ALLOWED_STORAGE_KEY_PREFIXES = {
        "lesson-content/", "video-intros/", "profile-images/", "resumes/"
    };

    private static final java.util.Set<String> LEGACY_PUBLIC_CONTENT_HOSTS =
            java.util.Set.of(
                    "42lms.in",
                    "www.42lms.in",
                    "42lms.com",
                    "www.42lms.com",
                    "42lms.s3-accelerate.amazonaws.com"
            );

    private static final java.util.regex.Pattern TENANT_STORAGE_KEY_PATTERN =
            java.util.regex.Pattern.compile("^org-\\d+/college-\\d+/(lesson-content|video-intros|profile-images|resumes)/.+");

    private static String stripKnownBucketPrefix(String key) {
        if (key == null) return null;
        String normalized = key.trim();
        if (normalized.startsWith("storagelms/")) {
            return normalized.substring("storagelms/".length());
        }
        return normalized;
    }

    /**
     * Returns true if the value is an allowed R2 storage key (path only, no URL).
     * Used when frontend sends key instead of URL for video/video-intro storage.
     * Rejects null, empty, path traversal (..), or URL-like (://) values.
     */
    public boolean isAllowedStorageKey(String key) {
        if (key == null || key.trim().isEmpty()) {
            return false;
        }
        String k = key.trim();
        if (k.contains("..") || k.contains("://")) {
            return false;
        }
        if (TENANT_STORAGE_KEY_PATTERN.matcher(k).matches()) {
            return true;
        }
        for (String prefix : ALLOWED_STORAGE_KEY_PREFIXES) {
            if (k.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns true if the URL is allowed for content (e.g. from our R2 or allowlist).
     * Null or empty URL is allowed (skip validation).
     */
    public boolean isAllowedContentUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return true;
        }
        String base = getNormalizedBase();
        if (base == null) {
            return false;
        }
        String normalized = url.trim();
        return normalized.startsWith(base) || normalized.equals(r2PublicUrl.trim());
    }

    /**
     * Resolves the R2 object key from a stored value that may be either a full URL or a key.
     * Used for playback, delete, and update (R2 cleanup). Strips query string from URLs so
     * presigned URLs do not produce an invalid key.
     *
     * @param value Stored cloudStorageObject or videoIntroUrl (URL or key)
     * @return The R2 key, or null if invalid/not from allowed storage
     */
    public String resolveStorageKeyFromValue(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        String v = value.trim();
        if (v.contains("://")) {
            String withoutQuery = v.contains("?") ? v.substring(0, v.indexOf('?')) : v;
            String key = urlToKey(withoutQuery);
            return (key != null && !key.isEmpty()) ? key : null;
        }
        String normalized = stripKnownBucketPrefix(v);
        return isAllowedStorageKey(normalized) ? normalized : null;
    }

    /**
     * Derives the R2 object key from a public URL.
     * Returns null if the URL is not from our configured R2 base.
     */
    public String urlToKey(String url) {
        if (url == null || url.trim().isEmpty()) {
            return null;
        }
        String normalized = url.trim();
        String base = getNormalizedBase();
        if (base != null) {
            if (normalized.startsWith(base)) {
                return stripKnownBucketPrefix(normalized.substring(base.length()));
            }
            if (normalized.equals(r2PublicUrl.trim())) {
                return "";
            }
            // base without trailing slash: e.g. https://pub-xxx.r2.dev
            String baseNoSlash = r2PublicUrl.trim();
            if (normalized.startsWith(baseNoSlash + "/")) {
                return stripKnownBucketPrefix(normalized.substring(baseNoSlash.length() + 1));
            }
            if (normalized.equals(baseNoSlash)) {
                return "";
            }
        }

        // Compatibility fallback:
        // Some migrated rows store direct R2 object URLs on an alternate host
        // (for example, the object store endpoint instead of the configured public base).
        // If the URL path still contains one of the allowed storage prefixes, treat it as the key.
        try {
            java.net.URL parsed = new java.net.URL(normalized);
            String path = parsed.getPath() != null ? parsed.getPath().trim() : "";
            if (path.startsWith("/")) {
                path = path.substring(1);
            }
            String stripped = stripKnownBucketPrefix(path);
            if (isAllowedStorageKey(stripped)) {
                return stripped;
            }
        } catch (Exception ignored) {
            // fall through
        }
        return null;
    }

    /**
     * Returns true for trusted legacy public URLs that are not in R2 but are still valid
     * playback sources for migrated content.
     */
    public boolean isAllowedLegacyPublicContentUrl(String url) {
        if (url == null || url.trim().isEmpty()) return false;
        try {
            java.net.URL parsed = new java.net.URL(url.trim());
            String protocol = parsed.getProtocol();
            String host = parsed.getHost();
            if (protocol == null || !"https".equalsIgnoreCase(protocol)) return false;
            if (host == null) return false;
            return LEGACY_PUBLIC_CONTENT_HOSTS.contains(host.toLowerCase());
        } catch (Exception e) {
            return false;
        }
    }

    private static final String[] YOUTUBE_ALLOWED_HOSTS = {
        "youtube.com", "www.youtube.com", "youtu.be", "www.youtu.be",
        "youtube-nocookie.com", "www.youtube-nocookie.com"
    };

    /**
     * Returns true if the URL is an allowed YouTube URL for lesson content.
     * Null or empty URL is allowed (skip validation).
     */
    public boolean isAllowedYouTubeUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return true;
        }
        try {
            java.net.URL u = new java.net.URL(url.trim());
            String host = u.getHost();
            if (host == null) return false;
            host = host.toLowerCase();
            for (String allowed : YOUTUBE_ALLOWED_HOSTS) {
                if (allowed.equals(host)) return true;
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Extracts YouTube video ID from URL if present (for optional format validation).
     * Returns null if not a recognizable YouTube URL or no video id.
     */
    public String extractYouTubeVideoId(String url) {
        if (url == null || url.trim().isEmpty()) return null;
        if (!isAllowedYouTubeUrl(url)) return null;
        try {
            java.net.URL u = new java.net.URL(url.trim());
            String host = u.getHost() != null ? u.getHost().toLowerCase() : "";
            String path = u.getPath();
            String query = u.getQuery();
            if (host.contains("youtu.be") && path != null && path.length() > 1) {
                return path.substring(1).split("/")[0];
            }
            if (host.contains("youtube.com") && query != null) {
                for (String param : query.split("&")) {
                    if (param.startsWith("v=")) return param.substring(2);
                }
            }
            if (host.contains("youtube.com") && path != null && path.startsWith("/embed/")) {
                String rest = path.substring(7);
                int slash = rest.indexOf('/');
                return slash >= 0 ? rest.substring(0, slash) : rest;
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }
}

