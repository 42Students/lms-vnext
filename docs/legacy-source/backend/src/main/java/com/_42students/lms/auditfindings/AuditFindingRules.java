package com._42students.lms.auditfindings;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * What a valid inbox file is. The same rules as scripts/rules.mjs in 42Students/lms-findings (the repo's own check); the
 * importer re-applies them so a file that got past the repo is still refused here. Change both together.
 */
public final class AuditFindingRules {

    private AuditFindingRules() {}

    public static final int SCHEMA_VERSION = 1;

    public static final List<String> AREAS = List.of(
            "login", "course", "lesson-content", "quiz", "assignment", "attendance", "classroom", "notifications", "calendar",
            "projects", "placements-tpo", "recruiter", "student-placements", "college-admin", "super-admin", "groups-electives",
            "people-accounts", "reports", "tracker", "mobile", "platform", "security", "other");
    public static final List<String> ROLES = List.of("public", "learner", "faculty", "mentor", "college-admin", "tpo", "recruiter", "super-admin");
    public static final List<String> SEVERITIES = List.of("critical", "high", "medium", "low");
    public static final List<String> KINDS = List.of("bug", "security", "data", "ux", "copy", "performance", "accessibility");
    public static final List<String> ENVIRONMENTS = List.of("prod", "dev", "local", "code");
    public static final List<String> REPOS = List.of("lms", "lms2-fe", "both", "infra", "other");
    /** What an agent may say in an update; decisions (confirmed, duplicate, ...) are made by people on the page. */
    public static final List<String> UPDATE_STATUSES = List.of("fixed", "comment", "needs-info", "cannot-reproduce", "reopen-suggested");

    public static final int TITLE_MAX = 160;
    public static final int TEXT_MAX = 4000;
    public static final int SHORT_MAX = 300;
    public static final int LIST_MAX = 20;
    public static final int FILE_MAX_BYTES = 32 * 1024;

    public static final Pattern FINDING_ID = Pattern.compile("^20\\d\\d-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])-[a-z][a-z-]*[a-z]-[a-z0-9]{4}$");
    public static final Pattern UPDATE_ID = Pattern.compile("^(20\\d\\d-\\d\\d-\\d\\d-[a-z][a-z-]*[a-z]-[a-z0-9]{4})\\.u(20\\d{10})-[a-z0-9]{4}$");
    private static final Pattern SHA = Pattern.compile("^[0-9a-f]{7,40}$");
    private static final Pattern ISO = Pattern.compile("^20\\d\\d-\\d\\d-\\d\\dT\\d\\d:\\d\\d(:\\d\\d(\\.\\d+)?)?(Z|[+-]\\d\\d:\\d\\d)$");

    private static final Pattern ALLOWED_EMAIL = Pattern.compile("@(example\\.(com|org|net)|[a-z0-9-]+\\.test|test\\.42lms\\.com)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern EMAIL = Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
    private static final Pattern PHONE = Pattern.compile("(?<![\\d])(?:\\+?91[\\s-]?)?([6-9]\\d{4}[\\s-]?\\d{5})(?![\\d])");
    private static final String[][] SECRETS = {
            {"a JWT / bearer token", "\\beyJ[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{5,}"},
            {"a GitHub token", "\\b(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})"},
            {"an API key", "\\b(sk-[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{30,}|xox[baprs]-[A-Za-z0-9-]{10,})"},
            {"a private key", "-----BEGIN [A-Z ]*PRIVATE KEY-----"},
            {"a password or secret value", "(?i)\\b(password|passwd|pwd|secret|api[_-]?key|token)\\s*[:=]\\s*[\"']?[^\\s\"',]{6,}"},
            {"a database URL with credentials", "(?i)\\b(mysql|postgres(ql)?|mongodb(\\+srv)?|redis)://[^\\s:@/]+:[^\\s@/]+@"},
    };

    private static final Set<String> FINDING_KEYS = Set.of("schema", "type", "id", "title", "area", "roles", "severity", "kind",
            "environment", "where", "summary", "steps", "expected", "actual", "evidence", "suggested_fix", "found_by", "found_at",
            "related", "duplicate_of");
    private static final Set<String> UPDATE_KEYS = Set.of("schema", "type", "id", "finding", "status", "note", "commits", "by", "at");

    /** Problems with one parsed file; empty means valid. fileName is the name inside inbox/. */
    public static List<String> check(JsonNode rec, String fileName) {
        List<String> errors = new ArrayList<>();
        if (rec == null || !rec.isObject()) return List.of("the file must hold one JSON object");
        if (!rec.path("schema").isInt() || rec.path("schema").asInt() != SCHEMA_VERSION) errors.add("\"schema\" must be " + SCHEMA_VERSION);
        String id = rec.path("id").isTextual() ? rec.path("id").asText() : null;
        if (id != null && !fileName.equals(id + ".json")) errors.add("the file must be named " + id + ".json (its id)");
        String type = rec.path("type").asText("");

        if ("finding".equals(type)) {
            onlyKeys(errors, rec, FINDING_KEYS, "");
            if (id == null || !FINDING_ID.matcher(id).matches()) errors.add("\"id\" must look like 2026-10-13-login-k7f3");
            else {
                String area = id.substring(11, id.length() - 5);
                if (rec.hasNonNull("area") && !area.equals(rec.path("area").asText())) errors.add("the id's area must match \"area\"");
            }
            text(errors, rec, "title", true, TITLE_MAX, 10);
            oneOf(errors, rec, "area", AREAS);
            list(errors, rec, "roles", true, ROLES, ROLES.size(), SHORT_MAX);
            oneOf(errors, rec, "severity", SEVERITIES);
            oneOf(errors, rec, "kind", KINDS);
            oneOf(errors, rec, "environment", ENVIRONMENTS);
            JsonNode w = rec.path("where");
            if (!w.isObject()) errors.add("\"where\" is required");
            else {
                onlyKeys(errors, w, Set.of("repo", "paths", "pages", "endpoints"), "where.");
                oneOf(errors, w, "repo", REPOS);
                list(errors, w, "paths", false, null, LIST_MAX, SHORT_MAX);
                list(errors, w, "pages", false, null, LIST_MAX, SHORT_MAX);
                list(errors, w, "endpoints", false, null, LIST_MAX, SHORT_MAX);
                if (!(nonEmptyArray(w.path("paths")) || nonEmptyArray(w.path("pages")) || nonEmptyArray(w.path("endpoints")))) {
                    errors.add("\"where\" needs at least one of paths, pages or endpoints");
                }
            }
            text(errors, rec, "summary", true, TEXT_MAX, 20);
            list(errors, rec, "steps", false, null, LIST_MAX, 500);
            for (String k : List.of("expected", "actual", "evidence", "suggested_fix")) text(errors, rec, k, false, TEXT_MAX, 0);
            JsonNode fb = rec.path("found_by");
            if (!fb.isObject()) errors.add("\"found_by\" is required");
            else {
                onlyKeys(errors, fb, Set.of("agent", "session"), "found_by.");
                text(errors, fb, "agent", true, 60, 2);
                text(errors, fb, "session", false, SHORT_MAX, 0);
            }
            if (!isIso(rec.path("found_at"))) errors.add("\"found_at\" must be a date-time like 2026-10-13T10:30:00+05:30");
            list(errors, rec, "related", false, null, LIST_MAX, 80);
            rec.path("related").forEach(r -> { if (!FINDING_ID.matcher(r.asText()).matches()) errors.add("\"related\" must hold finding ids"); });
            if (rec.has("duplicate_of") && !(rec.path("duplicate_of").isTextual() && FINDING_ID.matcher(rec.path("duplicate_of").asText()).matches())) {
                errors.add("\"duplicate_of\" must be a finding id");
            }
        } else if ("update".equals(type)) {
            onlyKeys(errors, rec, UPDATE_KEYS, "");
            Matcher m = id == null ? null : UPDATE_ID.matcher(id);
            boolean idOk = m != null && m.matches();
            if (!idOk) errors.add("\"id\" must look like <finding id>.u202610131030-ab12");
            String finding = rec.path("finding").asText("");
            if (!FINDING_ID.matcher(finding).matches()) errors.add("\"finding\" must be the id of the finding this updates");
            else if (idOk && !m.group(1).equals(finding)) errors.add("the id must start with the finding's id");
            oneOf(errors, rec, "status", UPDATE_STATUSES);
            text(errors, rec, "note", !"fixed".equals(rec.path("status").asText()), TEXT_MAX, 0);
            JsonNode c = rec.path("commits");
            if (!c.isMissingNode() && !c.isNull()) {
                if (!c.isArray() || c.size() > 10) errors.add("\"commits\" must be a list of at most 10 { repo, sha }");
                else for (JsonNode x : c) {
                    onlyKeys(errors, x, Set.of("repo", "sha"), "commits[].");
                    if (!REPOS.contains(x.path("repo").asText())) errors.add("a commit's \"repo\" must be one of: " + String.join(", ", REPOS));
                    if (!SHA.matcher(x.path("sha").asText()).matches()) errors.add("a commit's \"sha\" must be a commit hash");
                }
            }
            if ("fixed".equals(rec.path("status").asText()) && !nonEmptyArray(c)) errors.add("a \"fixed\" update needs \"commits\"");
            text(errors, rec, "by", true, 60, 2);
            if (!isIso(rec.path("at"))) errors.add("\"at\" must be a date-time like 2026-10-13T10:30:00+05:30");
        } else {
            errors.add("\"type\" must be \"finding\" or \"update\"");
        }

        String all = rec.toString();
        for (String[] s : SECRETS) if (Pattern.compile(s[1]).matcher(all).find()) errors.add("contains " + s[0]);
        errors.addAll(personalData(all));
        return errors;
    }

    /** A real person's phone number or email address (test data such as 9876543210 or @example.com is allowed). */
    static List<String> personalData(String text) {
        List<String> found = new ArrayList<>();
        Matcher p = PHONE.matcher(text);
        while (p.find()) {
            String digits = p.group(1).replaceAll("\\D", "");
            if (!digits.equals("9876543210") && !digits.matches("(\\d)\\1{9}")) found.add("contains a phone number");
        }
        Matcher e = EMAIL.matcher(text);
        while (e.find()) if (!ALLOWED_EMAIL.matcher(e.group()).find()) found.add("contains an email address");
        return new ArrayList<>(new java.util.LinkedHashSet<>(found));
    }

    public static OffsetDateTime parseTime(JsonNode n) {
        return OffsetDateTime.parse(n.asText().length() == 16 ? n.asText().substring(0, 16) + ":00" + n.asText().substring(16) : n.asText());
    }

    private static boolean isIso(JsonNode n) {
        if (!n.isTextual() || !ISO.matcher(n.asText()).matches()) return false;
        try { OffsetDateTime.parse(n.asText()); return true; } catch (Exception e) { return false; }
    }

    private static boolean nonEmptyArray(JsonNode n) { return n.isArray() && n.size() > 0; }

    private static void onlyKeys(List<String> errors, JsonNode obj, Set<String> keys, String where) {
        if (!obj.isObject()) return;
        for (Iterator<String> it = obj.fieldNames(); it.hasNext(); ) {
            String k = it.next();
            if (!keys.contains(k)) errors.add("unknown field \"" + where + k + "\"");
        }
    }

    private static void text(List<String> errors, JsonNode obj, String key, boolean required, int max, int min) {
        JsonNode v = obj.path(key);
        if (v.isMissingNode() || v.isNull() || (v.isTextual() && v.asText().isEmpty())) {
            if (required) errors.add("\"" + key + "\" is required");
            return;
        }
        if (!v.isTextual()) { errors.add("\"" + key + "\" must be text"); return; }
        if (v.asText().trim().length() < min) errors.add("\"" + key + "\" must be at least " + min + " characters");
        if (v.asText().length() > max) errors.add("\"" + key + "\" must be at most " + max + " characters");
    }

    private static void oneOf(List<String> errors, JsonNode obj, String key, List<String> allowed) {
        JsonNode v = obj.path(key);
        if (v.isMissingNode() || v.isNull() || v.asText().isEmpty()) { errors.add("\"" + key + "\" is required"); return; }
        if (!v.isTextual() || !allowed.contains(v.asText())) errors.add("\"" + key + "\" must be one of: " + String.join(", ", allowed));
    }

    private static void list(List<String> errors, JsonNode obj, String key, boolean required, List<String> allowed, int max, int itemMax) {
        JsonNode v = obj.path(key);
        if (v.isMissingNode() || v.isNull()) { if (required) errors.add("\"" + key + "\" is required"); return; }
        if (!v.isArray()) { errors.add("\"" + key + "\" must be a list"); return; }
        if (required && v.size() == 0) errors.add("\"" + key + "\" needs at least one entry");
        if (v.size() > max) errors.add("\"" + key + "\" can have at most " + max + " entries");
        Set<String> seen = new HashSet<>();
        for (JsonNode item : v) {
            if (!item.isTextual() || item.asText().isBlank()) { errors.add("\"" + key + "\" entries must be non-empty text"); continue; }
            if (item.asText().length() > itemMax) errors.add("\"" + key + "\" entries must be at most " + itemMax + " characters");
            if (allowed != null && !allowed.contains(item.asText())) errors.add("\"" + key + "\" entries must be one of: " + String.join(", ", allowed));
            if (!seen.add(item.asText())) errors.add("\"" + key + "\" has repeated entries");
        }
    }
}
