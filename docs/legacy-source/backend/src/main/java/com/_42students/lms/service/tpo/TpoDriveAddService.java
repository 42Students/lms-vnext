package com._42students.lms.service.tpo;

import com._42students.lms.model.Job;
import com._42students.lms.model.JobApplication;
import com._42students.lms.model.Learner;
import com._42students.lms.repository.JobApplicationRepository;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.repository.LearnerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * "Add to drive": the placement cell puts students it chose (for example from the students list) on a drive.
 * One student or up to {@link #MAX} at once. Every student is checked on their own, so one problem never blocks the rest:
 * already on the drive, debarred, another college, not eligible. A student who is not eligible can be added on purpose
 * with a reason, which is recorded as an "added by college" override. A debarred student never can.
 * Each added student is told and has 48 hours to opt out, exactly like "apply on behalf" always did.
 */
@Service
@RequiredArgsConstructor
public class TpoDriveAddService {

    public static final int MAX = 200;
    public static final String ADDED = "ADDED";
    public static final String ALREADY_ON_DRIVE = "ALREADY_ON_DRIVE";
    public static final String DEBARRED = "DEBARRED";
    public static final String NOT_ELIGIBLE = "NOT_ELIGIBLE";
    public static final String NOT_IN_COLLEGE = "NOT_IN_COLLEGE";

    private final JobRepository jobRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final LearnerRepository learnerRepository;
    private final EligibilityService eligibilityService;
    private final TpoDriveExtrasService extrasService;
    private final JobLifecycleService lifecycleService;
    private final NotificationOutboxService outboxService;
    private final TpoAuditService audit;
    private final NamedParameterJdbcTemplate jdbc;

    /** The words the placement cell reads for each outcome. */
    public static String reasonText(String code) {
        return switch (code) {
            case ALREADY_ON_DRIVE -> "Already on this drive";
            case DEBARRED -> "Debarred from drives";
            case NOT_ELIGIBLE -> "Not eligible for this drive";
            case NOT_IN_COLLEGE -> "Not a student of this college";
            default -> code;
        };
    }

    @Transactional
    public Map<String, Object> add(Integer jobId, Integer collegeId, List<Integer> learnerIds, boolean includeIneligible, String reason, Integer actorId) {
        if (learnerIds == null || learnerIds.isEmpty()) throw new IllegalArgumentException("Choose at least one student");
        Set<Integer> ids = new LinkedHashSet<>();
        for (Integer id : learnerIds) if (id != null) ids.add(id);
        if (ids.isEmpty()) throw new IllegalArgumentException("Choose at least one student");
        if (ids.size() > MAX) throw new IllegalArgumentException("Add at most " + MAX + " students at a time");
        if (includeIneligible && (reason == null || reason.trim().length() < 3)) throw new IllegalArgumentException("A reason is required to add students who are not eligible");

        Job job = jobRepository.findById(jobId).orElseThrow(() -> new IllegalArgumentException("Drive not found"));
        if (collegeId == null || !collegeId.equals(job.getCollegeId())) throw new IllegalArgumentException("Drive not found");
        if (!lifecycleService.isOpenForApplications(job)) throw new IllegalArgumentException("This drive is not open for applications. Publish it first, or pick an open drive.");

        Map<Integer, Learner> learners = new LinkedHashMap<>();
        for (Learner l : learnerRepository.findAllById(ids)) learners.put(l.getId(), l);

        Set<Integer> onDrive = new HashSet<>();
        jdbc.query("SELECT learner_id FROM job_application WHERE job_id = :j AND learner_id IN (:ids)",
                new MapSqlParameterSource("j", jobId).addValue("ids", ids), rs -> { onDrive.add(rs.getInt("learner_id")); });
        Set<Integer> debarred = new HashSet<>();
        jdbc.query("SELECT DISTINCT learner_id FROM placement_debarment WHERE learner_id IN (:ids) AND lifted_at IS NULL AND (until_date IS NULL OR until_date >= CURDATE()) AND (until_date IS NOT NULL OR until_drives IS NULL OR drives_counted < until_drives)",
                new MapSqlParameterSource("ids", ids), rs -> { debarred.add(rs.getInt("learner_id")); });
        List<Learner> ofCollege = learners.values().stream().filter(l -> collegeId.equals(l.getCollegeId())).toList();
        Set<Integer> eligible = eligibilityService.eligibleLearnerIds(job, ofCollege);

        List<Map<String, Object>> results = new ArrayList<>();
        int added = 0;
        for (Integer id : ids) {
            Learner l = learners.get(id);
            String outcome;
            if (l == null || !collegeId.equals(l.getCollegeId())) outcome = NOT_IN_COLLEGE;
            else if (onDrive.contains(id)) outcome = ALREADY_ON_DRIVE;
            else if (debarred.contains(id)) outcome = DEBARRED;
            else if (!eligible.contains(id) && !includeIneligible) outcome = NOT_ELIGIBLE;
            else {
                boolean override = !eligible.contains(id);
                if (override) extrasService.setOverride(jobId, id, "INCLUDE", reason.trim(), actorId);
                createApplication(job, l);
                outcome = ADDED;
                added++;
            }
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("learnerId", id);
            row.put("outcome", outcome);
            row.put("message", ADDED.equals(outcome) ? "Added" : reasonText(outcome));
            results.add(row);
        }
        if (added > 0) {
            audit.log(collegeId, "TPO", actorId, "STUDENTS_ADDED_TO_DRIVE", "DRIVE", jobId.longValue(), added + " added, " + (ids.size() - added) + " skipped");
            audit.bell(collegeId, "STUDENTS_ADDED", added + " student" + (added == 1 ? "" : "s") + " added to " + job.getCompanyName(), job.getJobTitle(), "/tpo/drives/" + jobId);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("added", added);
        out.put("skipped", ids.size() - added);
        out.put("results", results);
        return out;
    }

    private void createApplication(Job job, Learner learner) {
        JobApplication application = new JobApplication();
        application.setJob(job);
        application.setLearner(learner);
        application.setApplicationStatus("APPLIED");
        application.setOrganizationId(job.getOrganizationId());
        application.setSource("APPLIED_BY_COLLEGE");
        application.setAppliedByCollege(true);
        application.setAppliedByCollegeOptOutUntil(LocalDateTime.now().plusHours(48));
        application.setPublicRef(JobApplication.newPublicRef());
        jobApplicationRepository.save(application);
        outboxService.enqueue("APPLIED_ON_BEHALF", "LEARNER", learner.getId(), "APP",
                Map.of("jobId", job.getId(), "applicationId", application.getId()), null, false);
    }
}
