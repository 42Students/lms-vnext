package com._42students.lms.search.programs;

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
@RequestMapping("/api/v2/programs")
@Slf4j
@Api(tags = "Program Search API (v2 - In-Memory)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class ProgramSearchController {

    @Autowired
    private ProgramSearchCache programSearchCache;

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

    private List<ProgramSearchDTO> getScopedItems(UserPrincipal principal) {
        if (isGlobalSuperAdmin(principal)) return programSearchCache.filterForScope(null, null);
        Integer orgId = principal.getOrganizationId();
        Integer collegeId = principal.getCollegeId();
        if (orgId == null && collegeId == null) {
            throw new org.springframework.security.access.AccessDeniedException("Tenant scope not available");
        }
        return programSearchCache.filterForScope(orgId, collegeId);
    }

    @GetMapping("/search")
    @ApiOperation(value = "Search programs (in-memory)", notes = "Ultra-fast program search using in-memory cache.")
    public ResponseEntity<Response<List<ProgramSearchDTO>>> search(
            @ApiParam(value = "Search query", example = "btech")
            @RequestParam(required = false, defaultValue = "") String query,
            @ApiParam(value = "Maximum results", example = "15")
            @RequestParam(required = false, defaultValue = "15") int limit,
            @ApiParam(value = "Filter by department ID (optional)")
            @RequestParam(required = false) Integer deptId) {

        UserPrincipal principal = requirePrincipal();
        boolean isGlobalSuper = accessControlService != null
                && accessControlService.isSuperAdmin(principal)
                && principal.getCollegeId() == null
                && principal.getOrganizationId() == null;

        long start = System.currentTimeMillis();

        List<ProgramSearchDTO> results;

        if (deptId != null) {
            if (accessControlService != null) {
                accessControlService.requireAccessDepartment(principal, deptId);
            }
            results = programSearchCache.getByDepartmentId(deptId, limit);
            if (query != null && !query.trim().isEmpty()) {
                results = results.stream()
                    .filter(program -> {
                        String searchText = program.getSearchableText().toLowerCase();
                        return searchText.contains(query.toLowerCase());
                    })
                    .limit(limit)
                    .collect(java.util.stream.Collectors.toList());
            }
        } else {
            if (!isGlobalSuper) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new Response<>("error", "deptId is required (or use GLOBAL superadmin mode)", null));
            }
            results = programSearchCache.search(query, limit);
        }

        long duration = System.currentTimeMillis() - start;

        log.debug("Program search '{}' returned {} results in {}ms", query, results.size(), duration);

        return ResponseEntity.ok(
            new Response<>("success", "Programs retrieved in " + duration + "ms", results)
        );
    }

    @GetMapping("/popular")
    @ApiOperation(value = "Get popular programs")
    public ResponseEntity<Response<List<ProgramSearchDTO>>> getPopular(
            @RequestParam(required = false, defaultValue = "10") int limit) {

        UserPrincipal principal = requirePrincipal();
        // Usage is tracked globally in-memory; filter before returning to avoid cross-tenant leakage.
        List<ProgramSearchDTO> popular = programSearchCache.getPopular(Math.max(limit * 5, limit)).stream()
                .filter(p -> isGlobalSuperAdmin(principal)
                        || (principal.getCollegeId() != null && p.getCollegeId() != null && p.getCollegeId().equals(principal.getCollegeId()))
                        || (principal.getCollegeId() == null && principal.getOrganizationId() != null && p.getOrganizationId() != null && p.getOrganizationId().equals(principal.getOrganizationId())))
                .limit(limit)
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(
            new Response<>("success", "Popular programs retrieved", popular)
        );
    }

    @GetMapping("/department/{deptId}")
    @ApiOperation(value = "Get programs by department")
    public ResponseEntity<Response<List<ProgramSearchDTO>>> getByDepartment(
            @PathVariable Integer deptId,
            @RequestParam(required = false, defaultValue = "50") int limit) {

        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null) {
            accessControlService.requireAccessDepartment(principal, deptId);
        }
        List<ProgramSearchDTO> programs = programSearchCache.getByDepartmentId(deptId, limit);

        return ResponseEntity.ok(
            new Response<>("success", "Programs retrieved", programs)
        );
    }

    @GetMapping("/categories")
    @ApiOperation(value = "Get all program categories (departments)")
    public ResponseEntity<Response<List<String>>> getCategories() {
        UserPrincipal principal = requirePrincipal();
        List<String> categories;
        if (isGlobalSuperAdmin(principal)) {
            categories = programSearchCache.getCategories();
        } else {
            categories = getScopedItems(principal).stream()
                    .map(ProgramSearchDTO::getDeptName)
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
    @ApiOperation(value = "Get programs by department category")
    public ResponseEntity<Response<List<ProgramSearchDTO>>> getByCategory(
            @PathVariable String department,
            @RequestParam(required = false, defaultValue = "50") int limit) {

        UserPrincipal principal = requirePrincipal();
        List<ProgramSearchDTO> programs;
        if (isGlobalSuperAdmin(principal)) {
            programs = programSearchCache.getByCategory(department, limit);
        } else {
            programs = getScopedItems(principal).stream()
                    .filter(p -> p.getDeptName() != null && p.getDeptName().equalsIgnoreCase(department))
                    .limit(limit)
                    .collect(java.util.stream.Collectors.toList());
        }

        return ResponseEntity.ok(
            new Response<>("success", "Programs retrieved", programs)
        );
    }

    @PostMapping("/{programId}/select")
    @ApiOperation(value = "Record program selection")
    public ResponseEntity<Response<Void>> recordSelection(
            @PathVariable Long programId) {

        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null) {
            accessControlService.requireAccessProgram(principal, programId);
        }
        programSearchCache.recordUsage(programId.intValue());

        return ResponseEntity.ok(
            new Response<>("success", "Selection recorded", null)
        );
    }

    @GetMapping("/stats")
    @ApiOperation(value = "Get program search statistics")
    public ResponseEntity<Response<Map<String, Object>>> getStats() {
        UserPrincipal principal = requirePrincipal();
        Map<String, Object> stats = new HashMap<>();
        if (isGlobalSuperAdmin(principal)) {
            stats.put("totalPrograms", programSearchCache.size());
            stats.put("departments", programSearchCache.getCategories().size());
        } else {
            List<ProgramSearchDTO> scoped = getScopedItems(principal);
            stats.put("totalPrograms", scoped.size());
            stats.put("departments", scoped.stream()
                    .map(ProgramSearchDTO::getDeptId)
                    .filter(id -> id != null && id > 0)
                    .distinct()
                    .count());
        }

        return ResponseEntity.ok(
            new Response<>("success", "Stats retrieved", stats)
        );
    }

    @GetMapping("/exists/{programName}")
    @ApiOperation(value = "Check if program exists")
    public ResponseEntity<Response<Boolean>> exists(@PathVariable String programName) {
        UserPrincipal principal = requirePrincipal();
        boolean exists;
        if (isGlobalSuperAdmin(principal)) {
            exists = programSearchCache.exists(programName);
        } else {
            exists = getScopedItems(principal).stream()
                    .anyMatch(p -> p.getName() != null && p.getName().equalsIgnoreCase(programName));
        }
        return ResponseEntity.ok(
            new Response<>("success", "Checked", exists)
        );
    }

    @PostMapping("/refresh")
    @ApiOperation(value = "Refresh program cache")
    public ResponseEntity<Response<Void>> refresh() {
        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null) accessControlService.requireSuperAdmin(principal);
        programSearchCache.refresh();

        return ResponseEntity.ok(
            new Response<>("success", "Cache refreshed", null)
        );
    }
}


