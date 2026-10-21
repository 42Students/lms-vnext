package com._42students.lms.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Optional LMS modules exposed in Feature Controls and hierarchical Module Access.
 *
 * <p>Courses and their content are core LMS capabilities, not optional modules. Course-level
 * enrollment, publishing and authorization remain independent of this catalog. Quizzes,
 * assignments and attendance are pages inside Courses & Content rather than separately gated
 * modules. Projects and Placements are optional modules with direct API enforcement.
 */
public final class ModuleFeatureCatalog {

    private ModuleFeatureCatalog() {
    }

    private static final Map<String, String> MODULES;
    private static final Map<String, String> LABELS;

    static {
        Map<String, String> modules = new LinkedHashMap<>();
        modules.put("projects", "module.projects.enabled");
        modules.put("placements", "module.placements.enabled");
        modules.put("electives", "module.electives.enabled");
        MODULES = Collections.unmodifiableMap(modules);

        Map<String, String> labels = new LinkedHashMap<>();
        labels.put("projects", "Projects");
        labels.put("placements", "Placements");
        labels.put("electives", "Electives");
        LABELS = Collections.unmodifiableMap(labels);
    }

    /** Recognized stored values; null indicates an absent or unrecognized decision. */
    public static Boolean parseValue(String raw) {
        if (raw == null) return null;
        String value = raw.trim().toLowerCase(Locale.ROOT);
        switch (value) {
            case "false": case "0": case "no": case "off": case "disabled":
                return Boolean.FALSE;
            case "true": case "1": case "yes": case "on": case "enabled":
                return Boolean.TRUE;
            default:
                return null;
        }
    }

    public static boolean isTrue(String raw) {
        return Boolean.TRUE.equals(parseValue(raw));
    }

    public static List<String> moduleKeys() {
        return List.copyOf(MODULES.keySet());
    }

    /**
     * Modules switched for a whole college only. Placements: the college has it or not (super admin); who is in placements
     * is the placement cell's eligibility (batch, class, student), so the lower Module Access levels do not apply.
     */
    private static final java.util.Set<String> COLLEGE_LEVEL_ONLY = java.util.Set.of("placements");
    private static final java.util.Set<String> BELOW_COLLEGE = java.util.Set.of("LEARNER", "CLASS", "BATCH", "PROGRAM", "DEPARTMENT");

    /**
     * What a module is when nothing is set anywhere. Placements is a paid module: off until the super admin switches it on for a
     * college (product decision 2026-10-04). Every other optional module stays on by default.
     */
    private static final java.util.Set<String> DEFAULT_OFF = java.util.Set.of("placements");

    public static boolean defaultEnabled(String module) {
        return module == null || !DEFAULT_OFF.contains(module);
    }

    public static boolean collegeLevelOnly(String module) {
        return module != null && COLLEGE_LEVEL_ONLY.contains(module);
    }

    /** True when this level cannot carry a decision for this module. */
    public static boolean levelIgnored(String module, String scopeType) {
        return collegeLevelOnly(module) && scopeType != null && BELOW_COLLEGE.contains(scopeType.toUpperCase(java.util.Locale.ROOT));
    }

    public static List<String> settingKeys() {
        return List.copyOf(MODULES.values());
    }

    /** A locked explicit decision cannot be overridden at a narrower scope. */
    public static String lockKeyFor(String module) {
        String settingKey = settingKeyFor(module);
        return settingKey == null ? null : settingKey.replace(".enabled", ".locked");
    }

    public static List<String> settingAndLockKeys() {
        List<String> keys = new ArrayList<>(MODULES.values());
        for (String module : MODULES.keySet()) {
            keys.add(lockKeyFor(module));
        }
        return List.copyOf(keys);
    }

    public static String settingKeyFor(String module) {
        if (module == null) return null;
        return MODULES.get(module.trim().toLowerCase(Locale.ROOT));
    }

    public static String moduleForSettingKey(String settingKey) {
        if (settingKey == null) return null;
        for (Map.Entry<String, String> entry : MODULES.entrySet()) {
            if (entry.getValue().equals(settingKey.trim())) return entry.getKey();
        }
        return null;
    }

    public static String labelFor(String module) {
        if (module == null) return null;
        return LABELS.get(module.trim().toLowerCase(Locale.ROOT));
    }

    public static Map<String, String> labels() {
        return LABELS;
    }

    /** Unset optional-module settings default to enabled. */
    public static Map<String, Boolean> resolve(Map<String, String> settings) {
        Map<String, Boolean> out = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : MODULES.entrySet()) {
            String raw = settings == null ? null : settings.get(entry.getValue());
            Boolean parsed = parseValue(raw);
            // Unset follows the module's default (Placements off, the rest on); malformed persisted values never enable a module.
            out.put(entry.getKey(), raw == null ? defaultEnabled(entry.getKey()) : Boolean.TRUE.equals(parsed));
        }
        return out;
    }
}
