package com._42students.lms.service.impl;

import com._42students.lms.exceptions.WithdrawRequiresRequestException;
import com._42students.lms.model.College;
import com._42students.lms.model.Interview;
import com._42students.lms.model.Job;
import com._42students.lms.model.JobApplication;
import com._42students.lms.model.Learner;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.InterviewRepository;
import com._42students.lms.repository.JobApplicationRepository;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.util.JobNotificationHelper;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PlacementApplicationStateIntegrityTest {

    private static Job job(int id) {
        Job job = new Job();
        job.setId(id);
        job.setCollegeId(7);
        job.setOrganizationId(3);
        job.setIsDeleted(false);
        job.setIsActive(true);
        job.setJobTitle("Backend Engineer");
        job.setCompanyName("Synthetic Co");
        return job;
    }

    private static Learner learner(int id) {
        Learner learner = new Learner();
        learner.setId(id);
        return learner;
    }

    private static JobApplication application(int id, String status) {
        JobApplication app = new JobApplication();
        app.setId(id);
        app.setLearner(learner(42));
        app.setJob(job(900));
        app.setApplicationStatus(status);
        app.setIsDeleted(false);
        return app;
    }

    @Test
    void withdrawByIdUsesLockedIdentityPreservesPriorWaitlistAndCancelsInterviews() {
        JobServiceImpl service = new JobServiceImpl();
        JobApplicationRepository applications = mock(JobApplicationRepository.class);
        InterviewRepository interviews = mock(InterviewRepository.class);
        ReflectionTestUtils.setField(service, "jobApplicationRepository", applications);
        ReflectionTestUtils.setField(service, "interviewRepository", interviews);

        JobApplication app = application(700, "WAITLISTED");
        Interview scheduled = new Interview();
        scheduled.setId(800);
        scheduled.setInterviewStatus("SCHEDULED");

        when(applications.findByIdForUpdate(700)).thenReturn(Optional.of(app));
        when(interviews.findActiveInterviewsForApplication(700, null)).thenReturn(List.of());
        when(interviews.findNonTerminalByJobApplicationIdForUpdate(700)).thenReturn(List.of(scheduled));
        when(interviews.save(any(Interview.class))).thenAnswer(inv -> inv.getArgument(0));
        when(applications.save(any(JobApplication.class))).thenAnswer(inv -> inv.getArgument(0));

        JobApplication result = service.withdrawApplicationById(42, 700);

        assertEquals("WITHDRAWN", result.getApplicationStatus());
        assertEquals("WAITLISTED", result.getStatusBeforeWithdrawal());
        assertTrue(result.getIsDeleted());
        assertNotNull(result.getStatusUpdatedAt());
        assertEquals("CANCELLED", scheduled.getInterviewStatus());
        verify(applications).findByIdForUpdate(700);
        verify(interviews).save(scheduled);
        verify(applications).save(app);
    }

    @Test
    void withdrawByIdFailsClosedForAnotherLearnersApplication() {
        JobServiceImpl service = new JobServiceImpl();
        JobApplicationRepository applications = mock(JobApplicationRepository.class);
        InterviewRepository interviews = mock(InterviewRepository.class);
        ReflectionTestUtils.setField(service, "jobApplicationRepository", applications);
        ReflectionTestUtils.setField(service, "interviewRepository", interviews);

        JobApplication app = application(700, "SHORTLISTED");
        app.setLearner(learner(99));
        when(applications.findByIdForUpdate(700)).thenReturn(Optional.of(app));

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> service.withdrawApplicationById(42, 700));

        assertEquals("Application not found", error.getMessage());
        verify(applications, never()).save(any());
        verifyNoInteractions(interviews);
    }

    @Test
    void activeScheduledRoundStillRequiresPlacementCellWithdrawalRequest() {
        JobServiceImpl service = new JobServiceImpl();
        JobApplicationRepository applications = mock(JobApplicationRepository.class);
        InterviewRepository interviews = mock(InterviewRepository.class);
        ReflectionTestUtils.setField(service, "jobApplicationRepository", applications);
        ReflectionTestUtils.setField(service, "interviewRepository", interviews);

        JobApplication app = application(700, "INTERVIEW");
        Interview active = new Interview();
        active.setInterviewStatus("CONFIRMED");
        when(applications.findByIdForUpdate(700)).thenReturn(Optional.of(app));
        when(interviews.findActiveInterviewsForApplication(700, null)).thenReturn(List.of(active));

        assertThrows(WithdrawRequiresRequestException.class,
                () -> service.withdrawApplicationById(42, 700));

        verify(applications, never()).save(any());
    }

    @Test
    void rejectingInterviewStageCancelsNonTerminalInterviews() {
        AdminJobServiceImpl service = new AdminJobServiceImpl();
        JobRepository jobs = mock(JobRepository.class);
        JobApplicationRepository applications = mock(JobApplicationRepository.class);
        InterviewRepository interviews = mock(InterviewRepository.class);
        JobNotificationHelper notifications = mock(JobNotificationHelper.class);
        ReflectionTestUtils.setField(service, "jobRepository", jobs);
        ReflectionTestUtils.setField(service, "jobApplicationRepository", applications);
        ReflectionTestUtils.setField(service, "interviewRepository", interviews);
        ReflectionTestUtils.setField(service, "jobNotificationHelper", notifications);

        Job job = job(900);
        JobApplication app = application(700, "INTERVIEW");
        app.setJob(job);
        Interview active = new Interview();
        active.setId(800);
        active.setInterviewStatus("CONFIRMED");

        when(jobs.findById(900)).thenReturn(Optional.of(job));
        when(applications.findById(700)).thenReturn(Optional.of(app));
        when(interviews.findNonTerminalByJobApplicationIdForUpdate(700)).thenReturn(List.of(active));
        when(interviews.save(any(Interview.class))).thenAnswer(inv -> inv.getArgument(0));
        when(applications.save(any(JobApplication.class))).thenAnswer(inv -> inv.getArgument(0));

        JobApplication result = service.updateApplicationStatus(
                700, "REJECTED", 900, 7, 55, null, "Not selected");

        assertEquals("REJECTED", result.getApplicationStatus());
        assertEquals("CANCELLED", active.getInterviewStatus());
        verify(interviews).save(active);
        verify(notifications).sendStatusNotificationAsync(700, "REJECTED");
    }

    @Test
    void adminCannotForceLearnerOnlyWithdrawnState() {
        AdminJobServiceImpl service = new AdminJobServiceImpl();
        JobRepository jobs = mock(JobRepository.class);
        JobApplicationRepository applications = mock(JobApplicationRepository.class);
        ReflectionTestUtils.setField(service, "jobRepository", jobs);
        ReflectionTestUtils.setField(service, "jobApplicationRepository", applications);

        Job job = job(900);
        JobApplication app = application(700, "SHORTLISTED");
        app.setJob(job);
        when(jobs.findById(900)).thenReturn(Optional.of(job));
        when(applications.findById(700)).thenReturn(Optional.of(app));

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> service.updateApplicationStatus(700, "WITHDRAWN", 900, 7, 55, null, null));

        assertTrue(error.getMessage().contains("only be set by the learner"));
        verify(applications, never()).save(any());
    }

    @Test
    void bulkUpdateUsesSameStateMachineAndReportsInvalidRowsInsteadOfMutatingThem() {
        AdminJobServiceImpl service = new AdminJobServiceImpl();
        JobRepository jobs = mock(JobRepository.class);
        JobApplicationRepository applications = mock(JobApplicationRepository.class);
        ReflectionTestUtils.setField(service, "jobRepository", jobs);
        ReflectionTestUtils.setField(service, "jobApplicationRepository", applications);
        ReflectionTestUtils.setField(service, "self", service);

        Job job = job(900);
        JobApplication app = application(700, "APPLIED");
        app.setJob(job);
        when(jobs.findById(900)).thenReturn(Optional.of(job));
        when(applications.findById(700)).thenReturn(Optional.of(app));

        java.util.Map<String, Object> result = service.bulkUpdateApplicationStatus(
                900, 7, List.of(700), "HIRED", 55, null, null);

        assertEquals(0, ((Number) result.get("updatedCount")).intValue());
        assertEquals(1, ((List<?>) result.get("failed")).size());
        assertEquals("APPLIED", app.getApplicationStatus());
        verify(applications, never()).save(any());
    }
}
