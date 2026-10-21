package com._42students.lms.service.tpo;

import com._42students.lms.common.MarksConversion;
import com._42students.lms.model.Job;
import com._42students.lms.model.Learner;
import com._42students.lms.model.tpo.JobEligibility;
import com._42students.lms.model.tpo.JobEligibilityOverride;
import com._42students.lms.model.tpo.LearnerAcademicRecord;
import com._42students.lms.repository.tpo.JobEligibilityOverrideRepository;
import com._42students.lms.repository.tpo.LearnerAcademicRecordRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

/**
 * Evaluates the closed V1 eligibility rule set. Marks are the ones the Students table shows (AcademicMarksService): verified
 * first, else the student's own Education, flagged "not verified"; gender is the profile's. A missing value does not reject:
 * it is reported as "Not provided" and the student stays eligible on that criterion, unless the drive asks for verified marks
 * only (verifiedMarksOnly), when unverified or missing marks fail the marks rules. Per-student include/exclude overrides always
 * win. See TPO V1 - Locked.docx §4 and the drive form audit of 5 Oct 2026 (docs/tpo-ux/DRIVE-FORM-AUDIT-2026-10-05.md).
 */
@Service
@RequiredArgsConstructor
public class EligibilityService {

    private final LearnerAcademicRecordRepository academicRecordRepository;
    private final JobEligibilityOverrideRepository overrideRepository;
    private final ObjectMapper objectMapper;

    /** Marks as the Students table shows them. Optional so the rule evaluator still works on the academic record alone in unit tests. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private AcademicMarksService academicMarks;

    /** For the Batch rule and finished batches. Optional so the rule evaluator still works on its own in unit tests. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate jdbc;

    /** A learner's batch for the rules: which batch, and whether that batch has finished placements. */
    public static final class BatchInfo {
        public final Long batchId;
        public final boolean finished;
        public BatchInfo(Long batchId, boolean finished) { this.batchId = batchId; this.finished = finished; }
    }
    private static final BatchInfo NO_BATCH = new BatchInfo(null, false);

    /** One read for many learners: their batch (learner.class_id -> class.batch_id) and whether it is finished. */
    public Map<Integer, BatchInfo> batchInfo(java.util.Collection<Integer> learnerIds) {
        Map<Integer, BatchInfo> out = new java.util.HashMap<>();
        if (jdbc == null || learnerIds == null || learnerIds.isEmpty()) return out;
        jdbc.query("SELECT l.id AS l, c.batch_id AS b, (pb.finished_at IS NOT NULL) AS f FROM learner l JOIN class c ON c.id = l.class_id " +
                        "LEFT JOIN placement_batch pb ON pb.batch_id = c.batch_id WHERE l.id IN (:ids)",
                new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("ids", learnerIds),
                rs -> { long b = rs.getLong("b"); out.put(rs.getInt("l"), new BatchInfo(rs.wasNull() ? null : b, rs.getBoolean("f"))); });
        return out;
    }

    public JobEligibility parse(Job job) {
        if (job.getEligibilityJson() == null) return new JobEligibility();
        return objectMapper.convertValue(job.getEligibilityJson(), JobEligibility.class);
    }

    /** One rule's result: the rule name, whether it passed, and what to show the student. */
    public static class RuleCheck {
        public final String rule;
        public final boolean pass;
        public final String detail;

        public RuleCheck(String rule, boolean pass, String detail) {
            this.rule = rule;
            this.pass = pass;
            this.detail = detail;
        }
    }

    public static class EligibilityResult {
        public final boolean eligible;
        public final List<RuleCheck> checks;
        public final boolean isOverride;

        public EligibilityResult(boolean eligible, List<RuleCheck> checks, boolean isOverride) {
            this.eligible = eligible;
            this.checks = checks;
            this.isOverride = isOverride;
        }
    }

    public EligibilityResult evaluate(Job job, Integer learnerId, String learnerBranch) {
        Optional<JobEligibilityOverride> override = overrideRepository.findByJobIdAndLearnerId(job.getId(), learnerId);
        if (override.isPresent()) {
            boolean included = "INCLUDE".equals(override.get().getOverrideType());
            return new EligibilityResult(included, List.of(
                    new RuleCheck("Added by college", true, override.get().getReason())), true);
        }

        return evaluateRules(parse(job), learnerId, learnerBranch);
    }

    /**
     * Bulk evaluate(): the same answer for every learner, from one read of the academic records and
     * one read of this job's overrides. A per-learner loop over evaluate() made two queries per
     * student (the drive page's eligibility preview took 40+ seconds for one college).
     * Keys keep the order of the input map.
     */
    public Map<Integer, EligibilityResult> evaluateAll(Job job, Map<Integer, String> branchByLearner) {
        Map<Integer, EligibilityResult> out = new LinkedHashMap<>();
        if (branchByLearner == null || branchByLearner.isEmpty()) return out;
        Map<Integer, JobEligibilityOverride> overrides = new LinkedHashMap<>();
        for (JobEligibilityOverride o : overrideRepository.findByJobId(job.getId())) overrides.put(o.getLearnerId(), o);
        Map<Integer, EligibilityResult> byRules = evaluateRulesAll(parse(job), branchByLearner);
        for (Map.Entry<Integer, String> e : branchByLearner.entrySet()) {
            JobEligibilityOverride o = overrides.get(e.getKey());
            out.put(e.getKey(), o != null
                    ? new EligibilityResult("INCLUDE".equals(o.getOverrideType()), List.of(new RuleCheck("Added by college", true, o.getReason())), true)
                    : byRules.get(e.getKey()));
        }
        return out;
    }

    /** Bulk evaluateRules(): criteria only, no overrides, one read of the marks. */
    public Map<Integer, EligibilityResult> evaluateRulesAll(JobEligibility rules, Map<Integer, String> branchByLearner) {
        Map<Integer, EligibilityResult> out = new LinkedHashMap<>();
        if (branchByLearner == null || branchByLearner.isEmpty()) return out;
        Map<Integer, Academic> academics = academics(branchByLearner.keySet());
        Map<Integer, BatchInfo> batches = batchInfo(branchByLearner.keySet());
        for (Map.Entry<Integer, String> e : branchByLearner.entrySet()) {
            out.put(e.getKey(), evaluateRulesWith(rules, academics.get(e.getKey()), e.getValue(), batches.getOrDefault(e.getKey(), NO_BATCH)));
        }
        return out;
    }

    /** Eligible students per drive for many drives at once (the Drives list): one read of the marks and batches for all of them. */
    public Map<Integer, Long> eligibleCounts(List<Job> jobs, Map<Integer, String> branchByLearner) {
        Map<Integer, Long> out = new LinkedHashMap<>();
        if (jobs == null || jobs.isEmpty()) return out;
        if (branchByLearner == null || branchByLearner.isEmpty()) { jobs.forEach(j -> out.put(j.getId(), 0L)); return out; }
        Map<Integer, Academic> academics = academics(branchByLearner.keySet());
        Map<Integer, BatchInfo> batches = batchInfo(branchByLearner.keySet());
        for (Job job : jobs) {
            Map<Integer, JobEligibilityOverride> overrides = new HashMap<>();
            for (JobEligibilityOverride o : overrideRepository.findByJobId(job.getId())) overrides.put(o.getLearnerId(), o);
            JobEligibility rules = parse(job);
            long n = 0;
            for (Map.Entry<Integer, String> e : branchByLearner.entrySet()) {
                JobEligibilityOverride o = overrides.get(e.getKey());
                boolean ok = o != null ? "INCLUDE".equals(o.getOverrideType())
                        : evaluateRulesWith(rules, academics.get(e.getKey()), e.getValue(), batches.getOrDefault(e.getKey(), NO_BATCH)).eligible;
                if (ok) n++;
            }
            out.put(job.getId(), n);
        }
        return out;
    }

    /** A criteria object from any JSON column that uses the JobEligibility shape (job.eligibility_json, lms_group_rule.criteria_json). */
    public JobEligibility parseCriteria(Object json) {
        if (json == null) return new JobEligibility();
        return objectMapper.convertValue(json, JobEligibility.class);
    }

    /**
     * Criteria-only evaluation, without per-job overrides. Group rules use this directly: a group
     * expresses "keep this student regardless" through the member's lock, not through an override.
     */
    public EligibilityResult evaluateRules(JobEligibility rules, Integer learnerId, String learnerBranch) {
        return evaluateRulesWith(rules, academics(List.of(learnerId)).get(learnerId), learnerBranch, batchInfo(List.of(learnerId)).getOrDefault(learnerId, NO_BATCH));
    }

    /**
     * Bulk version used by TPO cohort reads: one read of the marks and of this job's overrides, then the same rule evaluator
     * in memory. Result order follows the incoming learner list.
     */
    public Set<Integer> eligibleLearnerIds(Job job, List<Learner> learners) {
        if (learners == null || learners.isEmpty()) return Set.of();
        List<Integer> learnerIds = learners.stream().map(Learner::getId).toList();
        Map<Integer, Academic> academics = academics(learnerIds);
        Map<Integer, JobEligibilityOverride> overrides = new LinkedHashMap<>();
        for (JobEligibilityOverride override : overrideRepository.findByJobId(job.getId())) overrides.put(override.getLearnerId(), override);
        JobEligibility rules = parse(job);
        Map<Integer, BatchInfo> batches = batchInfo(learnerIds);
        Set<Integer> eligible = new LinkedHashSet<>();
        for (Learner learner : learners) {
            JobEligibilityOverride override = overrides.get(learner.getId());
            if (override != null) {
                if ("INCLUDE".equals(override.getOverrideType())) eligible.add(learner.getId());
                continue;
            }
            if (evaluateRulesWith(rules, academics.get(learner.getId()), learner.getDepartment(), batches.getOrDefault(learner.getId(), NO_BATCH)).eligible) {
                eligible.add(learner.getId());
            }
        }
        return eligible;
    }

    // ---------------------------------------------------------------- the student's academics, as the rules read them

    /** One student's academics for the rules: each level's %, whether it is verified, CGPA, passing year, gender, the CGPA rule. */
    static final class Academic {
        final Map<String, BigDecimal> pct = new HashMap<>();
        final Set<String> unverified = new HashSet<>();
        BigDecimal cgpa;
        boolean cgpaVerified = true;
        Integer passingYear;
        boolean passingYearVerified = true;
        String gender;
        String rule = MarksConversion.DEFAULT_RULE;
        boolean lateralFlag;

        BigDecimal get(String level) { return pct.get(level); }
        boolean verified(String level) { return !unverified.contains(level); }
        /** A Diploma and no 12th (lateral entry), or the college's import said lateral. */
        boolean diplomaStudent() { return lateralFlag || (pct.get("DIPLOMA") != null && pct.get("12TH") == null); }
        String twelfthLevel() { return diplomaStudent() ? "DIPLOMA" : "12TH"; }

        /** The lowest of 10th, 12th (or Diploma) and UG; null when none is known. */
        BigDecimal lowest() {
            return java.util.stream.Stream.of(pct.get("10TH"), pct.get(twelfthLevel()), pct.get("UG")).filter(Objects::nonNull).min(BigDecimal::compareTo).orElse(null);
        }
        boolean lowestVerified() { return verified("10TH") && verified(twelfthLevel()) && verified("UG"); }

        @SuppressWarnings("unchecked")
        static Academic fromMarks(Map<String, Object> row, LearnerAcademicRecord record) {
            Academic a = new Academic();
            Map<String, Object> marks = row == null ? Map.of() : (Map<String, Object>) row.getOrDefault("marks", Map.of());
            marks.forEach((level, v) -> {
                Map<String, Object> m = (Map<String, Object>) v;
                BigDecimal p = dec(m.get("pct"));
                if (p != null) a.pct.put(level, p);
                if (Boolean.FALSE.equals(m.get("verified"))) a.unverified.add(level);
            });
            if (row != null) {
                a.cgpa = dec(row.get("cgpa"));
                a.cgpaVerified = !Boolean.FALSE.equals(row.get("cgpaVerified"));
                a.passingYear = row.get("passingYear") instanceof Number n ? n.intValue() : null;
                a.passingYearVerified = !Boolean.FALSE.equals(row.get("passingYearVerified"));
                a.gender = (String) row.get("gender");
                if (row.get("rule") != null) a.rule = (String) row.get("rule");
            }
            a.lateralFlag = record != null && Boolean.TRUE.equals(record.getIsLateralEntry());
            return a;
        }

        /** Only the verified academic record (when the marks service is not there, e.g. unit tests). */
        static Academic fromRecord(LearnerAcademicRecord r) {
            Academic a = new Academic();
            if (r == null) return a;
            if (r.getTenthPct() != null) a.pct.put("10TH", r.getTenthPct());
            if (r.getTwelfthPct() != null) a.pct.put("12TH", r.getTwelfthPct());
            if (r.getDiplomaPct() != null) a.pct.put("DIPLOMA", r.getDiplomaPct());
            if (r.getUgPct() != null) a.pct.put("UG", r.getUgPct());
            a.cgpa = r.getCgpa();
            a.passingYear = r.getPassingYear();
            a.gender = r.getGender();
            a.lateralFlag = Boolean.TRUE.equals(r.getIsLateralEntry());
            return a;
        }

        private static BigDecimal dec(Object o) {
            if (o == null) return null;
            if (o instanceof BigDecimal b) return b;
            try { return new BigDecimal(o.toString()); } catch (NumberFormatException e) { return null; }
        }
    }

    private Map<Integer, Academic> academics(java.util.Collection<Integer> learnerIds) {
        Map<Integer, LearnerAcademicRecord> records = new HashMap<>();
        if (learnerIds.size() == 1) { // one student (a student's own check, a single apply): one lookup, as before
            Integer only = learnerIds.iterator().next();
            academicRecordRepository.findById(only).ifPresent(r -> records.put(only, r));
        } else {
            for (LearnerAcademicRecord r : academicRecordRepository.findAllById(learnerIds)) records.put(r.getLearnerId(), r);
        }
        Map<Integer, Academic> out = new HashMap<>();
        if (academicMarks == null) {
            for (Integer id : learnerIds) out.put(id, Academic.fromRecord(records.get(id)));
            return out;
        }
        Map<Integer, Map<String, Object>> marks = academicMarks.marksForLearners(learnerIds);
        for (Integer id : learnerIds) out.put(id, Academic.fromMarks(marks.get(id), records.get(id)));
        return out;
    }

    /** The lowest of 10th, 12th (Diploma when there is no 12th) and UG percentages; null when none is known. */
    static BigDecimal lowestPct(LearnerAcademicRecord r) { return Academic.fromRecord(r).lowest(); }

    private static String pctText(BigDecimal v) { return v.setScale(1, java.math.RoundingMode.HALF_UP).stripTrailingZeros().toPlainString() + "%"; }
    private static String num(Double d) { return BigDecimal.valueOf(d).stripTrailingZeros().toPlainString(); }

    /**
     * One "at least X%" marks rule. Missing: "Not provided" and passes, unless verified marks only. Unverified: counts, flagged
     * "not verified", unless verified marks only.
     */
    private static boolean pctRule(List<RuleCheck> checks, String name, String minText, double min, BigDecimal value, boolean verified, boolean verifiedOnly) {
        if (value == null) {
            checks.add(new RuleCheck(name, !verifiedOnly, verifiedOnly ? "No verified marks (min " + minText + ")" : "Not provided"));
            return !verifiedOnly;
        }
        if (!verified && verifiedOnly) {
            checks.add(new RuleCheck(name, false, pctText(value) + " not verified yet (verified marks only)"));
            return false;
        }
        boolean ok = value.doubleValue() >= min;
        checks.add(new RuleCheck(name, ok, pctText(value) + " (min " + minText + ")" + (verified ? "" : " · not verified")));
        return ok;
    }

    private static boolean pctRule(List<RuleCheck> checks, String name, Double min, BigDecimal value, boolean verified, boolean verifiedOnly) {
        return pctRule(checks, name, num(min) + "%", min, value, verified, verifiedOnly);
    }

    private EligibilityResult evaluateRulesWith(JobEligibility rules, Academic a, String learnerBranch, BatchInfo batch) {
        if (a == null) a = new Academic();
        List<RuleCheck> checks = new ArrayList<>();
        boolean eligible = true;
        boolean verifiedOnly = Boolean.TRUE.equals(rules.getVerifiedMarksOnly());

        // A finished batch is out of the working set: its students only join a drive when the college adds them (an override).
        if (batch.finished) {
            checks.add(new RuleCheck("Batch", false, "Their batch has finished placements"));
            eligible = false;
        }
        if (rules.getBatchIds() != null && !rules.getBatchIds().isEmpty()) {
            boolean ok = batch.batchId != null && rules.getBatchIds().contains(batch.batchId);
            checks.add(new RuleCheck("Batch", ok, ok ? "Eligible" : "Not one of the drive's batches"));
            eligible &= ok;
        }
        if (rules.getBranches() != null && !rules.getBranches().isEmpty()) {
            boolean ok = learnerBranch != null && rules.getBranches().stream().anyMatch(b -> b.trim().equalsIgnoreCase(learnerBranch.trim()));
            checks.add(new RuleCheck("Branch", ok, ok ? "Eligible" : "Not an eligible branch"));
            eligible &= ok;
        }
        if (rules.getMinCgpa() != null) {
            if (a.cgpa != null) {
                if (!a.cgpaVerified && verifiedOnly) {
                    checks.add(new RuleCheck("CGPA", false, a.cgpa.stripTrailingZeros().toPlainString() + " not verified yet (verified marks only)"));
                    eligible = false;
                } else {
                    boolean ok = a.cgpa.doubleValue() >= rules.getMinCgpa();
                    checks.add(new RuleCheck("CGPA", ok, a.cgpa.stripTrailingZeros().toPlainString() + " (min " + num(rules.getMinCgpa()) + ")" + (a.cgpaVerified ? "" : " · not verified")));
                    eligible &= ok;
                }
            } else {
                // A degree graded in %: the CGPA cutoff as a % by the college's rule (7 CGPA is 66.5% by CGPA x 9.5).
                BigDecimal asPct = MarksConversion.toPercent(num(rules.getMinCgpa()), "CGPA", "10", a.rule);
                double min = asPct == null ? rules.getMinCgpa() * 10 : asPct.doubleValue();
                String minText = num(rules.getMinCgpa()) + " CGPA ≈ " + pctText(BigDecimal.valueOf(min));
                eligible &= pctRule(checks, "CGPA", minText, min, a.get("UG"), a.verified("UG"), verifiedOnly);
            }
        }
        if (rules.getMinPctThroughout() != null) {
            // "60% throughout": the lowest of 10th, 12th (or Diploma) and UG. The same number as the Students table's Lowest %.
            eligible &= pctRule(checks, "% throughout", rules.getMinPctThroughout(), a.lowest(), a.lowestVerified(), verifiedOnly);
        }
        if (rules.getTenthMinPct() != null) eligible &= pctRule(checks, "10th %", rules.getTenthMinPct(), a.get("10TH"), a.verified("10TH"), verifiedOnly);
        // "12th or Diploma": a student with a Diploma and no 12th (lateral entry) is checked against the Diploma minimum.
        if (rules.getTwelfthMinPct() != null || rules.getDiplomaMinPct() != null) {
            String name = a.diplomaStudent() ? "Diploma %" : "12th %";
            Double min = a.diplomaStudent() ? rules.getDiplomaMinPct() : rules.getTwelfthMinPct();
            if (min == null) checks.add(new RuleCheck(name, true, "Not required"));
            else eligible &= pctRule(checks, name, min, a.get(a.twelfthLevel()), a.verified(a.twelfthLevel()), verifiedOnly);
        }
        if (rules.getUgMinPct() != null) eligible &= pctRule(checks, "UG %", rules.getUgMinPct(), a.get("UG"), a.verified("UG"), verifiedOnly);
        // PG minimum: only for students who have a PG.
        if (rules.getPgMinPct() != null && a.get("PG") != null) eligible &= pctRule(checks, "PG %", rules.getPgMinPct(), a.get("PG"), a.verified("PG"), verifiedOnly);
        if (rules.getPassingYears() != null && !rules.getPassingYears().isEmpty()) {
            if (a.passingYear == null) {
                checks.add(new RuleCheck("Passing year", true, "Not provided"));
            } else {
                boolean ok = rules.getPassingYears().contains(a.passingYear);
                checks.add(new RuleCheck("Passing year", ok, a.passingYear + (a.passingYearVerified ? "" : " · not verified")));
                eligible &= ok;
            }
        }
        if (rules.getGender() != null) {
            // A diversity drive: the student's gender from their profile. Not given in the profile = not eligible for it.
            boolean ok = a.gender != null && rules.getGender().equalsIgnoreCase(a.gender.trim());
            checks.add(new RuleCheck("Gender", ok, a.gender == null ? "Not given in the profile (diversity drive)" : "Diversity drive"));
            eligible &= ok;
        }
        return new EligibilityResult(eligible, checks, false);
    }
}
