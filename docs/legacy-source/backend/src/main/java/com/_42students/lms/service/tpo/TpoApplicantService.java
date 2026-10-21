package com._42students.lms.service.tpo;

import com._42students.lms.model.tpo.PlacementRegistration;

import com._42students.lms.model.Job;
import com._42students.lms.model.JobApplication;
import com._42students.lms.model.Learner;
import com._42students.lms.repository.JobApplicationRepository;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.tpo.PlacementRegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Applicants tab: bulk move/reject (over the shared table component), "Not applied" + Remind,
 * and "Apply on behalf". See TPO V1 - Locked.docx §5.
 */
@Service
@RequiredArgsConstructor
public class TpoApplicantService {

    private final JobRepository jobRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final LearnerRepository learnerRepository;
    private final PlacementRegistrationRepository placementRegistrationRepository;
    private final EligibilityService eligibilityService;
    private final PlacementEligibilityService placementEligibility;
    private final ApplicationTransitionService transitionService;
    private final NotificationOutboxService outboxService;
    private final org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate jdbc;

    public List<JobApplication> applicants(Integer jobId) {
        return jobApplicationRepository.findByJobId(jobId);
    }

    /** Bulk reject with the internal/student reason split; over 25 rows the UI must confirm first. */
    @Transactional
    public ApplicationTransitionService.BulkResult bulkReject(List<Integer> applicationIds, Integer actorId, String internalReason) {
        return transitionService.bulkTransition(applicationIds, "REJECTED", actorId, "Not shortlisted", internalReason, true);
    }

    /**
     * "Move to...": only to Shortlisted, Test or Interview. Offered and Placed are set by offers, Waitlisted by results and
     * Withdrawn by the student; the endpoint used to take any status, so a crafted call could mark a student placed with
     * no offer behind it.
     */
    @Transactional
    public ApplicationTransitionService.BulkResult bulkMove(List<Integer> applicationIds, String newStatus, Integer actorId) {
        if (newStatus == null || !ApplicationTransitionService.MOVE_TARGETS.contains(newStatus)) {
            throw new IllegalStateException("Students can be moved only to Shortlisted, Test or Interview");
        }
        return transitionService.bulkTransition(applicationIds, newStatus, actorId, null, null, true);
    }

    /** Undo while the notices are still held: students go back where they were and nobody is told. -1 when it is too late. */
    @Transactional
    public int undo(Integer jobId, String undoGroupId, Integer actorId) {
        return transitionService.undo(jobId, undoGroupId, actorId);
    }

    /**
     * "Not applied (n)" — students who can genuinely act on this drive: not already applied,
     * in placements (Eligible), registered for PLACEMENTS (their latest registration: registration is
     * per batch now, not per season) and passing the same EligibilityService rules/overrides used
     * everywhere else in TPO V1. A drive without a season gets the same gate: it used to skip it,
     * so its count and its reminders included students who never registered.
     */
    public List<Learner> notApplied(Integer jobId) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new IllegalArgumentException("Drive not found"));
        List<JobApplication> applied = jobApplicationRepository.findByJobId(jobId);
        java.util.Set<Integer> appliedLearnerIds = applied.stream()
                .map(a -> a.getLearner() == null ? null : a.getLearner().getId())
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());
        Integer collegeId = job.getCollegeId();
        if (collegeId == null) return List.of();

        // Only students in placements (Eligible) can be on a drive's not-applied list.
        java.util.Map<Integer, PlacementEligibilityService.Resolved> inPlacements = placementEligibility.resolveCollege(collegeId);
        // BE-0100: start from every Eligible student of the college (the resolver covers them all), not from the first 5,000
        // learners; the list and "Remind all" used to miss everyone after that page.
        List<Integer> eligibleIds = inPlacements.entrySet().stream()
                .filter(e -> e.getValue() != null && PlacementEligibilityService.ELIGIBLE.equals(e.getValue().status))
                .map(java.util.Map.Entry::getKey)
                .filter(id -> !appliedLearnerIds.contains(id))
                .toList();
        List<Learner> inPlay = new java.util.ArrayList<>();
        for (int from = 0; from < eligibleIds.size(); from += 1000) {
            for (Learner l : learnerRepository.findAllById(eligibleIds.subList(from, Math.min(from + 1000, eligibleIds.size())))) {
                if (collegeId.equals(l.getCollegeId())) inPlay.add(l);
            }
        }
        // Registered for placements: the student's latest choice, whatever season row it was stored under (registration is per batch).
        // Every drive needs it, with or without a season: a drive created before seasons (seasonId null) used to skip this and list,
        // and remind, students who never registered.
        java.util.Map<Integer, PlacementRegistration> latest = new java.util.HashMap<>();
        if (!inPlay.isEmpty()) {
            for (PlacementRegistration r : placementRegistrationRepository.findByLearnerIdIn(inPlay.stream().map(Learner::getId).toList())) {
                PlacementRegistration cur = latest.get(r.getLearnerId());
                if (cur == null || (r.getId() != null && cur.getId() != null && r.getId() > cur.getId())) latest.put(r.getLearnerId(), r);
            }
        }
        List<Learner> candidates = inPlay.stream()
                .filter(l -> latest.get(l.getId()) != null && "PLACEMENTS".equals(latest.get(l.getId()).getChoice()))
                .toList();
        java.util.Set<Integer> eligibleLearnerIds = eligibilityService.eligibleLearnerIds(job, candidates);
        return candidates.stream().filter(l -> eligibleLearnerIds.contains(l.getId())).toList();
    }

    @Transactional
    /** Remind eligible students who have not applied; returns how many were reminded. Never after the deadline (they could not apply). */
    public int remindNotApplied(Integer jobId) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new IllegalArgumentException("Not found"));
        if (job.getApplicationDeadline() != null && job.getApplicationDeadline().isBefore(java.time.LocalDateTime.now(java.time.ZoneOffset.UTC)))
            throw new IllegalStateException("The deadline has passed, so they can no longer apply. Extend it first.");
        // Once a day per drive: every press used to remind every student who had not applied, again.
        Long today = jdbc.queryForObject("SELECT COUNT(*) FROM notification_outbox WHERE event = 'DRIVE_REMIND_NOT_APPLIED' AND channel = 'APP' " +
                "AND JSON_EXTRACT(payload_json, '$.jobId') = :j AND created_at > NOW() - INTERVAL 20 HOUR",
                new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("j", jobId), Long.class);
        if (today != null && today > 0) throw new IllegalStateException("Students who have not applied were already reminded today. One reminder a day at most.");
        List<Learner> who = notApplied(jobId);
        for (Learner l : who) {
            outboxService.enqueue("DRIVE_REMIND_NOT_APPLIED", "LEARNER", l.getId(), "APP",
                    Map.of("jobId", jobId), null, false);
        }
        return who.size();
    }
}
