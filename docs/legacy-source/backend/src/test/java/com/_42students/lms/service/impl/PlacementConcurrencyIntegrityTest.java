package com._42students.lms.service.impl;


import static org.mockito.ArgumentMatchers.eq;

import com._42students.lms.access.ResolvedLearnerScope;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.model.Job;
import com._42students.lms.model.JobApplication;
import com._42students.lms.model.Learner;
import com._42students.lms.repository.JobApplicationRepository;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.repository.LearnerRepository;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.Version;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PlacementConcurrencyIntegrityTest {

    private JobServiceImpl configuredApplyService(
            int learnerId,
            int jobId,
            JobApplicationRepository applications,
            JobRepository jobs,
            LearnerRepository learners,
            ScopeResolutionService scopes) {
        JobServiceImpl service = new JobServiceImpl();
        ReflectionTestUtils.setField(service, "jobApplicationRepository", applications);
        ReflectionTestUtils.setField(service, "jobRepository", jobs);
        ReflectionTestUtils.setField(service, "learnerRepository", learners);
        ReflectionTestUtils.setField(service, "scopeResolutionService", scopes);

        Learner learner = new Learner();
        learner.setId(learnerId);

        Job job = new Job();
        job.setId(jobId);
        job.setOrganizationId(3);
        job.setCollegeId(7);
        job.setIsActive(true);
        job.setIsDeleted(false);
        job.setVisibilityType("INTERNAL_ONLY");

        when(learners.findById(learnerId)).thenReturn(Optional.of(learner));
        when(scopes.resolveFullScope(learner)).thenReturn(ResolvedLearnerScope.builder()
                .learnerId(learnerId)
                .organizationId(3)
                .collegeId(7)
                .programId(11)
                .classId(12)
                .batchId(13)
                .build());
        when(jobs.findActiveJobById(jobId)).thenReturn(Optional.of(job));
        when(jobs.lockJobById(jobId)).thenReturn(Optional.of(job));
        return service;
    }

    @Test
    void repeatedAppliedSubmissionIsAnIdempotentReplay() {
        int learnerId = 980001;
        int jobId = 990001;
        JobApplicationRepository applications = mock(JobApplicationRepository.class);
        JobRepository jobs = mock(JobRepository.class);
        LearnerRepository learners = mock(LearnerRepository.class);
        ScopeResolutionService scopes = mock(ScopeResolutionService.class);
        JobServiceImpl service = configuredApplyService(learnerId, jobId, applications, jobs, learners, scopes);

        JobApplication existing = new JobApplication();
        existing.setId(7001);
        existing.setIsDeleted(false);
        existing.setApplicationStatus("APPLIED");
        when(applications.findByLearnerIdAndJobIdIncludeDeleted(learnerId, jobId))
                .thenReturn(Optional.of(existing));

        JobApplication result = service.applyToJob(learnerId, jobId, null);

        assertSame(existing, result);
        verify(applications, never()).saveAndFlush(any(JobApplication.class));
    }

    @Test
    void databaseUniqueConflictPropagatesInsteadOfQueryingInsideRollbackOnlyTransaction() {
        int learnerId = 980002;
        int jobId = 990002;
        JobApplicationRepository applications = mock(JobApplicationRepository.class);
        JobRepository jobs = mock(JobRepository.class);
        LearnerRepository learners = mock(LearnerRepository.class);
        ScopeResolutionService scopes = mock(ScopeResolutionService.class);
        JobServiceImpl service = configuredApplyService(learnerId, jobId, applications, jobs, learners, scopes);

        when(applications.findByLearnerIdAndJobIdIncludeDeleted(learnerId, jobId))
                .thenReturn(Optional.empty());
        DataIntegrityViolationException duplicate = new DataIntegrityViolationException("duplicate learner/job");
        when(applications.saveAndFlush(any(JobApplication.class))).thenThrow(duplicate);

        DataIntegrityViolationException thrown = assertThrows(
                DataIntegrityViolationException.class,
                () -> service.applyToJob(learnerId, jobId, null));

        assertSame(duplicate, thrown);
        verify(applications, never()).findByLearnerIdAndJobId(learnerId, jobId);
    }

    @Test
    void jobAndApplicationModelsKeepJpaOptimisticVersions() throws Exception {
        assertNotNull(Job.class.getDeclaredField("version").getAnnotation(Version.class));
        assertNotNull(JobApplication.class.getDeclaredField("version").getAnnotation(Version.class));
    }

    @Test
    void applyUsesReadCommittedSoPostLockDuplicateLookupSeesWinningCommit() throws Exception {
        Transactional transactional = JobServiceImpl.class
                .getMethod("applyToJob", Integer.class, Integer.class, String.class)
                .getAnnotation(Transactional.class);

        assertNotNull(transactional);
        assertEquals(Isolation.READ_COMMITTED, transactional.isolation());
    }


    // Audit 2026-10-06: a drive's rules and a debarment were only shown to the student, never checked when they applied.
    @Test
    void aDebarredStudentCannotApply() {
        int learnerId = 980010, jobId = 990010;
        JobApplicationRepository applications = mock(JobApplicationRepository.class);
        JobServiceImpl service = configuredApplyService(learnerId, jobId, applications, mock(JobRepository.class), mock(LearnerRepository.class), mock(ScopeResolutionService.class));
        com._42students.lms.service.tpo.TpoStudentService students = mock(com._42students.lms.service.tpo.TpoStudentService.class);
        when(students.isDebarred(learnerId)).thenReturn(true);
        ReflectionTestUtils.setField(service, "tpoStudentService", students);
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class, () -> service.applyToJob(learnerId, jobId, null));
        assertTrue(e.getMessage().contains("debarred"));
        verify(applications, never()).saveAndFlush(any(JobApplication.class));
    }

    @Test
    void aStudentWhoFailsTheDrivesRulesCannotApply() {
        int learnerId = 980011, jobId = 990011;
        JobApplicationRepository applications = mock(JobApplicationRepository.class);
        JobServiceImpl service = configuredApplyService(learnerId, jobId, applications, mock(JobRepository.class), mock(LearnerRepository.class), mock(ScopeResolutionService.class));
        com._42students.lms.service.tpo.EligibilityService rules = mock(com._42students.lms.service.tpo.EligibilityService.class);
        when(rules.evaluate(any(), eq(learnerId), any())).thenReturn(new com._42students.lms.service.tpo.EligibilityService.EligibilityResult(false,
                java.util.List.of(new com._42students.lms.service.tpo.EligibilityService.RuleCheck("CGPA", false, "6.5 (min 7)")), false));
        ReflectionTestUtils.setField(service, "driveEligibility", rules);
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class, () -> service.applyToJob(learnerId, jobId, null));
        assertTrue(e.getMessage().contains("CGPA"), e.getMessage());
        verify(applications, never()).saveAndFlush(any(JobApplication.class));
    }

    @Test
    void theDeadlineIsReadInUtcAsTheDriveFormSendsIt() {
        int learnerId = 980012, jobId = 990012;
        JobRepository jobs = mock(JobRepository.class);
        JobServiceImpl service = configuredApplyService(learnerId, jobId, mock(JobApplicationRepository.class), jobs, mock(LearnerRepository.class), mock(ScopeResolutionService.class));
        // The drive form sends the deadline in UTC: one minute ago in UTC is closed.
        jobs.findActiveJobById(jobId).orElseThrow().setApplicationDeadline(java.time.LocalDateTime.now(java.time.ZoneOffset.UTC).minusMinutes(1));
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class, () -> service.applyToJob(learnerId, jobId, null));
        assertTrue(e.getMessage().contains("deadline"), e.getMessage());
    }
}
