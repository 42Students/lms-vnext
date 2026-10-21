package com._42students.lms.search.lecturehalls;

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
@RequestMapping("/api/v2/lecture-halls")
@Slf4j
@Api(tags = "Lecture Hall Search API (v2)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class LectureHallSearchController {
    @Autowired
    private LectureHallSearchCache cache;

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
    public ResponseEntity<Response<List<LectureHallSearchDTO>>> search(
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false, defaultValue = "15") int limit,
            @RequestParam(required = false) Integer collegeId,
            @RequestParam(required = false) Integer deptId) {
        UserPrincipal principal = requirePrincipal();
        boolean isGlobalSuper = accessControlService != null
                && accessControlService.isSuperAdmin(principal)
                && principal.getCollegeId() == null
                && principal.getOrganizationId() == null;

        if (!isGlobalSuper) {
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

        final Integer deptIdFinal = deptId;
        final Integer collegeIdFinal = collegeId;
        List<LectureHallSearchDTO> results = cache.search(query, Math.min(limit, 200));
        if (deptIdFinal != null) {
            results = results.stream()
                    .filter(h -> h.getDeptId() != null && h.getDeptId().equals(deptIdFinal))
                    .limit(limit)
                    .collect(java.util.stream.Collectors.toList());
        } else if (collegeIdFinal != null) {
            results = results.stream()
                    .filter(h -> h.getCollegeId() != null && h.getCollegeId().equals(collegeIdFinal))
                    .limit(limit)
                    .collect(java.util.stream.Collectors.toList());
        } else if (!isGlobalSuper) {
            // Safety fallback: should be prevented earlier.
            results = java.util.List.of();
        }
        return ResponseEntity.ok(new Response<>("success", "Lecture halls retrieved", results));
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Response<Map<String, Object>>> getStats() {
        UserPrincipal principal = requirePrincipal();
        Map<String, Object> stats = new HashMap<>();
        if (isGlobalSuperAdmin(principal)) {
            stats.put("totalLectureHalls", cache.size());
        } else {
            Integer collegeId = principal.getCollegeId();
            if (collegeId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new Response<>("error", "college scope required", null));
            }
            long count = cache.getAllItems().stream()
                    .filter(h -> h.getCollegeId() != null && h.getCollegeId().equals(collegeId))
                    .count();
            stats.put("totalLectureHalls", count);
        }
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


