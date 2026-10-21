package com._42students.lms.service.impl;

import com._42students.lms.model.Job;
import com._42students.lms.model.JobApplication;
import com._42students.lms.repository.JobApplicationRepository;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.util.JobNotificationHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminAssessmentUrlPersistenceTest {
    @Mock private JobRepository jobRepository;
    @Mock private JobApplicationRepository jobApplicationRepository;
    @Mock private JobNotificationHelper jobNotificationHelper;

    private AdminJobServiceImpl service;
    private Job job;
    private JobApplication application;

    @BeforeEach
    void setup() {
        service = new AdminJobServiceImpl();
        ReflectionTestUtils.setField(service, "jobRepository", jobRepository);
        ReflectionTestUtils.setField(service, "jobApplicationRepository", jobApplicationRepository);
        ReflectionTestUtils.setField(service, "jobNotificationHelper", jobNotificationHelper);

        job = new Job();
        job.setId(10);
        job.setCollegeId(7);
        job.setIsDeleted(false);
        job.setIsActive(true);
        job.setAssessmentUrl("https://default.example/assessment");

        application = new JobApplication();
        application.setId(55);
        application.setJob(job);
        application.setApplicationStatus("ASSESSMENT");

        when(jobRepository.findById(10)).thenReturn(Optional.of(job));
        when(jobApplicationRepository.findById(55)).thenReturn(Optional.of(application));
        when(jobApplicationRepository.save(any(JobApplication.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void oneOffAssessmentUrlStaysOnApplicationAndDoesNotChangeJobDefault() {
        JobApplication updated = service.updateApplicationStatus(
                55, "ASSESSMENT", 10, 7, 99,
                "https://candidate.example/one-off", Boolean.FALSE, null);

        assertEquals("https://candidate.example/one-off", updated.getAssessmentUrl());
        assertEquals("https://default.example/assessment", job.getAssessmentUrl());
        verify(jobRepository, never()).save(any(Job.class));
        verify(jobApplicationRepository).save(application);
        verify(jobNotificationHelper).sendStatusNotificationAsync(55, "ASSESSMENT");
    }

    @Test
    void reusableAssessmentUrlUpdatesApplicationAndJobDefault() {
        JobApplication updated = service.updateApplicationStatus(
                55, "ASSESSMENT", 10, 7, 99,
                "https://new-default.example/assessment", Boolean.TRUE, null);

        assertEquals("https://new-default.example/assessment", updated.getAssessmentUrl());
        assertEquals("https://new-default.example/assessment", job.getAssessmentUrl());
        verify(jobRepository).save(job);
        verify(jobApplicationRepository).save(application);
        verify(jobNotificationHelper).sendStatusNotificationAsync(55, "ASSESSMENT");
    }
}
