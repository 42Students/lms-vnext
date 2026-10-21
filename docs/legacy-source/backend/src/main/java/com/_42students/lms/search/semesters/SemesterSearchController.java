package com._42students.lms.search.semesters;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.response.Response;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.Api;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v2/semesters")
@Slf4j
@Api(tags = "Semester Search API (v2)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class SemesterSearchController {
    @Autowired
    private SemesterSearchCache cache;

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
    
    @GetMapping("/search")
    public ResponseEntity<Response<List<SemesterSearchDTO>>> search(
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false, defaultValue = "15") int limit,
            @RequestParam(required = false) Integer programId) {
        UserPrincipal principal = requirePrincipal();
        boolean isGlobalSuper = accessControlService != null
                && accessControlService.isSuperAdmin(principal)
                && principal.getCollegeId() == null
                && principal.getOrganizationId() == null;

        if (!isGlobalSuper) {
            if (programId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new Response<>("error", "programId is required (or use GLOBAL superadmin mode)", null));
            }
            if (accessControlService != null) accessControlService.requireAccessProgram(principal, programId.longValue());
        } else if (programId != null && accessControlService != null) {
            accessControlService.requireAccessProgram(principal, programId.longValue());
        }

        List<SemesterSearchDTO> results = cache.search(query, Math.min(limit, 200));
        if (programId != null) {
            results = results.stream()
                    .filter(s -> s.getProgramId() != null && s.getProgramId().equals(programId))
                    .limit(limit)
                    .collect(java.util.stream.Collectors.toList());
        } else if (!isGlobalSuper) {
            results = java.util.List.of();
        }
        return ResponseEntity.ok(new Response<>("success", "Semesters retrieved", results));
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Response<Map<String, Object>>> getStats() {
        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null) accessControlService.requireSuperAdmin(principal);
        if (!isGlobalSuperAdmin(principal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new Response<>("error", "GLOBAL superadmin required for global stats", null));
        }
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSemesters", cache.size());
        return ResponseEntity.ok(new Response<>("success", "Stats retrieved", stats));
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<Response<Void>> refresh() {
        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null) accessControlService.requireSuperAdmin(principal);
        cache.refresh();
        return ResponseEntity.ok(new Response<>("success", "Cache refreshed", null));
    }
}


