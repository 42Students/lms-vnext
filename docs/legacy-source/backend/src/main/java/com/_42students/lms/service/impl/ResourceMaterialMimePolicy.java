package com._42students.lms.service.impl;

import java.util.Locale;
import java.util.Map;
import java.util.Set;

/** Explicit Resource file allowlist. A filename extension alone cannot authorize active HTML/SVG. */
public final class ResourceMaterialMimePolicy {
    private static final Map<String, Set<String>> EXTENSION_MIMES = Map.ofEntries(
            Map.entry("pdf", Set.of("application/pdf")),
            Map.entry("doc", Set.of("application/msword")),
            Map.entry("docx", Set.of("application/vnd.openxmlformats-officedocument.wordprocessingml.document")),
            Map.entry("txt", Set.of("text/plain")),
            Map.entry("ppt", Set.of("application/vnd.ms-powerpoint")),
            Map.entry("pptx", Set.of("application/vnd.openxmlformats-officedocument.presentationml.presentation")),
            Map.entry("xls", Set.of("application/vnd.ms-excel")),
            Map.entry("xlsx", Set.of("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")),
            Map.entry("csv", Set.of("text/csv", "application/csv", "application/vnd.ms-excel")),
            Map.entry("png", Set.of("image/png")),
            Map.entry("jpg", Set.of("image/jpeg")),
            Map.entry("jpeg", Set.of("image/jpeg")),
            Map.entry("webp", Set.of("image/webp"))
    );
    private static final Set<String> FALLBACK_OCTET_EXTENSIONS = Set.of("txt", "csv", "xls", "xlsx");

    private ResourceMaterialMimePolicy() { }

    public static String extension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        return dot > 0 && dot < filename.length() - 1
                ? filename.substring(dot + 1).toLowerCase(Locale.ROOT) : "";
    }

    public static boolean matches(String filename, String mime) {
        String ext = extension(filename);
        Set<String> allowed = EXTENSION_MIMES.get(ext);
        if (allowed == null || mime == null) return false;
        String normalized = mime.trim().toLowerCase(Locale.ROOT);
        return allowed.contains(normalized);
    }

    /** Multipart fallback infers octet-stream for these safe formats until its mapper is updated. */
    public static boolean matchesStored(String filename, String mime) {
        if (matches(filename, mime)) return true;
        return mime != null && "application/octet-stream".equalsIgnoreCase(mime.trim())
                && FALLBACK_OCTET_EXTENSIONS.contains(extension(filename));
    }
}
