package com._42students.lms.search.jobs;

import com._42students.lms.model.Job;
import com._42students.lms.model.Department;
import com._42students.lms.model.NewProgram;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.repository.DepartmentRepository;
import com._42students.lms.repository.NewProgramRepository;
import com._42students.lms.search.core.GenericSearchCache;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Job Search Cache
 *
 * Provides fast in-memory search for jobs with:
 * - Fuzzy matching (typos)
 * - Synonym expansion (sde → software developer)
 * - Weighted ranking
 * - Multi-field search (title, company, location, skills, etc.)
 */
@Component
@Slf4j
public class JobSearchCache extends GenericSearchCache<JobSearchDTO> {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private NewProgramRepository newProgramRepository;

    // Cache for foreign key lookups
    private Map<Integer, String> departmentCache = new HashMap<>();
    private Map<Integer, String> programCache = new HashMap<>();

    /** HARDENING: Partition by organization for tenant isolation; key = organizationId, value = list of jobs for that org. */
    private Map<Integer, List<JobSearchDTO>> jobsByOrganizationId = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        log.info("Initializing Job Search Cache...");

        // Configure search behavior
        configure();

        // Load jobs from database
        loadJobs();

        log.info("Job Search Cache initialized with {} jobs", size());
    }

    @Override
    protected void configure() {
        // Set which fields to search
        setSearchFieldsList(java.util.Arrays.asList(
            JobSearchDTO::getJobTitle,
            JobSearchDTO::getCompanyName,
            JobSearchDTO::getJobDescription,
            JobSearchDTO::getJobResponsibilities,
            JobSearchDTO::getJobType,
            JobSearchDTO::getLocation,
            JobSearchDTO::getTargetDepartmentName,
            JobSearchDTO::getTargetProgramName
        ));

        // Add job-specific synonyms
        addSynonym("sde", "software developer");
        addSynonym("swe", "software engineer");
        addSynonym("sd", "software developer");
        addSynonym("se", "software engineer");
        addSynonym("dev", "developer");
        addSynonym("eng", "engineer");
        addSynonym("mgr", "manager");
        addSynonym("pm", "product manager");
        addSynonym("tl", "team lead");
        addSynonym("intern", "internship");
        addSynonym("ft", "full time");
        addSynonym("pt", "part time");
        addSynonym("remote", "work from home");
        addSynonym("wfh", "work from home");
        addSynonym("hybrid", "hybrid work");
        addSynonym("ai", "artificial intelligence");
        addSynonym("ml", "machine learning");
        addSynonym("ds", "data science");
        addSynonym("da", "data analyst");
        addSynonym("de", "data engineer");
        addSynonym("ba", "business analyst");
        addSynonym("qa", "quality assurance");
        addSynonym("sdet", "software development engineer in test");
        addSynonym("ui", "user interface");
        addSynonym("ux", "user experience");
        addSynonym("frontend", "front end");
        addSynonym("backend", "back end");
        addSynonym("fullstack", "full stack");

        // Set category field (by job type)
        setCategoryField(JobSearchDTO::getJobType);
    }

    /**
     * Load jobs from database and convert to DTOs
     */
    private void loadJobs() {
        try {
            // Load all reference data first
            loadReferenceData();

            // Load all active jobs
            List<Job> jobs = jobRepository.findAllActiveJobs();

            // Convert to DTOs
            List<JobSearchDTO> dtos = jobs.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

            // Load into cache (parent allItems for search)
            load(dtos);

            // Partition by organization for tenant-isolated reads
            jobsByOrganizationId = dtos.stream()
                .filter(d -> d.getOrganizationId() != null)
                .collect(Collectors.groupingBy(JobSearchDTO::getOrganizationId));
            log.info("Partitioned {} jobs by {} organizations", dtos.size(), jobsByOrganizationId.size());

            log.info("Loaded {} active jobs from database", dtos.size());

        } catch (Exception e) {
            log.error("Failed to load jobs into cache", e);
        }
    }

    /**
     * Load reference data for foreign key lookups
     */
    private void loadReferenceData() {
        try {
            // Load departments
            List<Department> departments = departmentRepository.findAll();
            departmentCache = departments.stream()
                .collect(Collectors.toMap(
                    Department::getId,
                    Department::getName,
                    (existing, replacement) -> existing
                ));

            // Load programs (new_program)
            List<NewProgram> programs = newProgramRepository.findAll();
            programCache = programs.stream()
                .filter(p -> p.getIsDeleted() == null || !p.getIsDeleted())
                .collect(Collectors.toMap(
                    NewProgram::getId,
                    NewProgram::getName,
                    (existing, replacement) -> existing
                ));

            log.debug("Loaded reference data: {} departments, {} programs",
                departmentCache.size(), programCache.size());

        } catch (Exception e) {
            log.warn("Could not load all reference data: {}", e.getMessage());
        }
    }

    /**
     * Convert Job entity to JobSearchDTO
     */
    private JobSearchDTO toDTO(Job job) {
        String targetDepartmentName = job.getTargetDepartmentId() != null ?
            departmentCache.get(job.getTargetDepartmentId()) : null;

        // programCache now uses Integer keys
        String targetProgramName = job.getTargetProgramId() != null ?
            programCache.get(job.getTargetProgramId()) : null;

        return JobSearchDTO.builder()
            .id(job.getId())
            .jobTitle(job.getJobTitle())
            .companyName(job.getCompanyName())
            .companyLogo(job.getCompanyLogo())
            .jobDescription(job.getJobDescription())
            .jobResponsibilities(job.getJobResponsibilities())
            .jobType(job.getJobType())
            .location(job.getLocation())
            .ctcRange(job.getCtcRange())
            .postedDate(job.getPostedDate())
            .applicationDeadline(job.getApplicationDeadline())
            .isActive(job.getIsActive())
            .organizationId(job.getOrganizationId())
            .collegeId(job.getCollegeId())
            .targetDepartmentId(job.getTargetDepartmentId())
            .targetDepartmentName(targetDepartmentName)
            .targetProgramId(job.getTargetProgramId())
            .targetProgramName(targetProgramName)
            .build();
    }

    /**
     * Refresh cache (reload from database)
     */
    public void refresh() {
        log.info("Refreshing job search cache...");
        loadJobs();
    }

    /**
     * Get jobs by organization ID (from partition for tenant isolation).
     */
    public List<JobSearchDTO> getByOrganizationId(Integer organizationId, int limit) {
        List<JobSearchDTO> orgJobs = jobsByOrganizationId.getOrDefault(organizationId, Collections.emptyList());
        return orgJobs.size() <= limit ? orgJobs : orgJobs.subList(0, limit);
    }

    /**
     * Get jobs by department ID (uses allItems for backward compat when org not scoped).
     */
    public List<JobSearchDTO> getByDepartmentId(Integer deptId, int limit) {
        return allItems.stream()
            .filter(job -> job.getTargetDepartmentId() != null && job.getTargetDepartmentId().equals(deptId))
            .limit(limit)
            .collect(Collectors.toList());
    }

    /**
     * Get jobs by program ID
     */
    public List<JobSearchDTO> getByProgramId(Integer programId, int limit) {
        return allItems.stream()
            .filter(job -> job.getTargetProgramId() != null && job.getTargetProgramId().equals(programId))
            .limit(limit)
            .collect(Collectors.toList());
    }

    /**
     * Get jobs by job type
     */
    public List<JobSearchDTO> getByJobType(String jobType, int limit) {
        return allItems.stream()
            .filter(job -> job.getJobType() != null && job.getJobType().equalsIgnoreCase(jobType))
            .limit(limit)
            .collect(Collectors.toList());
    }

    /**
     * Get popular jobs within an organization (from partition).
     */
    public List<JobSearchDTO> getPopularByOrganization(Integer organizationId, int limit) {
        List<JobSearchDTO> orgJobs = jobsByOrganizationId.getOrDefault(organizationId, Collections.emptyList());
        return orgJobs.size() <= limit ? orgJobs : orgJobs.subList(0, limit);
    }

    /**
     * Get jobs by department ID within an organization (from partition).
     */
    public List<JobSearchDTO> getByDepartmentIdAndOrganization(Integer deptId, Integer organizationId, int limit) {
        List<JobSearchDTO> orgJobs = jobsByOrganizationId.getOrDefault(organizationId, Collections.emptyList());
        return orgJobs.stream()
            .filter(job -> job.getTargetDepartmentId() != null && job.getTargetDepartmentId().equals(deptId))
            .limit(limit)
            .collect(Collectors.toList());
    }

    /**
     * Get jobs by program ID within an organization (from partition).
     */
    public List<JobSearchDTO> getByProgramIdAndOrganization(Integer programId, Integer organizationId, int limit) {
        List<JobSearchDTO> orgJobs = jobsByOrganizationId.getOrDefault(organizationId, Collections.emptyList());
        return orgJobs.stream()
            .filter(job -> job.getTargetProgramId() != null && job.getTargetProgramId().equals(programId))
            .limit(limit)
            .collect(Collectors.toList());
    }

    /**
     * Get jobs by job type within an organization (from partition).
     */
    public List<JobSearchDTO> getByJobTypeAndOrganization(String jobType, Integer organizationId, int limit) {
        List<JobSearchDTO> orgJobs = jobsByOrganizationId.getOrDefault(organizationId, Collections.emptyList());
        return orgJobs.stream()
            .filter(job -> job.getJobType() != null && job.getJobType().equalsIgnoreCase(jobType))
            .limit(limit)
            .collect(Collectors.toList());
    }

    /**
     * Get jobs by category (job type) within an organization
     */
    public List<JobSearchDTO> getByCategoryAndOrganization(String jobType, Integer organizationId, int limit) {
        return getByJobTypeAndOrganization(jobType, organizationId, limit);
    }
}

