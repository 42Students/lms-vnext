package com._42students.lms.service.tpo;

import com._42students.lms.dto.tpo.RoundForm;
import com._42students.lms.model.Job;
import com._42students.lms.model.tpo.JobLifecycleStatus;
import com._42students.lms.model.tpo.JobRound;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.repository.tpo.JobRoundRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/** Round create/edit/delete, clone-a-drive, and the eligible-student preview shown before Publish. */
@Service
@RequiredArgsConstructor
public class TpoDriveExtrasService {

    private final JobRepository jobRepository;
    private final JobRoundRepository jobRoundRepository;
    private final EligibilityService eligibilityService;
    private final TpoDriveService driveService;
    private final NamedParameterJdbcTemplate jdbc;
    private final PlacementEligibilityService placementEligibility;
    private final JobTypeService jobTypes;
    private final TpoSeasonService seasonService;
    private final JobLifecycleService lifecycleService;

    // ---------------------------------------------------------------- rounds
    @Transactional
    public JobRound saveRound(Integer jobId, Long roundId, RoundForm rf) {
        if (rf.getKind() == null || rf.getName() == null || rf.getName().isBlank()) {
            throw new IllegalArgumentException("A round needs a type and a name");
        }
        // The type decides which stage clearing the round leads to, so only the known types are taken.
        if (!ROUND_KINDS.contains(rf.getKind())) throw new IllegalArgumentException("Unknown round type");
        JobRound round;
        if (roundId != null) {
            round = jobRoundRepository.findById(roundId).orElseThrow(() -> new IllegalArgumentException("Not found"));
            if (!round.getJobId().equals(jobId)) throw new IllegalArgumentException("Not found");
            // Once students are booked into it or have results, a test can't quietly become an interview (or a talk): it would
            // change where everyone who cleared it ends up.
            if (!rf.getKind().equals(round.getKind()) && inUse(roundId)) {
                throw new IllegalStateException("Students are already in this round, so its type can't change. Add a new round instead.");
            }
        } else {
            round = new JobRound();
            round.setJobId(jobId);
            // BE-0156: two people adding a round at once take turns on the drive row, then take the next number after the
            // highest one (not the count, which repeats a number once a round in the middle was removed).
            jdbc.queryForList("SELECT id FROM job WHERE id = :j FOR UPDATE", new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("j", jobId));
            Integer maxSeq = jdbc.queryForObject("SELECT COALESCE(MAX(seq), 0) FROM job_round WHERE job_id = :j FOR UPDATE",
                    new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("j", jobId), Integer.class);
            round.setSeq((maxSeq == null ? 0 : maxSeq) + 1);
            round.setStatus("PENDING");
        }
        round.setKind(rf.getKind());
        round.setName(rf.getName().trim());
        round.setMode(rf.getMode());
        round.setScheduledDate(rf.getScheduledDate());
        round.setVenue(rf.getVenue());
        round.setMeetingUrl(rf.getMeetingUrl());
        round.setWhatToBring(rf.getWhatToBring());
        round.setPlatform(rf.getPlatform());
        round.setTestLink(rf.getTestLink());
        round.setDurationMinutes(rf.getDurationMinutes());
        round.setResultsDue(rf.getResultsDue());
        if (round.getScheduledDate() != null && "PENDING".equals(round.getStatus())) round.setStatus("SCHEDULED");
        return jobRoundRepository.save(round);
    }

    public static final java.util.Set<String> ROUND_KINDS = java.util.Set.of("TEST", "VENDOR_TEST", "GD", "INTERVIEW", "TALK");

    /** Results, students sitting in it, students booked into it or marked on the day: the round means something to them. */
    private boolean inUse(Long roundId) {
        Long n = jdbc.queryForObject("SELECT (SELECT COUNT(*) FROM round_result WHERE round_id = :r) + (SELECT COUNT(*) FROM job_application WHERE current_round_id = :r) + " +
                "(SELECT COUNT(*) FROM round_assignment WHERE round_id = :r) + (SELECT COUNT(*) FROM round_attendance WHERE round_id = :r)",
                new MapSqlParameterSource("r", roundId), Long.class);
        return n != null && n > 0;
    }

    /** A round that already has results, or students in it or booked into it, cannot be deleted (deleting one used to leave
     *  booked students pointing at nothing). */
    @Transactional
    public void deleteRound(Integer jobId, Long roundId) {
        JobRound round = jobRoundRepository.findById(roundId).orElseThrow(() -> new IllegalArgumentException("Not found"));
        if (!round.getJobId().equals(jobId)) throw new IllegalArgumentException("Not found");
        if (inUse(roundId)) {
            throw new IllegalStateException("This round already has results or students booked into it, so it can't be deleted");
        }
        // Its empty slots go with it (students booked into a slot already stop the delete above).
        jdbc.update("DELETE FROM round_slot WHERE round_id = :r", new MapSqlParameterSource("r", roundId));
        jobRoundRepository.delete(round);
        // Close the gap in the ordering.
        int seq = 1;
        for (JobRound r : jobRoundRepository.findByJobIdOrderBySeqAsc(jobId)) { r.setSeq(seq++); jobRoundRepository.save(r); }
    }

    /**
     * Drag-to-reorder: the new order of this drive's rounds, as a full list of round ids. Only allowed while nothing depends on the
     * order: once a round has results or applicants sitting in it, "round 2" means something to those students.
     */
    @Transactional
    public List<JobRound> reorderRounds(Integer jobId, List<Long> orderedIds) {
        List<JobRound> current = jobRoundRepository.findByJobIdOrderBySeqAsc(jobId);
        java.util.Set<Long> have = new java.util.HashSet<>();
        for (JobRound r : current) have.add(r.getId());
        if (orderedIds == null || orderedIds.size() != current.size() || !have.equals(new java.util.HashSet<>(orderedIds))) {
            throw new IllegalArgumentException("Send every round of this drive exactly once");
        }
        Long results = jdbc.queryForObject("SELECT COUNT(*) FROM round_result rr JOIN job_round r ON r.id = rr.round_id WHERE r.job_id = :j",
                new MapSqlParameterSource("j", jobId), Long.class);
        Long inRound = jdbc.queryForObject("SELECT (SELECT COUNT(*) FROM job_application WHERE job_id = :j AND current_round_id IS NOT NULL) + " +
                "(SELECT COUNT(*) FROM round_assignment ra JOIN job_round r ON r.id = ra.round_id WHERE r.job_id = :j)",
                new MapSqlParameterSource("j", jobId), Long.class);
        if ((results != null && results > 0) || (inRound != null && inRound > 0)) {
            throw new IllegalStateException("Rounds can only be reordered before any results are entered or students are in a round");
        }
        // Two passes so a unique (job, order) key is never hit half-way.
        int tmp = 1000;
        for (JobRound r : current) { r.setSeq(tmp++); jobRoundRepository.saveAndFlush(r); }
        java.util.Map<Long, JobRound> byId = new java.util.HashMap<>();
        for (JobRound r : current) byId.put(r.getId(), r);
        int seq = 1;
        List<JobRound> out = new java.util.ArrayList<>();
        for (Long id : orderedIds) { JobRound r = byId.get(id); r.setSeq(seq++); out.add(jobRoundRepository.saveAndFlush(r)); }
        return out;
    }

    // ---------------------------------------------------------------- clone
    /** What a clone left behind on purpose, so the TPO is told rather than surprised (the drive form shows it). */
    public record CloneResult(Job job, String sourceName, int droppedBatches, List<Integer> droppedPassingYears,
                              boolean wasRecordedOutside, boolean wasFromRecruiter) {}

    /** "Clone a past drive": a fresh draft with the same details, pay, eligibility and rounds; dates are cleared. */
    @Transactional
    public Job clone(Integer sourceJobId, Integer organizationId, Integer collegeId, Integer facultyId) {
        return cloneDrive(sourceJobId, organizationId, collegeId, facultyId).job();
    }

    /**
     * The copy starts the way a drive made on the form starts (TpoDriveService.createDraft): a draft through the lifecycle (so it is
     * active and listed), in the current season, owned by the TPO, internal only. It used to set the status by hand, keep the old
     * drive's "counts as placed" even after Settings > Job types changed, and copy last year's batches and passing years, so a
     * clone of a 2025 drive quietly targeted students who had already left.
     */
    @Transactional
    public CloneResult cloneDrive(Integer sourceJobId, Integer organizationId, Integer collegeId, Integer facultyId) {
        Job src = jobRepository.findById(sourceJobId).orElseThrow(() -> new IllegalArgumentException("Not found"));
        Job copy = new Job();
        copy.setJobTitle(src.getJobTitle());
        copy.setCompanyName(src.getCompanyName());
        copy.setCompanyLogo(src.getCompanyLogo());
        copy.setCompanyId(src.getCompanyId());
        copy.setJobDescription(src.getJobDescription());
        copy.setJdUrl(src.getJdUrl());
        copy.setLocation(src.getLocation());
        copy.setDriveMode(src.getDriveMode());
        copy.setCtcRange(src.getCtcRange());
        copy.setCategory(src.getCategory());
        copy.setRequiresExternalRegistration(src.getRequiresExternalRegistration());
        copy.setExternalPortalName(src.getExternalPortalName());
        copy.setExternalPortalUrl(src.getExternalPortalUrl());
        copy.setRoleOptionsJson(src.getRoleOptionsJson());
        // Everything else the drive form saves: a cloned internship used to come back as a default type that counts as placed,
        // and lost its wanted skills, its off-campus details and its outside apply link.
        copy.setJobType(src.getJobType());
        // Whether offers count as placed follows the college's job types today, as it does for a drive made on the form.
        copy.setCountsAsPlaced(src.getJobType() == null ? src.getCountsAsPlaced() : jobTypes.countsAsPlaced(collegeId, src.getJobType()));
        copy.setCategoryOverrideReason(src.getCategoryOverrideReason());
        copy.setCandidatePreferences(src.getCandidatePreferences());
        // A drive recorded after it happened outside skips the deadline and the apply checks; a copy is a real new drive.
        copy.setRecordedOutside(false);
        copy.setHostCollegeName(src.getHostCollegeName());
        copy.setTravelNote(src.getTravelNote());
        copy.setExternalApplyUrl(src.getExternalApplyUrl());

        // Eligibility, without batches that have finished placements and passing years already behind us.
        int droppedBatches = 0;
        List<Integer> droppedYears = new java.util.ArrayList<>();
        Object eligibility = src.getEligibilityJson();
        java.util.Map<String, Object> e = asMap(eligibility);
        if (e != null) {
            java.util.Set<Long> finished = placementEligibility.finishedBatchIds(collegeId);
            if (e.get("batchIds") instanceof List<?> ids) {
                List<Object> keep = new java.util.ArrayList<>();
                for (Object id : ids) {
                    if (id instanceof Number n && finished.contains(n.longValue())) droppedBatches++; else keep.add(id);
                }
                e.put("batchIds", keep);
            }
            if (e.get("passingYears") instanceof List<?> years) {
                int thisYear = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Kolkata")).getYear();
                List<Object> keep = new java.util.ArrayList<>();
                for (Object y : years) {
                    if (y instanceof Number n && n.intValue() < thisYear) droppedYears.add(n.intValue()); else keep.add(y);
                }
                e.put("passingYears", keep);
            }
            eligibility = e;
        }
        copy.setEligibilityJson(eligibility);

        copy.setOrganizationId(organizationId);
        copy.setCollegeId(collegeId);
        copy.setCreatedBy(facultyId);
        copy.setOwnerFacultyId(facultyId);
        copy.setPostedDate(LocalDateTime.now());
        copy.setScreeningVersion("v1");
        copy.setVisibilityType("INTERNAL_ONLY");
        var season = seasonService.current(collegeId);
        if (season != null) copy.setSeasonId(season.getId());
        lifecycleService.transition(copy, JobLifecycleStatus.DRAFT);
        copy = jobRepository.save(copy);
        int seq = 1;
        for (JobRound r : jobRoundRepository.findByJobIdOrderBySeqAsc(sourceJobId)) {
            JobRound n = new JobRound();
            // The plan is copied; when it happens, the meeting link and the test link belong to the old drive's day.
            n.setJobId(copy.getId()); n.setSeq(seq++); n.setKind(r.getKind()); n.setName(r.getName()); n.setMode(r.getMode());
            n.setVenue(r.getVenue()); n.setWhatToBring(r.getWhatToBring()); n.setPlatform(r.getPlatform());
            n.setDurationMinutes(r.getDurationMinutes()); n.setStatus("PENDING");
            jobRoundRepository.save(n);
        }
        String sourceName = (src.getCompanyName() == null ? "" : src.getCompanyName() + " · ") + src.getJobTitle();
        return new CloneResult(copy, sourceName, droppedBatches, droppedYears, Boolean.TRUE.equals(src.getRecordedOutside()), src.getRecruiterId() != null);
    }

    /** The stored eligibility as an editable map (it can arrive as a map or as JSON text); null when there is none. */
    @SuppressWarnings("unchecked")
    private static java.util.Map<String, Object> asMap(Object eligibility) {
        if (eligibility == null) return null;
        com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
        try {
            if (eligibility instanceof String str) return str.isBlank() ? null : om.readValue(str, java.util.LinkedHashMap.class);
            return om.convertValue(eligibility, java.util.LinkedHashMap.class);
        } catch (Exception ex) {
            return null;
        }
    }

    // ---------------------------------------------------------------- list counts
    /** Per drive of this college: applications (not withdrawn) and offers students hold (released or accepted). Two grouped queries. */
    public List<Map<String, Object>> listCounts(Integer collegeId) {
        MapSqlParameterSource c = new MapSqlParameterSource("c", collegeId);
        Map<Integer, Map<String, Object>> out = new java.util.LinkedHashMap<>();
        for (Map<String, Object> r : jdbc.queryForList(
                "SELECT a.job_id AS jobId, COUNT(*) AS applied, " +
                // Still in the running: what Close turns into Not selected (the Drives list says how many before closing).
                "  SUM(a.application_status IN ('APPLIED','SHORTLISTED','ASSESSMENT','INTERVIEW','WAITLISTED')) AS openApps " +
                "FROM job_application a JOIN job j ON j.id = a.job_id " +
                "WHERE j.college_id = :c AND (j.is_deleted = 0 OR j.is_deleted IS NULL) AND (a.is_deleted = 0 OR a.is_deleted IS NULL) " +
                "AND (a.application_status IS NULL OR a.application_status <> 'WITHDRAWN') GROUP BY a.job_id", c)) {
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("jobId", ((Number) r.get("jobId")).intValue()); m.put("applied", ((Number) r.get("applied")).longValue()); m.put("offers", 0L);
            m.put("open", r.get("openApps") == null ? 0L : ((Number) r.get("openApps")).longValue());
            out.put(((Number) r.get("jobId")).intValue(), m);
        }
        for (Map<String, Object> r : jdbc.queryForList(
                "SELECT a.job_id AS jobId, COUNT(*) AS offers FROM job_offer o JOIN job_application a ON a.id = o.application_id JOIN job j ON j.id = a.job_id " +
                "WHERE j.college_id = :c AND (j.is_deleted = 0 OR j.is_deleted IS NULL) AND o.status IN ('RELEASED','ACCEPTED') GROUP BY a.job_id", c)) {
            int id = ((Number) r.get("jobId")).intValue();
            out.computeIfAbsent(id, k -> { Map<String, Object> m = new java.util.LinkedHashMap<>(); m.put("jobId", k); m.put("applied", 0L); return m; })
                    .put("offers", ((Number) r.get("offers")).longValue());
        }
        // Where each drive is: its rounds (how many, how many done, the next one) and, for live drives, how many students are eligible.
        for (Map<String, Object> r : jdbc.queryForList(
                "SELECT r.job_id AS jobId, COUNT(*) AS rounds, SUM(r.status = 'COMPLETED') AS roundsDone, " +
                "  (SELECT r2.name FROM job_round r2 WHERE r2.job_id = r.job_id AND r2.status <> 'COMPLETED' ORDER BY r2.seq LIMIT 1) AS nextRound, " +
                "  (SELECT r2.scheduled_date FROM job_round r2 WHERE r2.job_id = r.job_id AND r2.status <> 'COMPLETED' ORDER BY r2.seq LIMIT 1) AS nextRoundAt " +
                "FROM job_round r JOIN job j ON j.id = r.job_id WHERE j.college_id = :c AND (j.is_deleted = 0 OR j.is_deleted IS NULL) GROUP BY r.job_id", c)) {
            int id = ((Number) r.get("jobId")).intValue();
            Map<String, Object> m = out.computeIfAbsent(id, k -> { Map<String, Object> x = new java.util.LinkedHashMap<>(); x.put("jobId", k); x.put("applied", 0L); x.put("offers", 0L); return x; });
            m.put("rounds", ((Number) r.get("rounds")).longValue());
            m.put("roundsDone", r.get("roundsDone") == null ? 0L : ((Number) r.get("roundsDone")).longValue());
            m.put("nextRound", r.get("nextRound"));
            m.put("nextRoundAt", r.get("nextRoundAt"));
        }
        List<Job> live = jobRepository.findByCollegeIdAndIsDeletedFalse(collegeId).stream()
                .filter(j -> "PUBLISHED".equals(j.getLifecycleStatus())).toList();
        if (!live.isEmpty()) {
            eligibilityService.eligibleCounts(live, reachableStudents(collegeId)).forEach((id, n) ->
                    out.computeIfAbsent(id, k -> { Map<String, Object> x = new java.util.LinkedHashMap<>(); x.put("jobId", k); x.put("applied", 0L); x.put("offers", 0L); return x; })
                            .put("eligible", n));
            // Of those, the ones registered for placements: the only ones who can apply (the drive page's "Registered and eligible").
            eligibilityService.eligibleCounts(live, reachableStudents(collegeId, true)).forEach((id, n) ->
                    out.computeIfAbsent(id, k -> { Map<String, Object> x = new java.util.LinkedHashMap<>(); x.put("jobId", k); x.put("applied", 0L); x.put("offers", 0L); return x; })
                            .put("registeredEligible", n));
        }
        return new ArrayList<>(out.values());
    }

    // ---------------------------------------------------------------- eligibility preview
    /** "284 eligible, 37 excluded by rules", by branch, and who is excluded and why (capped at 200 names). */
    /** Students a drive can reach: in placements (Eligible) and registered for placements, or not registered yet. id -> branch. */
    Map<Integer, String> reachableStudents(Integer collegeId) {
        return reachableStudents(collegeId, false);
    }

    /** registeredOnly: only students who registered for placements (not the ones who haven't registered yet). */
    Map<Integer, String> reachableStudents(Integer collegeId, boolean registeredOnly) {
        List<Map<String, Object>> students = jdbc.queryForList(
                "SELECT l.id, l.department AS branch, " +
                "  COALESCE((SELECT pr.choice FROM placement_registration pr WHERE pr.learner_id = l.id ORDER BY pr.id DESC LIMIT 1), " + RegistrationRule.APPLIED_EARLIER + ") AS registration " +
                "FROM learner l WHERE l.college_id = :c AND (l.is_deleted = 0 OR l.is_deleted IS NULL)",
                new MapSqlParameterSource("c", collegeId));
        Map<Integer, PlacementEligibilityService.Resolved> inPlacements = placementEligibility.resolveCollege(collegeId);
        Map<Integer, String> out = new java.util.LinkedHashMap<>();
        for (Map<String, Object> s : students) {
            int id = ((Number) s.get("id")).intValue();
            PlacementEligibilityService.Resolved r = inPlacements.get(id);
            String reg = (String) s.get("registration");
            if (r == null || !PlacementEligibilityService.ELIGIBLE.equals(r.status)) continue;
            if (reg != null && !"PLACEMENTS".equals(reg)) continue;
            if (registeredOnly && reg == null) continue;
            out.put(id, (String) s.get("branch"));
        }
        return out;
    }

    public Map<String, Object> eligibilityPreview(Integer jobId, Integer collegeId) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new IllegalArgumentException("Not found"));
        List<Map<String, Object>> students = jdbc.queryForList(
                "SELECT l.id, l.first_name AS firstName, l.last_name AS lastName, l.roll_number AS roll, l.department AS branch, " +
                "  COALESCE((SELECT pr.choice FROM placement_registration pr WHERE pr.learner_id = l.id ORDER BY pr.id DESC LIMIT 1), " + RegistrationRule.APPLIED_EARLIER + ") AS registration " +
                "FROM learner l WHERE l.college_id = :c AND (l.is_deleted = 0 OR l.is_deleted IS NULL)",
                new MapSqlParameterSource("c", collegeId));
        int eligible = 0, excluded = 0, notRegistered = 0, inOnMissing = 0, inOnUnverified = 0;
        Map<String, Integer> byBranch = new TreeMap<>();
        Map<String, Integer> excludedByRule = new java.util.LinkedHashMap<>(); // "10th %" -> students it keeps out
        List<Map<String, Object>> excludedList = new ArrayList<>();
        // Only students in placements (Eligible) are counted: the rest are not reachable by any drive.
        Map<Integer, PlacementEligibilityService.Resolved> inPlacements = placementEligibility.resolveCollege(collegeId);
        students = students.stream().filter(s -> {
            PlacementEligibilityService.Resolved r = inPlacements.get(((Number) s.get("id")).intValue());
            return r != null && PlacementEligibilityService.ELIGIBLE.equals(r.status);
        }).toList();
        Map<Integer, String> branchById = new java.util.LinkedHashMap<>();
        for (Map<String, Object> s : students) {
            String reg = (String) s.get("registration");
            if (reg != null && !"PLACEMENTS".equals(reg)) continue;
            branchById.put(((Number) s.get("id")).intValue(), (String) s.get("branch"));
        }
        Map<Integer, EligibilityService.EligibilityResult> results = eligibilityService.evaluateAll(job, branchById);
        for (Map<String, Object> s : students) {
            String reg = (String) s.get("registration");
            if (reg != null && !"PLACEMENTS".equals(reg)) continue; // higher studies / not interested never count
            if (reg == null) notRegistered++;
            int id = ((Number) s.get("id")).intValue();
            String branch = (String) s.get("branch");
            EligibilityService.EligibilityResult r = results.get(id);
            if (r.eligible) {
                eligible++;
                byBranch.merge(branch == null || branch.isBlank() ? "Unknown" : branch.trim(), 1, Integer::sum);
                if (r.checks.stream().anyMatch(c -> "Not provided".equals(c.detail))) inOnMissing++;
                if (r.checks.stream().anyMatch(c -> c.detail != null && c.detail.endsWith("· not verified"))) inOnUnverified++;
            } else {
                excluded++;
                for (EligibilityService.RuleCheck c : r.checks) if (!c.pass) excludedByRule.merge(c.rule, 1, Integer::sum);
                if (excludedList.size() < 200) {
                    List<String> why = new ArrayList<>();
                    for (EligibilityService.RuleCheck c : r.checks) if (!c.pass) why.add(c.rule + ": " + c.detail);
                    excludedList.add(Map.of("learnerId", id, "name", (s.get("firstName") + " " + (s.get("lastName") == null ? "" : s.get("lastName"))).trim(),
                            "roll", s.get("roll") == null ? "" : s.get("roll"), "reasons", why));
                }
            }
        }
        Map<String, Object> out = new java.util.LinkedHashMap<>();
        out.put("eligible", eligible); out.put("excluded", excluded); out.put("notYetRegistered", notRegistered);
        out.put("eligibleByBranch", byBranch); out.put("excludedStudents", excludedList);
        // Why the rest are out, rule by rule, and how many are in only because a mark is missing or not verified yet.
        out.put("excludedByRule", excludedByRule); out.put("eligibleOnMissing", inOnMissing); out.put("eligibleOnUnverified", inOnUnverified);
        return out;
    }

    /**
     * "Company agreed" include (or a considered exclude) of one named student, with a reason. Logged, and shown to the recruiter as
     * "Added by college: reason" (TPO V1 - Locked.docx §4). Replaces an earlier decision for the same student.
     */
    @Transactional
    public void setOverride(Integer jobId, Integer learnerId, String type, String reason, Integer actorId) {
        if (!"INCLUDE".equals(type) && !"EXCLUDE".equals(type)) throw new IllegalArgumentException("Choose include or exclude");
        if (reason == null || reason.trim().length() < 3) throw new IllegalArgumentException("A reason is required");
        jdbc.update("INSERT INTO job_eligibility_override (job_id, learner_id, override_type, reason, created_by) VALUES (:j, :l, :t, :r, :by) " +
                        "ON DUPLICATE KEY UPDATE override_type = VALUES(override_type), reason = VALUES(reason), created_by = VALUES(created_by)",
                new MapSqlParameterSource("j", jobId).addValue("l", learnerId).addValue("t", type).addValue("r", reason.trim()).addValue("by", actorId));
    }

    @Transactional
    public void removeOverride(Integer jobId, Integer learnerId) {
        jdbc.update("DELETE FROM job_eligibility_override WHERE job_id = :j AND learner_id = :l", new MapSqlParameterSource("j", jobId).addValue("l", learnerId));
    }

    @Transactional
    public void setAutoApply(Integer jobId, boolean enabled) {
        jdbc.update("UPDATE job SET results_auto_apply = :e WHERE id = :j", new MapSqlParameterSource("e", enabled).addValue("j", jobId));
    }

    /** Approve a recruiter request and publish in one step ("Approve & publish"). */
    @Transactional
    public Job approveAndPublish(Integer jobId, Integer actorId) {
        driveService.approveRequest(jobId, actorId);
        return driveService.publish(jobId, actorId, true);
    }
}
