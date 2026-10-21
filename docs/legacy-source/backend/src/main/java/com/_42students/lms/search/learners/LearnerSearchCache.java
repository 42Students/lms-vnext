package com._42students.lms.search.learners;

import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.model.Learner;
import com._42students.lms.model.College;
import com._42students.lms.model.NewProgram;
import com._42students.lms.model._Class;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.NewProgramRepository;
import com._42students.lms.repository._ClassRepository;
import com._42students.lms.search.core.GenericSearchCache;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Learner Search Cache
 *
 * Provides fast in-memory search for learners with:
 * - Fuzzy matching (typos)
 * - Synonym expansion (std → student)
 * - Weighted ranking
 * - Multi-field search (name, email, roll number, etc.)
 */
@Component
@Slf4j
public class LearnerSearchCache extends GenericSearchCache<LearnerSearchDTO> {

    @Autowired
    private LearnerRepository learnerRepository;

    @Autowired
    private CollegeRepository collegeRepository;

    @Autowired
    private NewProgramRepository newProgramRepository;

    @Autowired
    private _ClassRepository classRepository;

    @Autowired
    private ScopeResolutionService scopeResolutionService;

    // Cache for foreign key lookups
    private Map<Integer, String> collegeCache = new HashMap<>();
    private Map<Integer, String> programCache = new HashMap<>();
    private Map<Integer, String> classCache = new HashMap<>();

    @PostConstruct
    public void init() {
        log.info("Initializing Learner Search Cache...");

        // Configure search behavior
        configure();

        // Load learners from database
        loadLearners();

        log.info("Learner Search Cache initialized with {} learners", size());
    }

    @Override
    protected void configure() {
        // Set which fields to search
        setSearchFieldsList(java.util.Arrays.asList(
            LearnerSearchDTO::getFirstName,
            LearnerSearchDTO::getLastName,
            LearnerSearchDTO::getRollNumber,
            LearnerSearchDTO::getUniqueId,
            LearnerSearchDTO::getContactMail,
            LearnerSearchDTO::getContactMobile,
            LearnerSearchDTO::getDepartment,
            LearnerSearchDTO::getCollegeName,
            LearnerSearchDTO::getProgramName,
            LearnerSearchDTO::getClassName
        ));

        // Add learner-specific synonyms
        addSynonym("std", "student");
        addSynonym("stud", "student");
        addSynonym("stu", "student");
        addSynonym("learner", "student");
        addSynonym("mobile", "contact_mobile");
        addSynonym("phone", "contact_mobile");
        addSynonym("email", "contact_mail");
        addSynonym("mail", "contact_mail");
        addSynonym("roll", "roll_number");
        addSynonym("id", "roll_number");

        // Set category field (by department)
        setCategoryField(LearnerSearchDTO::getDepartment);
    }

    /**
     * Load learners from database and convert to DTOs
     */
    private void loadLearners() {
        try {
            // Load all reference data first
            loadReferenceData();

            // Load all learners
            List<Learner> learners = learnerRepository.findAll();

            // Convert to DTOs - skip invalid records instead of failing entire cache load
            List<LearnerSearchDTO> dtos = learners.stream()
                .filter(learner -> learner.getIsDeleted() == null || !learner.getIsDeleted()) // Only active learners
                .map(learner -> {
                    try {
                        return toDTO(learner);
                    } catch (Exception e) {
                        log.warn("Skipping learner {} due to conversion error: {}", 
                            learner.getId(), e.getMessage());
                        return null;
                    }
                })
                .filter(Objects::nonNull)  // Remove null entries
                .collect(Collectors.toList());

            // Load into cache
            load(dtos);

            log.info("Loaded {} active learners from database", dtos.size());

        } catch (Exception e) {
            log.error("Failed to load learners into cache", e);
        }
    }

    /**
     * Load reference data for foreign key lookups
     */
    private void loadReferenceData() {
        try {
            // Load colleges
            List<College> colleges = collegeRepository.findAll();
            collegeCache = colleges.stream()
                .collect(Collectors.toMap(
                    College::getId,
                    College::getName,
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

            // Load classes
            List<_Class> classes = classRepository.findAll();
            classCache = classes.stream()
                .collect(Collectors.toMap(
                    _Class::getId,
                    _Class::getName,
                    (existing, replacement) -> existing
                ));

            log.debug("Loaded reference data: {} colleges, {} programs, {} classes",
                collegeCache.size(), programCache.size(), classCache.size());

        } catch (Exception e) {
            log.warn("Could not load all reference data: {}", e.getMessage());
        }
    }

    /**
     * Convert Learner entity to LearnerSearchDTO
     */
    private LearnerSearchDTO toDTO(Learner learner) {
        Integer effectiveCollegeId = learner.getCollegeId();
        Integer effectiveProgramId = learner.getProgramId();

        if (effectiveCollegeId == null && learner.getClassId() != null) {
            effectiveCollegeId = scopeResolutionService.resolveClassToCollegeId(learner.getClassId());
        }
        if (effectiveProgramId == null && learner.getClassId() != null) {
            effectiveProgramId = scopeResolutionService.resolveLearnerToProgramId(learner.getId());
        }

        String collegeName = effectiveCollegeId != null ?
            collegeCache.get(effectiveCollegeId) : null;
        String programName = effectiveProgramId != null ?
            programCache.get(effectiveProgramId) : null;
        String className = learner.getClassId() != null ?
            classCache.get(learner.getClassId()) : null;

        Integer organizationId = (scopeResolutionService != null && effectiveCollegeId != null)
                ? scopeResolutionService.resolveCollegeToOrganizationId(effectiveCollegeId)
                : null;

        return LearnerSearchDTO.builder()
            .id(learner.getId())
            .firstName(learner.getFirstName())
            .lastName(learner.getLastName())
            .uniqueId(learner.getUniqueId())
            .rollNumber(learner.getRollNumber())
            .contactMail(learner.getContactMail())
            .contactMobile(learner.getContactMobile())
            .department(learner.getDepartment())
            .collegeId(effectiveCollegeId)
            .collegeName(collegeName)
            .programId(effectiveProgramId)
            .programName(programName)
            .classId(learner.getClassId())
            .className(className)
            .organizationId(organizationId)
            .build();
    }

    /**
     * Refresh cache (reload from database)
     */
    public void refresh() {
        log.info("Refreshing learner search cache...");
        loadLearners();
    }

    /**
     * Get learners by college ID
     */
    public List<LearnerSearchDTO> getByCollegeId(Integer collegeId, int limit) {
        return allItems.stream()
            .filter(learner -> learner.getCollegeId() != null && learner.getCollegeId().equals(collegeId))
            .limit(limit)
            .collect(Collectors.toList());
    }

    /**
     * Get learners by program ID
     */
    public List<LearnerSearchDTO> getByProgramId(Integer programId, int limit) {
        return allItems.stream()
            .filter(learner -> learner.getProgramId() != null && learner.getProgramId().equals(programId))
            .limit(limit)
            .collect(Collectors.toList());
    }

    /**
     * Get learners by class ID
     */
    public List<LearnerSearchDTO> getByClassId(Integer classId, int limit) {
        return allItems.stream()
            .filter(learner -> learner.getClassId() != null && learner.getClassId().equals(classId))
            .limit(limit)
            .collect(Collectors.toList());
    }
}

