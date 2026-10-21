package com._42students.lms.service.tpo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Skill match on the drive page: the share of the skills the drive wants that the student lists on their profile, 0-100.
 * Worked out when the list is read, so it always reflects the drive and the profile as they are now.
 * It replaced the stored screening score, which was 0-1 shown as a percentage (a 75% match read "1%"), mixed education
 * preferences into a number called "skill" match, and was frozen at the moment the student applied.
 */
public final class SkillMatch {

    private static final ObjectMapper JSON = new ObjectMapper();

    private SkillMatch() {}

    /** The drive's wanted skills (candidate_preferences.preferredSkills), lower-cased and trimmed; empty when it names none. */
    public static Set<String> wanted(Object candidatePreferences) {
        Set<String> out = new LinkedHashSet<>();
        JsonNode node = read(candidatePreferences);
        JsonNode list = node == null ? null : node.get("preferredSkills");
        if (list != null && list.isArray()) {
            for (JsonNode s : list) {
                String v = s.isTextual() ? norm(s.asText()) : "";
                if (!v.isEmpty()) out.add(v);
            }
        }
        return out;
    }

    /** The skills on a student's profile (learner.skills, a list of {skill, ...}), lower-cased and trimmed. */
    public static Set<String> has(Object learnerSkills) {
        Set<String> out = new LinkedHashSet<>();
        JsonNode list = read(learnerSkills);
        if (list != null && list.isArray()) {
            for (JsonNode s : list) {
                String v = s.isTextual() ? s.asText() : s.path("skill").asText("");
                v = norm(v);
                if (!v.isEmpty()) out.add(v);
            }
        }
        return out;
    }

    /**
     * skillMatch (0-100, or null when the drive names no skills), skillsWanted and skillsMatched for one student. A student
     * with no skills on their profile matches 0 of them: that is true, and the TPO can see it.
     */
    public static Map<String, Object> of(Set<String> wanted, Object learnerSkills) {
        Map<String, Object> out = new LinkedHashMap<>();
        if (wanted == null || wanted.isEmpty()) {
            out.put("skillMatch", null);
            return out;
        }
        Set<String> has = has(learnerSkills);
        long matched = wanted.stream().filter(has::contains).count();
        out.put("skillMatch", Math.round(100.0 * matched / wanted.size()));
        out.put("skillsWanted", wanted.size());
        out.put("skillsMatched", matched);
        return out;
    }

    private static String norm(String s) {
        return s == null ? "" : s.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }

    private static JsonNode read(Object value) {
        if (value == null) return null;
        try {
            if (value instanceof byte[] b) return JSON.readTree(b);
            if (value instanceof String s) return s.isBlank() ? null : JSON.readTree(s);
            return JSON.valueToTree(value);
        } catch (Exception e) {
            return null; // a damaged value just means no match is shown
        }
    }
}
