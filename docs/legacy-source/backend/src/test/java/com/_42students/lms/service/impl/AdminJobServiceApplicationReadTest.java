package com._42students.lms.service.impl;

import com._42students.lms.model.Job;
import com._42students.lms.model.JobApplication;
import com._42students.lms.repository.JobApplicationRepository;
import com._42students.lms.repository.JobRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminJobServiceApplicationReadTest {

    @Mock private JobRepository jobRepository;
    @Mock private JobApplicationRepository jobApplicationRepository;

    private AdminJobServiceImpl service;

    @BeforeEach
    void setup() {
        service = new AdminJobServiceImpl();
        ReflectionTestUtils.setField(service, "jobRepository", jobRepository);
        ReflectionTestUtils.setField(service, "jobApplicationRepository", jobApplicationRepository);
    }

    @Test
    void readsExactApplicationEvenWhenListFiltersWouldExcludeIt() {
        Job job = new Job();
        job.setId(10);
        job.setCollegeId(7);
        job.setIsDeleted(false);

        JobApplication application = new JobApplication();
        application.setId(55);
        application.setJob(job);
        application.setApplicationStatus("INTERVIEW");

        when(jobRepository.findById(10)).thenReturn(Optional.of(job));
        when(jobApplicationRepository.findById(55)).thenReturn(Optional.of(application));

        JobApplication result = service.getJobApplication(55, 10, 7);

        assertSame(application, result);
        assertEquals("INTERVIEW", result.getApplicationStatus());
    }

    @Test
    void refusesApplicationFromAnotherJobWithoutRevealingOwnershipDetails() {
        Job requestedJob = new Job();
        requestedJob.setId(10);
        requestedJob.setCollegeId(7);
        requestedJob.setIsDeleted(false);

        Job otherJob = new Job();
        otherJob.setId(11);
        otherJob.setCollegeId(7);
        otherJob.setIsDeleted(false);

        JobApplication application = new JobApplication();
        application.setId(55);
        application.setJob(otherJob);

        when(jobRepository.findById(10)).thenReturn(Optional.of(requestedJob));
        when(jobApplicationRepository.findById(55)).thenReturn(Optional.of(application));

        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> service.getJobApplication(55, 10, 7)
        );
        assertEquals("Application not found", error.getMessage());
    }
}
