package com._42students.lms.common;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * The coding platforms a student can list on their profile. A profile is stored as the username only; the link is built from
 * {@link Platform#url}. A pasted profile link is accepted and reduced to its username, so "https://leetcode.com/u/asha_k/" and
 * "asha_k" save the same thing.
 */
public final class CodingPlatforms {
    private CodingPlatforms() {}

    public record Platform(String key, String label, String host, String pathPrefix, Pattern username, String hint) {
        public String url(String user) { return "https://" + host + pathPrefix + user; }
        public Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("key", key); m.put("label", label); m.put("urlPrefix", "https://" + host + pathPrefix); m.put("pattern", username.pattern()); m.put("hint", hint);
            return m;
        }
    }

    public static final List<Platform> ALL = List.of(
            new Platform("LEETCODE", "LeetCode", "leetcode.com", "/u/", Pattern.compile("[A-Za-z0-9_-]{3,30}"), "3-30 letters, digits, _ or -"),
            new Platform("HACKERRANK", "HackerRank", "www.hackerrank.com", "/profile/", Pattern.compile("[A-Za-z0-9_.-]{3,30}"), "3-30 letters, digits, _ . or -"),
            new Platform("CODECHEF", "CodeChef", "www.codechef.com", "/users/", Pattern.compile("[A-Za-z][A-Za-z0-9_]{2,19}"), "starts with a letter, 3-20 letters, digits or _"),
            new Platform("CODEFORCES", "Codeforces", "codeforces.com", "/profile/", Pattern.compile("[A-Za-z0-9_.-]{3,24}"), "3-24 letters, digits, _ . or -"),
            new Platform("GFG", "GeeksforGeeks", "www.geeksforgeeks.org", "/user/", Pattern.compile("[A-Za-z0-9_.-]{3,40}"), "3-40 letters, digits, _ . or -"),
            new Platform("HACKEREARTH", "HackerEarth", "www.hackerearth.com", "/@", Pattern.compile("[A-Za-z0-9_.-]{3,40}"), "3-40 letters, digits, _ . or -"));

    public static Platform byKey(String key) {
        if (key == null) return null;
        for (Platform p : ALL) if (p.key().equalsIgnoreCase(key.trim())) return p;
        return null;
    }

    private static final Pattern LINK = Pattern.compile("^(?:https?://)?([^/?#]+)(.*)$", Pattern.CASE_INSENSITIVE);

    private static String bareHost(String host) {
        String h = host.toLowerCase(Locale.ROOT);
        return h.startsWith("www.") ? h.substring(4) : h;
    }

    /** The username from what the student typed (a username or the platform's profile link); throws with a plain sentence when it is neither. */
    public static String username(Platform p, String raw) {
        String v = raw == null ? "" : raw.trim();
        if (v.isEmpty()) return null;
        if (v.contains("/") || v.toLowerCase(Locale.ROOT).contains(bareHost(p.host()))) {
            Matcher m = LINK.matcher(v);
            if (!m.matches() || !bareHost(m.group(1)).equals(bareHost(p.host()))) {
                throw new IllegalArgumentException(p.label() + ": that link is not a " + p.label() + " profile. Type your username instead.");
            }
            String path = m.group(2) == null ? "" : m.group(2);
            path = path.replaceAll("[?#].*$", "").replaceAll("/+$", "");
            String[] parts = path.split("/");
            v = parts.length == 0 ? "" : parts[parts.length - 1];
            if (v.startsWith("@")) v = v.substring(1);
        }
        if (!p.username().matcher(v).matches()) {
            throw new IllegalArgumentException(p.label() + " username \"" + v + "\" does not look right (" + p.hint() + ").");
        }
        return v;
    }

    /** Checks and normalises a whole map {platformKey: username or link}; blanks are dropped, unknown platforms refused. */
    public static Map<String, String> normalize(Map<String, String> in) {
        Map<String, String> out = new LinkedHashMap<>();
        if (in == null) return out;
        for (Map.Entry<String, String> e : in.entrySet()) {
            Platform p = byKey(e.getKey());
            if (p == null) throw new IllegalArgumentException("Unknown coding platform: " + e.getKey());
            String u = username(p, e.getValue());
            if (u != null) out.put(p.key(), u);
        }
        return out;
    }

    /** [{ key, label, username, url }] in platform order, for display. */
    public static List<Map<String, Object>> describe(Map<String, String> profiles) {
        List<Map<String, Object>> out = new java.util.ArrayList<>();
        if (profiles == null) return out;
        for (Platform p : ALL) {
            String u = profiles.get(p.key());
            if (u == null || u.isBlank()) continue;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("key", p.key()); m.put("label", p.label()); m.put("username", u); m.put("url", p.url(u));
            out.add(m);
        }
        return out;
    }
}
