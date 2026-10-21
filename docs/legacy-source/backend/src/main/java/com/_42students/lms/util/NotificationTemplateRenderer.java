package com._42students.lms.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Stateless variable substitution for in-code notification templates.
 * Replaces {{varName}} with values from the variables map.
 */
public final class NotificationTemplateRenderer {

    private static final Pattern VARIABLE_PATTERN = Pattern.compile("\\{\\{([^}]+)\\}\\}");

    private NotificationTemplateRenderer() {
    }

    public static String render(String templateContent, Map<String, Object> variables) {
        if (templateContent == null) return null;
        if (variables == null || variables.isEmpty()) return templateContent;
        Matcher matcher = VARIABLE_PATTERN.matcher(templateContent);
        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            String varName = matcher.group(1).trim();
            Object value = variables.get(varName);
            String replacement = value != null ? formatValue(value) : "";
            matcher.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    private static String formatValue(Object value) {
        if (value instanceof LocalDateTime) {
            return ((LocalDateTime) value).format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        }
        if (value instanceof Date) {
            return value.toString();
        }
        return value.toString();
    }
}

