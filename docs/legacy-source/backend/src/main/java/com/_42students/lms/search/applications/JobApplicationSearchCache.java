package com._42students.lms.search.applications;

import com._42students.lms.model.Job;
import com._42students.lms.model.JobApplication;
import com._42students.lms.model.Learner;
import com._42students.lms.repository.JobApplicationRepository;
import com._42students.lms.search.core.GenericSearchCache;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Component
@Slf4j
public class JobApplicationSearchCache extends GenericSearchCache<JobApplicationSearchDTO> {
    @Autowired
    private JobApplicationRepository jobApplicationRepository;
    private Map<Integer, String> learnerCache = new HashMap<>();
    private Map<Integer, Job> jobCache = new HashMap<>();

    /** HARDENING: Partition by organization for tenant isolation. */
    private Map<Integer, List<JobApplicationSearchDTO>> applicationsByOrganizationId = new ConcurrentHashMap<>();
    
    @PostConstruct
    public void init() {
        log.info("Initializing Job Application Search Cache...");
        configure();
        loadApplications();
        log.info("Job Application Search Cache initialized with {} applications", size());
    }
    
    @Override
    protected void configure() {
        setSearchFieldsList(java.util.Arrays.asList(
            JobApplicationSearchDTO::getLearnerName,
            JobApplicationSearchDTO::getJobTitle,
            JobApplicationSearchDTO::getCompanyName,
            JobApplicationSearchDTO::getApplicationStatus
        ));
    }
    
    private void loadApplications() {
        try {
            List<JobApplication> applications = jobApplicationRepository.findAllByIsDeletedFalse();
            applications.forEach(app -> {
                Learner learner = app.getLearner();
                if (learner != null) {
                    String name = (learner.getFirstName() != null ? learner.getFirstName() : "") + 
                                 " " + (learner.getLastName() != null ? learner.getLastName() : "");
                    learnerCache.put(learner.getId(), name.trim());
                }
                Job job = app.getJob();
                if (job != null) {
                    jobCache.put(job.getId(), job);
                }
            });
            
            List<JobApplicationSearchDTO> dtos = applications.stream().map(this::toDTO).collect(Collectors.toList());
            load(dtos);
            applicationsByOrganizationId = dtos.stream()
                .filter(d -> d.getOrganizationId() != null)
                .collect(Collectors.groupingBy(JobApplicationSearchDTO::getOrganizationId));
            log.info("Partitioned {} applications by {} organizations", dtos.size(), applicationsByOrganizationId.size());
            log.info("Loaded {} job applications from database", dtos.size());
        } catch (Exception e) {
            log.error("Failed to load job applications into cache", e);
        }
    }
    
    private JobApplicationSearchDTO toDTO(JobApplication app) {
        Learner learner = app.getLearner();
        Job job = app.getJob();
        Integer orgId = app.getOrganizationId() != null ? app.getOrganizationId() : (job != null ? job.getOrganizationId() : null);
        return JobApplicationSearchDTO.builder()
            .id(app.getId())
            .learnerId(learner != null ? learner.getId() : null)
            .learnerName(learner != null ? learnerCache.get(learner.getId()) : null)
            .jobId(job != null ? job.getId() : null)
            .jobTitle(job != null ? job.getJobTitle() : null)
            .companyName(job != null ? job.getCompanyName() : null)
            .applicationStatus(app.getApplicationStatus())
            .organizationId(orgId)
            .build();
    }
    
    public void refresh() {
        log.info("Refreshing job application search cache...");
        loadApplications();
    }

    /**
     * Search within a single organization's applications (tenant-isolated).
     */
    public List<JobApplicationSearchDTO> searchWithinOrganization(Integer organizationId, String query, int limit) {
        List<JobApplicationSearchDTO> orgList = applicationsByOrganizationId.getOrDefault(organizationId, Collections.emptyList());
        if (query == null || query.trim().isEmpty()) {
            return orgList.stream().limit(limit).collect(Collectors.toList());
        }
        String q = query.toLowerCase().trim();
        return orgList.stream()
            .filter(dto -> {
                String searchable = (dto.getLearnerName() != null ? dto.getLearnerName() : "") + " "
                    + (dto.getJobTitle() != null ? dto.getJobTitle() : "") + " "
                    + (dto.getCompanyName() != null ? dto.getCompanyName() : "") + " "
                    + (dto.getApplicationStatus() != null ? dto.getApplicationStatus() : "");
                return searchable.toLowerCase().contains(q);
            })
            .limit(limit)
            .collect(Collectors.toList());
    }

    public long countWithinOrganization(Integer organizationId) {
        if (organizationId == null) return 0;
        return applicationsByOrganizationId.getOrDefault(organizationId, Collections.emptyList()).size();
    }
}

