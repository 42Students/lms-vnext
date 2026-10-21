package com._42students.lms.service.impl;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.regex.Pattern;

/**
 * Normalizes a log entry's message into a stable "shape" signature so the alerting poller can tell
 * "this exact kind of error has never happened before" from "this is the 40th time this one has
 * fired" -- comparing raw messages directly would treat every occurrence as a distinct signature
 * the moment it contains an id, timestamp, or path segment that varies per request.
 */
public final class LogSignatureUtil {

    private LogSignatureUtil() {}

    private static final Pattern UUID_PATTERN =
            Pattern.compile("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");
    private static final Pattern NUMBER_PATTERN = Pattern.compile("\\b\\d+\\b");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("[\\w.+-]+@[\\w-]+\\.[\\w.-]+");
    private static final Pattern WHITESPACE_PATTERN = Pattern.compile("\\s+");

    /**
     * @param exceptionType e.g. "NullPointerException" parsed off the exception stack, or null
     * @param message       the log message
     * @param httpPath      request path, if any -- included so the same exception type/message on
     *                      two different endpoints is tracked as two distinct signatures
     */
    public static String normalize(String exceptionType, String message, String httpPath) {
        String base = (exceptionType == null ? "" : exceptionType + ":")
                + (message == null ? "" : message)
                + (httpPath == null ? "" : "@" + normalizePath(httpPath));
        String normalized = base.toLowerCase(java.util.Locale.ROOT);
        normalized = UUID_PATTERN.matcher(normalized).replaceAll("<uuid>");
        normalized = EMAIL_PATTERN.matcher(normalized).replaceAll("<email>");
        normalized = NUMBER_PATTERN.matcher(normalized).replaceAll("<n>");
        normalized = WHITESPACE_PATTERN.matcher(normalized).replaceAll(" ").trim();
        return normalized;
    }

    /** Path segments that look like ids (numeric, or a UUID) collapse to a placeholder. */
    private static String normalizePath(String path) {
        String[] segments = path.split("/");
        StringBuilder out = new StringBuilder();
        for (String segment : segments) {
            if (segment.isEmpty()) continue;
            out.append('/');
            if (segment.matches("\\d+") || UUID_PATTERN.matcher(segment).matches()) {
                out.append("<id>");
            } else {
                out.append(segment);
            }
        }
        return out.toString();
    }

    public static String hash(String normalized) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(normalized.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 is guaranteed available on every JVM; this branch is unreachable in practice.
            throw new IllegalStateException(e);
        }
    }
}
