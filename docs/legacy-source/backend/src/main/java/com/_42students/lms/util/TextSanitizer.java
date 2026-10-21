package com._42students.lms.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Utility class for sanitizing text input to prevent XSS and other security issues
 */
public class TextSanitizer {

    private static final ObjectMapper JSON_SIZE_MAPPER = new ObjectMapper();

    // importantDates is a JSON array of {label, date} objects, unlike candidatePreferences
    // (guarded by @ValidEligibilityRules) it previously had zero structural validation on the
    // write path: no cap on how many entries could be stored (a JSON-bomb-shaped array could be
    // saved unchecked) and the "label" text was persisted verbatim and later returned as-is to
    // learners via the Job entity / calendar endpoints, i.e. the same class of stored-XSS gap
    // Round 1 found and fixed for jobTitle/companyName/etc. — just never wired up for this field.
    private static final int IMPORTANT_DATES_MAX_ITEMS = 50;
    private static final int IMPORTANT_DATE_LABEL_MAX_LENGTH = 200;
    private static final int IMPORTANT_DATE_VALUE_MAX_LENGTH = 100;

    /**
     * Sanitizes text by HTML-escaping it, so no markup can ever reach a client as live HTML.
     *
     * <p>Previously this method stripped raw {@code <tag>} markup first and only afterwards
     * decoded HTML entities ({@code &lt;}, {@code &gt;}, {@code &amp;}, {@code &quot;},
     * {@code &apos;}) back into literal characters. That ordering was a stored-XSS bypass: a
     * pre-encoded payload such as {@code &lt;img src=x onerror=alert(1)&gt;} has no raw
     * {@code <}/{@code >} for the strip step to catch, sails through unchanged, and is then
     * decoded into live markup by the trailing entity-decode step.
     *
     * <p>Fields sanitized by this method (e.g. {@code Company.name}, job titles/descriptions)
     * are plain text and never need to render as HTML, so the fix is to escape rather than
     * attempt to selectively strip: delegate to the same safe, already-proven
     * {@link InputSanitizer#sanitize(String)} escaping logic used elsewhere in this codebase
     * (Learner/Faculty profile fields) instead of maintaining a separate, bug-prone
     * strip-then-decode implementation.
     *
     * @param input The input text to sanitize
     * @return Sanitized (HTML-escaped) text or null/blank input unchanged
     */
    public static String sanitizeText(String input) {
        if (!StringUtils.hasText(input)) {
            return input;
        }

        return InputSanitizer.sanitize(input);
    }

    /**
     * Sanitizes and truncates text to a maximum length
     * @param input The input text to sanitize
     * @param maxLength Maximum allowed length
     * @return Sanitized and truncated text
     */
    /**
     * A drive's description is rich text: students see it through RichTextDisplay's own tag allowlist. Escaping it (as
     * sanitizeAndTruncate does) stored "&lt;p&gt;..." and showed the tags to students and in the drive form (night audit 13 Oct 2026).
     * This keeps the formatting and drops anything unsafe (scripts, event handlers, javascript: links).
     */
    public static String sanitizeRichTextAndTruncate(String input, int maxLength) {
        if (input == null || input.isBlank()) return input;
        String s = input.length() > maxLength ? input.substring(0, maxLength) : input;
        String cleaned = org.jsoup.Jsoup.clean(s, org.jsoup.safety.Safelist.relaxed().removeTags("img"));
        return cleaned.length() > maxLength ? cleaned.substring(0, maxLength) : cleaned;
    }

    public static String sanitizeAndTruncate(String input, int maxLength) {
        String sanitized = sanitizeText(input);
        if (sanitized != null && sanitized.length() > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }
        return sanitized;
    }

    /**
     * Sanitizes and truncates text that may contain a URL (e.g. Interview.location, which doubles
     * as either a physical address or a meeting link — Google Meet/Zoom links commonly carry
     * tracking query params joined with {@code &}).
     *
     * <p>CORRECTNESS FIX (this audit round): {@link #sanitizeAndTruncate} delegates to
     * {@link InputSanitizer#sanitize}, which HTML-escapes via {@code HtmlUtils.htmlEscape} —
     * that turns every {@code &} into the literal 4-character sequence {@code &amp;}. The frontend
     * already validates the raw (unescaped) URL via {@code isValidMeetingUrl} before submitting,
     * but the value actually persisted here was the escaped one: a link like
     * {@code https://meet.google.com/abc?x=1&y=2} was stored (and later rendered as an {@code href}
     * by React, which does not re-decode HTML entities in attribute values) as
     * {@code https://meet.google.com/abc?x=1&amp;y=2} — a broken link with the wrong query param
     * name. This method still HTML-escapes {@code <}, {@code >}, {@code "}, and {@code '} (the
     * characters that actually enable markup injection) but leaves {@code &} untouched, so a
     * legitimate meeting URL's query string round-trips intact.
     *
     * @param input The input text to sanitize
     * @param maxLength Maximum allowed length
     * @return Sanitized and truncated text, with '&' preserved
     */
    public static String sanitizeAndTruncatePreservingAmpersand(String input, int maxLength) {
        if (!StringUtils.hasText(input)) {
            return input;
        }
        String sanitized = input.trim()
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
        if (sanitized.length() > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }
        return sanitized;
    }

    /**
     * Checks if text contains potentially malicious content
     * @param input The input text to check
     * @return true if text appears safe, false if potentially malicious
     */
    public static boolean isSafeText(String input) {
        if (!StringUtils.hasText(input)) {
            return true;
        }

        // Check for common XSS patterns
        String lowerInput = input.toLowerCase();
        return !lowerInput.contains("<script") &&
               !lowerInput.contains("javascript:") &&
               !lowerInput.contains("onload=") &&
               !lowerInput.contains("onerror=") &&
               !lowerInput.contains("onclick=");
    }

    /**
     * Validates and sanitizes a Job.importantDates value: must be a JSON array (or null),
     * capped in size, of objects whose "label" gets HTML-escaped/truncated the same way other
     * job text fields are, and whose "date" is truncated to a sane length. Rejects (rather than
     * silently drops or stores) shapes that aren't an array-of-objects, since malformed input
     * here previously reached storage - and the learner-facing calendar/job responses - with no
     * check at all.
     *
     * @param importantDates raw deserialized value from the incoming Job (null, List, or garbage)
     * @return sanitized List of label/date maps, or null if input was null
     * @throws IllegalArgumentException if the shape is invalid or exceeds the size cap
     */
    @SuppressWarnings("unchecked")
    public static Object sanitizeImportantDates(Object importantDates) {
        if (importantDates == null) {
            return null;
        }
        if (!(importantDates instanceof List)) {
            throw new IllegalArgumentException(
                "importantDates must be a JSON array of { label, date } objects");
        }
        List<?> list = (List<?>) importantDates;
        if (list.size() > IMPORTANT_DATES_MAX_ITEMS) {
            throw new IllegalArgumentException(
                "importantDates must not exceed " + IMPORTANT_DATES_MAX_ITEMS + " entries");
        }
        List<Map<String, Object>> sanitized = new ArrayList<>(list.size());
        for (Object item : list) {
            if (!(item instanceof Map)) {
                throw new IllegalArgumentException(
                    "Each importantDates entry must be an object with label and date");
            }
            Map<String, Object> map = (Map<String, Object>) item;
            Object labelObj = map.get("label");
            Object dateObj = map.get("date");

            String label = labelObj != null
                ? sanitizeAndTruncate(String.valueOf(labelObj), IMPORTANT_DATE_LABEL_MAX_LENGTH)
                : null;

            String date = dateObj != null ? String.valueOf(dateObj).trim() : null;
            if (date != null && date.length() > IMPORTANT_DATE_VALUE_MAX_LENGTH) {
                date = date.substring(0, IMPORTANT_DATE_VALUE_MAX_LENGTH);
            }

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("label", label);
            entry.put("date", date);
            sanitized.add(entry);
        }
        return sanitized;
    }

    private static final int CANDIDATE_PREF_STRING_MAX_LENGTH = 100;
    private static final int CANDIDATE_PREF_SKILL_MAX_LENGTH = 50;
    private static final int CANDIDATE_PREF_CUSTOM_RULE_MAX_LENGTH = 200;

    // Free-text keys on Job.candidatePreferences. EligibilityRulesValidator (@ValidEligibilityRules)
    // enforces the allowed key set, lengths, and types on write, but only rejects out-of-bounds
    // input - it never HTML-escapes the string values it accepts. Those values are then displayed
    // verbatim to learners (candidatePreferences is explicitly "display-only", shown pre-apply),
    // so a value like preferredCity="<img src=x onerror=alert(1)>" passes the validator untouched
    // and is stored/returned as live markup - the same stored-XSS gap already fixed for
    // jobTitle/companyName/importantDates, just never wired up for this field. sanitizeJobInputs
    // never touched candidatePreferences at all before this fix.
    private static final java.util.Set<String> CANDIDATE_PREF_TEXT_KEYS = java.util.Set.of(
        "degree", "specialization", "cityPreference",
        "preferredDegree", "preferredSpecialization", "preferredCity");

    /**
     * HTML-escapes the free-text values inside a Job.candidatePreferences JSON object
     * (preferredDegree/preferredSpecialization/preferredCity/degree/specialization/cityPreference,
     * preferredSkills[], customRules[].label/.value), leaving non-string/structural values
     * (papRequired, minGpa/preferredGpa, graduationYear/preferredGraduationYear, unknown keys)
     * untouched. Defensive by design: shape/key/length validation is already owned by
     * {@code EligibilityRulesValidator}, so this never throws - it just escapes whatever text
     * values are present.
     *
     * @param candidatePreferences raw deserialized value (null, Map, or garbage)
     * @return a sanitized copy, or the original value unchanged if it isn't a Map
     */
    @SuppressWarnings("unchecked")
    public static Object sanitizeCandidatePreferences(Object candidatePreferences) {
        if (!(candidatePreferences instanceof Map)) {
            return candidatePreferences;
        }
        Map<String, Object> source = (Map<String, Object>) candidatePreferences;
        Map<String, Object> sanitized = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : source.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();

            if (CANDIDATE_PREF_TEXT_KEYS.contains(key) && value instanceof String) {
                sanitized.put(key, sanitizeAndTruncate((String) value, CANDIDATE_PREF_STRING_MAX_LENGTH));
                continue;
            }

            if ("preferredSkills".equals(key) && value instanceof List) {
                List<Object> skills = new ArrayList<>();
                for (Object skill : (List<?>) value) {
                    if (skill instanceof String) {
                        skills.add(sanitizeAndTruncate((String) skill, CANDIDATE_PREF_SKILL_MAX_LENGTH));
                    } else {
                        skills.add(skill);
                    }
                }
                sanitized.put(key, skills);
                continue;
            }

            if ("customRules".equals(key) && value instanceof List) {
                List<Object> rules = new ArrayList<>();
                for (Object item : (List<?>) value) {
                    if (item instanceof Map) {
                        Map<String, Object> rule = (Map<String, Object>) item;
                        Map<String, Object> sanitizedRule = new LinkedHashMap<>();
                        for (Map.Entry<String, Object> ruleEntry : rule.entrySet()) {
                            Object ruleValue = ruleEntry.getValue();
                            if ("label".equals(ruleEntry.getKey()) || "value".equals(ruleEntry.getKey())) {
                                // ROUND 4 AUDIT FIX: EligibilityRulesValidator only checks
                                // String.valueOf(valueObj).trim().length() for customRules[].value
                                // — it never rejects a non-String (Map/List) value, since
                                // String.valueOf() happily stringifies those too and the result
                                // can easily be under the 200-char cap. Previously this method only
                                // handled the `ruleValue instanceof String` case and fell through to
                                // storing anything else (a nested object/array) completely
                                // unescaped, e.g. customRules: [{"label":"x","value":
                                // {"nested":"<img src=x onerror=alert(1)>"}}] would pass validation
                                // and be persisted with the nested string live/unescaped — a bypass
                                // of the same stored-XSS protection every other text field here
                                // gets. Recurse instead of a flat instanceof-String check so any
                                // String found at any depth inside label/value gets escaped, while
                                // non-string leaves (numbers/booleans/null) and the structural
                                // shape are preserved as-is and nothing throws on an unexpected
                                // shape.
                                sanitizedRule.put(ruleEntry.getKey(), sanitizeNestedValue(ruleValue));
                            } else {
                                sanitizedRule.put(ruleEntry.getKey(), ruleValue);
                            }
                        }
                        rules.add(sanitizedRule);
                    } else {
                        rules.add(item);
                    }
                }
                sanitized.put(key, rules);
                continue;
            }

            sanitized.put(key, value);
        }
        return sanitized;
    }

    /**
     * Recursively HTML-escapes any String found within an arbitrary JSON-shaped value (String,
     * Map, List, or other/leaf types). Used for candidatePreferences.customRules[].label/.value,
     * which - unlike the other candidatePreferences fields - are only shape-checked by
     * {@code EligibilityRulesValidator} via {@code String.valueOf(...)} (which stringifies a
     * Map/List without rejecting it), so a nested object/array can reach this method instead of
     * a plain String. Never throws: unrecognized/non-string leaf types (numbers, booleans, null)
     * are returned unchanged, and Map/List structure is preserved.
     *
     * @param value the raw value (String, Map, List, or other)
     * @return a deep copy with every String leaf HTML-escaped/truncated, or the original value
     *         unchanged if it isn't a String/Map/List
     */
    @SuppressWarnings("unchecked")
    private static Object sanitizeNestedValue(Object value) {
        if (value instanceof String) {
            return sanitizeAndTruncate((String) value, CANDIDATE_PREF_CUSTOM_RULE_MAX_LENGTH);
        }
        if (value instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) value;
            Map<String, Object> result = new LinkedHashMap<>();
            for (Map.Entry<String, Object> entry : map.entrySet()) {
                result.put(entry.getKey(), sanitizeNestedValue(entry.getValue()));
            }
            return result;
        }
        if (value instanceof List) {
            List<Object> result = new ArrayList<>();
            for (Object item : (List<?>) value) {
                result.add(sanitizeNestedValue(item));
            }
            return result;
        }
        return value;
    }

    /**
     * Rejects a JSON-typed field (evaluationConfig, etc.) whose serialized size exceeds
     * maxBytes. evaluationConfig currently has no consumer and therefore no schema to validate
     * against, but "nothing reads it yet" previously also meant nothing capped how large a blob
     * an admin could write into it - this closes that write-side gap without constraining its
     * (still-undefined) shape.
     *
     * @throws IllegalArgumentException if the value serializes larger than maxBytes
     */
    public static void enforceJsonSizeLimit(Object value, int maxBytes, String fieldName) {
        if (value == null) {
            return;
        }
        try {
            byte[] bytes = JSON_SIZE_MAPPER.writeValueAsBytes(value);
            if (bytes.length > maxBytes) {
                throw new IllegalArgumentException(
                    fieldName + " must not exceed " + maxBytes + " bytes of JSON");
            }
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalArgumentException(fieldName + " could not be serialized for validation", e);
        }
    }
}


