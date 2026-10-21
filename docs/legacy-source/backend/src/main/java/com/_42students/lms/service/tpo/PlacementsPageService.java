package com._42students.lms.service.tpo;

import com._42students.lms.model.tpo.RecruiterLead;
import com._42students.lms.service.company.CompanyDomainService;
import com._42students.lms.util.InputSanitizer;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * A college's placements web page on its own address (D2 default). The college switches it on, writes about its placements and
 * picks which live numbers show; any number built on fewer than {@link #MIN_GROUP} students or offers is hidden, so no one can
 * be picked out. "Recruit from us" takes a code-proven company email and lands as a recruiter lead in Engage.
 */
@Service
@RequiredArgsConstructor
public class PlacementsPageService {

    public static final int MIN_GROUP = 5;
    /** The numbers a college can show, in page order. */
    public static final List<String> NUMBERS = List.of("STUDENTS", "PLACED", "PLACED_PERCENT", "OFFERS", "COMPANIES", "HIGHEST_CTC", "MEDIAN_CTC");
    public static final Map<String, String> LABELS = Map.of("STUDENTS", "Students in placements", "PLACED", "Students placed", "PLACED_PERCENT", "Placed",
            "OFFERS", "Offers", "COMPANIES", "Companies that hired", "HIGHEST_CTC", "Highest CTC", "MEDIAN_CTC", "Median CTC");
    private static final ObjectMapper OM = new ObjectMapper();

    private final NamedParameterJdbcTemplate jdbc;
    private final PlacementEligibilityService placementEligibility;
    private final CompanyDomainService domainService;
    private final RecruiterInviteCodeService codeService;
    private final TpoRecruiterLeadService recruiterLeads;
    private final TpoAuditService audit;

    // ---------------------------------------------------------------- the placement cell's side

    public Map<String, Object> settings(Integer collegeId) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT enabled, about, numbers_json FROM college_placements_page WHERE college_id = :c",
                new MapSqlParameterSource("c", collegeId));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("enabled", !rows.isEmpty() && truthy(rows.get(0).get("enabled")));
        out.put("about", rows.isEmpty() ? null : rows.get(0).get("about"));
        out.put("numbers", rows.isEmpty() ? List.of("STUDENTS", "PLACED", "COMPANIES") : readNumbers(rows.get(0).get("numbers_json")));
        out.put("available", NUMBERS.stream().map(n -> Map.of("value", n, "label", LABELS.get(n))).toList());
        out.put("preview", numbers(collegeId, NUMBERS));
        return out;
    }

    @Transactional
    public Map<String, Object> save(Integer collegeId, Boolean enabled, String about, List<String> numbers, Integer facultyId) {
        Map<String, Object> cur = settings(collegeId);
        List<String> chosen = new ArrayList<>();
        @SuppressWarnings("unchecked") List<String> base = numbers != null ? numbers : (List<String>) cur.get("numbers");
        for (String n : base) if (NUMBERS.contains(n) && !chosen.contains(n)) chosen.add(n);
        String a = about != null ? clean(about, 4000) : (String) cur.get("about");
        String json;
        try { json = OM.writeValueAsString(chosen); } catch (Exception e) { throw new IllegalArgumentException("Numbers are not valid"); }
        boolean on = enabled != null ? enabled : Boolean.TRUE.equals(cur.get("enabled"));
        jdbc.update("INSERT INTO college_placements_page (college_id, enabled, about, numbers_json, updated_at, updated_by_faculty_id) VALUES (:c, :e, :a, :n, NOW(), :f) " +
                "ON DUPLICATE KEY UPDATE enabled = VALUES(enabled), about = VALUES(about), numbers_json = VALUES(numbers_json), updated_at = NOW(), updated_by_faculty_id = VALUES(updated_by_faculty_id)",
                new MapSqlParameterSource("c", collegeId).addValue("e", on ? 1 : 0).addValue("a", a).addValue("n", json).addValue("f", facultyId));
        return settings(collegeId);
    }

    // ---------------------------------------------------------------- the public page

    /** The page for this college, or null when the college has not switched it on. */
    public Map<String, Object> page(Integer collegeId, String collegeName) {
        Map<String, Object> s = settings(collegeId);
        if (!Boolean.TRUE.equals(s.get("enabled"))) return null;
        @SuppressWarnings("unchecked") List<String> chosen = (List<String>) s.get("numbers");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("collegeName", collegeName);
        out.put("about", s.get("about"));
        out.put("numbers", numbers(collegeId, chosen));
        return out;
    }

    /** Live numbers over the last 12 months, in the chosen order; any built on fewer than MIN_GROUP is left out. */
    public List<Map<String, Object>> numbers(Integer collegeId, List<String> chosen) {
        long students = placementEligibility.resolveCollege(collegeId).values().stream().filter(r -> PlacementEligibilityService.ELIGIBLE.equals(r.status)).count();
        MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId);
        String offersFrom = "FROM job_offer o JOIN job_application a ON a.id = o.application_id JOIN job j ON j.id = a.job_id " +
                "WHERE j.college_id = :c AND o.status IN ('RELEASED','ACCEPTED') AND o.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH) ";
        Map<String, Object> f = jdbc.queryForMap("SELECT COUNT(*) AS offers, COUNT(DISTINCT CASE WHEN o.status = 'ACCEPTED' THEN a.learner_id END) AS placed, " +
                "COUNT(DISTINCT CASE WHEN o.status = 'ACCEPTED' THEN COALESCE(CAST(j.company_id AS CHAR), LOWER(TRIM(j.company_name))) END) AS companies, " +
                "MAX(o.ctc_lpa) AS highest " + offersFrom, p);
        long offers = n(f.get("offers"));
        long placed = n(f.get("placed"));
        long companies = n(f.get("companies"));
        List<BigDecimal> ctcs = jdbc.queryForList("SELECT o.ctc_lpa " + offersFrom + "AND o.ctc_lpa IS NOT NULL ORDER BY o.ctc_lpa", p, BigDecimal.class);
        List<Map<String, Object>> out = new ArrayList<>();
        for (String key : chosen) {
            Object value = switch (key) {
                case "STUDENTS" -> students >= MIN_GROUP ? students : null;
                case "PLACED" -> placed >= MIN_GROUP ? placed : null;
                case "PLACED_PERCENT" -> students >= MIN_GROUP && placed >= MIN_GROUP ? Math.round(placed * 100.0 / students) + "%" : null;
                case "OFFERS" -> offers >= MIN_GROUP ? offers : null;
                case "COMPANIES" -> companies >= MIN_GROUP ? companies : null;
                case "HIGHEST_CTC" -> ctcs.size() >= MIN_GROUP && f.get("highest") != null ? lpa(new BigDecimal(String.valueOf(f.get("highest")))) : null;
                case "MEDIAN_CTC" -> ctcs.size() >= MIN_GROUP ? lpa(median(ctcs)) : null;
                default -> null;
            };
            if (value != null) out.add(Map.of("key", key, "label", LABELS.get(key), "value", value));
        }
        return out;
    }

    // ---------------------------------------------------------------- "Recruit from us"

    public Map<String, Object> sendCode(Integer collegeId, String email) {
        String e = requireCompanyEmail(email);
        try {
            codeService.sendShared(codeKey(collegeId), e, null);
        } catch (RecruiterInviteCodeService.CodeProblem p) {
            throw new CompanyJoinService.JoinProblem(p.getCode(), p.getMessage());
        }
        return Map.of("status", "CODE_SENT", "email", e);
    }

    @Transactional
    public Map<String, Object> recruit(Integer collegeId, String email, String code, String name, String company, String phone, String note) {
        String e = requireCompanyEmail(email);
        String who = clean(name, 150);
        if (who == null) throw new CompanyJoinService.JoinProblem("NAME_REQUIRED", "Enter your name");
        try {
            codeService.verify(codeKey(collegeId), e, code);
        } catch (RecruiterInviteCodeService.CodeProblem p) {
            throw new CompanyJoinService.JoinProblem(p.getCode(), p.getMessage());
        }
        RecruiterLead lead = recruiterLeads.findExisting(collegeId, e);
        if (lead == null) lead = recruiterLeads.addRecruiterLead(collegeId, who, e, clean(company, 200), null, "COMPANY_REACHED_OUT");
        if (phone != null && !phone.isBlank()) recruiterLeads.addDetails(lead, phone.trim(), null);
        String message = clean(note, 1000);
        recruiterLeads.logActivity(lead.getId(), "SYSTEM", null, "Asked to recruit through your placements page" + (message == null ? "" : ": \"" + message + "\""), null);
        audit.bell(collegeId, "RECRUIT_FROM_US", who + " wants to recruit from you", (company == null ? e : clean(company, 200)) + " · from your placements page",
                "/tpo/recruiters/" + lead.getId());
        return Map.of("status", "RECEIVED");
    }

    // ---------------------------------------------------------------- internals

    private static String codeKey(Integer collegeId) {
        return "placements-page:" + collegeId;
    }

    private String requireCompanyEmail(String email) {
        if (email == null || email.isBlank()) throw new CompanyJoinService.JoinProblem("EMAIL_REQUIRED", "Enter your work email");
        String e = email.trim().toLowerCase();
        CompanyDomainService.Check check = domainService.checkEmail(e);
        if (!check.ok()) throw new CompanyJoinService.JoinProblem("COMPANY_EMAIL_REQUIRED", check.message());
        return e;
    }

    static BigDecimal median(List<BigDecimal> sorted) {
        int size = sorted.size();
        if (size == 0) return null;
        if (size % 2 == 1) return sorted.get(size / 2);
        return sorted.get(size / 2 - 1).add(sorted.get(size / 2)).divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
    }

    private static String lpa(BigDecimal v) {
        return v == null ? null : v.stripTrailingZeros().toPlainString() + " LPA";
    }

    @SuppressWarnings("unchecked")
    private static List<String> readNumbers(Object json) {
        if (json == null) return List.of();
        try { return OM.readValue(String.valueOf(json), List.class); } catch (Exception e) { return List.of(); }
    }

    private static long n(Object v) {
        return v == null ? 0 : ((Number) v).longValue();
    }

    private static boolean truthy(Object v) {
        return v instanceof Boolean b ? b : v instanceof Number num && num.intValue() != 0;
    }

    private static String clean(String value, int max) {
        if (value == null) return null;
        String v = InputSanitizer.sanitize(value.trim());
        if (v == null || v.isEmpty()) return null;
        return v.length() > max ? v.substring(0, max) : v;
    }
}
