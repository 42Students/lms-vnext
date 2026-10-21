package com._42students.lms.search.departments;

import com._42students.lms.model.Department;
import com._42students.lms.model.College;
import com._42students.lms.repository.DepartmentRepository;
import com._42students.lms.repository.CollegeRepository;
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
public class DepartmentSearchCache extends GenericSearchCache<DepartmentSearchDTO> {

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private CollegeRepository collegeRepository;

    private Map<Integer, String> collegeCache = new HashMap<>();

    @PostConstruct
    public void init() {
        log.info("Initializing Department Search Cache...");
        configure();
        loadDepartments();
        log.info("Department Search Cache initialized with {} departments", size());
    }

    @Override
    protected void configure() {
        setSearchFieldsList(java.util.Arrays.asList(
            DepartmentSearchDTO::getName,
            DepartmentSearchDTO::getCollegeName
        ));

        addSynonym("cse", "computer science");
        addSynonym("ece", "electronics");
        addSynonym("eee", "electrical");
        addSynonym("mech", "mechanical");
        addSynonym("civil", "civil engineering");
        addSynonym("chem", "chemical");
        addSynonym("bio", "biotechnology");
        addSynonym("maths", "mathematics");
        addSynonym("physics", "physics");
        addSynonym("chemistry", "chemistry");

        setCategoryField(DepartmentSearchDTO::getCollegeName);
    }

    private void loadDepartments() {
        try {
            loadReferenceData();
            List<Department> departments = departmentRepository.findAll();
            List<DepartmentSearchDTO> dtos = departments.stream()
                .filter(dept -> dept.getIsDeleted() == null || !dept.getIsDeleted())
                .map(this::toDTO)
                .collect(Collectors.toList());
            load(dtos);
            log.info("Loaded {} departments from database", dtos.size());
        } catch (Exception e) {
            log.error("Failed to load departments into cache", e);
        }
    }

    private void loadReferenceData() {
        try {
            List<College> colleges = collegeRepository.findAll();
            collegeCache = colleges.stream()
                .collect(Collectors.toMap(
                    College::getId,
                    College::getName,
                    (existing, replacement) -> existing
                ));
        } catch (Exception e) {
            log.warn("Could not load college reference data: {}", e.getMessage());
        }
    }

    private DepartmentSearchDTO toDTO(Department department) {
        // collegeId is primitive int, check > 0 instead of null
        String collegeName = department.getCollegeId() > 0 ?
            collegeCache.get(department.getCollegeId()) : null;

        return DepartmentSearchDTO.builder()
            .id(department.getId())
            .name(department.getName())
            .deptChairId(department.getDeptChairId())
            .deptViceChairId(department.getDeptViceChairId())
            .collegeId(department.getCollegeId())
            .collegeName(collegeName)
            .build();
    }

    public void refresh() {
        log.info("Refreshing department search cache...");
        loadDepartments();
    }

    public List<DepartmentSearchDTO> getByCollegeId(Integer collegeId, int limit) {
        return allItems.stream()
            .filter(dept -> dept.getCollegeId() != null && dept.getCollegeId().equals(collegeId))
            .limit(limit)
            .collect(Collectors.toList());
    }
}
