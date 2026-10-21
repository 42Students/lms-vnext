package com._42students.lms.service.tpo;

import com._42students.lms.model.Job;
import com._42students.lms.model.tpo.JobLifecycleStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * What happens when the terms of a live drive change (owner, 19 Oct 2026): everyone still in the drive is told, and applicants
 * the new rules leave out are flagged "Now ineligible" for the placement cell (never removed). Used by the drive form ("notify
 * applicants") and by accepted or answered change requests, which changed a live drive without telling anyone.
 */
@Service
@RequiredArgsConstructor
public class LiveDriveChangeService {

    /** Change-request fields that change what a student signed up for; a new title or description is not one. */
    public static final Set<String> TERMS = Set.of("LOCATION", "JOB_TYPE", "MODE", "DEADLINE", "CTC_LPA", "STIPEND", "MIN_CGPA", "BRANCHES");
    /** Fields that change who may apply. */
    public static final Set<String> RULES = Set.of("MIN_CGPA", "BRANCHES");

    private final NamedParameterJdbcTemplate jdbc;
    private final NotificationOutboxService outbox;
    private final EligibilityService eligibility;
    private final TpoAuditService audit;

    /**
     * DRIVE_UPDATED to every applicant still in the drive (not withdrawn, not turned down) of a live drive. what names the change
     * ("Application deadline"), or null when the form changed several things. Returns how many were told.
     */
    @Transactional
    public int tellApplicants(Job job, String what) {
        if (job == null || !JobLifecycleStatus.PUBLISHED.equals(job.getLifecycleStatus())) return 0;
        List<Integer> learners = jdbc.queryForList("SELECT DISTINCT learner_id FROM job_application WHERE job_id = :j AND learner_id IS NOT NULL " +
                        "AND (is_deleted = 0 OR is_deleted IS NULL) AND application_status NOT IN ('REJECTED','WITHDRAWN')",
                new MapSqlParameterSource("j", job.getId()), Integer.class);
        Map<String, Object> payload = new HashMap<>();
        payload.put("jobId", job.getId());
        payload.put("changed", what == null || what.isBlank() ? "" : "What changed: " + what + ".");
        for (Integer learnerId : learners) {
            outbox.enqueue("DRIVE_UPDATED", "LEARNER", learnerId, "APP", payload, null, false);
        }
        return learners.size();
    }

    /**
     * After a live drive's rules change: its open applications are checked against the new rules. A newly ineligible applicant is
     * flagged (the change notice already told them the drive changed); one who qualifies again loses the flag. Returns how many were
     * newly flagged, and rings the placement cell's bell when any were.
     */
    @Transactional
    public int recheckEligibility(Job job) {
        if (job == null || !JobLifecycleStatus.PUBLISHED.equals(job.getLifecycleStatus())) return 0;
        List<Map<String, Object>> apps = jdbc.queryForList(
                "SELECT a.id AS applicationId, a.learner_id AS learnerId, a.ineligible_flag_at AS flagged, l.department AS branch " +
                        "FROM job_application a JOIN learner l ON l.id = a.learner_id WHERE a.job_id = :j " +
                        "AND (a.is_deleted = 0 OR a.is_deleted IS NULL) AND a.application_status IN ('APPLIED','SHORTLISTED','ASSESSMENT','INTERVIEW')",
                new MapSqlParameterSource("j", job.getId()));
        int flagged = 0;
        for (Map<String, Object> a : apps) {
            int learnerId = ((Number) a.get("learnerId")).intValue();
            boolean eligible = eligibility.evaluate(job, learnerId, (String) a.get("branch")).eligible;
            Object id = a.get("applicationId");
            if (!eligible && a.get("flagged") == null) {
                jdbc.update("UPDATE job_application SET ineligible_flag_at = NOW() WHERE id = :id", new MapSqlParameterSource("id", id));
                audit.log(job.getCollegeId(), "SYSTEM", null, "APPLICANT_FLAGGED_INELIGIBLE", "DRIVE", (long) job.getId(),"learner " + learnerId + " (drive rules changed)");
                flagged++;
            } else if (eligible && a.get("flagged") != null) {
                jdbc.update("UPDATE job_application SET ineligible_flag_at = NULL WHERE id = :id", new MapSqlParameterSource("id", id));
            }
        }
        if (flagged > 0) {
            audit.bell(job.getCollegeId(), "INELIGIBLE_FLAGGED", flagged + " applicant(s) no longer meet the rules of " + job.getJobTitle(),
                    "The drive's rules changed. They are flagged, not removed.", "/tpo/drives/" + job.getId());
        }
        return flagged;
    }
}
