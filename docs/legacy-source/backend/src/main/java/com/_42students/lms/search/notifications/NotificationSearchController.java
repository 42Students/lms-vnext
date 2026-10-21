package com._42students.lms.search.notifications;

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
@RequestMapping("/api/v2/notifications")
@Slf4j
@Api(tags = "Notification Search API (v2)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class NotificationSearchController {
    @Autowired
    private NotificationSearchCache cache;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired
    private AccessControlService accessControlService;

    private UserPrincipal requirePrincipal() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            throw new org.springframework.security.access.AccessDeniedException("Authentication required");
        }
        return principal;
    }
    
    @GetMapping("/search")
    public ResponseEntity<Response<List<NotificationSearchDTO>>> search(
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false, defaultValue = "15") int limit,
            @RequestParam(required = false) Integer classId,
            @RequestParam(required = false) Integer courseId) {
        UserPrincipal principal = requirePrincipal();
        if (limit < 1) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new Response<>(HttpStatus.BAD_REQUEST.name(), "limit must be >= 1", null));
        }
        if (classId != null && classId < 1) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new Response<>(HttpStatus.BAD_REQUEST.name(), "classId must be >= 1", null));
        }
        if (courseId != null && courseId < 1) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new Response<>(HttpStatus.BAD_REQUEST.name(), "courseId must be >= 1", null));
        }
        if (classId != null && courseId != null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new Response<>(HttpStatus.BAD_REQUEST.name(), "Provide either classId or courseId, not both", null));
        }
        boolean isGlobalSuper = accessControlService != null
                && accessControlService.isSuperAdmin(principal)
                && principal.getCollegeId() == null
                && principal.getOrganizationId() == null;

        if (!isGlobalSuper) {
            if (classId == null && courseId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new Response<>(HttpStatus.FORBIDDEN.name(), "classId or courseId is required", null));
            }
            if (classId != null) accessControlService.requireAccessClass(principal, classId);
            if (courseId != null) accessControlService.requireAccessCourse(principal, courseId);
        } else {
            if (classId != null) accessControlService.requireAccessClass(principal, classId);
            if (courseId != null) accessControlService.requireAccessCourse(principal, courseId);
        }

        int cappedLimit = Math.min(limit, 200);
        List<NotificationSearchDTO> results = cache.search(query, cappedLimit * 4).stream()
                // Match the v1 learner feeds: future scheduled notifications are not visible yet.
                .filter(n -> n.getScheduledAt() == null
                        || !n.getScheduledAt().isAfter(java.time.LocalDateTime.now()))
                // A notification addressed to one learner must never leak to a classmate simply
                // because it also carries the same class/course for deep-link context.
                .filter(n -> !principal.isLearner()
                        || n.getLearnerId() == null
                        || n.getLearnerId() <= 0
                        || java.util.Objects.equals(n.getLearnerId(), principal.getId()))
                .collect(java.util.stream.Collectors.toList());
        if (classId != null) {
            results = results.stream()
                    .filter(n -> n.getClassId() != null && n.getClassId().equals(classId))
                    .limit(cappedLimit)
                    .collect(java.util.stream.Collectors.toList());
        } else if (courseId != null) {
            results = results.stream()
                    .filter(n -> n.getCourseId() != null && n.getCourseId().equals(courseId))
                    .limit(cappedLimit)
                    .collect(java.util.stream.Collectors.toList());
        } else if (!isGlobalSuper) {
            results = java.util.List.of();
        }
        return ResponseEntity.ok(new Response<>("success", "Notifications retrieved", results));
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Response<Map<String, Object>>> getStats() {
        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null) accessControlService.requireSuperAdmin(principal);
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalNotifications", cache.size());
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



