package com._42students.lms.service.tpo;

import com._42students.lms.model.Job;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Who hears about a drive, and the timed reminders (TPO V1 - Locked.docx §1 notifications table): eligible students when a drive opens, everyone
 * still to apply on the morning the deadline falls, and a released offer's holder 24 hours before it expires.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class TpoAnnouncementService {

    private final NamedParameterJdbcTemplate jdbc;
    private final EligibilityService eligibilityService;
    private final NotificationOutboxService outbox;
    private final com._42students.lms.repository.JobRepository jobRepository;
    private final TpoMailService mail;
    private final PlacementEligibilityService placementEligibility;

    /** Registered-for-placements (or not yet registered), not debarred, and meeting the drive's rules. */
    public List<Integer> eligibleLearnerIds(Job job) {
        List<Map<String, Object>> students = jdbc.queryForList(
                "SELECT l.id, l.department AS branch, " +
                "  COALESCE((SELECT pr.choice FROM placement_registration pr WHERE pr.learner_id = l.id ORDER BY pr.id DESC LIMIT 1), " + RegistrationRule.APPLIED_EARLIER + ") AS registration, " +
                "  (SELECT COUNT(*) FROM placement_debarment d WHERE d.learner_id = l.id AND d.lifted_at IS NULL AND (d.until_date IS NULL OR d.until_date >= CURDATE()) AND (d.until_date IS NOT NULL OR d.until_drives IS NULL OR d.drives_counted < d.until_drives)) AS debarred " +
                "FROM learner l WHERE l.college_id = :c AND (l.is_deleted = 0 OR l.is_deleted IS NULL)", new MapSqlParameterSource("c", job.getCollegeId()));
        // Only students in placements (Eligible) are ever told about a drive.
        Map<Integer, PlacementEligibilityService.Resolved> inPlacements = placementEligibility.resolveCollege(job.getCollegeId());
        Map<Integer, String> candidates = new java.util.LinkedHashMap<>();
        for (Map<String, Object> s : students) {
            PlacementEligibilityService.Resolved pe = inPlacements.get(((Number) s.get("id")).intValue());
            if (pe == null || !PlacementEligibilityService.ELIGIBLE.equals(pe.status)) continue;
            String reg = (String) s.get("registration");
            if (reg != null && !"PLACEMENTS".equals(reg)) continue;
            if (((Number) s.get("debarred")).intValue() > 0) continue;
            candidates.put(((Number) s.get("id")).intValue(), (String) s.get("branch"));
        }
        List<Integer> out = new ArrayList<>();
        eligibilityService.evaluateAll(job, candidates).forEach((id, r) -> { if (r.eligible) out.add(id); });
        return out;
    }

    private Map<String, Object> describe(Job job) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("jobId", job.getId());
        m.put("company", job.getCompanyName());
        m.put("role", job.getJobTitle());
        m.put("ctc", job.getCtcRange() == null ? "" : job.getCtcRange());
        // Stored in UTC (the TPO pages send UTC); students read India time.
        m.put("deadline", job.getApplicationDeadline() == null ? "" : job.getApplicationDeadline().atZone(java.time.ZoneOffset.UTC)
                .withZoneSameInstant(java.time.ZoneId.of("Asia/Kolkata")).format(java.time.format.DateTimeFormatter.ofPattern("d MMM yyyy, h:mm a", java.util.Locale.ENGLISH)));
        return m;
    }

    /** "New drive open to you": App and Email to every eligible student. */
    @Transactional
    public int announcePublished(Job job) {
        List<Integer> ids = eligibleLearnerIds(job);
        for (Integer id : ids) outbox.enqueue("DRIVE_PUBLISHED", "LEARNER", id, "APP", describe(job), null, false);
        return ids.size();
    }

    /** Eligible students who have not applied yet are reminded on the morning the deadline falls. */
    // Timed by TpoScheduledJobs (one replica only).
    @Transactional
    public void deadlineToday() {
        List<Integer> jobs = jdbc.queryForList("SELECT id FROM job WHERE lifecycle_status = 'PUBLISHED' AND DATE(CONVERT_TZ(application_deadline, '+00:00', '+05:30')) = DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+05:30')) AND (is_deleted = 0 OR is_deleted IS NULL)",
                new MapSqlParameterSource(), Integer.class);
        for (Integer jobId : jobs) {
            jobRepository.findById(jobId).ifPresent(job -> {
                Set<Integer> applied = new HashSet<>(jdbc.queryForList("SELECT learner_id FROM job_application WHERE job_id = :j", new MapSqlParameterSource("j", jobId), Integer.class));
                for (Integer id : eligibleLearnerIds(job)) {
                    if (applied.contains(id)) continue;
                    outbox.enqueue("DEADLINE_TODAY", "LEARNER", id, "APP", describe(job), null, false);
                }
            });
        }
    }

    /** A released offer with under 24 hours left tells its holder once. */
    // Timed by TpoScheduledJobs (one replica only).
    @Transactional
    public void offersExpiringSoon() {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT o.id AS offerId, a.learner_id AS learnerId, j.company_name AS company, j.job_title AS role, o.respond_by AS respondBy FROM job_offer o " +
                "JOIN job_application a ON a.id = o.application_id JOIN job j ON j.id = a.job_id " +
                "WHERE o.status = 'RELEASED' AND o.respond_by > NOW() AND o.respond_by <= NOW() + INTERVAL 24 HOUR AND o.expiring_notified_at IS NULL", new MapSqlParameterSource());
        for (Map<String, Object> r : rows) {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("offerId", r.get("offerId")); payload.put("company", r.get("company")); payload.put("role", r.get("role"));
            payload.put("respondBy", String.valueOf(TpoTime.ldt(r.get("respondBy"))).replace('T', ' '));
            outbox.enqueue("OFFER_EXPIRING", "LEARNER", ((Number) r.get("learnerId")).intValue(), "APP", payload, null, false);
            jdbc.update("UPDATE job_offer SET expiring_notified_at = :n WHERE id = :id", new MapSqlParameterSource("n", LocalDateTime.now()).addValue("id", r.get("offerId")));
        }
    }

    /**
     * recruiter V1 §1 email table: "Shortlist due tomorrow" — the day before a share link's own "please shortlist by" date. Uses the
     * share's own event log for idempotency (one reminder per link, not a new schema column) exactly like the read/download
     * events TpoShareService already writes there.
     */
    // Timed by TpoScheduledJobs (one replica only).
    @Transactional
    public void shortlistDueTomorrow() {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT s.id, s.recipient_email AS email, j.company_name AS company, j.job_title AS role, j.college_id AS collegeId FROM tpo_share_link s JOIN job j ON j.id = s.job_id " +
                "WHERE s.revoked_at IS NULL AND s.shortlist_by IS NOT NULL AND DATE(s.shortlist_by) = CURDATE() + INTERVAL 1 DAY " +
                "AND NOT EXISTS (SELECT 1 FROM tpo_share_event e WHERE e.share_id = s.id AND e.action = 'SHORTLIST_REMINDER' AND DATE(e.created_at) = CURDATE())",
                new MapSqlParameterSource());
        for (Map<String, Object> r : rows) {
            if (r.get("email") == null) continue;
            mail.sendAsCollege("shortlist-due-tomorrow", String.valueOf(r.get("email")), Map.of("company", String.valueOf(r.get("company")), "role", String.valueOf(r.get("role"))),
                    r.get("collegeId") == null ? null : ((Number) r.get("collegeId")).intValue());
            jdbc.update("INSERT INTO tpo_share_event (share_id, action, detail) VALUES (:s, 'SHORTLIST_REMINDER', NULL)", new MapSqlParameterSource("s", r.get("id")));
        }
    }
}
