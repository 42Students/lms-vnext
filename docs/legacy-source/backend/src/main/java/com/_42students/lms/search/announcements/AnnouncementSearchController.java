package com._42students.lms.search.announcements;

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
@RequestMapping("/api/v2/announcements")
@Slf4j
@Api(tags = "Announcement Search API (v2)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class AnnouncementSearchController {
    @Autowired
    private AnnouncementSearchCache cache;

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
    
    @GetMapping("/search")
    public ResponseEntity<Response<List<AnnouncementSearchDTO>>> search(
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false, defaultValue = "15") int limit) {
        UserPrincipal principal = requirePrincipal();
        boolean isGlobalSuper = accessControlService != null
                && accessControlService.isSuperAdmin(principal)
                && principal.getCollegeId() == null
                && principal.getOrganizationId() == null;
        if (!isGlobalSuper) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new Response<>("error", "Announcement search is GLOBAL-only. Use /api/v1/announcements/* scoped APIs.", null));
        }
        List<AnnouncementSearchDTO> results = cache.search(query, limit);
        return ResponseEntity.ok(new Response<>("success", "Announcements retrieved", results));
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Response<Map<String, Object>>> getStats() {
        UserPrincipal principal = requirePrincipal();
        if (accessControlService != null) accessControlService.requireSuperAdmin(principal);
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAnnouncements", cache.size());
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


