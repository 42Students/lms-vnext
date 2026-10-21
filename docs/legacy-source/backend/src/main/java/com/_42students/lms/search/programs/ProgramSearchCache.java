package com._42students.lms.search.programs;

import com._42students.lms.model.NewProgram;
import com._42students.lms.model.Department;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.repository.NewProgramRepository;
import com._42students.lms.repository.DepartmentRepository;
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
public class ProgramSearchCache extends GenericSearchCache<ProgramSearchDTO> {

    @Autowired
    private NewProgramRepository newProgramRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired(required = false)
    private ScopeResolutionService scopeResolutionService;

    private Map<Integer, String> departmentCache = new HashMap<>();

    @PostConstruct
    public void init() {
        log.info("Initializing Program Search Cache...");
        configure();
        loadPrograms();
        log.info("Program Search Cache initialized with {} programs", size());
    }

    @Override
    protected void configure() {
        setSearchFieldsList(java.util.Arrays.asList(
            ProgramSearchDTO::getName,
            ProgramSearchDTO::getStartYear,
            ProgramSearchDTO::getEndYear,
            ProgramSearchDTO::getDeptName
        ));

        addSynonym("btech", "bachelor of technology");
        addSynonym("mtech", "master of technology");
        addSynonym("mba", "master of business administration");
        addSynonym("mca", "master of computer applications");
        addSynonym("bsc", "bachelor of science");
        addSynonym("msc", "master of science");
        addSynonym("bcom", "bachelor of commerce");
        addSynonym("mcom", "master of commerce");
        addSynonym("ba", "bachelor of arts");
        addSynonym("ma", "master of arts");

        setCategoryField(ProgramSearchDTO::getDeptName);
    }

    private void loadPrograms() {
        try {
            loadReferenceData();
            List<NewProgram> programs = newProgramRepository.findAll();
            List<ProgramSearchDTO> dtos = programs.stream()
                .filter(program -> program.getIsDeleted() == null || !program.getIsDeleted())
                .map(this::toDTO)
                .collect(Collectors.toList());
            load(dtos);
            log.info("Loaded {} programs from database", dtos.size());
        } catch (Exception e) {
            log.error("Failed to load programs into cache", e);
        }
    }

    private void loadReferenceData() {
        try {
            List<Department> departments = departmentRepository.findAll();
            departmentCache = departments.stream()
                .collect(Collectors.toMap(
                    Department::getId,
                    Department::getName,
                    (existing, replacement) -> existing
                ));
        } catch (Exception e) {
            log.warn("Could not load department reference data: {}", e.getMessage());
        }
    }

    private ProgramSearchDTO toDTO(NewProgram program) {
        String deptName = program.getDeptId() > 0 ?
            departmentCache.get(program.getDeptId()) : null;

        Integer deptId = program.getDeptId() > 0 ? program.getDeptId() : null;
        Integer collegeId = (scopeResolutionService != null && deptId != null)
                ? scopeResolutionService.resolveDepartmentToCollegeId(deptId)
                : null;
        Integer organizationId = (scopeResolutionService != null && collegeId != null)
                ? scopeResolutionService.resolveCollegeToOrganizationId(collegeId)
                : null;

        return ProgramSearchDTO.builder()
            .id((long) program.getId())
            .name(program.getName())
            .startYear(null)
            .endYear(null)
            .organizationId(organizationId)
            .collegeId(collegeId)
            .deptId(program.getDeptId())
            .deptName(deptName)
            .build();
    }

    public void refresh() {
        log.info("Refreshing program search cache...");
        loadPrograms();
    }

    public List<ProgramSearchDTO> getByDepartmentId(Integer deptId, int limit) {
        return allItems.stream()
            .filter(program -> program.getDeptId() != null && program.getDeptId().equals(deptId))
            .limit(limit)
            .collect(Collectors.toList());
    }

    public List<ProgramSearchDTO> filterForScope(Integer organizationId, Integer collegeId) {
        synchronized (this) {
            if (collegeId != null) {
                return allItems.stream()
                        .filter(p -> p.getCollegeId() != null && p.getCollegeId().equals(collegeId))
                        .collect(Collectors.toList());
            }
            if (organizationId != null) {
                return allItems.stream()
                        .filter(p -> p.getOrganizationId() != null && p.getOrganizationId().equals(organizationId))
                        .collect(Collectors.toList());
            }
            return new java.util.ArrayList<>(allItems);
        }
    }
}

