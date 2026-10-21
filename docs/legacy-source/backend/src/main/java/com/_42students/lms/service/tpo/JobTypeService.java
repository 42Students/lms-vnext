package com._42students.lms.service.tpo;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * A college's job types (TPO notes item 15): the five built-in types (JobTypes), which a college can hide but never rename
 * or re-answer, plus its own types, each with one answer: does an offer of this type count as placed? Kept in
 * tpo_college_settings.job_types_json. The drive form, filters and reports read this list (one source: /api/v1/choices);
 * each drive carries its type's answer in job.counts_as_placed.
 */
@Service
@RequiredArgsConstructor
public class JobTypeService {

    public static final int MAX_CUSTOM = 30;
    private static final ObjectMapper OM = new ObjectMapper();
    private static final java.util.regex.Pattern NAME = java.util.regex.Pattern.compile("[\\p{L}\\p{N} +&/().,'-]{2,40}");

    private final NamedParameterJdbcTemplate jdbc;
    private final TpoSettingsHubService settingsHub;
    private final TpoAuditService audit;

    public record Type(String id, String name, boolean builtin, boolean countsAsPlaced, boolean hidden) {
        public Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", id); m.put("name", name); m.put("builtin", builtin); m.put("countsAsPlaced", countsAsPlaced); m.put("hidden", hidden);
            return m;
        }
    }

    private record Stored(Set<String> hidden, List<Map<String, Object>> custom) {}

    @SuppressWarnings("unchecked")
    private Stored read(Integer collegeId) {
        List<String> raw = jdbc.queryForList("SELECT job_types_json FROM tpo_college_settings WHERE college_id = :c", new MapSqlParameterSource("c", collegeId), String.class);
        Set<String> hidden = new LinkedHashSet<>();
        List<Map<String, Object>> custom = new ArrayList<>();
        if (!raw.isEmpty() && raw.get(0) != null) {
            try {
                Map<String, Object> m = OM.readValue(raw.get(0), Map.class);
                if (m.get("hidden") instanceof List<?> h) h.forEach(x -> hidden.add(String.valueOf(x)));
                if (m.get("custom") instanceof List<?> c) c.forEach(x -> { if (x instanceof Map<?, ?> t) custom.add((Map<String, Object>) t); });
            } catch (Exception ignored) { /* a bad value reads as "nothing changed" */ }
        }
        return new Stored(hidden, custom);
    }

    /** Built-in types first (fixed order), then the college's own, hidden ones included. */
    public List<Type> all(Integer collegeId) {
        List<Type> out = new ArrayList<>();
        if (collegeId == null) {
            for (String t : JobTypes.ALL) out.add(new Type(null, t, true, JobTypes.BUILTIN_COUNTS_AS_PLACED.get(t), false));
            return out;
        }
        Stored s = read(collegeId);
        for (String t : JobTypes.ALL) out.add(new Type(null, t, true, JobTypes.BUILTIN_COUNTS_AS_PLACED.get(t), s.hidden().contains(t)));
        for (Map<String, Object> c : s.custom()) {
            out.add(new Type(String.valueOf(c.get("id")), String.valueOf(c.get("name")), false, !Boolean.FALSE.equals(c.get("countsAsPlaced")), Boolean.TRUE.equals(c.get("hidden"))));
        }
        return out;
    }

    /** What a new drive can pick. */
    public List<Type> visible(Integer collegeId) {
        return all(collegeId).stream().filter(t -> !t.hidden()).toList();
    }

    /** Settings: every type with how many drives use it. */
    public List<Map<String, Object>> list(Integer collegeId) {
        Map<String, Long> used = new HashMap<>();
        jdbc.query("SELECT job_type AS t, COUNT(*) AS n FROM job WHERE college_id = :c AND (is_deleted = 0 OR is_deleted IS NULL) AND job_type IS NOT NULL GROUP BY job_type",
                new MapSqlParameterSource("c", collegeId), rs -> { used.put(rs.getString("t").toLowerCase(Locale.ROOT), rs.getLong("n")); });
        List<Map<String, Object>> out = new ArrayList<>();
        for (Type t : all(collegeId)) {
            Map<String, Object> m = t.toMap();
            m.put("drives", used.getOrDefault(t.name().toLowerCase(Locale.ROOT), 0L));
            out.add(m);
        }
        return out;
    }

    /**
     * The type's name as the college spells it, for a drive being saved. A hidden (or older, unlisted) type is refused for a
     * new choice but kept on a drive that already has it. Blank gives null; anything else unknown is refused with the list.
     */
    public String normalize(Integer collegeId, String raw, String current) {
        if (raw == null || raw.isBlank()) return null;
        String want = raw.trim();
        // A drive keeps the type it has, even one switched off since or written by an older page.
        if (current != null && current.trim().equalsIgnoreCase(want)) return current;
        for (Type t : all(collegeId)) {
            if (!t.name().equalsIgnoreCase(want)) continue;
            if (t.hidden() && (current == null || !current.equalsIgnoreCase(t.name()))) {
                throw new IllegalArgumentException(t.name() + " is switched off in Settings > Job types");
            }
            return t.name();
        }
        throw new IllegalArgumentException("Job type must be one of " + String.join(", ", visible(collegeId).stream().map(Type::name).toList()));
    }

    /** Whether offers of this type count as placed (unknown types count, like before types existed). */
    public boolean countsAsPlaced(Integer collegeId, String name) {
        Boolean builtin = JobTypes.builtinCountsAsPlaced(name);
        if (builtin != null) return builtin;
        if (name == null) return true;
        return all(collegeId).stream().filter(t -> t.name().equalsIgnoreCase(name.trim())).findFirst().map(Type::countsAsPlaced).orElse(true);
    }

    /**
     * Saves the whole list. Built-in types: only "hidden" is read. The college's own types: new ones (no id) are added,
     * a renamed one renames its drives, a changed answer is applied to its drives, a removed one must not be in use (hide
     * it instead). At least one type stays switched on.
     */
    @Transactional
    public List<Map<String, Object>> save(Integer collegeId, List<Map<String, Object>> in, Integer actorId) {
        if (in == null) throw new IllegalArgumentException("Send the list of job types");
        Map<String, Type> before = new LinkedHashMap<>();
        for (Type t : all(collegeId)) if (!t.builtin()) before.put(t.id(), t);
        Set<String> hidden = new LinkedHashSet<>();
        List<Map<String, Object>> custom = new ArrayList<>();
        Set<String> names = new HashSet<>();
        for (String b : JobTypes.ALL) names.add(b.toLowerCase(Locale.ROOT));
        Set<String> kept = new HashSet<>();
        for (Map<String, Object> t : in) {
            String name = t.get("name") == null ? "" : String.valueOf(t.get("name")).trim().replaceAll("\\s+", " ");
            boolean isHidden = Boolean.TRUE.equals(t.get("hidden"));
            Boolean builtin = JobTypes.builtinCountsAsPlaced(name);
            if (Boolean.TRUE.equals(t.get("builtin"))) {
                if (builtin == null) throw new IllegalArgumentException("A built-in job type can't be renamed");
                if (isHidden) hidden.add(JobTypes.ALL.stream().filter(b -> b.equalsIgnoreCase(name)).findFirst().orElse(name));
                continue;
            }
            if (!NAME.matcher(name).matches()) throw new IllegalArgumentException("\"" + name + "\": a job type name is 2-40 letters, digits or simple punctuation");
            if (!names.add(name.toLowerCase(Locale.ROOT))) throw new IllegalArgumentException("\"" + name + "\" is already a job type");
            if (!(t.get("countsAsPlaced") instanceof Boolean counts)) throw new IllegalArgumentException("Say whether an offer of \"" + name + "\" counts as placed");
            String id = t.get("id") == null || String.valueOf(t.get("id")).isBlank() ? UUID.randomUUID().toString().substring(0, 8) : String.valueOf(t.get("id"));
            if (t.get("id") != null && !before.containsKey(id)) throw new IllegalArgumentException("Not found");
            kept.add(id);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", id); m.put("name", name); m.put("countsAsPlaced", counts); m.put("hidden", isHidden);
            custom.add(m);
        }
        if (custom.size() > MAX_CUSTOM) throw new IllegalArgumentException("Up to " + MAX_CUSTOM + " job types of your own");
        if (hidden.size() == JobTypes.ALL.size() && custom.stream().allMatch(m -> Boolean.TRUE.equals(m.get("hidden")))) {
            throw new IllegalArgumentException("Keep at least one job type switched on");
        }
        MapSqlParameterSource c = new MapSqlParameterSource("c", collegeId);
        for (Type old : before.values()) {
            if (kept.contains(old.id())) continue;
            Long n = jdbc.queryForObject("SELECT COUNT(*) FROM job WHERE college_id = :c AND job_type = :t AND (is_deleted = 0 OR is_deleted IS NULL)", new MapSqlParameterSource("c", collegeId).addValue("t", old.name()), Long.class);
            if (n != null && n > 0) throw new IllegalArgumentException("\"" + old.name() + "\" is used by " + n + (n == 1 ? " drive" : " drives") + ": switch it off instead of deleting it");
        }
        for (Map<String, Object> m : custom) {
            Type old = before.get(String.valueOf(m.get("id")));
            if (old == null) continue;
            String name = String.valueOf(m.get("name"));
            boolean counts = (Boolean) m.get("countsAsPlaced");
            if (!old.name().equals(name)) {
                jdbc.update("UPDATE job SET job_type = :n WHERE college_id = :c AND job_type = :o", new MapSqlParameterSource("c", collegeId).addValue("n", name).addValue("o", old.name()));
            }
            if (old.countsAsPlaced() != counts) {
                jdbc.update("UPDATE job SET counts_as_placed = :p WHERE college_id = :c AND job_type = :n", new MapSqlParameterSource("c", collegeId).addValue("p", counts ? 1 : 0).addValue("n", name));
            }
        }
        String json;
        try { json = OM.writeValueAsString(Map.of("hidden", new ArrayList<>(hidden), "custom", custom)); } catch (Exception e) { throw new IllegalArgumentException("Job types are not valid"); }
        ensureSettingsRow(collegeId, actorId);
        jdbc.update("UPDATE tpo_college_settings SET job_types_json = :j WHERE college_id = :c", c.addValue("j", json));
        audit.log(collegeId, "TPO", actorId, "JOB_TYPES_UPDATED", "SETTINGS", null, custom.size() + (custom.size() == 1 ? " type of your own, " : " types of your own, ") + hidden.size() + " built-in switched off");
        return list(collegeId);
    }

    /** A college that never saved settings has no row; create it with the usual defaults so templates are not lost. */
    void ensureSettingsRow(Integer collegeId, Integer actorId) {
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM tpo_college_settings WHERE college_id = :c", new MapSqlParameterSource("c", collegeId), Long.class);
        if (n == null || n == 0) settingsHub.saveCollege(collegeId, new HashMap<>(), actorId);
    }
}
