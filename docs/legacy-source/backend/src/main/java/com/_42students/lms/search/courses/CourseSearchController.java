package com._42students.lms.search.courses;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.access.ResolvedLearnerScope;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.Department;
import com._42students.lms.repository.DepartmentRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.CourseSlugResolver;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Course Search Controller (v2).
 * All results are scoped: non–super-admin users only see courses in their college.
 */
@RestController
@RequestMapping("/api/v2/courses")
@Slf4j
@Api(tags = "Course Search API (v2 - In-Memory)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class CourseSearchController {
    
    @Autowired
    private CourseSearchCache courseSearchCache;
    
    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private CourseSlugResolver courseSlugResolver;

    @Autowired(required = false)
    private AccessControlService accessControlService;

    @Autowired(required = false)
    private SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    private ScopeResolutionService scopeResolutionService;
    
    private static final int MAX_QUERY_LENGTH = 200;
    private static final int MAX_SLUG_LENGTH = 64;

    private UserPrincipal requirePrincipal() {
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal == null) {
            throw new org.springframework.security.access.AccessDeniedException("Authentication required");
        }
        return principal;
    }

    private boolean isGlobalSuperAdmin(UserPrincipal principal) {
        boolean isSuper = accessControlService != null && accessControlService.isSuperAdmin(principal);
        return isSuper && principal.getCollegeId() == null && principal.getOrganizationId() == null;
    }

    private List<String> allowedDepartmentNames(UserPrincipal principal) {
        if (principal == null) return List.of();
        if (isGlobalSuperAdmin(principal)) {
            return departmentRepository.findAll().stream()
                    .filter(d -> d != null && (d.getIsDeleted() == null || !d.getIsDeleted()))
                    .map(Department::getName)
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .distinct()
                    .collect(Collectors.toList());
        }
        Integer collegeId = principal.getCollegeId();
        Integer orgId = principal.getOrganizationId();
        List<Department> depts = collegeId != null
                ? departmentRepository.fetchAllDepartments(collegeId)
                : (orgId != null ? departmentRepository.fetchAllDepartmentsByOrganizationId(orgId) : List.of());
        return depts.stream()
                .filter(d -> d != null && (d.getIsDeleted() == null || !d.getIsDeleted()))
                .map(Department::getName)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .collect(Collectors.toList());
    }

    @GetMapping("/search")
    @ApiOperation(value = "Search courses (in-memory)", notes = "Scoped: deptId must be in principal's college; if no deptId, results limited to principal's college.")
    public ResponseEntity<Response<List<CourseSearchDTO>>> search(
            @ApiParam(value = "Search query", example = "java")
            @RequestParam(required = false, defaultValue = "") String query,
            @ApiParam(value = "Maximum results", example = "15")
            @RequestParam(required = false, defaultValue = "15") int limit,
            @ApiParam(value = "Filter by department ID (must be in principal's scope)")
            @RequestParam(required = false) Integer deptId) {
        if (query != null && query.length() > MAX_QUERY_LENGTH) {
            return ResponseEntity.badRequest().body(new Response<>("error", "Query length must not exceed " + MAX_QUERY_LENGTH, null));
        }
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new Response<>("error", "Authentication required", null));
        }
        if (deptId != null && accessControlService != null) {
            accessControlService.requireAccessDepartment(principal, deptId);
        }
        long start = System.currentTimeMillis();

        List<CourseSearchDTO> results;
        if (deptId != null) {
            results = courseSearchCache.getByDepartmentId(deptId, limit);
            if (query != null && !query.trim().isEmpty()) {
                String q = query.toLowerCase().trim();
                results = results.stream()
                    .filter(course -> course.getSearchableText().toLowerCase().contains(q))
                    .limit(limit)
                    .collect(Collectors.toList());
            }
        } else {
            boolean isSuper = accessControlService != null && accessControlService.isSuperAdmin(principal);
            boolean isGlobalSuper = isSuper && principal.getCollegeId() == null && principal.getOrganizationId() == null;
            if (isGlobalSuper) {
                results = courseSearchCache.search(query, limit);
            } else {
                Integer collegeId = principal.getCollegeId();
                Integer organizationId = principal.getOrganizationId();
                if (collegeId == null && principal.isLearner() && scopeResolutionService != null) {
                    ResolvedLearnerScope scope = scopeResolutionService.resolveFullScope(principal.getId());
                    collegeId = scope.getCollegeId();
                    if (organizationId == null) organizationId = scope.getOrganizationId();
                }
                if (collegeId != null) {
                    results = courseSearchCache.getByCollegeId(collegeId, limit);
                } else if (organizationId != null && isSuper) {
                    results = courseSearchCache.getByOrganizationId(organizationId, limit);
                } else {
                    results = List.of();
                }
                if (query != null && !query.trim().isEmpty()) {
                    String q = query.toLowerCase().trim();
                    results = results.stream()
                            .filter(course -> course.getSearchableText().toLowerCase().contains(q))
                            .limit(limit)
                            .collect(Collectors.toList());
                }
            }
        }
        
        long duration = System.currentTimeMillis() - start;
        log.debug("Course search '{}' returned {} results in {}ms", query, results.size(), duration);
        return ResponseEntity.ok(new Response<>("success", "Courses retrieved in " + duration + "ms", results));
    }
    
    @GetMapping("/popular")
    @ApiOperation(value = "Get popular courses", notes = "Scoped: non-super-admin users only see popular courses within their own college/organization.")
    public ResponseEntity<Response<List<CourseSearchDTO>>> getPopular(
            @RequestParam(required = false, defaultValue = "10") int limit) {
        // SECURITY FIX: this endpoint previously had no authentication check and no tenant scoping
        // at all — courseSearchCache.getPopular() reads the shared in-memory cache across every
        // college/organization, so any caller (and, unlike every other endpoint in this controller,
        // not even necessarily an authenticated one) could see popular-course names and metadata
        // from colleges they have no access to. Scope it the same way search()/getStats()/exists()
        // already do for this same cache.
        UserPrincipal principal = requirePrincipal();
        List<CourseSearchDTO> popular;
        if (isGlobalSuperAdmin(principal)) {
            popular = courseSearchCache.getPopular(limit);
        } else {
            List<String> allowed = allowedDepartmentNames(principal);
            popular = courseSearchCache.getPopular(Math.max(limit, courseSearchCache.size())).stream()
                    .filter(c -> c.getDeptName() != null && allowed.stream().anyMatch(n -> n.equalsIgnoreCase(c.getDeptName())))
                    .limit(limit)
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(
            new Response<>("success", "Popular courses retrieved", popular)
        );
    }
    
    @GetMapping("/departments")
    @ApiOperation(value = "Get departments", notes = "Super-admin: all. Others: principal's college only.")
    public ResponseEntity<Response<List<Map<String, Object>>>> getDepartments() {
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new Response<>("error", "Authentication required", null));
        }
        List<Department> depts;
        if (accessControlService != null && accessControlService.isSuperAdmin(principal)) {
            depts = departmentRepository.findAll();
        } else {
            Integer collegeId = principal.getCollegeId();
            if (collegeId == null && principal.isLearner() && scopeResolutionService != null) {
                collegeId = scopeResolutionService.resolveFullScope(principal.getId()).getCollegeId();
            }
            if (collegeId != null) {
                depts = departmentRepository.fetchAllDepartments(collegeId);
            } else {
                depts = List.of();
            }
        }
        List<Map<String, Object>> departments = depts.stream()
            .map(dept -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", dept.getId());
                map.put("name", dept.getName());
                return map;
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(new Response<>("success", "Departments retrieved", departments));
    }
    
    @GetMapping("/department/{deptId}")
    @ApiOperation(value = "Get courses by department", notes = "Requires department access.")
    public ResponseEntity<Response<List<CourseSearchDTO>>> getByDepartment(
            @PathVariable Integer deptId,
            @RequestParam(required = false, defaultValue = "50") int limit) {
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new Response<>("error", "Authentication required", null));
        }
        if (accessControlService != null) accessControlService.requireAccessDepartment(principal, deptId);
        List<CourseSearchDTO> courses = courseSearchCache.getByDepartmentId(deptId, limit);
        return ResponseEntity.ok(new Response<>("success", "Courses retrieved", courses));
    }
    
    @GetMapping("/categories")
    @ApiOperation(value = "Get all course categories (departments)", notes = "Returns list of departments as categories")
    public ResponseEntity<Response<List<String>>> getCategories() {
        UserPrincipal principal = requirePrincipal();
        List<String> categories = allowedDepartmentNames(principal).stream()
                .sorted(String::compareToIgnoreCase)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(
            new Response<>("success", "Categories retrieved", categories)
        );
    }
    
    @GetMapping("/category/{category}")
    @ApiOperation(value = "Get courses by category (department)", notes = "Returns courses in a department")
    public ResponseEntity<Response<List<CourseSearchDTO>>> getByCategory(
            @PathVariable String category,
            @RequestParam(required = false, defaultValue = "50") int limit) {
        UserPrincipal principal = requirePrincipal();
        List<String> allowed = allowedDepartmentNames(principal);
        if (!isGlobalSuperAdmin(principal) && (category == null || allowed.stream().noneMatch(n -> n.equalsIgnoreCase(category)))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new Response<>("error", "Department not in scope", null));
        }
        List<CourseSearchDTO> courses = courseSearchCache.getByCategory(category, limit);
        
        return ResponseEntity.ok(
            new Response<>("success", "Courses retrieved", courses)
        );
    }
    
    @PostMapping("/{courseId}/select")
    @ApiOperation(value = "Record course selection (by ID)", notes = "Track course access for popularity ranking. Prefer /by-slug/{slug}/select to avoid exposing IDs.")
    public ResponseEntity<Response<Void>> recordSelection(
            @PathVariable Integer courseId) {
        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null) {
            accessControlService.requireAccessCourse(principal, courseId);
        }
        courseSearchCache.recordUsage(courseId);
        return ResponseEntity.ok(
            new Response<>("success", "Selection recorded", null)
        );
    }

    @PostMapping("/by-slug/{slug}/select")
    @ApiOperation(value = "Record course selection (by slug)", notes = "Track course access for popularity ranking. Use slug to avoid exposing internal course ID.")
    public ResponseEntity<Response<Void>> recordSelectionBySlug(@PathVariable String slug) {
        UserPrincipal principal = requirePrincipal();
        if (slug == null || slug.length() > MAX_SLUG_LENGTH) {
            return ResponseEntity.badRequest().body(new Response<>("error", "Invalid slug", null));
        }
        try {
            courseSlugResolver.validateSlugFormat(slug);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return ResponseEntity.status(e.getStatus()).body(new Response<>("error", e.getReason(), null));
        }
        int courseId = courseSlugResolver.resolve(slug, null);
        if (accessControlService != null) {
            accessControlService.requireAccessCourse(principal, courseId);
        }
        courseSearchCache.recordUsage(courseId);
        return ResponseEntity.ok(
            new Response<>("success", "Selection recorded", null)
        );
    }
    
    @GetMapping("/stats")
    @ApiOperation(value = "Get course search statistics")
    public ResponseEntity<Response<Map<String, Object>>> getStats() {
        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null) accessControlService.requireSuperAdmin(principal);
        if (!isGlobalSuperAdmin(principal)) {
            List<String> allowed = allowedDepartmentNames(principal);
            List<CourseSearchDTO> scoped = courseSearchCache.getAllItems().stream()
                    .filter(c -> c.getDeptName() != null && allowed.stream().anyMatch(n -> n.equalsIgnoreCase(c.getDeptName())))
                    .collect(Collectors.toList());
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalCourses", scoped.size());
            stats.put("categories", scoped.stream()
                    .map(CourseSearchDTO::getDeptName)
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .distinct()
                    .count());
            stats.put("departments", allowed.size());
            return ResponseEntity.ok(new Response<>("success", "Stats retrieved", stats));
        }
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCourses", courseSearchCache.size());
        stats.put("categories", courseSearchCache.getCategories().size());
        stats.put("departments", departmentRepository.count());
        
        return ResponseEntity.ok(
            new Response<>("success", "Stats retrieved", stats)
        );
    }
    
    @GetMapping("/exists/{courseName}")
    @ApiOperation(value = "Check if course exists")
    public ResponseEntity<Response<Boolean>> exists(@PathVariable String courseName) {
        UserPrincipal principal = requirePrincipal();
        boolean exists;
        if (isGlobalSuperAdmin(principal)) {
            exists = courseSearchCache.exists(courseName);
        } else {
            List<String> allowed = allowedDepartmentNames(principal);
            exists = courseSearchCache.getAllItems().stream()
                    .filter(c -> c.getDeptName() != null && allowed.stream().anyMatch(n -> n.equalsIgnoreCase(c.getDeptName())))
                    .anyMatch(c -> c.getCourseName() != null && c.getCourseName().equalsIgnoreCase(courseName));
        }
        return ResponseEntity.ok(new Response<>("success", "Checked", exists));
    }
    
    @PostMapping("/refresh")
    @ApiOperation(value = "Refresh course cache", notes = "Reload courses from database (admin)")
    public ResponseEntity<Response<Void>> refresh() {
        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null) accessControlService.requireSuperAdmin(principal);
        courseSearchCache.refresh();
        
        return ResponseEntity.ok(
            new Response<>("success", "Cache refreshed", null)
        );
    }
}


