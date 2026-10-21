package com._42students.lms.service.tpo;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

/**
 * Import with preview (TPO V1 - Locked.docx §1 shared pieces, §5 Results staging). The browser reads the
 * Excel/CSV and sends plain rows; this class matches them to the drive's applicants and reports three
 * groups: Matched, Not in file, Unmatched. Matching order: 42LMS applicant ID (public_ref) -> company ID
 * (external_ref) -> email -> roll number. Phone is only ever a suggestion, never a match.
 */
@Service
@RequiredArgsConstructor
public class TpoImportService {

    private static final Set<String> INACTIVE = Set.of("REJECTED", "WITHDRAWN", "NOT_SELECTED");
    private static final Set<String> OUTCOMES = Set.of("PASS", "FAIL", "ABSENT", "HOLD");

    private final NamedParameterJdbcTemplate jdbc;
    private final TpoResultsService resultsService;
    private final TpoOfferService offerService;

    private static class Cand {
        int applicationId; int learnerId; String publicRef; String externalRef; String email; String roll; String phone;
        String name; String stage;
    }

    private List<Cand> candidates(Integer jobId) {
        List<Cand> out = new ArrayList<>();
        jdbc.query("SELECT a.id, a.learner_id, a.public_ref, a.external_ref, a.application_status, l.contact_mail, l.roll_number, " +
                        "l.contact_mobile, l.first_name, l.last_name FROM job_application a JOIN learner l ON l.id = a.learner_id " +
                        "WHERE a.job_id = :j AND (a.is_deleted = 0 OR a.is_deleted IS NULL)",
                new MapSqlParameterSource("j", jobId), rs -> {
                    Cand c = new Cand();
                    c.applicationId = rs.getInt("id"); c.learnerId = rs.getInt("learner_id");
                    c.publicRef = norm(rs.getString("public_ref")); c.externalRef = norm(rs.getString("external_ref"));
                    c.email = norm(rs.getString("contact_mail")); c.roll = norm(rs.getString("roll_number"));
                    c.phone = digits(rs.getString("contact_mobile"));
                    c.name = ((rs.getString("first_name") == null ? "" : rs.getString("first_name")) + " " +
                            (rs.getString("last_name") == null ? "" : rs.getString("last_name"))).trim();
                    c.stage = rs.getString("application_status");
                    out.add(c);
                });
        return out;
    }

    private static String norm(String s) { return s == null || s.isBlank() ? null : s.trim().toLowerCase(Locale.ROOT); }
    private static String digits(String s) {
        if (s == null) return null;
        String d = s.replaceAll("\\D", "");
        return d.length() > 10 ? d.substring(d.length() - 10) : (d.isEmpty() ? null : d);
    }
    private static String str(Map<String, Object> row, String k) { Object v = row.get(k); return v == null ? null : String.valueOf(v); }

    /** Returns the matched candidate, or null. Ambiguity (two candidates for the same key) counts as no match. */
    private Cand match(Map<String, Object> row, List<Cand> cands) {
        String[][] order = {{"applicantId", "publicRef"}, {"companyId", "externalRef"}, {"email", "email"}, {"roll", "roll"}};
        for (String[] o : order) {
            String v = norm(str(row, o[0]));
            if (v == null) continue;
            List<Cand> hits = new ArrayList<>();
            for (Cand c : cands) {
                String field = switch (o[1]) {
                    case "publicRef" -> c.publicRef; case "externalRef" -> c.externalRef;
                    case "email" -> c.email; default -> c.roll; };
                if (v.equals(field)) hits.add(c);
            }
            if (hits.size() == 1) return hits.get(0);
            if (hits.size() > 1) return null;
        }
        return null;
    }

    private List<Map<String, Object>> suggestions(Map<String, Object> row, List<Cand> cands, Set<Integer> taken) {
        String phone = digits(str(row, "phone"));
        List<Map<String, Object>> out = new ArrayList<>();
        if (phone == null) return out;
        for (Cand c : cands) {
            if (phone.equals(c.phone) && !taken.contains(c.applicationId)) {
                out.add(Map.of("applicationId", c.applicationId, "name", c.name, "roll", c.roll == null ? "" : c.roll));
            }
        }
        return out;
    }

    /** Preview for a results file. Nothing is written. */
    public Map<String, Object> previewResults(Integer jobId, List<Map<String, Object>> rows) {
        List<Cand> cands = candidates(jobId);
        List<Map<String, Object>> matched = new ArrayList<>();
        List<Map<String, Object>> unmatched = new ArrayList<>();
        Set<Integer> seen = new HashSet<>();
        for (int i = 0; i < rows.size(); i++) {
            Map<String, Object> row = rows.get(i);
            String outcome = str(row, "outcome") == null ? null : str(row, "outcome").toUpperCase(Locale.ROOT);
            Cand c = match(row, cands);
            if (outcome == null || !OUTCOMES.contains(outcome)) {
                unmatched.add(Map.of("row", i, "reason", "Result must be PASS, FAIL, HOLD or ABSENT", "data", row));
            } else if (c == null) {
                unmatched.add(Map.of("row", i, "reason", "No applicant matches this row", "data", row,
                        "suggestions", suggestions(row, cands, seen)));
            } else if (!seen.add(c.applicationId)) {
                unmatched.add(Map.of("row", i, "reason", "Applicant appears twice in the file", "data", row));
            } else {
                matched.add(Map.of("row", i, "applicationId", c.applicationId, "name", c.name, "stage", c.stage, "outcome", outcome));
            }
        }
        List<Map<String, Object>> notInFile = new ArrayList<>();
        for (Cand c : cands) {
            if (!seen.contains(c.applicationId) && !INACTIVE.contains(c.stage)) {
                notInFile.add(Map.of("applicationId", c.applicationId, "name", c.name, "roll", c.roll == null ? "" : c.roll, "stage", c.stage));
            }
        }
        return Map.of("matched", matched, "notInFile", notInFile, "unmatched", unmatched);
    }

    /**
     * Stages the matched rows. notInFileAction = NOT_CLEARED stages FAIL for applicants missing from the file;
     * LEAVE_PENDING (default) touches nobody. Unmatched rows block the commit unless the caller resolved them by
     * giving the row an applicationId, or dropped them from the request.
     */
    @Transactional
    public Map<String, Object> commitResults(Integer jobId, Long roundId, List<Map<String, Object>> rows,
                                              String notInFileAction, Integer actorId) {
        Map<String, Object> preview = previewResults(jobId, resolveExplicit(rows));
        @SuppressWarnings("unchecked") List<Map<String, Object>> unmatched = (List<Map<String, Object>>) preview.get("unmatched");
        if (!unmatched.isEmpty()) {
            throw new IllegalStateException(unmatched.size() + " row(s) are unmatched. Fix or remove them first.");
        }
        int staged = 0;
        @SuppressWarnings("unchecked") List<Map<String, Object>> matched = (List<Map<String, Object>>) preview.get("matched");
        List<Map<String, Object>> resolved = resolveExplicit(rows);
        for (Map<String, Object> m : matched) {
            Map<String, Object> row = resolved.get((Integer) m.get("row"));
            resultsService.stage(roundId, (Integer) m.get("applicationId"), (String) m.get("outcome"),
                    intOrNull(row.get("waitlistRank")), dblOrNull(row.get("score")), str(row, "reasonCategory"),
                    str(row, "comment"), "EXCEL", "FACULTY", actorId);
            staged++;
        }
        int notCleared = 0;
        if ("NOT_CLEARED".equalsIgnoreCase(notInFileAction)) {
            @SuppressWarnings("unchecked") List<Map<String, Object>> missing = (List<Map<String, Object>>) preview.get("notInFile");
            for (Map<String, Object> m : missing) {
                resultsService.stage(roundId, (Integer) m.get("applicationId"), "FAIL", null, null, null,
                        "Not in the results file", "EXCEL", "FACULTY", actorId);
                notCleared++;
            }
        }
        return Map.of("staged", staged, "notClearedFromMissing", notCleared);
    }

    /** A row the TPO resolved by hand carries applicationId; turn it into an applicantId-keyed row so the normal matcher accepts it. */
    private List<Map<String, Object>> resolveExplicit(List<Map<String, Object>> rows) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> r : rows) {
            Map<String, Object> copy = new HashMap<>(r);
            Object appId = r.get("applicationId");
            if (appId != null) {
                Integer id = Integer.valueOf(String.valueOf(appId));
                List<String> ref = jdbc.queryForList("SELECT public_ref FROM job_application WHERE id = :id",
                        new MapSqlParameterSource("id", id), String.class);
                if (!ref.isEmpty()) copy.put("applicantId", ref.get(0));
            }
            out.add(copy);
        }
        return out;
    }

    /** Preview for a company selection list; rows carry roleOption, ctcLpa, kind. */
    public Map<String, Object> previewSelections(Integer jobId, List<Map<String, Object>> rows) {
        List<Cand> cands = candidates(jobId);
        List<Map<String, Object>> matched = new ArrayList<>();
        List<Map<String, Object>> unmatched = new ArrayList<>();
        Set<Integer> seen = new HashSet<>();
        for (int i = 0; i < rows.size(); i++) {
            Map<String, Object> row = rows.get(i);
            Cand c = match(row, cands);
            if (c == null) {
                unmatched.add(Map.of("row", i, "reason", "No applicant matches this row", "data", row,
                        "suggestions", suggestions(row, cands, seen)));
            } else if (!seen.add(c.applicationId)) {
                unmatched.add(Map.of("row", i, "reason", "Applicant appears twice in the file", "data", row));
            } else {
                matched.add(Map.of("row", i, "applicationId", c.applicationId, "name", c.name, "stage", c.stage));
            }
        }
        return Map.of("matched", matched, "unmatched", unmatched);
    }

    @Transactional
    public int commitSelections(Integer jobId, List<Map<String, Object>> rows, Integer actorId) {
        List<Map<String, Object>> resolved = resolveExplicit(rows);
        Map<String, Object> preview = previewSelections(jobId, resolved);
        @SuppressWarnings("unchecked") List<Map<String, Object>> unmatched = (List<Map<String, Object>>) preview.get("unmatched");
        if (!unmatched.isEmpty()) throw new IllegalStateException(unmatched.size() + " row(s) are unmatched. Fix or remove them first.");
        @SuppressWarnings("unchecked") List<Map<String, Object>> matched = (List<Map<String, Object>>) preview.get("matched");
        int n = 0;
        for (Map<String, Object> m : matched) {
            Map<String, Object> row = resolved.get((Integer) m.get("row"));
            BigDecimal ctc = row.get("ctcLpa") == null || String.valueOf(row.get("ctcLpa")).isBlank() ? null : new BigDecimal(String.valueOf(row.get("ctcLpa")));
            String kind = "LOI".equalsIgnoreCase(str(row, "kind")) ? "LOI" : "OFFER";
            try {
                offerService.recordSelection((Integer) m.get("applicationId"), str(row, "roleOption"), ctc, kind, actorId, "TPO");
                n++;
            } catch (IllegalStateException alreadyOrOut) {
                // already holds an offer on this drive, or no longer in play: that row is left out, the rest are recorded
            }
        }
        return n;
    }

    private static Integer intOrNull(Object o) {
        try { return o == null || String.valueOf(o).isBlank() ? null : Integer.valueOf(String.valueOf(o).replaceAll("\\.0+$", "")); }
        catch (NumberFormatException e) { return null; }
    }
    private static Double dblOrNull(Object o) {
        try { return o == null || String.valueOf(o).isBlank() ? null : Double.valueOf(String.valueOf(o)); }
        catch (NumberFormatException e) { return null; }
    }
}
