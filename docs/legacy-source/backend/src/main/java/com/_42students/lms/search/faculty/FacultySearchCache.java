package com._42students.lms.search.faculty;

import com._42students.lms.enums.FacultyType;
import com._42students.lms.model.College;
import com._42students.lms.model.Department;
import com._42students.lms.model.Faculty;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.DepartmentRepository;
import com._42students.lms.repository.FacultyRepository;
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
 * Faculty Search Cache
 *
 * Provides fast in-memory search for faculty with:
 * - Fuzzy matching (typos)
 * - Synonym expansion (prof → professor, hod → head of department)
 * - Weighted ranking
 * - Multi-field search (name, email, department, faculty type, etc.)
 */
@Component
@Slf4j
public class FacultySearchCache extends GenericSearchCache<FacultySearchDTO> {

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private CollegeRepository collegeRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired(required = false)
    private ScopeResolutionService scopeResolutionService;

    // Cache for foreign key lookups
    private Map<Integer, String> collegeCache = new HashMap<>();
    private Map<Integer, String> departmentCache = new HashMap<>();

    @PostConstruct
    public void init() {
        log.info("Initializing Faculty Search Cache...");

        // Configure search behavior
        configure();

        // Load faculty from database
        loadFaculty();

        log.info("Faculty Search Cache initialized with {} faculty members", size());
    }

    @Override
    protected void configure() {
        // Set which fields to search
        setSearchFieldsList(java.util.Arrays.asList(
            FacultySearchDTO::getFirstName,
            FacultySearchDTO::getLastName,
            FacultySearchDTO::getUniqueId,
            FacultySearchDTO::getContactMail,
            FacultySearchDTO::getContactMobile,
            FacultySearchDTO::getDepartment,
            FacultySearchDTO::getDeptName,
            FacultySearchDTO::getCollegeName
        ));

        // Add faculty-specific synonyms
        addSynonym("prof", "professor");
        addSynonym("professor", "professor");
        addSynonym("hod", "head of department");
        addSynonym("head", "head of department");
        addSynonym("asst prof", "assistant professor");
        addSynonym("asst", "assistant professor");
        addSynonym("assoc prof", "associate professor");
        addSynonym("assoc", "associate professor");
        addSynonym("lecturer", "lecturer");
        addSynonym("instructor", "instructor");
        addSynonym("mobile", "contact_mobile");
        addSynonym("phone", "contact_mobile");
        addSynonym("email", "contact_mail");
        addSynonym("mail", "contact_mail");
        addSynonym("dept", "department");
        addSynonym("fac", "faculty");
        addSynonym("teacher", "faculty");

        // Set category field (by department)
        setCategoryField(FacultySearchDTO::getDepartment);
    }

    /**
     * Load faculty from database and convert to DTOs
     */
    private void loadFaculty() {
        try {
            // Load all reference data first
            loadReferenceData();

            // Load all faculty
            List<Faculty> faculty = facultyRepository.findAll();

            // Convert to DTOs - skip invalid records instead of failing entire cache load
            List<FacultySearchDTO> dtos = faculty.stream()
                .filter(f -> f.getIsDeleted() == null || !f.getIsDeleted()) // Only active faculty
                .map(f -> {
                    try {
                        return toDTO(f);
                    } catch (Exception e) {
                        log.warn("Skipping faculty {} due to conversion error: {}", 
                            f.getId(), e.getMessage());
                        return null;
                    }
                })
                .filter(Objects::nonNull)  // Remove null entries
                .collect(Collectors.toList());

            // Load into cache
            load(dtos);

            log.info("Loaded {} active faculty members from database", dtos.size());

        } catch (Exception e) {
            log.error("Failed to load faculty into cache", e);
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

            // Load departments
            List<Department> departments = departmentRepository.findAll();
            departmentCache = departments.stream()
                .collect(Collectors.toMap(
                    Department::getId,
                    Department::getName,
                    (existing, replacement) -> existing
                ));

            log.debug("Loaded reference data: {} colleges, {} departments",
                collegeCache.size(), departmentCache.size());

        } catch (Exception e) {
            log.warn("Could not load all reference data: {}", e.getMessage());
        }
    }

    /**
     * Convert Faculty entity to FacultySearchDTO
     */
    private FacultySearchDTO toDTO(Faculty faculty) {
        String collegeName = faculty.getCollegeId() != null ?
            collegeCache.get(faculty.getCollegeId()) : null;

        String deptName = faculty.getDeptId() != null ?
            departmentCache.get(faculty.getDeptId()) : null;

        Integer organizationId = (scopeResolutionService != null && faculty.getCollegeId() != null)
                ? scopeResolutionService.resolveCollegeToOrganizationId(faculty.getCollegeId())
                : null;

        return FacultySearchDTO.builder()
            .id(faculty.getId())
            .firstName(faculty.getFirstName())
            .lastName(faculty.getLastName())
            .uniqueId(faculty.getUniqueId())
            .contactMail(faculty.getContactMail())
            .contactMobile(faculty.getContactMobile())
            .department(faculty.getDepartment())
            .facultyType(faculty.getFacultyType())
            .deptId(faculty.getDeptId())
            .deptName(deptName)
            .organizationId(organizationId)
            .collegeId(faculty.getCollegeId())
            .collegeName(collegeName)
            .build();
    }

    /**
     * Refresh cache (reload from database)
     */
    public void refresh() {
        log.info("Refreshing faculty search cache...");
        loadFaculty();
    }

    /**
     * Get faculty by college ID
     */
    public List<FacultySearchDTO> getByCollegeId(Integer collegeId, int limit) {
        return allItems.stream()
            .filter(faculty -> faculty.getCollegeId() != null && faculty.getCollegeId().equals(collegeId))
            .limit(limit)
            .collect(Collectors.toList());
    }

    /**
     * Get faculty by department ID
     */
    public List<FacultySearchDTO> getByDepartmentId(Integer deptId, int limit) {
        return allItems.stream()
            .filter(faculty -> faculty.getDeptId() != null && faculty.getDeptId().equals(deptId))
            .limit(limit)
            .collect(Collectors.toList());
    }

    /**
     * Get faculty by faculty type
     */
    public List<FacultySearchDTO> getByFacultyType(FacultyType facultyType, int limit) {
        return allItems.stream()
            .filter(faculty -> faculty.getFacultyType() == facultyType)
            .limit(limit)
            .collect(Collectors.toList());
    }

    public List<FacultySearchDTO> filterForScope(Integer organizationId, Integer collegeId) {
        synchronized (this) {
            if (collegeId != null) {
                return allItems.stream()
                        .filter(f -> f.getCollegeId() != null && f.getCollegeId().equals(collegeId))
                        .collect(Collectors.toList());
            }
            if (organizationId != null) {
                return allItems.stream()
                        .filter(f -> f.getOrganizationId() != null && f.getOrganizationId().equals(organizationId))
                        .collect(Collectors.toList());
            }
            return new java.util.ArrayList<>(allItems);
        }
    }
}

