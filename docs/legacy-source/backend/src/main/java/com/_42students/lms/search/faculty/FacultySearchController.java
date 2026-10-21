package com._42students.lms.search.faculty;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.response.Response;
import com._42students.lms.enums.FacultyType;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.DepartmentRepository;
import com._42students.lms.security.UserPrincipal;
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

/**
 * Faculty Search Controller
 *
 * Provides ultra-fast faculty search using in-memory cache.
 * Supports fuzzy matching, synonym expansion, and multi-field search.
 */
@RestController
@RequestMapping("/api/v2/faculty")
@Slf4j
@Api(tags = "Faculty Search API (v2 - In-Memory)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class FacultySearchController {

    @Autowired
    private FacultySearchCache facultySearchCache;

    @Autowired
    private CollegeRepository collegeRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired(required = false)
    private SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    private AccessControlService accessControlService;

    @Autowired(required = false)
    private ScopeResolutionService scopeResolutionService;

    private UserPrincipal requirePrincipal() {
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal == null) {
            throw new org.springframework.security.access.AccessDeniedException("Authentication required");
        }
        return principal;
    }

    private boolean isGlobalSuperAdmin(UserPrincipal principal) {
        return accessControlService != null
                && accessControlService.isSuperAdmin(principal)
                && principal.getCollegeId() == null
                && principal.getOrganizationId() == null;
    }

    private List<FacultySearchDTO> getScopedItems(UserPrincipal principal) {
        if (isGlobalSuperAdmin(principal)) return facultySearchCache.filterForScope(null, null);
        Integer orgId = principal.getOrganizationId();
        Integer collegeId = principal.getCollegeId();
        if (orgId == null && collegeId == null) {
            throw new org.springframework.security.access.AccessDeniedException("Tenant scope not available");
        }
        return facultySearchCache.filterForScope(orgId, collegeId);
    }

    @GetMapping("/search")
    @ApiOperation(value = "Search faculty (in-memory)",
                  notes = "Ultra-fast faculty search using in-memory cache. Supports fuzzy matching and synonyms.")
    public ResponseEntity<Response<List<FacultySearchDTO>>> search(
            @ApiParam(value = "Search query", example = "john")
            @RequestParam(required = false, defaultValue = "") String query,
            @ApiParam(value = "Maximum results", example = "15")
            @RequestParam(required = false, defaultValue = "15") int limit,
            @ApiParam(value = "Filter by college ID (optional)")
            @RequestParam(required = false) Integer collegeId,
            @ApiParam(value = "Filter by department ID (optional)")
            @RequestParam(required = false) Integer deptId,
            @ApiParam(value = "Filter by faculty type (optional)")
            @RequestParam(required = false) FacultyType facultyType) {

        UserPrincipal principal = requirePrincipal();
        boolean isGlobalSuper = accessControlService != null
                && accessControlService.isSuperAdmin(principal)
                && principal.getCollegeId() == null
                && principal.getOrganizationId() == null;

        if (!isGlobalSuper) {
            // Scoped superadmin and all other roles are restricted: require college filter or use JWT college.
            if (principal.getCollegeId() != null) {
                collegeId = principal.getCollegeId();
            }
            if (collegeId == null && deptId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new Response<>("error", "collegeId or deptId is required (or use GLOBAL superadmin mode)", null));
            }
        }
        if (collegeId != null && accessControlService != null) {
            accessControlService.requireAccessCollege(principal, collegeId);
        }
        if (deptId != null && accessControlService != null) {
            accessControlService.requireAccessDepartment(principal, deptId);
        }

        long start = System.currentTimeMillis();

        List<FacultySearchDTO> results;

        // Apply filters if provided
        if (collegeId != null) {
            results = facultySearchCache.getByCollegeId(collegeId, limit);
            // Then search within college results
            if (query != null && !query.trim().isEmpty()) {
                results = results.stream()
                    .filter(faculty -> {
                        String searchText = faculty.getSearchableText().toLowerCase();
                        return searchText.contains(query.toLowerCase());
                    })
                    .limit(limit)
                    .collect(java.util.stream.Collectors.toList());
            }
        } else if (deptId != null) {
            results = facultySearchCache.getByDepartmentId(deptId, limit);
            // Then search within department results
            if (query != null && !query.trim().isEmpty()) {
                results = results.stream()
                    .filter(faculty -> {
                        String searchText = faculty.getSearchableText().toLowerCase();
                        return searchText.contains(query.toLowerCase());
                    })
                    .limit(limit)
                    .collect(java.util.stream.Collectors.toList());
            }
        } else if (facultyType != null) {
            results = facultySearchCache.getByFacultyType(facultyType, limit);
            // Then search within faculty type results
            if (query != null && !query.trim().isEmpty()) {
                results = results.stream()
                    .filter(faculty -> {
                        String searchText = faculty.getSearchableText().toLowerCase();
                        return searchText.contains(query.toLowerCase());
                    })
                    .limit(limit)
                    .collect(java.util.stream.Collectors.toList());
            }
        } else {
            // Normal search
            results = facultySearchCache.search(query, limit);
        }

        long duration = System.currentTimeMillis() - start;

        log.debug("Faculty search '{}' returned {} results in {}ms", query, results.size(), duration);

        return ResponseEntity.ok(
            new Response<>("success", "Faculty retrieved in " + duration + "ms", results)
        );
    }

    @GetMapping("/popular")
    @ApiOperation(value = "Get popular faculty", notes = "Returns most commonly accessed faculty members")
    public ResponseEntity<Response<List<FacultySearchDTO>>> getPopular(
            @RequestParam(required = false, defaultValue = "10") int limit) {

        UserPrincipal principal = requirePrincipal();
        List<FacultySearchDTO> popular = facultySearchCache.getPopular(Math.max(limit * 5, limit)).stream()
                .filter(f -> isGlobalSuperAdmin(principal)
                        || (principal.getCollegeId() != null && f.getCollegeId() != null && f.getCollegeId().equals(principal.getCollegeId()))
                        || (principal.getCollegeId() == null && principal.getOrganizationId() != null && f.getOrganizationId() != null && f.getOrganizationId().equals(principal.getOrganizationId())))
                .limit(limit)
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(
            new Response<>("success", "Popular faculty retrieved", popular)
        );
    }

    @GetMapping("/colleges")
    @ApiOperation(value = "Get all colleges", notes = "Returns list of all colleges")
    public ResponseEntity<Response<List<Map<String, Object>>>> getColleges() {
        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null && !accessControlService.isSuperAdmin(principal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new Response<>("error", "Superadmin only", null));
        }
        if (principal.getOrganizationId() != null || principal.getCollegeId() != null) {
            // Scoped superadmin: do not enumerate all colleges.
            return ResponseEntity.ok(new Response<>("success", "Colleges retrieved", java.util.List.of()));
        }
        List<Map<String, Object>> colleges = collegeRepository.findAll().stream()
            .map(college -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", college.getId());
                map.put("name", college.getName());
                map.put("city", college.getCity());
                map.put("state", college.getState());
                return map;
            })
            .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(
            new Response<>("success", "Colleges retrieved", colleges)
        );
    }

    @GetMapping("/college/{collegeId}")
    @ApiOperation(value = "Get faculty by college", notes = "Returns all faculty in a college")
    public ResponseEntity<Response<List<FacultySearchDTO>>> getByCollege(
            @PathVariable Integer collegeId,
            @RequestParam(required = false, defaultValue = "50") int limit) {

        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null) accessControlService.requireAccessCollege(principal, collegeId);
        List<FacultySearchDTO> faculty = facultySearchCache.getByCollegeId(collegeId, limit);

        return ResponseEntity.ok(
            new Response<>("success", "Faculty retrieved", faculty)
        );
    }

    @GetMapping("/department/{deptId}")
    @ApiOperation(value = "Get faculty by department", notes = "Returns all faculty in a department")
    public ResponseEntity<Response<List<FacultySearchDTO>>> getByDepartment(
            @PathVariable Integer deptId,
            @RequestParam(required = false, defaultValue = "50") int limit) {

        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null) accessControlService.requireAccessDepartment(principal, deptId);
        List<FacultySearchDTO> faculty = facultySearchCache.getByDepartmentId(deptId, limit);

        return ResponseEntity.ok(
            new Response<>("success", "Faculty retrieved", faculty)
        );
    }

    @GetMapping("/faculty-type/{facultyType}")
    @ApiOperation(value = "Get faculty by type", notes = "Returns faculty of specific type (PROFESSOR, ASSOCIATE_PROFESSOR, etc.)")
    public ResponseEntity<Response<List<FacultySearchDTO>>> getByFacultyType(
            @PathVariable FacultyType facultyType,
            @RequestParam(required = false, defaultValue = "50") int limit) {

        UserPrincipal principal = requirePrincipal();
        List<FacultySearchDTO> faculty = getScopedItems(principal).stream()
                .filter(f -> f.getFacultyType() == facultyType)
                .limit(limit)
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(
            new Response<>("success", "Faculty retrieved", faculty)
        );
    }

    @GetMapping("/categories")
    @ApiOperation(value = "Get all departments (categories)", notes = "Returns list of departments as categories")
    public ResponseEntity<Response<List<String>>> getCategories() {
        UserPrincipal principal = requirePrincipal();
        List<String> categories;
        if (isGlobalSuperAdmin(principal)) {
            categories = facultySearchCache.getCategories();
        } else {
            categories = getScopedItems(principal).stream()
                    .map(FacultySearchDTO::getDepartment)
                    .filter(n -> n != null && !n.trim().isEmpty())
                    .distinct()
                    .sorted(String::compareToIgnoreCase)
                    .collect(java.util.stream.Collectors.toList());
        }

        return ResponseEntity.ok(
            new Response<>("success", "Categories retrieved", categories)
        );
    }

    @GetMapping("/category/{department}")
    @ApiOperation(value = "Get faculty by department", notes = "Returns faculty in a department")
    public ResponseEntity<Response<List<FacultySearchDTO>>> getByDepartmentCategory(
            @PathVariable String department,
            @RequestParam(required = false, defaultValue = "50") int limit) {

        UserPrincipal principal = requirePrincipal();
        List<FacultySearchDTO> faculty;
        if (isGlobalSuperAdmin(principal)) {
            faculty = facultySearchCache.getByCategory(department, limit);
        } else {
            faculty = getScopedItems(principal).stream()
                    .filter(f -> f.getDepartment() != null && f.getDepartment().equalsIgnoreCase(department))
                    .limit(limit)
                    .collect(java.util.stream.Collectors.toList());
        }

        return ResponseEntity.ok(
            new Response<>("success", "Faculty retrieved", faculty)
        );
    }

    @PostMapping("/{facultyId}/select")
    @ApiOperation(value = "Record faculty selection", notes = "Track faculty access for popularity ranking")
    public ResponseEntity<Response<Void>> recordSelection(
            @PathVariable Integer facultyId) {

        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null && scopeResolutionService != null) {
            Integer collegeId = scopeResolutionService.resolveFacultyToCollegeId(facultyId);
            if (collegeId != null) {
                accessControlService.requireAccessCollege(principal, collegeId);
            }
        }
        facultySearchCache.recordUsage(facultyId);

        return ResponseEntity.ok(
            new Response<>("success", "Selection recorded", null)
        );
    }

    @GetMapping("/stats")
    @ApiOperation(value = "Get faculty search statistics")
    public ResponseEntity<Response<Map<String, Object>>> getStats() {
        UserPrincipal principal = requirePrincipal();
        Map<String, Object> stats = new HashMap<>();
        if (isGlobalSuperAdmin(principal)) {
            stats.put("totalFaculty", facultySearchCache.size());
            stats.put("departments", facultySearchCache.getCategories().size());
            stats.put("colleges", collegeRepository.count());
            stats.put("facultyTypes", java.util.Arrays.toString(FacultyType.values()));
        } else {
            List<FacultySearchDTO> scoped = getScopedItems(principal);
            stats.put("totalFaculty", scoped.size());
            stats.put("departments", scoped.stream()
                    .map(FacultySearchDTO::getDeptId)
                    .filter(id -> id != null && id > 0)
                    .distinct()
                    .count());
            stats.put("colleges", principal.getCollegeId() != null ? 1 : null);
            stats.put("facultyTypes", java.util.Arrays.toString(FacultyType.values()));
        }

        return ResponseEntity.ok(
            new Response<>("success", "Stats retrieved", stats)
        );
    }

    @GetMapping("/exists/{facultyName}")
    @ApiOperation(value = "Check if faculty exists")
    public ResponseEntity<Response<Boolean>> exists(@PathVariable String facultyName) {
        UserPrincipal principal = requirePrincipal();
        boolean exists;
        if (isGlobalSuperAdmin(principal)) {
            exists = facultySearchCache.exists(facultyName);
        } else {
            exists = getScopedItems(principal).stream()
                    .anyMatch(f -> f.getDisplayName() != null && f.getDisplayName().equalsIgnoreCase(facultyName));
        }
        return ResponseEntity.ok(
            new Response<>("success", "Checked", exists)
        );
    }

    @PostMapping("/refresh")
    @ApiOperation(value = "Refresh faculty cache", notes = "Reload faculty from database (admin)")
    public ResponseEntity<Response<Void>> refresh() {
        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null) accessControlService.requireSuperAdmin(principal);
        facultySearchCache.refresh();

        return ResponseEntity.ok(
            new Response<>("success", "Cache refreshed", null)
        );
    }
}


