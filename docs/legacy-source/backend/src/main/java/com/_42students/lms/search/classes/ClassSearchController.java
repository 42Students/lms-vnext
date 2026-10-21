package com._42students.lms.search.classes;

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
@RequestMapping("/api/v2/classes")
@Slf4j
@Api(tags = "Class Search API (v2 - In-Memory)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class ClassSearchController {

    @Autowired
    private ClassSearchCache classSearchCache;

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

    private List<ClassSearchDTO> filterForPrincipalScope(UserPrincipal principal, List<ClassSearchDTO> input) {
        if (isGlobalSuperAdmin(principal)) return input;
        Integer orgId = principal.getOrganizationId();
        Integer collegeId = principal.getCollegeId();
        if (orgId == null && collegeId == null) {
            throw new org.springframework.security.access.AccessDeniedException("Tenant scope not available");
        }
        return input.stream()
                .filter(c -> {
                    if (collegeId != null) return c.getCollegeId() != null && c.getCollegeId().equals(collegeId);
                    return c.getOrganizationId() != null && c.getOrganizationId().equals(orgId);
                })
                .collect(java.util.stream.Collectors.toList());
    }

    private List<ClassSearchDTO> getScopedItems(UserPrincipal principal) {
        if (isGlobalSuperAdmin(principal)) return classSearchCache.filterForScope(null, null);
        return classSearchCache.filterForScope(principal.getOrganizationId(), principal.getCollegeId());
    }

    @GetMapping("/search")
    @ApiOperation(value = "Search classes (in-memory)", notes = "Ultra-fast class search using in-memory cache.")
    public ResponseEntity<Response<List<ClassSearchDTO>>> search(
            @ApiParam(value = "Search query", example = "section a")
            @RequestParam(required = false, defaultValue = "") String query,
            @ApiParam(value = "Maximum results", example = "15")
            @RequestParam(required = false, defaultValue = "15") int limit,
            @ApiParam(value = "Filter by program ID (optional)")
            @RequestParam(required = false) Integer programId) {

        UserPrincipal principal = requirePrincipal();
        boolean isGlobalSuper = isGlobalSuperAdmin(principal);

        long start = System.currentTimeMillis();

        List<ClassSearchDTO> results;

        if (programId != null) {
            if (accessControlService != null) {
                accessControlService.requireAccessProgram(principal, programId.longValue());
            }
            results = classSearchCache.getByProgramId(programId, limit);
            if (query != null && !query.trim().isEmpty()) {
                results = results.stream()
                    .filter(cls -> {
                        String searchText = cls.getSearchableText().toLowerCase();
                        return searchText.contains(query.toLowerCase());
                    })
                    .limit(limit)
                    .collect(java.util.stream.Collectors.toList());
            }
        } else {
            if (!isGlobalSuper) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new Response<>("error", "programId is required (or use GLOBAL superadmin mode)", null));
            }
            results = classSearchCache.search(query, limit);
        }

        long duration = System.currentTimeMillis() - start;

        log.debug("Class search '{}' returned {} results in {}ms", query, results.size(), duration);

        return ResponseEntity.ok(
            new Response<>("success", "Classes retrieved in " + duration + "ms", results)
        );
    }

    @GetMapping("/popular")
    @ApiOperation(value = "Get popular classes")
    public ResponseEntity<Response<List<ClassSearchDTO>>> getPopular(
            @RequestParam(required = false, defaultValue = "10") int limit) {

        UserPrincipal principal = requirePrincipal();
        // Usage is tracked globally in-memory; filter before returning to avoid cross-tenant leakage.
        List<ClassSearchDTO> popular = filterForPrincipalScope(principal, classSearchCache.getPopular(Math.max(limit * 5, limit)))
                .stream()
                .limit(limit)
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(
            new Response<>("success", "Popular classes retrieved", popular)
        );
    }

    @GetMapping("/program/{programId}")
    @ApiOperation(value = "Get classes by program")
    public ResponseEntity<Response<List<ClassSearchDTO>>> getByProgram(
            @PathVariable Integer programId,
            @RequestParam(required = false, defaultValue = "50") int limit) {

        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null) {
            accessControlService.requireAccessProgram(principal, programId.longValue());
        }
        List<ClassSearchDTO> classes = classSearchCache.getByProgramId(programId, limit);

        return ResponseEntity.ok(
            new Response<>("success", "Classes retrieved", classes)
        );
    }

    @GetMapping("/categories")
    @ApiOperation(value = "Get all class categories (programs)")
    public ResponseEntity<Response<List<String>>> getCategories() {
        UserPrincipal principal = requirePrincipal();
        List<String> categories = filterForPrincipalScope(principal, getScopedItems(principal)).stream()
                .map(ClassSearchDTO::getProgramName)
                .filter(n -> n != null && !n.trim().isEmpty())
                .distinct()
                .sorted(String::compareToIgnoreCase)
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(
            new Response<>("success", "Categories retrieved", categories)
        );
    }

    @GetMapping("/category/{program}")
    @ApiOperation(value = "Get classes by program category")
    public ResponseEntity<Response<List<ClassSearchDTO>>> getByCategory(
            @PathVariable String program,
            @RequestParam(required = false, defaultValue = "50") int limit) {

        UserPrincipal principal = requirePrincipal();
        List<ClassSearchDTO> classes = filterForPrincipalScope(principal, getScopedItems(principal)).stream()
                .filter(c -> c.getProgramName() != null && c.getProgramName().equalsIgnoreCase(program))
                .limit(limit)
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(
            new Response<>("success", "Classes retrieved", classes)
        );
    }

    @PostMapping("/{classId}/select")
    @ApiOperation(value = "Record class selection")
    public ResponseEntity<Response<Void>> recordSelection(
            @PathVariable Integer classId) {

        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null) {
            accessControlService.requireAccessClass(principal, classId);
        }
        classSearchCache.recordUsage(classId);

        return ResponseEntity.ok(
            new Response<>("success", "Selection recorded", null)
        );
    }

    @GetMapping("/stats")
    @ApiOperation(value = "Get class search statistics")
    public ResponseEntity<Response<Map<String, Object>>> getStats() {
        UserPrincipal principal = requirePrincipal();
        Map<String, Object> stats = new HashMap<>();
        List<ClassSearchDTO> scoped = filterForPrincipalScope(principal, getScopedItems(principal));
        stats.put("totalClasses", scoped.size());
        stats.put("programs", scoped.stream()
                .map(ClassSearchDTO::getProgramId)
                .filter(id -> id != null && id > 0)
                .distinct()
                .count());

        return ResponseEntity.ok(
            new Response<>("success", "Stats retrieved", stats)
        );
    }

    @GetMapping("/exists/{className}")
    @ApiOperation(value = "Check if class exists")
    public ResponseEntity<Response<Boolean>> exists(@PathVariable String className) {
        UserPrincipal principal = requirePrincipal();
        boolean exists = filterForPrincipalScope(principal, getScopedItems(principal)).stream()
                .anyMatch(c -> c.getName() != null && c.getName().equalsIgnoreCase(className));
        return ResponseEntity.ok(
            new Response<>("success", "Checked", exists)
        );
    }

    @PostMapping("/refresh")
    @ApiOperation(value = "Refresh class cache")
    public ResponseEntity<Response<Void>> refresh() {
        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null) accessControlService.requireSuperAdmin(principal);
        classSearchCache.refresh();

        return ResponseEntity.ok(
            new Response<>("success", "Cache refreshed", null)
        );
    }
}


