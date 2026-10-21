package com._42students.lms.search.batches;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
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
@RequestMapping("/api/v2/batches")
@Slf4j
@Api(tags = "Batch Search API (v2 - In-Memory)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class BatchSearchController {

    @Autowired
    private BatchSearchCache batchSearchCache;

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

    private List<BatchSearchDTO> getScopedItems(UserPrincipal principal) {
        if (isGlobalSuperAdmin(principal)) return batchSearchCache.filterForScope(null, null);
        Integer orgId = principal.getOrganizationId();
        Integer collegeId = principal.getCollegeId();
        if (orgId == null && collegeId == null) {
            throw new org.springframework.security.access.AccessDeniedException("Tenant scope not available");
        }
        return batchSearchCache.filterForScope(orgId, collegeId);
    }

    @GetMapping("/search")
    @ApiOperation(value = "Search batches (in-memory)", notes = "Ultra-fast batch search using in-memory cache.")
    public ResponseEntity<Response<List<BatchSearchDTO>>> search(
            @ApiParam(value = "Search query", example = "2023")
            @RequestParam(required = false, defaultValue = "") String query,
            @ApiParam(value = "Maximum results", example = "15")
            @RequestParam(required = false, defaultValue = "15") int limit,
            @ApiParam(value = "Filter by program ID (optional)")
            @RequestParam(required = false) Long programId) {

        UserPrincipal principal = requirePrincipal();
        boolean isGlobalSuper = accessControlService != null
                && accessControlService.isSuperAdmin(principal)
                && principal.getCollegeId() == null
                && principal.getOrganizationId() == null;

        long start = System.currentTimeMillis();

        List<BatchSearchDTO> results;

        if (programId != null) {
            if (accessControlService != null) {
                accessControlService.requireAccessProgram(principal, programId);
            }
            results = batchSearchCache.getByProgramId(programId, limit);
            if (query != null && !query.trim().isEmpty()) {
                results = results.stream()
                    .filter(batch -> {
                        String searchText = batch.getSearchableText().toLowerCase();
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
            results = batchSearchCache.search(query, limit);
        }

        long duration = System.currentTimeMillis() - start;

        log.debug("Batch search '{}' returned {} results in {}ms", query, results.size(), duration);

        return ResponseEntity.ok(
            new Response<>("success", "Batches retrieved in " + duration + "ms", results)
        );
    }

    @GetMapping("/popular")
    @ApiOperation(value = "Get popular batches")
    public ResponseEntity<Response<List<BatchSearchDTO>>> getPopular(
            @RequestParam(required = false, defaultValue = "10") int limit) {

        UserPrincipal principal = requirePrincipal();
        List<BatchSearchDTO> popular = batchSearchCache.getPopular(Math.max(limit * 5, limit)).stream()
                .filter(b -> isGlobalSuperAdmin(principal)
                        || (principal.getCollegeId() != null && b.getCollegeId() != null && b.getCollegeId().equals(principal.getCollegeId()))
                        || (principal.getCollegeId() == null && principal.getOrganizationId() != null && b.getOrganizationId() != null && b.getOrganizationId().equals(principal.getOrganizationId())))
                .limit(limit)
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(
            new Response<>("success", "Popular batches retrieved", popular)
        );
    }

    @GetMapping("/program/{programId}")
    @ApiOperation(value = "Get batches by program")
    public ResponseEntity<Response<List<BatchSearchDTO>>> getByProgram(
            @PathVariable Long programId,
            @RequestParam(required = false, defaultValue = "50") int limit) {

        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null) {
            accessControlService.requireAccessProgram(principal, programId);
        }
        List<BatchSearchDTO> batches = batchSearchCache.getByProgramId(programId, limit);

        return ResponseEntity.ok(
            new Response<>("success", "Batches retrieved", batches)
        );
    }

    @GetMapping("/categories")
    @ApiOperation(value = "Get all batch categories (programs)")
    public ResponseEntity<Response<List<String>>> getCategories() {
        UserPrincipal principal = requirePrincipal();
        List<String> categories;
        if (isGlobalSuperAdmin(principal)) {
            categories = batchSearchCache.getCategories();
        } else {
            categories = getScopedItems(principal).stream()
                    .map(BatchSearchDTO::getProgramName)
                    .filter(n -> n != null && !n.trim().isEmpty())
                    .distinct()
                    .sorted(String::compareToIgnoreCase)
                    .collect(java.util.stream.Collectors.toList());
        }

        return ResponseEntity.ok(
            new Response<>("success", "Categories retrieved", categories)
        );
    }

    @GetMapping("/category/{program}")
    @ApiOperation(value = "Get batches by program category")
    public ResponseEntity<Response<List<BatchSearchDTO>>> getByCategory(
            @PathVariable String program,
            @RequestParam(required = false, defaultValue = "50") int limit) {

        UserPrincipal principal = requirePrincipal();
        List<BatchSearchDTO> batches;
        if (isGlobalSuperAdmin(principal)) {
            batches = batchSearchCache.getByCategory(program, limit);
        } else {
            batches = getScopedItems(principal).stream()
                    .filter(b -> b.getProgramName() != null && b.getProgramName().equalsIgnoreCase(program))
                    .limit(limit)
                    .collect(java.util.stream.Collectors.toList());
        }

        return ResponseEntity.ok(
            new Response<>("success", "Batches retrieved", batches)
        );
    }

    @PostMapping("/{batchId}/select")
    @ApiOperation(value = "Record batch selection")
    public ResponseEntity<Response<Void>> recordSelection(
            @PathVariable Long batchId) {

        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null && scopeResolutionService != null) {
            Integer collegeId = scopeResolutionService.resolveBatchToCollegeId(batchId);
            if (collegeId != null) {
                accessControlService.requireAccessCollege(principal, collegeId);
            }
        }
        batchSearchCache.recordUsage(batchId.intValue());

        return ResponseEntity.ok(
            new Response<>("success", "Selection recorded", null)
        );
    }

    @GetMapping("/stats")
    @ApiOperation(value = "Get batch search statistics")
    public ResponseEntity<Response<Map<String, Object>>> getStats() {
        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null) accessControlService.requireSuperAdmin(principal);
        Map<String, Object> stats = new HashMap<>();
        if (isGlobalSuperAdmin(principal)) {
            stats.put("totalBatches", batchSearchCache.size());
            stats.put("programs", batchSearchCache.getCategories().size());
        } else {
            List<BatchSearchDTO> scoped = getScopedItems(principal);
            stats.put("totalBatches", scoped.size());
            stats.put("programs", scoped.stream()
                    .map(BatchSearchDTO::getProgramId)
                    .filter(id -> id != null && id > 0)
                    .distinct()
                    .count());
        }

        return ResponseEntity.ok(
            new Response<>("success", "Stats retrieved", stats)
        );
    }

    @GetMapping("/exists/{batchName}")
    @ApiOperation(value = "Check if batch exists")
    public ResponseEntity<Response<Boolean>> exists(@PathVariable String batchName) {
        UserPrincipal principal = requirePrincipal();
        boolean exists;
        if (isGlobalSuperAdmin(principal)) {
            exists = batchSearchCache.exists(batchName);
        } else {
            exists = getScopedItems(principal).stream()
                    .anyMatch(b -> b.getBatchName() != null && b.getBatchName().equalsIgnoreCase(batchName));
        }
        return ResponseEntity.ok(
            new Response<>("success", "Checked", exists)
        );
    }

    @PostMapping("/refresh")
    @ApiOperation(value = "Refresh batch cache")
    public ResponseEntity<Response<Void>> refresh() {
        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null) accessControlService.requireSuperAdmin(principal);
        batchSearchCache.refresh();

        return ResponseEntity.ok(
            new Response<>("success", "Cache refreshed", null)
        );
    }
}


