package com._42students.lms.service.tpo;

import com._42students.lms.model.tpo.PlacementSeason;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * The student's placement page in one call (Student V1 - Changes): registration with consent, released offers only, their round schedule, their
 * requests and the notices the placement cell sent. A student never sees an offer before the TPO releases it, nor a TPO's private notes.
 */
@Service
@RequiredArgsConstructor
public class LearnerPlacementService {

    private final NamedParameterJdbcTemplate jdbc;
    private final TpoSeasonService seasonService;
    private final TpoStudentService studentService;
    private final TpoScheduleService scheduleService;
    private final TpoRequestService requestService;
    private final BatchRegistrationService batchRegistration;

    public Map<String, Object> overview(Integer learnerId, Integer collegeId) {
        Map<String, Object> out = new LinkedHashMap<>();
        // Registration is per batch: the window is the student's batch's (invited, deadline, not finished).
        PlacementSeason season = seasonService.current(collegeId);
        Optional<com._42students.lms.model.tpo.PlacementRegistration> reg = studentService.registration(learnerId, season.getId());
        BatchRegistrationService.Window window = batchRegistration.windowFor(learnerId);
        Map<String, Object> registration = new LinkedHashMap<>(window.toMap());
        registration.put("choice", reg.map(r -> r.getChoice()).orElse(null));
        out.put("registration", registration);

        out.put("offers", jdbc.queryForList(
                "SELECT o.id AS offerId, o.application_id AS applicationId, o.kind, o.status, o.role_option_name AS roleOption, o.ctc_lpa AS ctcLpa, o.joining_date AS joiningDate, o.respond_by AS respondBy, " +
                "  o.letter_url AS letterUrl, o.released_at AS releasedAt, o.acceptance_channel AS acceptanceChannel, o.accepted_disputable_until AS disputableUntil, " +
                "  j.company_name AS company, j.job_title AS role, j.id AS jobId " +
                "FROM job_offer o JOIN job_application a ON a.id = o.application_id JOIN job j ON j.id = a.job_id " +
                "WHERE a.learner_id = :l AND o.status IN ('RELEASED','ACCEPTED','DECLINED','EXPIRED','WITHDRAWN') ORDER BY o.released_at DESC", // never SELECTED or PENDING_VERIFICATION
                new MapSqlParameterSource("l", learnerId)));
        out.put("schedule", scheduleService.assignmentsForLearner(learnerId));
        out.put("requests", requestService.forLearner(learnerId));
        out.put("debarments", jdbc.queryForList("SELECT id, reason, until_date AS untilDate, until_drives AS untilDrives FROM placement_debarment WHERE learner_id = :l AND lifted_at IS NULL " +
                "AND (until_date IS NULL OR until_date >= CURDATE()) AND (until_date IS NOT NULL OR until_drives IS NULL OR drives_counted < until_drives)", new MapSqlParameterSource("l", learnerId)));
        // A "Register for placements" notice is done with once they have registered (it stayed on the page, asking again).
        out.put("notices", notices(learnerId, reg.isPresent()));
        return out;
    }

    /** Register with consent. Closed registration is the TPO's to change; only Placements needs the consent to share data with companies. */
    @Transactional
    public void register(Integer learnerId, Integer collegeId, String choice, boolean consent) {
        if (!Set.of("PLACEMENTS", "HIGHER_STUDIES", "NOT_INTERESTED").contains(choice)) throw new IllegalArgumentException("Choose Placements, Higher studies or Not interested");
        PlacementSeason season = seasonService.current(collegeId);
        boolean already = studentService.registration(learnerId, season.getId()).isPresent();
        if (!batchRegistration.windowFor(learnerId).open) {
            throw new IllegalStateException(already ? "Registration is closed. Ask the placement cell to change your choice." : "Registration is closed. Ask the placement cell to register you.");
        }
        if ("PLACEMENTS".equals(choice) && !consent) throw new IllegalArgumentException("To register for placements you need to agree to share your details with the companies you apply to");
        studentService.register(learnerId, season.getId(), choice, "SELF");
    }

    /** Stage and request decisions as a student reads them. */
    static final Map<String, String> STATUS_WORDS = Map.ofEntries(
            Map.entry("APPLIED", "applied"), Map.entry("SHORTLISTED", "shortlisted"), Map.entry("ASSESSMENT", "in the test stage"),
            Map.entry("INTERVIEW", "in the interview stage"), Map.entry("WAITLISTED", "waitlisted"), Map.entry("OFFERED", "offered a job"),
            Map.entry("HIRED", "placed"), Map.entry("REJECTED", "not selected"), Map.entry("WITHDRAWN", "withdrawn"),
            Map.entry("APPROVED", "approved"), Map.entry("AUTO_APPROVED", "approved"));

    private static final Map<String, String[]> TEXT = Map.ofEntries(
            Map.entry("ROUND_SCHEDULED", new String[]{"Your round is scheduled", "{round} for {company}{startsAt}{room}"}),
            Map.entry("ROUND_REMINDER", new String[]{"Your round is tomorrow", "{round} for {company}{startsAt}{room}"}),
            Map.entry("ROUND_TODAY", new String[]{"Your round is today", "{round} for {company}{startsAt}{room}"}),
            Map.entry("OFFER_RELEASED", new String[]{"You have an offer", "{company} has released an offer for {role}. Please respond by {respondBy}."}),
            Map.entry("OFFER_EXPIRING", new String[]{"Your offer expires soon", "Your offer from {company} expires at {respondBy}."}),
            Map.entry("OFFER_EXPIRED", new String[]{"An offer expired", "Your offer expired without an answer."}),
            Map.entry("OFFER_WITHDRAWN", new String[]{"An offer was withdrawn", "The company withdrew the offer. {reason}"}),
            Map.entry("DEADLINE_TODAY", new String[]{"Deadline today", "Applications for {company} · {role} close today."}),
            Map.entry("DRIVE_CANCELLED", new String[]{"A drive was cancelled", "{company} · {role} was cancelled. {reason}"}),
            Map.entry("DRIVE_PUBLISHED", new String[]{"A new drive is open to you", "{company} · {role} {ctc}. Apply before {deadline}."}),
            Map.entry("DRIVE_UPDATED", new String[]{"A drive you applied to changed", "{company} · {role} changed. {changed} Please check the drive."}),
            Map.entry("APPLICATION_STATUS_CHANGED", new String[]{"Your application moved", "{company} · {role}: you are now {status}."}),
            Map.entry("APPLIED_ON_BEHALF", new String[]{"The placement cell applied for you", "You are applied to {company} · {role}. You can withdraw within 48 hours from your applications."}),
            Map.entry("DRIVE_CLOSED", new String[]{"A drive closed", "{company} · {role} has closed. {message}"}),
            Map.entry("DRIVE_REMIND_NOT_APPLIED", new String[]{"You have not applied yet", "{company} · {role} is open to you. Apply before the deadline."}),
            Map.entry("REQUEST_DECIDED", new String[]{"Your request was answered", "Your request was {status}. {reason}"}),
            Map.entry("NUDGE", new String[]{"A message from the placement cell", "{message}"}),
            Map.entry("PREP_ASSIGNED", new String[]{"Prep assigned to you", "The placement cell assigned you preparation work."}),
            Map.entry("REGISTRATION_OPEN", new String[]{"Register for placements", "Choose Placements, Higher studies or Not interested by {deadline}."}),
            Map.entry("REGISTRATION_REMINDER", new String[]{"Registration closes soon", "You have not chosen yet. Register for placements by {deadline}."}),
            Map.entry("NOW_INELIGIBLE", new String[]{"You no longer meet a drive's rules", "After your academic details were updated you no longer meet the rules of a drive you applied to."}),
            Map.entry("MARKED_ABSENT", new String[]{"You were marked absent", "You can dispute this from your placement page."}),
            Map.entry("DEBARRED", new String[]{"You are debarred from drives", "{reason} You can dispute this from your placement page."}),
            Map.entry("ACCEPTANCE_REVERSED", new String[]{"An acceptance was reversed", "{reason}"}),
            Map.entry("RESCHEDULE_DECIDED", new String[]{"Your reschedule request was answered", "{reply}"}),
            Map.entry("OFFER_ACCEPTED_REPORTED", new String[]{"The company says you accepted", "If that is wrong you have {disputeWindowHours} hours to dispute it."}),
            Map.entry("PROFILE_VERIFIED", new String[]{"Your {section} is verified", "Verified by {by}. Companies and the placement cell now see it as verified."}),
            Map.entry("PROFILE_SENT_BACK", new String[]{"Your {section} needs a change", "{reason} Fix it on your profile and send it again."}),
            Map.entry("PLACEMENT_ANNOUNCEMENT", new String[]{"Announcement: {title}", "{preview}"}));

    private List<Map<String, Object>> notices(Integer learnerId, boolean registered) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT id, event, payload_json AS payload, created_at AS createdAt FROM notification_outbox " +
                "WHERE recipient_type = 'LEARNER' AND recipient_id = :l AND channel = 'APP' AND status <> 'CANCELLED' ORDER BY id DESC LIMIT 40", new MapSqlParameterSource("l", learnerId));
        List<Map<String, Object>> out = new ArrayList<>();
        com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
        for (Map<String, Object> r : rows) {
            String[] t = TEXT.get(String.valueOf(r.get("event")));
            if (t == null) continue;
            if (registered && String.valueOf(r.get("event")).startsWith("REGISTRATION_")) continue;
            Map<?, ?> payload = Map.of();
            try { if (r.get("payload") != null) payload = om.readValue(String.valueOf(r.get("payload")), Map.class); } catch (Exception ignored) { /* a damaged payload just shows the plain text */ }
            String body = t[1];
            String title = t[0];
            // Every event of a drive names the drive: company and role from the payload's application or drive when it has none.
            Map<String, Object> filled = new java.util.LinkedHashMap<>();
            payload.forEach((k, v) -> filled.put(String.valueOf(k), v));
            if (!filled.containsKey("company") && (filled.get("applicationId") != null || filled.get("jobId") != null)) {
                List<Map<String, Object>> drive = filled.get("applicationId") != null
                        ? jdbc.queryForList("SELECT j.company_name AS company, j.job_title AS role FROM job_application a JOIN job j ON j.id = a.job_id WHERE a.id = :id",
                                new MapSqlParameterSource("id", Long.parseLong(String.valueOf(filled.get("applicationId")))))
                        : jdbc.queryForList("SELECT company_name AS company, job_title AS role FROM job WHERE id = :id",
                                new MapSqlParameterSource("id", Long.parseLong(String.valueOf(filled.get("jobId")))));
                if (!drive.isEmpty()) { filled.put("company", drive.get(0).get("company")); filled.put("role", drive.get(0).get("role")); }
            }
            // Stage and decision codes in the student's words (they read "now ASSESSMENT" / "was APPROVED").
            if (filled.get("status") != null) filled.put("status", STATUS_WORDS.getOrDefault(String.valueOf(filled.get("status")), String.valueOf(filled.get("status")).toLowerCase(java.util.Locale.ROOT)));
            payload = filled;
            for (Map.Entry<?, ?> e : payload.entrySet()) {
                String v = e.getValue() == null ? "" : String.valueOf(e.getValue());
                // Times are stored in UTC ("2026-10-15 03:43:18.812"); the notice read them out like that (night audit).
                if (TIME_KEYS.contains(String.valueOf(e.getKey()))) v = indiaTime(v);
                if ("startsAt".equals(e.getKey()) && !v.isBlank()) v = " on " + v;
                if ("room".equals(e.getKey()) && !v.isBlank()) v = " in " + v;
                body = body.replace("{" + e.getKey() + "}", v);
                title = title.replace("{" + e.getKey() + "}", e.getValue() == null ? "" : String.valueOf(e.getValue()));
            }
            // Titles had placeholders too ("Announcement: {title}") that were never filled.
            title = title.replaceAll("\\{[a-zA-Z]+}", "").replaceAll("\\s+", " ").trim();
            body = body.replaceAll("\\{[a-zA-Z]+}", "").replaceAll("\\s+", " ").trim();
            Map<String, Object> n = new LinkedHashMap<>();
            n.put("id", r.get("id")); n.put("title", title); n.put("body", body); n.put("createdAt", r.get("createdAt")); n.put("event", r.get("event"));
            // Every notice opens the page where the student acts on it (student redesign, 14 Oct 2026).
            n.put("link", linkFor(String.valueOf(r.get("event")), payload));
            // An announcement's notice opens it (Announcements V2); a reminder says so.
            if ("PLACEMENT_ANNOUNCEMENT".equals(r.get("event")) && payload.get("announcementId") != null) {
                n.put("link", "/learn/my-placements/announcements?a=" + payload.get("announcementId"));
                if (Boolean.TRUE.equals(payload.get("reminder"))) n.put("title", "Reminder: " + payload.get("title"));
            }
            out.add(n);
        }
        return out;
    }

    static String linkFor(String event, Map<?, ?> payload) {
        String base = "/learn/my-placements";
        Object job = payload.get("jobId");
        switch (event) {
            case "ROUND_SCHEDULED": case "ROUND_REMINDER": case "ROUND_TODAY": case "RESCHEDULE_DECIDED": return base + "/schedule";
            case "OFFER_RELEASED": case "OFFER_EXPIRING": case "OFFER_EXPIRED": case "OFFER_WITHDRAWN": case "OFFER_ACCEPTED_REPORTED":
            case "ACCEPTANCE_REVERSED": return base + "/offers";
            case "DEADLINE_TODAY": case "DRIVE_PUBLISHED": case "DRIVE_REMIND_NOT_APPLIED": case "DRIVE_UPDATED": case "DRIVE_CANCELLED": case "DRIVE_CLOSED":
                return job != null ? base + "/jobs/" + job : base + "/jobs";
            case "APPLICATION_STATUS_CHANGED": case "APPLIED_ON_BEHALF": case "NOW_INELIGIBLE": return base + "/applications";
            case "REQUEST_DECIDED": case "MARKED_ABSENT": case "DEBARRED": case "REGISTRATION_OPEN": case "REGISTRATION_REMINDER": return base + "/placement";
            case "PROFILE_VERIFIED": case "PROFILE_SENT_BACK": return "/learn/profile";
            case "PREP_ASSIGNED": return "/learn/courses";
            default: return null;
        }
    }

    private static final java.util.Set<String> TIME_KEYS = java.util.Set.of("respondBy", "startsAt", "deadline", "dueAt", "closesAt", "registrationDeadline");

    /** A stored UTC time as the student reads it: "15 Oct, 9:13 AM" in India time. Anything that isn't a time stays as it was. */
    static String indiaTime(String raw) {
        if (raw == null || raw.isBlank()) return raw;
        try {
            java.time.LocalDateTime utc = java.time.LocalDateTime.parse(raw.trim().replace(' ', 'T'));
            return utc.atZone(java.time.ZoneOffset.UTC).withZoneSameInstant(java.time.ZoneId.of("Asia/Kolkata"))
                    .format(java.time.format.DateTimeFormatter.ofPattern("d MMM, h:mm a", java.util.Locale.ENGLISH));
        } catch (java.time.format.DateTimeParseException e) {
            return raw;
        }
    }
}
