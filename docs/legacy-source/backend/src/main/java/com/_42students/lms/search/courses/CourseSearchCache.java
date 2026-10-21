package com._42students.lms.search.courses;

import com._42students.lms.model.Course;
import com._42students.lms.model.Department;
import com._42students.lms.model.College;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.CourseRepository;
import com._42students.lms.repository.DepartmentRepository;
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
 * Course Search Cache
 * 
 * Provides fast in-memory search for courses with:
 * - Fuzzy matching (typos)
 * - Synonym expansion (cs → computer science)
 * - Weighted ranking
 * - Department filtering
 */
@Component
@Slf4j
public class CourseSearchCache extends GenericSearchCache<CourseSearchDTO> {
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private CollegeRepository collegeRepository;
    
    // Cache department names
    private Map<Integer, String> departmentCache = new HashMap<>();
    
    @PostConstruct
    public void init() {
        log.info("Initializing Course Search Cache...");
        
        // Configure search behavior
        configure();
        
        // Load courses from database
        loadCourses();
        
        log.info("Course Search Cache initialized with {} courses", size());
    }
    
    @Override
    protected void configure() {
        // Set which fields to search
        setSearchFieldsList(java.util.Arrays.asList(
            CourseSearchDTO::getCourseName,
            CourseSearchDTO::getShortTitle,
            CourseSearchDTO::getDeptName
        ));
        
        // Add course-specific synonyms
        addSynonym("cs", "computer science");
        addSynonym("ds", "data structures");
        addSynonym("algo", "algorithms");
        addSynonym("ml", "machine learning");
        addSynonym("ai", "artificial intelligence");
        addSynonym("dbms", "database management");
        addSynonym("os", "operating systems");
        addSynonym("cn", "computer networks");
        addSynonym("se", "software engineering");
        addSynonym("oop", "object oriented programming");
        addSynonym("dsa", "data structures and algorithms");
        addSynonym("web", "web development");
        addSynonym("app", "application");
        addSynonym("dev", "development");
        addSynonym("prog", "programming");
        
        // Set category field (by department)
        setCategoryField(CourseSearchDTO::getDeptName);
    }
    
    /**
     * Load courses from database and convert to DTOs
     */
    private void loadCourses() {
        try {
            // Load all departments for name lookup
            List<Department> departments = departmentRepository.findAll();
            departmentCache = departments.stream()
                .collect(Collectors.toMap(
                    Department::getId,
                    Department::getName,
                    (existing, replacement) -> existing
                ));
            
            // Load all active courses
            List<Course> courses = courseRepository.findAll();
            
            // Convert to DTOs - skip invalid records instead of failing entire cache load
            List<CourseSearchDTO> dtos = courses.stream()
                .map(course -> {
                    try {
                        return toDTO(course);
                    } catch (Exception e) {
                        log.warn("Skipping course {} due to conversion error: {}", 
                            course.getId(), e.getMessage());
                        return null;
                    }
                })
                .filter(Objects::nonNull)  // Remove null entries
                .filter(dto -> dto.getActive() != null && dto.getActive()) // Only active courses
                .collect(Collectors.toList());
            
            // Load into cache
            load(dtos);
            
            log.info("Loaded {} active courses from database", dtos.size());
            
        } catch (Exception e) {
            log.error("Failed to load courses into cache", e);
        }
    }
    
    /**
     * Convert Course entity to CourseSearchDTO
     */
    private CourseSearchDTO toDTO(Course course) {
        String deptName = departmentCache.getOrDefault(course.getDeptId(), "Unknown");
        
        return CourseSearchDTO.builder()
            .id(course.getId())
            .slug(course.getSlug()) // Include slug for URL obfuscation
            .courseName(course.getCourseName())
            .shortTitle(course.getShortTitle())
            .deptId(course.getDeptId())
            .deptName(deptName)
            .active(course.getActive())
            .enabled(course.getEnabled())
            .build();
    }
    
    /**
     * Refresh cache (reload from database)
     */
    public void refresh() {
        log.info("Refreshing course search cache...");
        loadCourses();
    }
    
    /**
     * Get courses by department ID. Thread-safe with cache load/refresh.
     */
    public List<CourseSearchDTO> getByDepartmentId(Integer deptId, int limit) {
        synchronized (this) {
            return allItems.stream()
                .filter(course -> course.getDeptId() != null && course.getDeptId().equals(deptId))
                .limit(limit)
                .collect(Collectors.toList());
        }
    }

    /**
     * Get courses for a college (all departments in that college). For scope-limited search.
     */
    public List<CourseSearchDTO> getByCollegeId(Integer collegeId, int limit) {
        if (collegeId == null) return List.of();
        List<Integer> deptIds = departmentRepository.fetchAllDepartments(collegeId).stream()
            .map(Department::getId)
            .collect(Collectors.toList());
        if (deptIds.isEmpty()) return List.of();
        synchronized (this) {
            return allItems.stream()
                .filter(course -> course.getDeptId() != null && deptIds.contains(course.getDeptId()))
                .limit(limit)
                .collect(Collectors.toList());
        }
    }

    /**
     * Get courses for an organization (all colleges in that org).
     */
    public List<CourseSearchDTO> getByOrganizationId(Integer organizationId, int limit) {
        if (organizationId == null) return List.of();
        List<College> colleges = collegeRepository.fetchColleges(organizationId);
        if (colleges == null || colleges.isEmpty()) return List.of();
        List<Integer> deptIds = colleges.stream()
                .flatMap(c -> departmentRepository.fetchAllDepartments(c.getId()).stream())
                .map(Department::getId)
                .distinct()
                .collect(Collectors.toList());
        if (deptIds.isEmpty()) return List.of();
        synchronized (this) {
            return allItems.stream()
                    .filter(course -> course.getDeptId() != null && deptIds.contains(course.getDeptId()))
                    .limit(limit)
                    .collect(Collectors.toList());
        }
    }
}

