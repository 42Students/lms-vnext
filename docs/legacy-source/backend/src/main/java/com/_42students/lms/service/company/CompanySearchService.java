package com._42students.lms.service.company;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Strong company search (docs/companies/COMPANY-SEARCH-2026-10-13.md). One matcher for every way people type a company:
 * case, punctuation, "&" / "and", legal suffixes (Ltd, Pvt, Limited, Inc ...), word order, spacing ("TechMahindra"), typing in
 * progress ("infos"), typos ("Infosis", "Acenture"), acronyms ("TCS", "L&T"), well-known short names, aliases 42 keeps, and a website
 * or an email ("hr@infosys.com"). Results are ranked and say why they matched.
 *
 * The index is in memory (id, name, keys, tokens, acronym, aliases, domains, how many colleges use it), rebuilt at most once a
 * minute and at once when a company, alias or domain changes (invalidate()).
 */
@Service
@RequiredArgsConstructor
public class CompanySearchService {

    private final NamedParameterJdbcTemplate jdbc;

    static final Set<String> STOP = Set.of("and", "of", "the", "for", "a", "an", "in", "co");
    static final Pattern SUFFIX = Pattern.compile("\\s+(pvt|private|ltd|limited|llp|llc|inc|incorporated|corp|corporation|co|company|plc|gmbh|sa|ag|bv|pte|pty|india|technologies india)$");
    static final long TTL_MS = 60_000;

    /**
     * Short names people use that neither the name's initials nor a typo would find. Key: the short name as typed (normalised);
     * value: the company's name (normalised). Only applied when such a company exists. 42 adds the rest as aliases.
     */
    static final Map<String, List<String>> KNOWN = Map.ofEntries(
            Map.entry("tcs", List.of("tata consultancy services")),
            Map.entry("lt", List.of("larsen and toubro", "l and t", "lti mindtree", "ltimindtree", "larsen and toubro infotech")),
            Map.entry("lti", List.of("lti mindtree", "ltimindtree", "larsen and toubro infotech")),
            Map.entry("ltts", List.of("l and t technology services", "larsen and toubro technology services")),
            Map.entry("hcl", List.of("hcl technologies", "hcltech", "hcl tech")),
            Map.entry("hcltech", List.of("hcl technologies")),
            Map.entry("ibm", List.of("international business machines")),
            Map.entry("cts", List.of("cognizant technology solutions", "cognizant")),
            Map.entry("cognizant", List.of("cognizant technology solutions")),
            Map.entry("infy", List.of("infosys")),
            Map.entry("wipro", List.of("wipro technologies")),
            Map.entry("techm", List.of("tech mahindra")),
            Map.entry("mphasis", List.of("mphasis")),
            Map.entry("ey", List.of("ernst and young", "ernst young")),
            Map.entry("pwc", List.of("pricewaterhousecoopers", "price waterhouse coopers")),
            Map.entry("kpmg", List.of("klynveld peat marwick goerdeler")),
            Map.entry("jpmc", List.of("jpmorgan chase", "jp morgan chase")),
            Map.entry("jpmorgan", List.of("jpmorgan chase", "jp morgan chase")),
            Map.entry("gs", List.of("goldman sachs")),
            Map.entry("ms", List.of("morgan stanley", "microsoft")),
            Map.entry("aws", List.of("amazon web services", "amazon")),
            Map.entry("bofa", List.of("bank of america")),
            Map.entry("sbi", List.of("state bank of india")),
            Map.entry("hdfc", List.of("hdfc bank")),
            Map.entry("icici", List.of("icici bank")),
            Map.entry("drdo", List.of("defence research and development organisation", "defence research and development organization")),
            Map.entry("isro", List.of("indian space research organisation", "indian space research organization")),
            Map.entry("bhel", List.of("bharat heavy electricals")),
            Map.entry("ongc", List.of("oil and natural gas corporation")),
            Map.entry("zs", List.of("zs associates")),
            Map.entry("ge", List.of("general electric")),
            Map.entry("hp", List.of("hewlett packard", "hewlett packard enterprise")),
            Map.entry("hpe", List.of("hewlett packard enterprise")));

    /** One company in the index. */
    record Entry(Integer id, String name, String logoUrl, String key, String compact, List<String> tokens, String acronym,
                 Map<String, String> aliases, List<String> domains, boolean verified, int colleges) { }

    /** A scored hit: the company, how well it matched, why, and whether it was a near spelling. */
    public record Hit(Integer id, String name, String logoUrl, List<String> domains, boolean verifiedBy42, int colleges, int score, String reason, boolean fuzzy) { }

    private volatile List<Entry> index = List.of();
    private volatile long builtAt = 0;
    private volatile Map<String, Integer> byKey = Map.of();

    public void invalidate() {
        builtAt = 0;
    }

    // ------------------------------------------------------------------------------------------------ normalising

    /** Lower case, "&" as "and", no punctuation, single spaces, no trailing legal suffix (repeatedly: "Pvt Ltd"). */
    public static String norm(String s) {
        if (s == null) return "";
        String k = s.toLowerCase(Locale.ROOT).replace("&amp;", "&").replace("&", " and ").replace("+", " plus ")
                .replaceAll("[^a-z0-9 ]", " ").replaceAll("\\s+", " ").trim();
        String prev;
        do {
            prev = k;
            k = SUFFIX.matcher(k).replaceAll("").trim();
        } while (!k.equals(prev) && !k.isEmpty());
        return k.isEmpty() ? s.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "") : k;
    }

    static List<String> tokens(String normalised) {
        if (normalised.isBlank()) return List.of();
        return Arrays.asList(normalised.split(" "));
    }

    /** Initials of the words that matter: "Tata Consultancy Services" -> "tcs", "Larsen & Toubro" -> "lt". */
    static String acronym(List<String> tokens) {
        StringBuilder b = new StringBuilder();
        for (String t : tokens) if (!STOP.contains(t) && !t.isEmpty()) b.append(t.charAt(0));
        return b.toString();
    }

    /** The words without spaces or stop words: "L & T" -> "lt", "Tech Mahindra" -> "techmahindra". */
    static String compact(List<String> tokens) {
        StringBuilder b = new StringBuilder();
        for (String t : tokens) if (!STOP.contains(t)) b.append(t);
        return b.toString();
    }

    // ------------------------------------------------------------------------------------------------ the index

    private List<Entry> entries() {
        if (System.currentTimeMillis() - builtAt < TTL_MS && !index.isEmpty()) return index;
        synchronized (this) {
            if (System.currentTimeMillis() - builtAt < TTL_MS && !index.isEmpty()) return index;
            Map<Integer, Map<String, String>> aliases = new HashMap<>();
            for (Map<String, Object> a : jdbc.queryForList("SELECT company_id, alias FROM company_alias", new MapSqlParameterSource())) {
                String alias = String.valueOf(a.get("alias"));
                aliases.computeIfAbsent(((Number) a.get("company_id")).intValue(), k -> new LinkedHashMap<>()).put(norm(alias), alias);
            }
            Map<Integer, List<String>> domains = new HashMap<>();
            for (Map<String, Object> d : jdbc.queryForList("SELECT company_id, domain FROM company_domain ORDER BY id", new MapSqlParameterSource())) {
                domains.computeIfAbsent(((Number) d.get("company_id")).intValue(), k -> new ArrayList<>()).add(String.valueOf(d.get("domain")));
            }
            Map<Integer, Integer> colleges = new HashMap<>();
            for (Map<String, Object> c : jdbc.queryForList("SELECT company_id, COUNT(*) AS n FROM college_company WHERE is_deleted = 0 GROUP BY company_id", new MapSqlParameterSource())) {
                colleges.put(((Number) c.get("company_id")).intValue(), ((Number) c.get("n")).intValue());
            }
            List<Entry> out = new ArrayList<>();
            Map<String, Integer> keys = new HashMap<>();
            for (Map<String, Object> c : jdbc.queryForList("SELECT id, name, logo_url AS logoUrl, verified_by_42 AS verified FROM company " +
                    "WHERE (is_deleted = 0 OR is_deleted IS NULL) AND merged_into_company_id IS NULL", new MapSqlParameterSource())) {
                int id = ((Number) c.get("id")).intValue();
                String name = String.valueOf(c.get("name"));
                String key = norm(name);
                List<String> tk = tokens(key);
                boolean verified = c.get("verified") instanceof Boolean b ? b : c.get("verified") instanceof Number n && n.intValue() != 0;
                out.add(new Entry(id, name, (String) c.get("logoUrl"), key, compact(tk), tk, acronym(tk), aliases.getOrDefault(id, Map.of()),
                        domains.getOrDefault(id, List.of()), verified, colleges.getOrDefault(id, 0)));
                // A verified company wins the key when two share it.
                keys.merge(key, id, (a, b) -> a);
            }
            index = Collections.unmodifiableList(out);
            byKey = keys;
            builtAt = System.currentTimeMillis();
            return index;
        }
    }

    // ------------------------------------------------------------------------------------------------ searching

    /** Ranked companies for what was typed; domainHit is the company a typed website or email belongs to (or null). */
    public List<Hit> search(String q, Integer domainHit, int limit) {
        String typed = q == null ? "" : q.trim();
        String nq = norm(typed);
        List<String> qt = tokens(nq);
        String qCompact = compact(qt);
        // "infos" while typing: the last word may be half typed.
        Set<String> expansions = new LinkedHashSet<>(KNOWN.getOrDefault(qCompact, List.of()));
        List<Hit> hits = new ArrayList<>();
        for (Entry e : entries()) {
            Scored s = domainHit != null && domainHit.equals(e.id()) ? new Scored(1000, "Matched " + matchedDomain(e, typed), false) : score(e, nq, qt, qCompact, expansions);
            if (s == null) continue;
            int boost = (e.verified() ? 6 : 0) + Math.min(e.colleges(), 5);
            String reason = SHORT_NAME.equals(s.reason) ? "Short name: " + shortAsTyped(typed) : s.reason;
            hits.add(new Hit(e.id(), e.name(), e.logoUrl(), e.domains(), e.verified(), e.colleges(), s.score + boost, reason, s.fuzzy));
        }
        hits.sort((a, b) -> b.score() != a.score() ? Integer.compare(b.score(), a.score()) : a.name().compareToIgnoreCase(b.name()));
        return hits.size() > limit ? new ArrayList<>(hits.subList(0, limit)) : hits;
    }

    /** The one existing company this name certainly is (same name, an alias, or a known short name), or null. */
    public Hit sameCompany(String name) {
        String nq = norm(name);
        if (nq.isBlank()) return null;
        List<String> qt = tokens(nq);
        String qc = compact(qt);
        for (Hit h : search(name, null, 5)) {
            Entry e = entries().stream().filter(x -> x.id().equals(h.id())).findFirst().orElse(null);
            if (e == null) continue;
            if (e.key().equals(nq) || e.compact().equals(qc) || e.aliases().containsKey(nq) || KNOWN.getOrDefault(qc, List.of()).contains(e.key())) return h;
        }
        return null;
    }

    /** The key a name is indexed under, and whether some company has it (for Engage names that were never added). */
    public boolean known(String name) {
        entries();
        String k = norm(name);
        if (byKey.containsKey(k)) return true;
        for (Entry e : index) if (e.aliases().containsKey(k)) return true;
        return false;
    }

    /**
     * Names this college already uses (Engage contacts, old drives without a company) that match what was typed and are not a company
     * on 42's list: so a company the cell has been talking to is one click from being added.
     */
    public List<String> engageNames(Integer collegeId, String q, int limit) {
        String nq = norm(q);
        List<String> qt = tokens(nq);
        String qc = compact(qt);
        Set<String> expansions = new LinkedHashSet<>(KNOWN.getOrDefault(qc, List.of()));
        Map<String, String> seen = new LinkedHashMap<>();
        for (String n : jdbc.queryForList("SELECT DISTINCT TRIM(company_name) FROM recruiter_lead WHERE college_id = :c AND company_name IS NOT NULL AND TRIM(company_name) <> '' " +
                "UNION SELECT DISTINCT TRIM(company_name) FROM job WHERE college_id = :c AND company_id IS NULL AND company_name IS NOT NULL AND TRIM(company_name) <> '' " +
                "AND (is_deleted = 0 OR is_deleted IS NULL)", new MapSqlParameterSource("c", collegeId), String.class)) {
            String k = norm(n);
            if (seen.containsKey(k) || known(n)) continue;
            List<String> tk = tokens(k);
            Entry e = new Entry(null, n, null, k, compact(tk), tk, acronym(tk), Map.of(), List.of(), false, 0);
            if (score(e, nq, qt, qc, expansions) != null) seen.put(k, n);
            if (seen.size() >= limit) break;
        }
        return new ArrayList<>(seen.values());
    }

    private record Scored(int score, String reason, boolean fuzzy) { }

    /** Marks a short-name match; search() says it with the text as typed ("Short name: L&T", not the normalised "lt"). */
    static final String SHORT_NAME = "(short name)";

    /** "tcs" reads as "TCS"; anything longer or with spaces ("l and t") stays as typed. */
    static String shortAsTyped(String typed) {
        return typed.length() <= 5 && !typed.contains(" ") ? typed.toUpperCase(Locale.ROOT) : typed;
    }

    /** How well one company matches; null when it doesn't. */
    static Scored score(Entry e, String nq, List<String> qt, String qCompact, Set<String> expansions) {
        if (nq.isEmpty()) return null;
        if (e.key().equals(nq) || e.compact().equals(qCompact)) return new Scored(100, null, false);
        for (Map.Entry<String, String> a : e.aliases().entrySet()) {
            if (a.getKey().equals(nq) || compact(tokens(a.getKey())).equals(qCompact)) return new Scored(97, "Also known as " + a.getValue(), false);
        }
        if (expansions.contains(e.key())) return new Scored(95, SHORT_NAME, false);
        if (qCompact.length() >= 2 && e.acronym().length() >= 2 && e.acronym().equals(qCompact)) return new Scored(93, SHORT_NAME, false);
        if (e.key().startsWith(nq) || e.compact().startsWith(qCompact)) return new Scored(88, null, false);
        for (Map.Entry<String, String> a : e.aliases().entrySet()) {
            if (a.getKey().startsWith(nq)) return new Scored(84, "Also known as " + a.getValue(), false);
        }
        // Every typed word starts some word of the name, in any order ("mahindra tech").
        if (allWordsPrefix(qt, e.tokens())) return new Scored(80, null, false);
        if (e.key().contains(nq) || (qCompact.length() >= 3 && e.compact().contains(qCompact))) return new Scored(68, null, false);
        if (qCompact.length() >= 2 && e.acronym().startsWith(qCompact) && qCompact.length() >= 3) return new Scored(62, null, false);
        // Near spellings: each typed word (3+ letters) is close to a word of the name, or to the start of one while typing.
        int dist = fuzzyDistance(qt, e.tokens());
        if (dist >= 0) return new Scored(58 - 6 * dist, "Did you mean " + e.name() + "?", true);
        // Run together and misspelt ("techmahindraa", "infosis"): the whole name without spaces, or its start while typing.
        if (qCompact.length() >= 5) {
            int max = allowed(qCompact.length());
            int whole = bounded(qCompact, e.compact(), max);
            int start = e.compact().length() > qCompact.length() ? bounded(qCompact, e.compact().substring(0, qCompact.length()), max) : -1;
            int best = whole < 0 ? start : start < 0 ? whole : Math.min(whole, start);
            if (best >= 0) return new Scored(54 - 6 * best, "Did you mean " + e.name() + "?", true);
        }
        return null;
    }

    static boolean allWordsPrefix(List<String> qt, List<String> nt) {
        List<String> words = new ArrayList<>();
        for (String t : qt) if (!STOP.contains(t)) words.add(t);
        if (words.isEmpty()) return false;
        Set<Integer> used = new HashSet<>();
        for (String w : words) {
            boolean found = false;
            for (int i = 0; i < nt.size(); i++) {
                if (!used.contains(i) && nt.get(i).startsWith(w)) { used.add(i); found = true; break; }
            }
            if (!found) return false;
        }
        return true;
    }

    /** Total edits to match every typed word to a word of the name (or its start), or -1 when one is too far. */
    static int fuzzyDistance(List<String> qt, List<String> nt) {
        int total = 0;
        int counted = 0;
        Set<Integer> used = new HashSet<>();
        for (String w : qt) {
            if (STOP.contains(w)) continue;
            if (w.length() < 3) return -1;
            int best = -1;
            int bestIdx = -1;
            int max = allowed(w.length());
            for (int i = 0; i < nt.size(); i++) {
                if (used.contains(i)) continue;
                String n = nt.get(i);
                int d = bounded(w, n, max);
                // Half typed: compare with the start of the word, one letter longer than typed.
                if (n.length() > w.length() + 1) {
                    int dp = bounded(w, n.substring(0, w.length()), max);
                    if (dp >= 0 && (d < 0 || dp < d)) d = dp;
                }
                if (d >= 0 && (best < 0 || d < best)) { best = d; bestIdx = i; }
            }
            if (best < 0) return -1;
            used.add(bestIdx);
            total += best;
            counted++;
        }
        return counted == 0 ? -1 : total;
    }

    static int allowed(int length) {
        return length <= 4 ? 1 : length <= 7 ? 2 : 3;
    }

    /** Damerau-Levenshtein (adjacent swaps count once) with a cap; -1 when over the cap. */
    static int bounded(String a, String b, int max) {
        if (Math.abs(a.length() - b.length()) > max) return -1;
        int[][] d = new int[a.length() + 1][b.length() + 1];
        for (int i = 0; i <= a.length(); i++) d[i][0] = i;
        for (int j = 0; j <= b.length(); j++) d[0][j] = j;
        for (int i = 1; i <= a.length(); i++) {
            int rowMin = Integer.MAX_VALUE;
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                int v = Math.min(Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1), d[i - 1][j - 1] + cost);
                if (i > 1 && j > 1 && a.charAt(i - 1) == b.charAt(j - 2) && a.charAt(i - 2) == b.charAt(j - 1)) v = Math.min(v, d[i - 2][j - 2] + 1);
                d[i][j] = v;
                rowMin = Math.min(rowMin, v);
            }
            if (rowMin > max) return -1;
        }
        int r = d[a.length()][b.length()];
        return r > max ? -1 : r;
    }

    private static String matchedDomain(Entry e, String typed) {
        String t = typed.toLowerCase(Locale.ROOT);
        for (String d : e.domains()) if (t.endsWith(d) || t.contains(d)) return d;
        return e.domains().isEmpty() ? "its website" : e.domains().get(0);
    }
}
