package com._42students.lms.search.departments;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.response.Response;
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

@RestController
@RequestMapping("/api/v2/departments")
@Slf4j
@Api(tags = "Department Search API (v2 - In-Memory)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class DepartmentSearchController {

    @Autowired
    private DepartmentSearchCache departmentSearchCache;

    @Autowired(required = false)
    private SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    private AccessControlService accessControlService;

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

    private Integer requireEffectiveCollegeId(UserPrincipal principal, Integer collegeId) {
        if (isGlobalSuperAdmin(principal)) return collegeId;
        if (principal.getCollegeId() != null) return principal.getCollegeId();
        if (collegeId == null) {
            throw new org.springframework.security.access.AccessDeniedException("collegeId is required");
        }
        return collegeId;
    }

    @GetMapping("/search")
    @ApiOperation(value = "Search departments (in-memory)", notes = "Ultra-fast department search using in-memory cache.")
    public ResponseEntity<Response<List<DepartmentSearchDTO>>> search(
            @ApiParam(value = "Search query", example = "cse")
            @RequestParam(required = false, defaultValue = "") String query,
            @ApiParam(value = "Maximum results", example = "15")
            @RequestParam(required = false, defaultValue = "15") int limit,
            @ApiParam(value = "Filter by college ID (optional)")
            @RequestParam(required = false) Integer collegeId) {

        UserPrincipal principal = requirePrincipal();
        boolean isGlobalSuper = accessControlService != null
                && accessControlService.isSuperAdmin(principal)
                && principal.getCollegeId() == null
                && principal.getOrganizationId() == null;

        if (!isGlobalSuper) {
            if (principal.getCollegeId() != null) {
                collegeId = principal.getCollegeId();
            }
            if (collegeId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new Response<>("error", "collegeId is required (or use GLOBAL superadmin mode)", null));
            }
        }
        if (collegeId != null && accessControlService != null) {
            accessControlService.requireAccessCollege(principal, collegeId);
        }

        long start = System.currentTimeMillis();

        List<DepartmentSearchDTO> results;

        if (collegeId != null) {
            results = departmentSearchCache.getByCollegeId(collegeId, limit);
            if (query != null && !query.trim().isEmpty()) {
                results = results.stream()
                    .filter(dept -> {
                        String searchText = dept.getSearchableText().toLowerCase();
                        return searchText.contains(query.toLowerCase());
                    })
                    .limit(limit)
                    .collect(java.util.stream.Collectors.toList());
            }
        } else {
            results = departmentSearchCache.search(query, limit);
        }

        long duration = System.currentTimeMillis() - start;

        log.debug("Department search '{}' returned {} results in {}ms", query, results.size(), duration);

        return ResponseEntity.ok(
            new Response<>("success", "Departments retrieved in " + duration + "ms", results)
        );
    }

    @GetMapping("/popular")
    @ApiOperation(value = "Get popular departments")
    public ResponseEntity<Response<List<DepartmentSearchDTO>>> getPopular(
            @RequestParam(required = false, defaultValue = "10") int limit) {

        UserPrincipal principal = requirePrincipal();
        Integer collegeId = requireEffectiveCollegeId(principal, null);
        List<DepartmentSearchDTO> popular = departmentSearchCache.getPopular(Math.max(limit * 5, limit)).stream()
                .filter(d -> isGlobalSuperAdmin(principal) || (d.getCollegeId() != null && d.getCollegeId().equals(collegeId)))
                .limit(limit)
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(
            new Response<>("success", "Popular departments retrieved", popular)
        );
    }

    @GetMapping("/college/{collegeId}")
    @ApiOperation(value = "Get departments by college")
    public ResponseEntity<Response<List<DepartmentSearchDTO>>> getByCollege(
            @PathVariable Integer collegeId,
            @RequestParam(required = false, defaultValue = "50") int limit) {

        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null) accessControlService.requireAccessCollege(principal, collegeId);
        List<DepartmentSearchDTO> departments = departmentSearchCache.getByCollegeId(collegeId, limit);

        return ResponseEntity.ok(
            new Response<>("success", "Departments retrieved", departments)
        );
    }

    @GetMapping("/categories")
    @ApiOperation(value = "Get all department categories (colleges)")
    public ResponseEntity<Response<List<String>>> getCategories() {
        UserPrincipal principal = requirePrincipal();
        Integer collegeId = requireEffectiveCollegeId(principal, null);
        List<String> categories;
        if (isGlobalSuperAdmin(principal)) {
            categories = departmentSearchCache.getCategories();
        } else {
            categories = departmentSearchCache.getByCollegeId(collegeId, Integer.MAX_VALUE).stream()
                    .map(DepartmentSearchDTO::getCollegeName)
                    .filter(n -> n != null && !n.trim().isEmpty())
                    .distinct()
                    .collect(java.util.stream.Collectors.toList());
        }

        return ResponseEntity.ok(
            new Response<>("success", "Categories retrieved", categories)
        );
    }

    @GetMapping("/category/{college}")
    @ApiOperation(value = "Get departments by college category")
    public ResponseEntity<Response<List<DepartmentSearchDTO>>> getByCategory(
            @PathVariable String college,
            @RequestParam(required = false, defaultValue = "50") int limit) {

        UserPrincipal principal = requirePrincipal();
        Integer collegeId = requireEffectiveCollegeId(principal, null);
        List<DepartmentSearchDTO> departments;
        if (isGlobalSuperAdmin(principal)) {
            departments = departmentSearchCache.getByCategory(college, limit);
        } else {
            departments = departmentSearchCache.getByCollegeId(collegeId, Integer.MAX_VALUE).stream()
                    .filter(d -> d.getCollegeName() != null && d.getCollegeName().equalsIgnoreCase(college))
                    .limit(limit)
                    .collect(java.util.stream.Collectors.toList());
        }

        return ResponseEntity.ok(
            new Response<>("success", "Departments retrieved", departments)
        );
    }

    @PostMapping("/{deptId}/select")
    @ApiOperation(value = "Record department selection")
    public ResponseEntity<Response<Void>> recordSelection(
            @PathVariable Integer deptId) {

        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null) {
            accessControlService.requireAccessDepartment(principal, deptId);
        }
        departmentSearchCache.recordUsage(deptId);

        return ResponseEntity.ok(
            new Response<>("success", "Selection recorded", null)
        );
    }

    @GetMapping("/stats")
    @ApiOperation(value = "Get department search statistics")
    public ResponseEntity<Response<Map<String, Object>>> getStats() {
        UserPrincipal principal = requirePrincipal();
        Integer collegeId = requireEffectiveCollegeId(principal, null);
        Map<String, Object> stats = new HashMap<>();
        if (isGlobalSuperAdmin(principal)) {
            stats.put("totalDepartments", departmentSearchCache.size());
            stats.put("colleges", departmentSearchCache.getCategories().size());
        } else {
            List<DepartmentSearchDTO> scoped = departmentSearchCache.getByCollegeId(collegeId, Integer.MAX_VALUE);
            stats.put("totalDepartments", scoped.size());
            stats.put("colleges", 1);
        }

        return ResponseEntity.ok(
            new Response<>("success", "Stats retrieved", stats)
        );
    }

    @GetMapping("/exists/{deptName}")
    @ApiOperation(value = "Check if department exists")
    public ResponseEntity<Response<Boolean>> exists(@PathVariable String deptName) {
        UserPrincipal principal = requirePrincipal();
        Integer collegeId = requireEffectiveCollegeId(principal, null);
        boolean exists;
        if (isGlobalSuperAdmin(principal)) {
            exists = departmentSearchCache.exists(deptName);
        } else {
            exists = departmentSearchCache.getByCollegeId(collegeId, Integer.MAX_VALUE).stream()
                    .anyMatch(d -> d.getName() != null && d.getName().equalsIgnoreCase(deptName));
        }
        return ResponseEntity.ok(
            new Response<>("success", "Checked", exists)
        );
    }

    @PostMapping("/refresh")
    @ApiOperation(value = "Refresh department cache")
    public ResponseEntity<Response<Void>> refresh() {
        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null) accessControlService.requireSuperAdmin(principal);
        departmentSearchCache.refresh();

        return ResponseEntity.ok(
            new Response<>("success", "Cache refreshed", null)
        );
    }
}


