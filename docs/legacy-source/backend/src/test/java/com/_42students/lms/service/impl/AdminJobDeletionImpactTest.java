package com._42students.lms.service.impl;

import com._42students.lms.model.Interview;
import com._42students.lms.model.Job;
import com._42students.lms.model.JobApplication;
import com._42students.lms.model.Learner;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.InterviewRepository;
import com._42students.lms.repository.JobApplicationRepository;
import com._42students.lms.repository.JobRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminJobDeletionImpactTest {
    @Mock private JobRepository jobRepository;
    @Mock private JobApplicationRepository jobApplicationRepository;
    @Mock private InterviewRepository interviewRepository;
    @Mock private CollegeRepository collegeRepository;

    private AdminJobServiceImpl service;

    @BeforeEach
    void setup() {
        service = new AdminJobServiceImpl();
        ReflectionTestUtils.setField(service, "jobRepository", jobRepository);
        ReflectionTestUtils.setField(service, "jobApplicationRepository", jobApplicationRepository);
        ReflectionTestUtils.setField(service, "interviewRepository", interviewRepository);
        ReflectionTestUtils.setField(service, "collegeRepository", collegeRepository);
    }

    @Test
    void previewCountsOnlyLiveApplicationsAndOpenInterviews() {
        Job job = new Job();
        job.setId(10);
        job.setCollegeId(7);
        job.setIsDeleted(false);
        job.setJobTitle("Platform Engineer");

        Learner learner = new Learner();
        learner.setId(42);

        JobApplication live = new JobApplication();
        live.setId(100);
        live.setJob(job);
        live.setLearner(learner);
        live.setIsDeleted(false);

        JobApplication withdrawn = new JobApplication();
        withdrawn.setId(101);
        withdrawn.setJob(job);
        withdrawn.setLearner(learner);
        withdrawn.setIsDeleted(true);

        Interview open = new Interview();
        open.setInterviewStatus("SCHEDULED");
        Interview done = new Interview();
        done.setInterviewStatus("COMPLETED");

        when(jobRepository.findById(10)).thenReturn(Optional.of(job));
        when(jobApplicationRepository.findByJobId(10)).thenReturn(List.of(live, withdrawn));
        when(interviewRepository.findByJobApplicationId(100)).thenReturn(List.of(open, done));
        when(interviewRepository.findByJobApplicationId(101)).thenReturn(List.of());

        var impact = service.getJobDeletionImpact(10, 7);

        assertEquals(1L, impact.get("activeApplicationCount"));
        assertEquals(1L, impact.get("affectedLearnerCount"));
        assertEquals(1L, impact.get("openInterviewCount"));
        assertEquals(Boolean.TRUE, impact.get("applicationsPreserved"));
        assertEquals(Boolean.TRUE, impact.get("learnersWillBeNotified"));
    }
}
