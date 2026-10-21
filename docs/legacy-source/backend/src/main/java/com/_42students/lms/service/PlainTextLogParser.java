package com._42students.lms.service;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Reads the human-readable console format some environments still emit (colored, one text blob per
 * event) so the Logs page can show a real level, logger, message and stack trace for them.
 *
 * Kubernetes labels every stdout line INFO, so without this an ERROR from such a pod is
 * indistinguishable from routine output and disappears behind any level filter. Structured JSON
 * logs (production) never reach this class.
 */
final class PlainTextLogParser {

    static final class Parsed {
        final String severity;
        final String message;
        final String logger;
        final String exception;

        Parsed(String severity, String message, String logger, String exception) {
            this.severity = severity;
            this.message = message;
            this.logger = logger;
            this.exception = exception;
        }
    }

    private static final Pattern ANSI = Pattern.compile("\u001B\\[[0-9;]*[A-Za-z]");
    private static final Pattern HEADER = Pattern.compile(
            "^\\s*\\S+(?:\\s+\\d{1,2}:\\d{2}:\\d{2}[.,]?\\d*)?\\s+(TRACE|DEBUG|INFO|WARN|WARNING|ERROR|FATAL)\\s+"
                    + "(?:\\[([^\\]]*)\\]\\s*)?(?:(\\S+)\\s*[:\\-]\\s*)?(.*)$",
            Pattern.DOTALL);
    private static final Pattern EXCEPTION_START = Pattern.compile(
            "^\\s*(?:Caused by:\\s*)?[A-Za-z_$][\\w$.]*(?:Exception|Error|Throwable)\\b.*");
    private static final Pattern STACK_FRAME = Pattern.compile("(?m)^\\s+at\\s+\\S+");

    private PlainTextLogParser() {}

    static String stripAnsi(String text) {
        return text == null ? null : ANSI.matcher(text).replaceAll("");
    }

    /** Returns null when the text is empty. Always returns a usable Parsed otherwise. */
    static Parsed parse(String raw) {
        String text = stripAnsi(raw);
        if (text == null || text.isBlank()) return null;

        int newline = text.indexOf('\n');
        String firstLine = newline < 0 ? text : text.substring(0, newline);
        String rest = newline < 0 ? "" : text.substring(newline + 1);

        Matcher header = HEADER.matcher(firstLine);
        if (header.matches()) {
            String severity = normalizeLevel(header.group(1));
            String logger = header.group(3);
            String message = header.group(4) == null ? "" : header.group(4).trim();
            String exception = rest.isBlank() ? null : rest.stripTrailing();
            if (message.isEmpty() && exception != null) message = firstLineOf(exception);
            return new Parsed(severity, message, logger, exception);
        }

        boolean looksLikeStack = EXCEPTION_START.matcher(firstLine).matches() || STACK_FRAME.matcher(text).find();
        if (looksLikeStack) {
            return new Parsed("ERROR", firstLine.trim(), null, text.stripTrailing());
        }
        return new Parsed(null, text.trim(), null, null);
    }

    private static String firstLineOf(String value) {
        int newline = value.indexOf('\n');
        return (newline < 0 ? value : value.substring(0, newline)).trim();
    }

    private static String normalizeLevel(String level) {
        String upper = level.toUpperCase(Locale.ROOT);
        return "WARN".equals(upper) ? "WARNING" : "FATAL".equals(upper) ? "CRITICAL" : upper;
    }
}
