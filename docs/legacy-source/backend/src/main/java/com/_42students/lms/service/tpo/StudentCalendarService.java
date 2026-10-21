package com._42students.lms.service.tpo;

import com._42students.lms.model.Learner;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Student V1 §8 Calendar: the two pieces the student's existing Career Calendar
 * (JobService.getImportantDateEventsForLearner — interviews/deadlines already covered there)
 * never carried — talks (pre-placement info sessions) and the college's blocked exam dates.
 * Both already exist as TPO-facing schema/data ({@code job_round} kind=TALK,
 * {@code placement_season.blocked_dates} — see {@link TpoInsightsService#calendar}); this reuses
 * that same data read-only, scoped to what a student may see, rather than inventing new schema.
 */
@Service
@RequiredArgsConstructor
public class StudentCalendarService {

    private final NamedParameterJdbcTemplate jdbc;
    private final TpoInsightsService insights;
    private final JobService jobService;
    private final LearnerRepository learnerRepository;

    public List<Map<String, Object>> extras(Integer learnerId, LocalDateTime start, LocalDateTime end) {
        Learner learner = learnerRepository.findById(learnerId)
                .orElseThrow(() -> new IllegalArgumentException("Learner not found: " + learnerId));
        List<Map<String, Object>> out = new ArrayList<>();

        // Talks: only for jobs this student can see or has applied to — never a drive hidden
        // from them, even though the talk itself (unlike a round result) carries nothing
        // college-confidential.
        List<Integer> jobIds = jobService.getCalendarJobIdsForLearner(learnerId);
        if (!jobIds.isEmpty()) {
            MapSqlParameterSource p = new MapSqlParameterSource("ids", jobIds).addValue("from", start).addValue("to", end);
            for (Map<String, Object> r : jdbc.queryForList(
                    "SELECT r.id, r.name, r.scheduled_date AS startsAt, r.mode, r.venue, r.meeting_url AS meetingUrl, " +
                    "j.id AS jobId, j.company_name AS company, j.job_title AS jobTitle " +
                    "FROM job_round r JOIN job j ON j.id = r.job_id " +
                    "WHERE r.job_id IN (:ids) AND r.kind = 'TALK' AND r.scheduled_date IS NOT NULL " +
                    "AND r.scheduled_date >= :from AND r.scheduled_date <= :to",
                    p)) {
                Map<String, Object> e = new LinkedHashMap<>(r);
                e.put("type", "TALK");
                e.put("title", r.get("name") + " · " + r.get("company"));
                out.add(e);
            }
        }

        // The student's own rounds the placement cell scheduled (tests, group discussions, interviews): only on the schedule
        // page before, never on the calendar (night audit 13 Oct 2026). Same rows as the schedule, so a withdrawn or ended
        // application leaves no rounds behind; the time is the confirmed slot's, else the round's own.
        MapSqlParameterSource mine = new MapSqlParameterSource("l", learnerId).addValue("from", start).addValue("to", end);
        for (Map<String, Object> r : jdbc.queryForList(
                "SELECT r.id, r.name, r.kind, COALESCE(s.starts_at, r.scheduled_date) AS startsAt, r.mode, " +
                "COALESCE(NULLIF(NULLIF(ra.room, ''), 'null'), s.room, r.venue) AS venue, r.meeting_url AS meetingUrl, " +
                "j.id AS jobId, j.company_name AS company, j.job_title AS jobTitle " +
                "FROM round_assignment ra JOIN job_application a ON a.id = ra.application_id JOIN job_round r ON r.id = ra.round_id " +
                "JOIN job j ON j.id = r.job_id LEFT JOIN round_slot s ON s.id = ra.slot_id " +
                "WHERE a.learner_id = :l AND a.application_status IN ('APPLIED','SHORTLISTED','ASSESSMENT','INTERVIEW','WAITLISTED') " +
                "AND j.lifecycle_status = 'PUBLISHED' AND COALESCE(s.starts_at, r.scheduled_date) >= :from AND COALESCE(s.starts_at, r.scheduled_date) <= :to",
                mine)) {
            Map<String, Object> e = new LinkedHashMap<>(r);
            e.put("type", "ROUND");
            e.put("title", r.get("name") + " · " + r.get("company"));
            out.add(e);
        }

        // Blocked (exam) dates are college-wide — shown to every student at that college,
        // whether or not they can see any particular drive.
        if (learner.getCollegeId() != null) {
            for (Map<String, Object> b : insights.blockedDates(learner.getCollegeId())) {
                LocalDate d;
                try { d = LocalDate.parse(String.valueOf(b.get("date"))); } catch (Exception ignored) { continue; }
                LocalDateTime dt = d.atStartOfDay();
                if (!dt.isBefore(start) && !dt.isAfter(end)) {
                    Map<String, Object> e = new LinkedHashMap<>();
                    e.put("type", "BLOCKED");
                    e.put("title", b.get("label") == null ? "Blocked date — no drives" : String.valueOf(b.get("label")));
                    e.put("startsAt", dt);
                    out.add(e);
                }
            }
        }

        return out;
    }
}
