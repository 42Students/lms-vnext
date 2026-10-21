package com._42students.lms.service.tpo;

import com._42students.lms.model.Job;
import com._42students.lms.model.Learner;
import com._42students.lms.model.tpo.JobEligibility;
import com._42students.lms.model.tpo.JobEligibilityOverride;
import com._42students.lms.model.tpo.LearnerAcademicRecord;
import com._42students.lms.repository.tpo.JobEligibilityOverrideRepository;
import com._42students.lms.repository.tpo.LearnerAcademicRecordRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * A missing value never hard-rejects a student — it is reported as "Not provided" and counted as
 * eligible on that criterion (engineering review item 6). Per-student overrides always win. See
 * TPO V1 - Locked.docx §4.
 */
class EligibilityServiceTest {

    private final LearnerAcademicRecordRepository academicRepo = mock(LearnerAcademicRecordRepository.class);
    private final JobEligibilityOverrideRepository overrideRepo = mock(JobEligibilityOverrideRepository.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final EligibilityService service = new EligibilityService(academicRepo, overrideRepo, objectMapper);

    private Job jobWithMinCgpa(double minCgpa) {
        Job job = new Job();
        job.setId(1);
        JobEligibility rules = new JobEligibility();
        rules.setMinCgpa(minCgpa);
        job.setEligibilityJson(objectMapper.convertValue(rules, Object.class));
        return job;
    }

    @Test void missingAcademicRecordIsEligibleAndLabelledNotProvided() {
        when(overrideRepo.findByJobIdAndLearnerId(1, 100)).thenReturn(Optional.empty());
        when(academicRepo.findById(100)).thenReturn(Optional.empty());
        Job job = jobWithMinCgpa(7.0);

        EligibilityService.EligibilityResult result = service.evaluate(job, 100, "CSE");

        assertTrue(result.eligible);
        assertTrue(result.checks.stream().anyMatch(c -> c.detail.equals("Not provided")));
    }

    @Test void belowMinCgpaIsIneligible() {
        when(overrideRepo.findByJobIdAndLearnerId(1, 100)).thenReturn(Optional.empty());
        LearnerAcademicRecord record = new LearnerAcademicRecord();
        record.setLearnerId(100);
        record.setCgpa(BigDecimal.valueOf(6.2));
        when(academicRepo.findById(100)).thenReturn(Optional.of(record));
        Job job = jobWithMinCgpa(7.0);

        assertFalse(service.evaluate(job, 100, "CSE").eligible);
    }

    @Test void perStudentIncludeOverrideWinsOverFailingRules() {
        JobEligibilityOverride override = new JobEligibilityOverride();
        override.setOverrideType("INCLUDE");
        override.setReason("Company agreed on call, 3 Oct");
        when(overrideRepo.findByJobIdAndLearnerId(1, 100)).thenReturn(Optional.of(override));
        Job job = jobWithMinCgpa(9.0); // impossibly high — would fail every real student

        EligibilityService.EligibilityResult result = service.evaluate(job, 100, "CSE");

        assertTrue(result.eligible);
        assertTrue(result.isOverride);
    }

    @Test void lateralEntryStudentIsCheckedAgainstDiplomaNotTwelfth() {
        when(overrideRepo.findByJobIdAndLearnerId(1, 100)).thenReturn(Optional.empty());
        LearnerAcademicRecord record = new LearnerAcademicRecord();
        record.setLearnerId(100);
        record.setIsLateralEntry(true);
        record.setDiplomaPct(BigDecimal.valueOf(72));
        // twelfthPct intentionally left null — a lateral-entry student has no 12th result.
        when(academicRepo.findById(100)).thenReturn(Optional.of(record));

        Job job = new Job();
        job.setId(1);
        JobEligibility rules = new JobEligibility();
        rules.setTwelfthMinPct(60.0);   // would need a 12th % this lateral-entry student never has
        rules.setDiplomaMinPct(70.0);   // the rule that should actually apply, and 72 >= 70 passes
        job.setEligibilityJson(objectMapper.convertValue(rules, Object.class));

        EligibilityService.EligibilityResult result = service.evaluate(job, 100, "CSE");
        assertTrue(result.eligible);
        assertTrue(result.checks.stream().anyMatch(c -> c.rule.equals("Diploma %") && c.pass));
    }

    @Test void bulkEligibilityUsesOnePreloadedRuleSetAndHonorsOverrides() {
        Job job = jobWithMinCgpa(7.0);
        Learner eligible = new Learner();
        eligible.setId(100);
        eligible.setDepartment("CSE");
        Learner excluded = new Learner();
        excluded.setId(101);
        excluded.setDepartment("CSE");

        LearnerAcademicRecord record = new LearnerAcademicRecord();
        record.setLearnerId(100);
        record.setCgpa(BigDecimal.valueOf(8.1));
        when(academicRepo.findAllById(List.of(100, 101))).thenReturn(List.of(record));

        JobEligibilityOverride exclude = new JobEligibilityOverride();
        exclude.setLearnerId(101);
        exclude.setOverrideType("EXCLUDE");
        when(overrideRepo.findByJobId(1)).thenReturn(List.of(exclude));

        assertTrue(service.eligibleLearnerIds(job, List.of(eligible, excluded)).contains(100));
        assertFalse(service.eligibleLearnerIds(job, List.of(eligible, excluded)).contains(101));
    }

    @Test void evaluateAllGivesTheSameAnswersAsEvaluateFromTwoReads() {
        Job job = jobWithMinCgpa(7.0);
        LearnerAcademicRecord good = new LearnerAcademicRecord();
        good.setLearnerId(100);
        good.setCgpa(BigDecimal.valueOf(8.1));
        LearnerAcademicRecord low = new LearnerAcademicRecord();
        low.setLearnerId(101);
        low.setCgpa(BigDecimal.valueOf(6.2));
        Map<Integer, String> branches = new java.util.LinkedHashMap<>();
        branches.put(100, "CSE"); branches.put(101, "CSE"); branches.put(102, "ECE"); branches.put(103, "CSE");
        when(academicRepo.findAllById(branches.keySet())).thenReturn(List.of(good, low));
        JobEligibilityOverride include = new JobEligibilityOverride();
        include.setLearnerId(101);
        include.setOverrideType("INCLUDE");
        include.setReason("Company agreed");
        JobEligibilityOverride exclude = new JobEligibilityOverride();
        exclude.setLearnerId(103);
        exclude.setOverrideType("EXCLUDE");
        exclude.setReason("Already placed elsewhere");
        when(overrideRepo.findByJobId(1)).thenReturn(List.of(include, exclude));

        Map<Integer, EligibilityService.EligibilityResult> r = service.evaluateAll(job, branches);

        assertEquals(List.of(100, 101, 102, 103), List.copyOf(r.keySet()), "input order kept");
        assertTrue(r.get(100).eligible, "meets the CGPA rule");
        assertTrue(r.get(101).eligible && r.get(101).isOverride, "fails the rule but the college included them");
        assertTrue(r.get(102).eligible, "no record: counted eligible, flagged Not provided");
        assertFalse(r.get(103).eligible, "excluded by hand");
        verify(academicRepo, never()).findById(any());
        verify(overrideRepo, never()).findByJobIdAndLearnerId(any(), any());
    }

    @Test void aBacklogRuleSavedOnAnOldDriveNoLongerExcludesAnyone() {
        Job job = new Job();
        job.setId(1);
        // As an old drive saved it, before backlogs were removed: the keys are ignored when read.
        job.setEligibilityJson(java.util.Map.of("maxActiveBacklogs", 0, "maxPastBacklogs", 0));
        LearnerAcademicRecord record = new LearnerAcademicRecord();
        record.setLearnerId(100);
        when(academicRepo.findById(100)).thenReturn(Optional.of(record));
        EligibilityService.EligibilityResult r = service.evaluate(job, 100, "CSE");
        assertTrue(r.eligible, "the LMS has no source for backlogs, so they are never checked");
        assertTrue(r.checks.stream().noneMatch(c -> c.rule.toLowerCase().contains("backlog")));
    }

    @Test void percentageThroughoutIsTheLowestOfTenthTwelfthOrDiplomaAndUg() {
        Job job = new Job();
        job.setId(1);
        job.setEligibilityJson(java.util.Map.of("minPctThroughout", 60));
        LearnerAcademicRecord record = new LearnerAcademicRecord();
        record.setLearnerId(100);
        record.setTenthPct(new BigDecimal("87.4"));
        record.setDiplomaPct(new BigDecimal("58")); // no 12th: the Diploma counts
        record.setUgPct(new BigDecimal("72"));
        when(academicRepo.findById(100)).thenReturn(Optional.of(record));
        EligibilityService.EligibilityResult r = service.evaluate(job, 100, "CSE");
        assertFalse(r.eligible, "58% in the Diploma is below 60% throughout (this rule used to be saved and never checked)");
        record.setDiplomaPct(new BigDecimal("61"));
        assertTrue(service.evaluate(job, 100, "CSE").eligible);
    }

    @Test void lateralEntryStudentBelowDiplomaMinimumIsIneligible() {
        when(overrideRepo.findByJobIdAndLearnerId(1, 100)).thenReturn(Optional.empty());
        LearnerAcademicRecord record = new LearnerAcademicRecord();
        record.setLearnerId(100);
        record.setIsLateralEntry(true);
        record.setDiplomaPct(BigDecimal.valueOf(65));
        when(academicRepo.findById(100)).thenReturn(Optional.of(record));

        Job job = new Job();
        job.setId(1);
        JobEligibility rules = new JobEligibility();
        rules.setDiplomaMinPct(70.0);
        job.setEligibilityJson(objectMapper.convertValue(rules, Object.class));

        assertFalse(service.evaluate(job, 100, "CSE").eligible);
    }
}
