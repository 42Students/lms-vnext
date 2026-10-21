package com._42students.lms.service.tpo;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * The student's placements in one read (student redesign, 14 Oct 2026): every application with its drive's real rounds and
 * where the student is in them, their schedule (past and ahead, tests included), and their offers. The student pages were built
 * before the TPO rounds existed and read the old interview table, so a student with an interview tomorrow was told "No
 * interviews scheduled yet". Every student page now reads this.
 *
 * Only what a student may see: applied round results (never a staged one), outcome words only (never a score, comment or reason
 * category), released offers only.
 */
@Service
@RequiredArgsConstructor
public class LearnerJourneyService {

    private final NamedParameterJdbcTemplate jdbc;

    static final Set<String> ACTIVE = Set.of("APPLIED", "SHORTLISTED", "ASSESSMENT", "INTERVIEW", "WAITLISTED");
    static final Set<String> OFFER_STATUSES = Set.of("RELEASED", "ACCEPTED", "DECLINED", "EXPIRED", "WITHDRAWN");

    public Map<String, Object> journey(Integer learnerId) {
        MapSqlParameterSource l = new MapSqlParameterSource("l", learnerId);
        List<Map<String, Object>> apps = jdbc.queryForList(
                "SELECT a.id AS applicationId, a.job_id AS jobId, a.application_status AS status, a.applied_at AS appliedAt, a.status_updated_at AS updatedAt, " +
                "  a.rejection_reason AS reason, a.applied_by_college AS appliedByCollege, a.applied_by_college_opt_out_until AS optOutUntil, " +
                "  a.assessment_url AS assessmentUrl, a.current_round_id AS currentRoundId, " +
                "  j.company_name AS company, j.company_logo AS logo, j.job_title AS role, j.job_type AS jobType, j.location, j.ctc_range AS pay, " +
                "  j.category, j.lifecycle_status AS lifecycle, j.cancelled_reason AS cancelReason, j.cancelled_at AS cancelledAt, j.closed_at AS closedAt, " +
                "  j.application_deadline AS deadline, j.assessment_deadline AS assessmentDeadline " +
                "FROM job_application a JOIN job j ON j.id = a.job_id WHERE a.learner_id = :l AND (a.is_deleted = 0 OR a.is_deleted IS NULL) " +
                "ORDER BY a.applied_at DESC", l);
        if (apps.isEmpty()) return Map.of("applications", List.of(), "schedule", List.of(), "offers", List.of());

        List<Integer> appIds = new ArrayList<>();
        Set<Integer> jobIds = new LinkedHashSet<>();
        for (Map<String, Object> a : apps) { appIds.add(num(a.get("applicationId"))); jobIds.add(num(a.get("jobId"))); }
        MapSqlParameterSource ids = new MapSqlParameterSource("apps", appIds).addValue("jobs", jobIds);

        Map<Integer, List<Map<String, Object>>> roundsByJob = new HashMap<>();
        for (Map<String, Object> r : jdbc.queryForList(
                "SELECT id AS roundId, job_id AS jobId, seq, kind, name, mode, scheduled_date AS scheduledAt, venue, meeting_url AS meetingUrl, " +
                "what_to_bring AS whatToBring, platform, test_link AS testLink, duration_minutes AS durationMinutes FROM job_round WHERE job_id IN (:jobs) ORDER BY job_id, seq, id", ids)) {
            roundsByJob.computeIfAbsent(num(r.get("jobId")), k -> new ArrayList<>()).add(r);
        }
        // Applied results only; the latest per application and round.
        Map<String, String> outcome = new HashMap<>();
        for (Map<String, Object> r : jdbc.queryForList(
                "SELECT application_id AS a, round_id AS r, outcome FROM round_result WHERE application_id IN (:apps) AND applied_at IS NOT NULL AND superseded_by IS NULL ORDER BY applied_at, id", ids)) {
            outcome.put(r.get("a") + ":" + r.get("r"), String.valueOf(r.get("outcome")));
        }
        Map<String, Map<String, Object>> booked = new HashMap<>();
        for (Map<String, Object> r : jdbc.queryForList(
                "SELECT ra.application_id AS a, ra.round_id AS r, s.starts_at AS startsAt, s.ends_at AS endsAt, " +
                "  COALESCE(NULLIF(NULLIF(ra.room, ''), 'null'), s.room) AS room, ra.student_confirmed_at AS confirmedAt, ra.notified_at AS notifiedAt " +
                "FROM round_assignment ra LEFT JOIN round_slot s ON s.id = ra.slot_id WHERE ra.application_id IN (:apps)", ids)) {
            booked.put(r.get("a") + ":" + r.get("r"), r);
        }
        Map<String, Map<String, Object>> moveAsks = new HashMap<>();
        for (Map<String, Object> r : jdbc.queryForList(
                "SELECT application_id AS a, round_id AS r, status, reply, created_at AS askedAt FROM reschedule_request WHERE application_id IN (:apps) ORDER BY id", ids)) {
            moveAsks.put(r.get("a") + ":" + r.get("r"), r);
        }
        Map<Integer, Map<String, Object>> offerByApp = new HashMap<>();
        List<Map<String, Object>> offers = jdbc.queryForList(
                "SELECT o.id AS offerId, o.application_id AS applicationId, o.status, o.role_option_name AS roleOption, o.ctc_lpa AS ctcLpa, o.joining_date AS joiningDate, " +
                "  o.respond_by AS respondBy, o.letter_url AS letterUrl, o.released_at AS releasedAt, o.responded_at AS respondedAt, o.acceptance_channel AS acceptanceChannel, " +
                "  o.accepted_disputable_until AS disputableUntil, j.id AS jobId, j.company_name AS company, j.company_logo AS logo, j.job_title AS role, j.job_type AS jobType, " +
                "  j.counts_as_placed AS countsAsPlaced " +
                "FROM job_offer o JOIN job_application a ON a.id = o.application_id JOIN job j ON j.id = a.job_id " +
                "WHERE a.learner_id = :l AND o.status IN (:st) ORDER BY o.released_at DESC, o.id DESC", new MapSqlParameterSource("l", learnerId).addValue("st", OFFER_STATUSES));
        for (Map<String, Object> o : offers) offerByApp.putIfAbsent(num(o.get("applicationId")), o);

        List<Map<String, Object>> schedule = new ArrayList<>();
        List<Map<String, Object>> outApps = new ArrayList<>();
        for (Map<String, Object> a : apps) {
            int appId = num(a.get("applicationId"));
            String status = String.valueOf(a.get("status"));
            boolean live = ACTIVE.contains(status) && "PUBLISHED".equals(String.valueOf(a.get("lifecycle")));
            boolean ended = Set.of("REJECTED", "WITHDRAWN", "NOT_SELECTED").contains(status) || !Set.of("PUBLISHED", "CLOSED").contains(String.valueOf(a.get("lifecycle")));
            List<Map<String, Object>> rounds = new ArrayList<>();
            boolean currentFound = false;
            boolean blocked = false; // a round not cleared: nothing after it is theirs
            boolean openBooking = false; // booked into a round with no result yet: withdrawing goes through the placement cell
            for (Map<String, Object> r : roundsByJob.getOrDefault(num(a.get("jobId")), List.of())) {
                String key = appId + ":" + r.get("roundId");
                Map<String, Object> round = new LinkedHashMap<>(r);
                round.remove("jobId");
                String out = outcome.get(key);
                Map<String, Object> b = booked.get(key);
                if (b != null && out == null) openBooking = true;
                String state;
                if (out != null) {
                    state = switch (out) { case "PASS" -> "CLEARED"; case "FAIL" -> "NOT_CLEARED"; case "ABSENT" -> "ABSENT"; case "HOLD" -> "WAITLISTED"; default -> "DONE"; };
                    if (!"CLEARED".equals(state) && !"WAITLISTED".equals(state)) blocked = true;
                } else if (blocked || ended) {
                    state = "NOT_REACHED";
                } else if (Set.of("OFFERED", "HIRED").contains(status)) {
                    state = "DONE";
                } else if ("TALK".equals(r.get("kind"))) {
                    state = "TALK";
                } else if (!currentFound) {
                    state = b != null ? "SCHEDULED" : "NEXT";
                    currentFound = true;
                } else {
                    state = b != null ? "SCHEDULED" : "LATER";
                }
                round.put("state", state);
                Object startsAt = b != null && b.get("startsAt") != null ? b.get("startsAt") : r.get("scheduledAt");
                round.put("startsAt", startsAt);
                round.put("endsAt", b == null ? null : b.get("endsAt"));
                Object room = b != null && b.get("room") != null ? b.get("room") : r.get("venue");
                round.put("room", room);
                round.put("booked", b != null);
                round.put("confirmedAt", b == null ? null : b.get("confirmedAt"));
                round.put("hasSlot", b != null && b.get("startsAt") != null);
                Map<String, Object> ask = moveAsks.get(key);
                round.put("moveAsk", ask == null ? null : Map.of("status", ask.get("status"), "reply", ask.get("reply") == null ? "" : ask.get("reply"), "askedAt", ask.get("askedAt")));
                rounds.add(round);

                // The schedule: every round booked for them (past ones too, for the record), the talks of a drive they are in, and
                // the next round of a live application when it has a date but no booking yet (shown as expected, not confirmed).
                boolean onSchedule = b != null || ("TALK".equals(r.get("kind")) && live && r.get("scheduledAt") != null)
                        || (live && "NEXT".equals(state) && r.get("scheduledAt") != null);
                if (onSchedule && startsAt != null && (b == null || live || out != null)) {
                    Map<String, Object> item = new LinkedHashMap<>(round);
                    item.put("applicationId", appId);
                    item.put("jobId", a.get("jobId"));
                    item.put("company", a.get("company"));
                    item.put("logo", a.get("logo"));
                    item.put("role", a.get("role"));
                    item.put("live", live);
                    item.put("expected", b == null && !"TALK".equals(r.get("kind")));
                    schedule.add(item);
                }
            }
            Map<String, Object> app = new LinkedHashMap<>(a);
            app.put("rounds", rounds);
            app.put("live", live);
            app.put("offer", offerByApp.get(appId));
            // How the student can step out: on their own until they are booked into a round, then by asking the placement cell.
            app.put("withdraw", !ACTIVE.contains(status) || !Set.of("PUBLISHED", "CLOSED").contains(String.valueOf(a.get("lifecycle"))) ? null
                    : openBooking ? "REQUEST" : "SELF");
            outApps.add(app);
        }
        schedule.sort(Comparator.comparing(x -> String.valueOf(x.get("startsAt"))));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("applications", outApps);
        out.put("schedule", schedule);
        out.put("offers", offers);
        return out;
    }

    /** One drive's selection process for a student who may not have applied: the rounds as the drive lists them, nothing personal. */
    public List<Map<String, Object>> process(Integer jobId) {
        return jdbc.queryForList("SELECT id AS roundId, seq, kind, name, mode, scheduled_date AS scheduledAt, duration_minutes AS durationMinutes, platform " +
                "FROM job_round WHERE job_id = :j ORDER BY seq, id", new MapSqlParameterSource("j", jobId));
    }

    private static int num(Object o) { return ((Number) o).intValue(); }
}
