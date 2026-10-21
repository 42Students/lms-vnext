package com._42students.lms.service.impl;

import com._42students.lms.model.Job;
import com._42students.lms.model.LearnerSavedJob;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.repository.LearnerSavedJobRepository;
import com._42students.lms.service.LearnerSavedJobService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
public class LearnerSavedJobServiceImpl implements LearnerSavedJobService {
    private final LearnerSavedJobRepository savedJobRepository;
    private final JobRepository jobRepository;

    public LearnerSavedJobServiceImpl(LearnerSavedJobRepository savedJobRepository, JobRepository jobRepository) {
        this.savedJobRepository = savedJobRepository;
        this.jobRepository = jobRepository;
    }

    @Override
    @Transactional
    public void saveJob(Integer learnerId, Integer jobId) {
        if (savedJobRepository.existsByLearnerIdAndJobId(learnerId, jobId)) return;
        LearnerSavedJob lsj = new LearnerSavedJob();
        lsj.setLearnerId(learnerId);
        lsj.setJobId(jobId);
        savedJobRepository.save(lsj);
        log.info("Learner {} saved job {}", learnerId, jobId);
    }

    @Override
    @Transactional
    public void unsaveJob(Integer learnerId, Integer jobId) {
        savedJobRepository.deleteByLearnerIdAndJobId(learnerId, jobId);
        log.info("Learner {} unsaved job {}", learnerId, jobId);
    }

    @Override
    public boolean isSaved(Integer learnerId, Integer jobId) {
        return savedJobRepository.existsByLearnerIdAndJobId(learnerId, jobId);
    }

    @Override
    public Set<Integer> getSavedJobIds(Integer learnerId) {
        return savedJobRepository.findByLearnerIdOrderByCreatedAtDesc(learnerId)
                .stream().map(LearnerSavedJob::getJobId).collect(Collectors.toSet());
    }

    @Override
    public List<Job> getSavedJobs(Integer learnerId) {
        List<Integer> jobIds = savedJobRepository.findByLearnerIdOrderByCreatedAtDesc(learnerId)
                .stream().map(LearnerSavedJob::getJobId).collect(Collectors.toList());
        if (jobIds.isEmpty()) return List.of();
        return jobRepository.findAllById(jobIds).stream()
                .filter(j -> j.getIsDeleted() == null || !j.getIsDeleted())
                .collect(Collectors.toList());
    }
}

