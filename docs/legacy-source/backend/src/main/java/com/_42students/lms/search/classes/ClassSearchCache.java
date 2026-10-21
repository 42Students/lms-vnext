package com._42students.lms.search.classes;

import com._42students.lms.model._Class;
import com._42students.lms.model.NewProgram;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.repository._ClassRepository;
import com._42students.lms.repository.NewProgramRepository;
import com._42students.lms.search.core.GenericSearchCache;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@Slf4j
public class ClassSearchCache extends GenericSearchCache<ClassSearchDTO> {

    @Autowired
    private _ClassRepository classRepository;

    @Autowired
    private NewProgramRepository newProgramRepository;

    @Autowired(required = false)
    private ScopeResolutionService scopeResolutionService;

    private Map<Integer, String> programCache = new HashMap<>();

    @PostConstruct
    public void init() {
        log.info("Initializing Class Search Cache...");
        configure();
        loadClasses();
        log.info("Class Search Cache initialized with {} classes", size());
    }

    @Override
    protected void configure() {
        setSearchFieldsList(java.util.Arrays.asList(
            ClassSearchDTO::getName,
            ClassSearchDTO::getDescription,
            ClassSearchDTO::getProgramName
        ));

        addSynonym("section", "section");
        addSynonym("batch", "batch");
        addSynonym("semester", "semester");

        setCategoryField(ClassSearchDTO::getProgramName);
    }

    private void loadClasses() {
        try {
            loadReferenceData();
            List<_Class> classes = classRepository.findAll();
            List<ClassSearchDTO> dtos = classes.stream()
                .filter(cls -> cls.getIsDeleted() == null || !cls.getIsDeleted())
                .map(this::toDTO)
                .collect(Collectors.toList());
            load(dtos);
            log.info("Loaded {} classes from database", dtos.size());
        } catch (Exception e) {
            log.error("Failed to load classes into cache", e);
        }
    }

    private void loadReferenceData() {
        try {
            List<NewProgram> programs = newProgramRepository.findAll();
            programCache = programs.stream()
                .filter(p -> p.getIsDeleted() == null || !p.getIsDeleted())
                .collect(Collectors.toMap(
                    NewProgram::getId,
                    NewProgram::getName,
                    (existing, replacement) -> existing
                ));
        } catch (Exception e) {
            log.warn("Could not load program reference data: {}", e.getMessage());
        }
    }

    private ClassSearchDTO toDTO(_Class cls) {
        // cls.getProgramId() is primitive int
        String programName = cls.getProgramId() > 0 ?
            programCache.get(cls.getProgramId()) : null;

        Integer programId = cls.getProgramId() > 0 ? cls.getProgramId() : null;
        Integer collegeId = (scopeResolutionService != null && programId != null)
                ? scopeResolutionService.resolveProgramToCollegeId(programId)
                : null;
        Integer organizationId = (scopeResolutionService != null && collegeId != null)
                ? scopeResolutionService.resolveCollegeToOrganizationId(collegeId)
                : null;

        return ClassSearchDTO.builder()
            .id(cls.getId())
            .name(cls.getName())
            .description(cls.getDescription())
            .startDate(cls.getStartDate())
            .endDate(cls.getEndDate())
            .organizationId(organizationId)
            .collegeId(collegeId)
            .programId(programId)
            .programName(programName)
            .build();
    }

    public void refresh() {
        log.info("Refreshing class search cache...");
        loadClasses();
    }

    public List<ClassSearchDTO> getByProgramId(Integer programId, int limit) {
        return allItems.stream()
            .filter(cls -> cls.getProgramId() != null && cls.getProgramId().equals(programId))
            .limit(limit)
            .collect(Collectors.toList());
    }

    public List<ClassSearchDTO> filterForScope(Integer organizationId, Integer collegeId) {
        synchronized (this) {
            if (collegeId != null) {
                return allItems.stream()
                        .filter(c -> c.getCollegeId() != null && c.getCollegeId().equals(collegeId))
                        .collect(Collectors.toList());
            }
            if (organizationId != null) {
                return allItems.stream()
                        .filter(c -> c.getOrganizationId() != null && c.getOrganizationId().equals(organizationId))
                        .collect(Collectors.toList());
            }
            return new java.util.ArrayList<>(allItems);
        }
    }
}

