package com._42students.lms.search.lessons;

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
@RequestMapping("/api/v2/lessons")
@Slf4j
@Api(tags = "Lesson Search API (v2)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class LessonSearchController {
    @Autowired
    private LessonSearchCache cache;

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
    public ResponseEntity<Response<List<LessonSearchDTO>>> search(
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false, defaultValue = "15") int limit,
            @RequestParam(required = false) Integer courseId) {
        UserPrincipal principal = requirePrincipal();
        boolean isGlobalSuper = accessControlService != null
                && accessControlService.isSuperAdmin(principal)
                && principal.getCollegeId() == null
                && principal.getOrganizationId() == null;

        if (!isGlobalSuper) {
            if (courseId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new Response<>("error", "courseId is required (or use GLOBAL superadmin mode)", null));
            }
            if (accessControlService != null) accessControlService.requireAccessCourse(principal, courseId);
        } else if (courseId != null && accessControlService != null) {
            // GLOBAL superadmin can still validate course access when they provided a filter.
            accessControlService.requireAccessCourse(principal, courseId);
        }

        List<LessonSearchDTO> results = cache.search(query, Math.min(limit, 200));
        if (courseId != null) {
            results = results.stream()
                    .filter(l -> l.getCourseId() != null && l.getCourseId().equals(courseId))
                    .limit(limit)
                    .collect(java.util.stream.Collectors.toList());
        } else if (!isGlobalSuper) {
            results = java.util.List.of();
        }
        return ResponseEntity.ok(new Response<>("success", "Lessons retrieved", results));
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Response<Map<String, Object>>> getStats() {
        UserPrincipal principal = requirePrincipal();
        boolean isGlobalSuper = isGlobalSuperAdmin(principal);
        Map<String, Object> stats = new HashMap<>();
        if (isGlobalSuper) {
            stats.put("totalLessons", cache.size());
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new Response<>("error", "Use /search with courseId for scoped stats", null));
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


