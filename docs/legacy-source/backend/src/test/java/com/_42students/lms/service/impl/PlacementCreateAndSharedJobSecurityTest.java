package com._42students.lms.service.impl;

import com._42students.lms.access.ResolvedLearnerScope;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.model.College;
import com._42students.lms.model.Interview;
import com._42students.lms.model.Job;
import com._42students.lms.model.JobApplication;
import com._42students.lms.model.Learner;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.InterviewRepository;
import com._42students.lms.repository.JobApplicationRepository;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.repository.LearnerRepository;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PlacementCreateAndSharedJobSecurityTest {

    @Test
    void collegeJobCreateDiscardsClientSuppliedIdAndVersion() {
        AdminJobServiceImpl service = new AdminJobServiceImpl();
        JobRepository jobs = mock(JobRepository.class);
        CollegeRepository colleges = mock(CollegeRepository.class);

        ReflectionTestUtils.setField(service, "jobRepository", jobs);
        ReflectionTestUtils.setField(service, "collegeRepository", colleges);

        College college = new College();
        college.setOrgId(3);
        when(colleges.findById(7)).thenReturn(Optional.of(college));
        when(jobs.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Job malicious = new Job();
        malicious.setId(999);
        malicious.setVersion(17L);
        malicious.setJobTitle("Software Engineer");
        malicious.setCompanyName("Acme");
        malicious.setVisibilityType("INTERNAL_ONLY");

        Job result = service.createJob(malicious, 7, 55);

        assertEquals(0, result.getId());
        assertNull(result.getVersion());
        assertEquals(7, result.getCollegeId());
        assertEquals(3, result.getOrganizationId());
        verify(jobs).save(same(malicious));
    }


    @Test
    void organizationJobCreateAlsoDiscardsClientSuppliedIdAndVersion() {
        PlacementJobServiceImpl service = new PlacementJobServiceImpl();
        JobRepository jobs = mock(JobRepository.class);
        ReflectionTestUtils.setField(service, "jobRepository", jobs);
        when(jobs.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Job malicious = new Job();
        malicious.setId(998);
        malicious.setVersion(16L);
        malicious.setJobTitle("Platform Engineer");
        malicious.setCompanyName("Acme");
        malicious.setVisibilityType("INTERNAL_ONLY");

        Job result = service.createJob(malicious, 3, 56);

        assertEquals(0, result.getId());
        assertNull(result.getVersion());
        assertEquals(3, result.getOrganizationId());
        assertEquals(56, result.getCreatedBy());
        verify(jobs).save(same(malicious));
    }

    @Test
    void collegeServiceCannotMutateOrganizationWideJob() {
        AdminJobServiceImpl service = new AdminJobServiceImpl();
        JobRepository jobs = mock(JobRepository.class);
        CollegeRepository colleges = mock(CollegeRepository.class);

        ReflectionTestUtils.setField(service, "jobRepository", jobs);
        ReflectionTestUtils.setField(service, "collegeRepository", colleges);

        College college = new College();
        college.setOrgId(3);
        when(colleges.findById(7)).thenReturn(Optional.of(college));

        Job shared = new Job();
        shared.setId(900);
        shared.setCollegeId(null);
        shared.setOrganizationId(3);
        shared.setIsDeleted(false);
        shared.setIsActive(true);
        shared.setJobTitle("Shared role");
        shared.setCompanyName("Acme");
        when(jobs.findById(900)).thenReturn(Optional.of(shared));

        Job update = new Job();
        update.setJobTitle("Mutated role");
        update.setCompanyName("Acme");

        IllegalArgumentException updateError = assertThrows(IllegalArgumentException.class,
                () -> service.updateJob(900, update, 7));
        assertTrue(updateError.getMessage().contains("shared across the organization"));

        IllegalArgumentException deleteError = assertThrows(IllegalArgumentException.class,
                () -> service.deleteJob(900, 7));
        assertTrue(deleteError.getMessage().contains("shared across the organization"));

        Map<String, Object> bulk = service.bulkUpdateJobStatus(7, List.of(900), false);
        assertEquals(0, ((Number) bulk.get("updatedCount")).intValue());
        assertEquals(1, ((List<?>) bulk.get("failed")).size());
        verify(jobs, never()).save(any(Job.class));
        verify(jobs, never()).softDeleteById(anyInt());
    }

    @Test
    void interviewCreateDiscardsClientSuppliedIdAndVersion() {
        InterviewServiceImpl service = new InterviewServiceImpl();
        InterviewRepository interviews = mock(InterviewRepository.class);
        JobApplicationRepository applications = mock(JobApplicationRepository.class);
        JobRepository jobs = mock(JobRepository.class);
        LearnerRepository learners = mock(LearnerRepository.class);
        ScopeResolutionService scopes = mock(ScopeResolutionService.class);

        ReflectionTestUtils.setField(service, "interviewRepository", interviews);
        ReflectionTestUtils.setField(service, "jobApplicationRepository", applications);
        ReflectionTestUtils.setField(service, "jobRepository", jobs);
        ReflectionTestUtils.setField(service, "learnerRepository", learners);
        ReflectionTestUtils.setField(service, "scopeResolutionService", scopes);

        Job job = new Job();
        job.setId(900);
        job.setOrganizationId(3);
        job.setCollegeId(7);
        job.setIsDeleted(false);
        job.setIsActive(true);
        job.setCompanyName("Acme");

        Learner learner = new Learner();
        learner.setId(55);

        JobApplication application = new JobApplication();
        application.setId(700);
        application.setJob(job);
        application.setLearner(learner);
        application.setOrganizationId(3);
        application.setApplicationStatus("SHORTLISTED");

        when(applications.findByIdForUpdate(700)).thenReturn(Optional.of(application));
        when(jobs.findByIdAndOrganization(900, 3)).thenReturn(Optional.of(job));
        when(learners.findByIdForUpdate(55)).thenReturn(Optional.of(learner));
        when(scopes.resolveFullScope(learner)).thenReturn(ResolvedLearnerScope.builder()
                .learnerId(55).organizationId(3).collegeId(7).build());
        when(interviews.findPotentialOverlapsForLearner(55, null)).thenReturn(List.of());
        when(interviews.findPotentialOverlapsForApplication(700, null)).thenReturn(List.of());
        when(interviews.findActiveInterviewsForApplication(700, null)).thenReturn(List.of());
        when(jobs.lockJobById(900)).thenReturn(Optional.of(job));
        when(interviews.save(any(Interview.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(applications.save(any(JobApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Interview malicious = new Interview();
        malicious.setId(999);
        malicious.setVersion(17L);
        malicious.setJob(job);
        malicious.setJobApplication(application);
        malicious.setLearner(learner);
        malicious.setRoundDescription("Technical discussion");
        malicious.setScheduledDate(LocalDateTime.now(ZoneOffset.UTC).plusDays(2));

        Interview result = service.scheduleInterview(malicious, 3, 88);

        assertEquals(0, result.getId());
        assertNull(result.getVersion());
        assertEquals(3, result.getOrganizationId());
        assertEquals(88, result.getCreatedBy());
        verify(interviews).save(same(malicious));
    }
}
