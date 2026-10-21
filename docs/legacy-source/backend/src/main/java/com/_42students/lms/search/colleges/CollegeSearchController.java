package com._42students.lms.search.colleges;

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
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v2/colleges")
@Slf4j
@Api(tags = "College Search API (v2 - In-Memory)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class CollegeSearchController {

    @Autowired
    private CollegeSearchCache collegeSearchCache;

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
                && principal.getOrganizationId() == null
                && principal.getCollegeId() == null;
    }

    private Integer resolveOrgId(UserPrincipal principal, Integer requestedOrgId) {
        if (principal == null) return null;
        boolean isSuper = accessControlService != null && accessControlService.isSuperAdmin(principal);
        if (isSuper && principal.getOrganizationId() != null) {
            return principal.getOrganizationId();
        }
        if (isSuper && requestedOrgId != null) {
            return requestedOrgId; // global super only
        }
        return principal.getOrganizationId();
    }

    private List<CollegeSearchDTO> filterForOrg(Integer orgId, List<CollegeSearchDTO> input) {
        if (orgId == null) return List.of();
        return input.stream()
                .filter(c -> c.getOrgId() != null && c.getOrgId().equals(orgId))
                .collect(Collectors.toList());
    }

    @GetMapping("/search")
    @ApiOperation(value = "Search colleges (in-memory)", notes = "Ultra-fast college search using in-memory cache. Supports fuzzy matching and synonyms.")
    public ResponseEntity<Response<List<CollegeSearchDTO>>> search(
            @ApiParam(value = "Search query", example = "iit")
            @RequestParam(required = false, defaultValue = "") String query,
            @ApiParam(value = "Maximum results", example = "15")
            @RequestParam(required = false, defaultValue = "15") int limit,
            @ApiParam(value = "Filter by state (optional)")
            @RequestParam(required = false) String state,
            @ApiParam(value = "Filter by city (optional)")
            @RequestParam(required = false) String city,
            @ApiParam(value = "Filter by organization ID (optional)")
            @RequestParam(required = false) Integer orgId) {

        UserPrincipal principal = requirePrincipal();
        boolean isSuper = accessControlService != null && accessControlService.isSuperAdmin(principal);
        if (isSuper && principal.getOrganizationId() != null) {
            // Scoped superadmin must not query other orgs via param.
            orgId = principal.getOrganizationId();
        } else if (!isSuper) {
            // Non-superadmin: restrict to their org; no public list-all.
            if (principal.getOrganizationId() == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new Response<>("error", "Organization context required", null));
            }
            orgId = principal.getOrganizationId();
        }

        long start = System.currentTimeMillis();

        List<CollegeSearchDTO> results;

        // Apply filters if provided. State/city indexes are global cache views, so organization
        // scope must be re-applied before query filtering or returning any result.
        if (state != null) {
            results = collegeSearchCache.getByState(state, Math.max(limit * 5, limit));
            if (orgId != null) {
                results = filterForOrg(orgId, results);
            }
            // Then search within state results
            if (query != null && !query.trim().isEmpty()) {
                results = results.stream()
                    .filter(college -> {
                        String searchText = college.getSearchableText().toLowerCase();
                        return searchText.contains(query.toLowerCase());
                    })
                    .limit(limit)
                    .collect(java.util.stream.Collectors.toList());
            } else {
                results = results.stream().limit(limit).collect(java.util.stream.Collectors.toList());
            }
        } else if (city != null) {
            results = collegeSearchCache.getByCity(city, Math.max(limit * 5, limit));
            if (orgId != null) {
                results = filterForOrg(orgId, results);
            }
            // Then search within city results
            if (query != null && !query.trim().isEmpty()) {
                results = results.stream()
                    .filter(college -> {
                        String searchText = college.getSearchableText().toLowerCase();
                        return searchText.contains(query.toLowerCase());
                    })
                    .limit(limit)
                    .collect(java.util.stream.Collectors.toList());
            } else {
                results = results.stream().limit(limit).collect(java.util.stream.Collectors.toList());
            }
        } else if (orgId != null) {
            results = collegeSearchCache.getByOrganization(orgId, limit);
            // Then search within organization results
            if (query != null && !query.trim().isEmpty()) {
                results = results.stream()
                    .filter(college -> {
                        String searchText = college.getSearchableText().toLowerCase();
                        return searchText.contains(query.toLowerCase());
                    })
                    .limit(limit)
                    .collect(java.util.stream.Collectors.toList());
            }
        } else {
            // Normal search
            results = collegeSearchCache.search(query, limit);
        }

        long duration = System.currentTimeMillis() - start;

        log.debug("College search '{}' returned {} results in {}ms", query, results.size(), duration);

        return ResponseEntity.ok(
            new Response<>("success", "Colleges retrieved in " + duration + "ms", results)
        );
    }

    @GetMapping("/popular")
    @ApiOperation(value = "Get popular colleges", notes = "Returns most commonly accessed colleges")
    public ResponseEntity<Response<List<CollegeSearchDTO>>> getPopular(
            @RequestParam(required = false, defaultValue = "10") int limit) {
        UserPrincipal principal = requirePrincipal();
        Integer orgId = resolveOrgId(principal, null);
        if (orgId == null && !isGlobalSuperAdmin(principal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new Response<>("error", "Organization context required", null));
        }
        List<CollegeSearchDTO> popular = collegeSearchCache.getPopular(Math.max(limit * 5, limit));
        if (!isGlobalSuperAdmin(principal)) {
            popular = filterForOrg(orgId, popular);
        }
        popular = popular.stream().limit(limit).collect(Collectors.toList());

        return ResponseEntity.ok(
            new Response<>("success", "Popular colleges retrieved", popular)
        );
    }

    @GetMapping("/states")
    @ApiOperation(value = "Get all states", notes = "Returns list of all states")
    public ResponseEntity<Response<List<String>>> getStates() {
        UserPrincipal principal = requirePrincipal();
        Integer orgId = resolveOrgId(principal, null);
        List<String> states;
        if (isGlobalSuperAdmin(principal)) {
            states = collegeSearchCache.getCategories();
        } else {
            states = filterForOrg(orgId, collegeSearchCache.getAllItems()).stream()
                    .map(CollegeSearchDTO::getState)
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .distinct()
                    .sorted(String::compareToIgnoreCase)
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(
            new Response<>("success", "States retrieved", states)
        );
    }

    @GetMapping("/state/{state}")
    @ApiOperation(value = "Get colleges by state", notes = "Returns all colleges in a state")
    public ResponseEntity<Response<List<CollegeSearchDTO>>> getByState(
            @PathVariable String state,
            @RequestParam(required = false, defaultValue = "50") int limit) {
        UserPrincipal principal = requirePrincipal();
        Integer orgId = resolveOrgId(principal, null);
        List<CollegeSearchDTO> colleges = collegeSearchCache.getByState(state, Math.max(limit * 5, limit));
        if (!isGlobalSuperAdmin(principal)) {
            colleges = filterForOrg(orgId, colleges);
        }
        colleges = colleges.stream().limit(limit).collect(Collectors.toList());

        return ResponseEntity.ok(
            new Response<>("success", "Colleges retrieved", colleges)
        );
    }

    @GetMapping("/city/{city}")
    @ApiOperation(value = "Get colleges by city", notes = "Returns all colleges in a city")
    public ResponseEntity<Response<List<CollegeSearchDTO>>> getByCity(
            @PathVariable String city,
            @RequestParam(required = false, defaultValue = "50") int limit) {
        UserPrincipal principal = requirePrincipal();
        Integer orgId = resolveOrgId(principal, null);
        List<CollegeSearchDTO> colleges = collegeSearchCache.getByCity(city, Math.max(limit * 5, limit));
        if (!isGlobalSuperAdmin(principal)) {
            colleges = filterForOrg(orgId, colleges);
        }
        colleges = colleges.stream().limit(limit).collect(Collectors.toList());

        return ResponseEntity.ok(
            new Response<>("success", "Colleges retrieved", colleges)
        );
    }

    @GetMapping("/categories")
    @ApiOperation(value = "Get all college categories (states)", notes = "Returns list of states as categories")
    public ResponseEntity<Response<List<String>>> getCategories() {
        UserPrincipal principal = requirePrincipal();
        Integer orgId = resolveOrgId(principal, null);
        List<String> categories;
        if (isGlobalSuperAdmin(principal)) {
            categories = collegeSearchCache.getCategories();
        } else {
            categories = filterForOrg(orgId, collegeSearchCache.getAllItems()).stream()
                    .map(CollegeSearchDTO::getState)
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .distinct()
                    .sorted(String::compareToIgnoreCase)
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(
            new Response<>("success", "Categories retrieved", categories)
        );
    }

    @GetMapping("/category/{state}")
    @ApiOperation(value = "Get colleges by category (state)", notes = "Returns colleges in a state")
    public ResponseEntity<Response<List<CollegeSearchDTO>>> getByCategory(
            @PathVariable String state,
            @RequestParam(required = false, defaultValue = "50") int limit) {
        UserPrincipal principal = requirePrincipal();
        Integer orgId = resolveOrgId(principal, null);
        List<CollegeSearchDTO> colleges = collegeSearchCache.getByCategory(state, Math.max(limit * 5, limit));
        if (!isGlobalSuperAdmin(principal)) {
            colleges = filterForOrg(orgId, colleges);
        }
        colleges = colleges.stream().limit(limit).collect(Collectors.toList());

        return ResponseEntity.ok(
            new Response<>("success", "Colleges retrieved", colleges)
        );
    }

    @PostMapping("/{collegeId}/select")
    @ApiOperation(value = "Record college selection", notes = "Track college access for popularity ranking")
    public ResponseEntity<Response<Void>> recordSelection(
            @PathVariable Integer collegeId) {
        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null) {
            accessControlService.requireAccessCollege(principal, collegeId);
        }

        collegeSearchCache.recordUsage(collegeId);

        return ResponseEntity.ok(
            new Response<>("success", "Selection recorded", null)
        );
    }

    @GetMapping("/stats")
    @ApiOperation(value = "Get college search statistics")
    public ResponseEntity<Response<Map<String, Object>>> getStats() {
        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null) accessControlService.requireSuperAdmin(principal);
        Map<String, Object> stats = new HashMap<>();
        if (isGlobalSuperAdmin(principal)) {
            stats.put("totalColleges", collegeSearchCache.size());
            stats.put("states", collegeSearchCache.getCategories().size());
        } else {
            Integer orgId = resolveOrgId(principal, null);
            List<CollegeSearchDTO> scoped = filterForOrg(orgId, collegeSearchCache.getAllItems());
            stats.put("totalColleges", scoped.size());
            stats.put("states", scoped.stream()
                    .map(CollegeSearchDTO::getState)
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .distinct()
                    .count());
        }

        return ResponseEntity.ok(
            new Response<>("success", "Stats retrieved", stats)
        );
    }

    @GetMapping("/exists/{collegeName}")
    @ApiOperation(value = "Check if college exists")
    public ResponseEntity<Response<Boolean>> exists(@PathVariable String collegeName) {
        UserPrincipal principal = requirePrincipal();
        boolean exists;
        if (isGlobalSuperAdmin(principal)) {
            exists = collegeSearchCache.exists(collegeName);
        } else {
            Integer orgId = resolveOrgId(principal, null);
            if (orgId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new Response<>("error", "Organization context required", null));
            }
            exists = filterForOrg(orgId, collegeSearchCache.getAllItems()).stream()
                    .map(CollegeSearchDTO::getDisplayName)
                    .filter(Objects::nonNull)
                    .anyMatch(name -> name.equalsIgnoreCase(collegeName));
        }
        return ResponseEntity.ok(
            new Response<>("success", "Checked", exists)
        );
    }

    @PostMapping("/refresh")
    @ApiOperation(value = "Refresh college cache", notes = "Reload colleges from database (admin)")
    public ResponseEntity<Response<Void>> refresh() {
        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null) accessControlService.requireSuperAdmin(principal);
        collegeSearchCache.refresh();

        return ResponseEntity.ok(
            new Response<>("success", "Cache refreshed", null)
        );
    }
}


