package com._42students.lms.service.tpo;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * The parts of Settings (TPO V1 - Locked.docx §9) beyond placement rules and "What companies see": the season
 * (batches, dates, registration deadline, blocked dates), templates, branding, trusted company domains, the
 * SMS cap, saved table views, and each person's own notification choices.
 */
@Service
@RequiredArgsConstructor
public class TpoSettingsHubService {

    private final NamedParameterJdbcTemplate jdbc;
    private final TpoAuditService audit;
    private final TpoSeasonService seasonService;

    /** The one college logo (Branding, falling back to the college record). */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.service.CollegeLogoService collegeLogoService;
    /** The optional student notices the TPO can switch off. Always-on notices have no switch. */
    /** How long a recruiter's access lasts when the college has not chosen (TPO notes 2026-10-04). */
    public static final int DEFAULT_RECRUITER_ACCESS_MONTHS = 6;

    /** Whether a recruiter's drive request waits for the placement cell (default yes). */
    public boolean recruiterDriveNeedsApproval(Integer collegeId) {
        List<Integer> v = jdbc.queryForList("SELECT recruiter_drive_needs_approval FROM tpo_college_settings WHERE college_id = :c", new MapSqlParameterSource("c", collegeId), Integer.class);
        return v.isEmpty() || v.get(0) == null || v.get(0) != 0;
    }

    /** When a recruiter joining now loses access: now + the college's months, or null for no end date. */
    public java.time.LocalDateTime recruiterAccessValidUntil(Integer collegeId, java.time.LocalDateTime from) {
        List<Integer> v = jdbc.queryForList("SELECT recruiter_access_months FROM tpo_college_settings WHERE college_id = :c", new MapSqlParameterSource("c", collegeId), Integer.class);
        int months = v.isEmpty() || v.get(0) == null ? DEFAULT_RECRUITER_ACCESS_MONTHS : v.get(0);
        return months <= 0 ? null : from.plusMonths(months);
    }

    /** Whether recruiters see their drive's applicants as they apply, without a share from the placement cell (N6; default no). */
    public boolean recruiterSeesApplicantsDirectly(Integer collegeId) {
        List<String> v = jdbc.queryForList("SELECT recruiter_sees_applicants FROM tpo_college_settings WHERE college_id = :c", new MapSqlParameterSource("c", collegeId), String.class);
        return !v.isEmpty() && "DIRECT".equals(v.get(0));
    }

    public static final List<String> TOGGLE_KEYS = List.of("driveOpenEmail", "resultApplied", "nudges", "prepAssigned");
    private final com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();

    // ---------------------------------------------------------------- season
    /** Every season with its blocked dates, plus the drives still open in each (so "Start a new season" can list them). */
    /**
     * The season selector in the top bar: id, name, dates and which one is current. One query, nothing created on a read,
     * and readable by the whole placement team (the Settings list below is TPO-only and also loads each season's open drives).
     */
    public List<Map<String, Object>> seasonLens(Integer collegeId) {
        return jdbc.queryForList("SELECT id, name, start_date AS startDate, end_date AS endDate, is_current AS isCurrent FROM placement_season " +
                "WHERE college_id = :c ORDER BY is_current DESC, id DESC", new MapSqlParameterSource("c", collegeId));
    }

    public List<Map<String, Object>> seasons(Integer collegeId) {
        seasonService.current(collegeId); // a college always has a current season; create it on first look
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT id, name, start_date AS startDate, end_date AS endDate, registration_deadline AS registrationDeadline, " +
                "is_registration_open AS registrationOpen, blocked_dates AS blockedDates, is_current AS isCurrent FROM placement_season WHERE college_id = :c ORDER BY id DESC",
                new MapSqlParameterSource("c", collegeId));
        for (Map<String, Object> r : rows) {
            r.put("blockedDates", parseJson(r.get("blockedDates")));
            r.put("openDrives", jdbc.queryForList("SELECT id, company_name AS company, job_title AS title, lifecycle_status AS status FROM job WHERE college_id = :c AND season_id = :s " +
                    "AND lifecycle_status IN ('DRAFT','PUBLISHED') AND (is_deleted = 0 OR is_deleted IS NULL)", new MapSqlParameterSource("c", collegeId).addValue("s", r.get("id"))));
        }
        return rows;
    }

    private Object parseJson(Object raw) {
        if (raw == null) return List.of();
        try { return om.readValue(String.valueOf(raw), Object.class); } catch (Exception e) { return List.of(); }
    }

    @Transactional
    public void updateSeason(Integer collegeId, Long seasonId, String name, LocalDate start, LocalDate end, LocalDateTime registrationDeadline,
                             List<Map<String, Object>> blockedDates, Integer actorId) {
        if (end != null && start != null && end.isBefore(start)) throw new IllegalArgumentException("The season can't end before it starts");
        String blocked;
        try { blocked = blockedDates == null ? null : om.writeValueAsString(blockedDates); } catch (Exception e) { throw new IllegalArgumentException("Blocked dates are not valid"); }
        int n = jdbc.update("UPDATE placement_season SET name = COALESCE(:n, name), start_date = :s, end_date = :e, registration_deadline = :rd, blocked_dates = :b " +
                        "WHERE id = :id AND college_id = :c",
                new MapSqlParameterSource("n", name == null || name.isBlank() ? null : name.trim()).addValue("s", start).addValue("e", end)
                        .addValue("rd", registrationDeadline).addValue("b", blocked).addValue("id", seasonId).addValue("c", collegeId));
        if (n == 0) throw new IllegalArgumentException("Not found");
        audit.log(collegeId, "TPO", actorId, "SEASON_UPDATED", "SETTINGS", seasonId, name);
    }

    // ---------------------------------------------------------------- college settings row
    public Map<String, Object> college(Integer collegeId) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT invite_email_template AS inviteEmailTemplate, reminder_email_template AS reminderEmailTemplate, " +
                "student_email_wording AS studentEmailWording, sms_monthly_cap AS smsMonthlyCap, email_signature AS emailSignature, " +
                "logo_url AS logoUrl, trusted_domains_json AS trustedDomains, notify_toggles_json AS notificationToggles, prep_course_ids_json AS prepCourseIds, prep_threshold_pct AS prepThresholdPct, " +
                "recruiter_drive_needs_approval AS recruiterDriveNeedsApproval, recruiter_access_months AS recruiterAccessMonths, recruiter_sees_applicants AS recruiterSeesApplicants FROM tpo_college_settings WHERE college_id = :c", new MapSqlParameterSource("c", collegeId));
        Map<String, Object> out = new LinkedHashMap<>(rows.isEmpty() ? defaults() : rows.get(0));
        out.put("trustedDomains", parseJson(out.get("trustedDomains")));
        // The college's one logo, set by 42LMS in super admin (Branding); TPO sees it but no longer sets its own.
        out.put("logoUrl", collegeLogoService != null ? collegeLogoService.logoOf(collegeId) : null);
        Map<String, Object> toggles = new LinkedHashMap<>();
        for (String k : TOGGLE_KEYS) toggles.put(k, true);
        Object saved = parseJson(out.get("notificationToggles"));
        if (saved instanceof Map<?, ?> sm) sm.forEach((k, v) -> { if (toggles.containsKey(String.valueOf(k)) && v instanceof Boolean) toggles.put(String.valueOf(k), v); });
        out.put("notificationToggles", toggles);
        Object prep = parseJson(out.get("prepCourseIds"));
        out.put("prepCourseIds", prep instanceof List<?> ? prep : List.of());
        if (out.get("prepThresholdPct") == null) out.put("prepThresholdPct", 60);
        Object approval = out.get("recruiterDriveNeedsApproval");
        out.put("recruiterDriveNeedsApproval", approval == null || (approval instanceof Boolean b ? b : ((Number) approval).intValue() != 0));
        out.put("recruiterSeesApplicants", "DIRECT".equals(out.get("recruiterSeesApplicants")) ? "DIRECT" : "AFTER_REVIEW");
        out.put("recruiterAccessMonths", out.get("recruiterAccessMonths") == null ? DEFAULT_RECRUITER_ACCESS_MONTHS : ((Number) out.get("recruiterAccessMonths")).intValue());
        out.put("smsUsedThisMonth", jdbc.queryForObject("SELECT COUNT(*) FROM notification_outbox o JOIN learner l ON o.recipient_type = 'LEARNER' AND l.id = o.recipient_id " +
                "WHERE l.college_id = :c AND o.channel = 'SMS' AND o.status = 'SENT' AND o.sent_at >= DATE_FORMAT(NOW(), '%Y-%m-01') AND o.event IN (:ev)",
                new MapSqlParameterSource("c", collegeId).addValue("ev", NotificationOutboxService.OPTIONAL_EVENT_SWITCH.keySet()), Long.class));
        return out;
    }

    private static Map<String, Object> defaults() {
        Map<String, Object> d = new LinkedHashMap<>();
        d.put("inviteEmailTemplate", "Hello {name},\n\nWe would like to invite {company} to recruit from our campus this season. Join here: {link}\n\nThank you,\n{signature}");
        d.put("reminderEmailTemplate", "Hello {name}, a quick reminder about our campus invitation: {link}");
        d.put("studentEmailWording", null);
        d.put("smsMonthlyCap", 500);
        d.put("prepThresholdPct", 60);
        d.put("recruiterDriveNeedsApproval", true);
        d.put("recruiterAccessMonths", DEFAULT_RECRUITER_ACCESS_MONTHS);
        d.put("recruiterSeesApplicants", "AFTER_REVIEW");
        d.put("emailSignature", null);
        d.put("logoUrl", null);
        d.put("trustedDomains", null);
        return d;
    }

    @Transactional
    public void saveCollege(Integer collegeId, Map<String, Object> in, Integer actorId) {
        Map<String, Object> cur = college(collegeId);
        String trusted;
        try { trusted = om.writeValueAsString(normalizeDomains(in.containsKey("trustedDomains") ? in.get("trustedDomains") : cur.get("trustedDomains"))); }
        catch (Exception e) { throw new IllegalArgumentException("Trusted domains are not valid"); }
        int cap = in.get("smsMonthlyCap") == null ? ((Number) cur.get("smsMonthlyCap")).intValue() : Integer.parseInt(String.valueOf(in.get("smsMonthlyCap")));
        if (cap < 0 || cap > 100000) throw new IllegalArgumentException("The SMS cap must be between 0 and 100000");
        Map<String, Object> mergedToggles = new LinkedHashMap<>();
        @SuppressWarnings("unchecked") Map<String, Object> curToggles = (Map<String, Object>) cur.get("notificationToggles");
        for (String k : TOGGLE_KEYS) {
            Object incoming = in.get("notificationToggles") instanceof Map<?, ?> m ? m.get(k) : null;
            mergedToggles.put(k, incoming instanceof Boolean ? incoming : curToggles.get(k));
        }
        String togglesJson;
        try { togglesJson = om.writeValueAsString(mergedToggles); } catch (Exception e) { throw new IllegalArgumentException("Notification switches are not valid"); }
        Object courses = in.containsKey("prepCourseIds") ? in.get("prepCourseIds") : cur.get("prepCourseIds");
        String coursesJson;
        try { coursesJson = om.writeValueAsString(courses instanceof Collection<?> c ? c : List.of()); } catch (Exception e) { throw new IllegalArgumentException("Prep courses are not valid"); }
        int threshold = in.get("prepThresholdPct") == null ? ((Number) cur.get("prepThresholdPct")).intValue() : Integer.parseInt(String.valueOf(in.get("prepThresholdPct")));
        if (threshold < 0 || threshold > 100) throw new IllegalArgumentException("The prep threshold must be between 0 and 100");
        boolean needsApproval = in.get("recruiterDriveNeedsApproval") instanceof Boolean b ? b : (Boolean) cur.get("recruiterDriveNeedsApproval");
        int accessMonths = in.get("recruiterAccessMonths") == null ? ((Number) cur.get("recruiterAccessMonths")).intValue() : Integer.parseInt(String.valueOf(in.get("recruiterAccessMonths")));
        if (accessMonths < 0 || accessMonths > 60) throw new IllegalArgumentException("Recruiter access must be between 0 (no end date) and 60 months");
        String seesApplicants = in.containsKey("recruiterSeesApplicants") ? String.valueOf(in.get("recruiterSeesApplicants")) : (String) cur.get("recruiterSeesApplicants");
        if (!List.of("DIRECT", "AFTER_REVIEW").contains(seesApplicants)) throw new IllegalArgumentException("Choose when recruiters see applicants");
        MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId).addValue("sa", seesApplicants).addValue("cap", cap).addValue("td", trusted).addValue("nt", togglesJson)
                .addValue("pc", coursesJson).addValue("pt", threshold).addValue("na", needsApproval ? 1 : 0).addValue("am", accessMonths);
        for (String k : List.of("inviteEmailTemplate", "reminderEmailTemplate", "studentEmailWording", "emailSignature")) {
            p.addValue(k, in.containsKey(k) ? in.get(k) : cur.get(k));
        }
        p.addValue("logoUrl", null); // the logo is set in super admin now; an existing row keeps its old value untouched
        jdbc.update("INSERT INTO tpo_college_settings (college_id, invite_email_template, reminder_email_template, student_email_wording, sms_monthly_cap, email_signature, logo_url, trusted_domains_json, notify_toggles_json, prep_course_ids_json, prep_threshold_pct, recruiter_drive_needs_approval, recruiter_access_months, recruiter_sees_applicants) " +
                "VALUES (:c, :inviteEmailTemplate, :reminderEmailTemplate, :studentEmailWording, :cap, :emailSignature, :logoUrl, :td, :nt, :pc, :pt, :na, :am, :sa) " +
                "ON DUPLICATE KEY UPDATE invite_email_template = VALUES(invite_email_template), reminder_email_template = VALUES(reminder_email_template), " +
                "student_email_wording = VALUES(student_email_wording), sms_monthly_cap = VALUES(sms_monthly_cap), email_signature = VALUES(email_signature), trusted_domains_json = VALUES(trusted_domains_json), notify_toggles_json = VALUES(notify_toggles_json), prep_course_ids_json = VALUES(prep_course_ids_json), prep_threshold_pct = VALUES(prep_threshold_pct), " +
                "recruiter_drive_needs_approval = VALUES(recruiter_drive_needs_approval), recruiter_access_months = VALUES(recruiter_access_months), recruiter_sees_applicants = VALUES(recruiter_sees_applicants)", p);
        audit.log(collegeId, "TPO", actorId, "SETTINGS_UPDATED", "SETTINGS", null, String.join(",", in.keySet()));
    }

    private static List<String> normalizeDomains(Object raw) {
        List<String> out = new ArrayList<>();
        if (raw instanceof Collection<?> c) for (Object o : c) {
            String d = String.valueOf(o).trim().toLowerCase(Locale.ROOT).replaceFirst("^@", "");
            if (!d.matches("^[a-z0-9.-]+\\.[a-z]{2,}$")) throw new IllegalArgumentException("'" + o + "' is not a company domain");
            if (com._42students.lms.service.company.CompanyDomainService.isPersonalOrDisposableDomain(d)) throw new IllegalArgumentException("A free-mail domain can't be trusted");
            if (!out.contains(d)) out.add(d);
        }
        return out;
    }

    // ---------------------------------------------------------------- my notifications
    public Map<String, Object> myPrefs(Integer facultyId) {
        List<String> raw = jdbc.queryForList("SELECT prefs_json FROM tpo_user_prefs WHERE faculty_id = :f", new MapSqlParameterSource("f", facultyId), String.class);
        Map<String, Object> prefs = new LinkedHashMap<>();
        prefs.put("morningDigest", false); prefs.put("recruiterMessages", true); prefs.put("requests", true); prefs.put("resultsReady", true); prefs.put("followUps", true);
        if (!raw.isEmpty() && raw.get(0) != null) {
            try { @SuppressWarnings("unchecked") Map<String, Object> saved = om.readValue(raw.get(0), Map.class); prefs.putAll(saved); } catch (Exception ignored) { }
        }
        return prefs;
    }

    @Transactional
    public void saveMyPrefs(Integer facultyId, Map<String, Object> prefs) {
        Map<String, Object> merged = myPrefs(facultyId);
        for (String k : merged.keySet()) if (prefs.get(k) instanceof Boolean b) merged.put(k, b);
        try {
            jdbc.update("INSERT INTO tpo_user_prefs (faculty_id, prefs_json) VALUES (:f, :p) ON DUPLICATE KEY UPDATE prefs_json = VALUES(prefs_json)",
                    new MapSqlParameterSource("f", facultyId).addValue("p", om.writeValueAsString(merged)));
        } catch (Exception e) { throw new IllegalStateException(e); }
    }

    // ---------------------------------------------------------------- saved views
    /** Every TPO grid that can save named views (scope is VARCHAR(20)). */
    static final Set<String> SAVED_VIEW_SCOPES = Set.of("STUDENTS", "RECRUITER_LEADS", "DRIVES", "APPLICANTS", "BATCH_STUDENTS", "OFFERS", "REQUESTS",
            "AUDIT", "REPORT", "VERIFICATION", "RESULTS", "COMPANY_DRIVES");
    public List<Map<String, Object>> views(Integer collegeId, Integer facultyId, String scope) {
        return jdbc.queryForList("SELECT id, name, filters_json AS filters, pinned = 1 AS pinned, last_used_at AS lastUsedAt, created_at AS createdAt " +
                "FROM tpo_saved_view WHERE college_id = :c AND faculty_id = :f AND scope = :s ORDER BY pinned DESC, name",
                new MapSqlParameterSource("c", collegeId).addValue("f", facultyId).addValue("s", scope));
    }

    @Transactional
    public void saveView(Integer collegeId, Integer facultyId, String scope, String name, Object filters) {
        if (!SAVED_VIEW_SCOPES.contains(scope)) throw new IllegalArgumentException("Unknown table");
        if (name == null || name.isBlank()) throw new IllegalArgumentException("Name the view");
        int added;
        try {
            // BE-0121: one view per name (per person and table). The insert only happens when no view of that name exists.
            added = jdbc.update("INSERT INTO tpo_saved_view (college_id, faculty_id, scope, name, filters_json) " +
                            "SELECT :c, :f, :s, :n, :j FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM tpo_saved_view WHERE college_id = :c AND faculty_id = :f AND scope = :s AND LOWER(name) = LOWER(:n))",
                    new MapSqlParameterSource("c", collegeId).addValue("f", facultyId).addValue("s", scope).addValue("n", name.trim()).addValue("j", om.writeValueAsString(filters)));
        } catch (Exception e) { throw new IllegalArgumentException("The filters could not be saved"); }
        if (added == 0) throw new IllegalArgumentException("You already have a view called \"" + name.trim() + "\". Pick another name.");
    }

    /** Most views a person can pin into the Views dropdown (the rest stay in "Manage views"). */
    static final int MAX_PINNED_VIEWS = 5;

    /**
     * Rename a view, pin or unpin it, or replace its filters with the current ones. Only the person's own views. Null fields are
     * left as they are.
     */
    @Transactional
    public void updateView(Integer collegeId, Integer facultyId, Long viewId, String name, Boolean pinned, Object filters) {
        MapSqlParameterSource p = new MapSqlParameterSource("id", viewId).addValue("c", collegeId).addValue("f", facultyId);
        Integer mine = jdbc.queryForObject("SELECT COUNT(*) FROM tpo_saved_view WHERE id = :id AND college_id = :c AND faculty_id = :f", p, Integer.class);
        if (mine == null || mine == 0) throw new IllegalArgumentException("That view no longer exists");
        if (name != null) {
            if (name.isBlank()) throw new IllegalArgumentException("Name the view");
            jdbc.update("UPDATE tpo_saved_view SET name = :n, updated_at = NOW() WHERE id = :id AND college_id = :c AND faculty_id = :f",
                    new MapSqlParameterSource(p.getValues()).addValue("n", name.trim().length() > 100 ? name.trim().substring(0, 100) : name.trim()));
        }
        if (Boolean.TRUE.equals(pinned)) {
            Integer already = jdbc.queryForObject("SELECT COUNT(*) FROM tpo_saved_view v WHERE v.college_id = :c AND v.faculty_id = :f AND v.pinned = 1 " +
                    "AND v.id <> :id AND v.scope = (SELECT x.scope FROM (SELECT scope FROM tpo_saved_view WHERE id = :id) x)", p, Integer.class);
            if (already != null && already >= MAX_PINNED_VIEWS) {
                throw new IllegalArgumentException("You can pin up to " + MAX_PINNED_VIEWS + " views. Unpin one first.");
            }
        }
        if (pinned != null) {
            jdbc.update("UPDATE tpo_saved_view SET pinned = :p, updated_at = NOW() WHERE id = :id AND college_id = :c AND faculty_id = :f",
                    new MapSqlParameterSource(p.getValues()).addValue("p", pinned ? 1 : 0));
        }
        if (filters != null) {
            try {
                jdbc.update("UPDATE tpo_saved_view SET filters_json = :j, updated_at = NOW() WHERE id = :id AND college_id = :c AND faculty_id = :f",
                        new MapSqlParameterSource(p.getValues()).addValue("j", om.writeValueAsString(filters)));
            } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                throw new IllegalArgumentException("The filters could not be saved");
            }
        }
    }

    /** A view was opened or downloaded: remembered so the dropdown can offer recent views and the manager can flag unused ones. */
    @Transactional
    public void markViewUsed(Integer collegeId, Integer facultyId, Long viewId) {
        jdbc.update("UPDATE tpo_saved_view SET last_used_at = NOW() WHERE id = :id AND college_id = :c AND faculty_id = :f",
                new MapSqlParameterSource("id", viewId).addValue("c", collegeId).addValue("f", facultyId));
    }

    @Transactional
    public void deleteView(Integer collegeId, Integer facultyId, Long viewId) {
        jdbc.update("DELETE FROM tpo_saved_view WHERE id = :id AND college_id = :c AND faculty_id = :f",
                new MapSqlParameterSource("id", viewId).addValue("c", collegeId).addValue("f", facultyId));
    }
}
