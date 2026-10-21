package com._42students.lms.search.learners;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ResolvedLearnerScope;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.College;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.NewProgramRepository;
import com._42students.lms.repository._ClassRepository;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import org.springframework.security.access.AccessDeniedException;
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

/**
 * Learner Search Controller (v2).
 * All results are scoped: filters (collegeId, programId, classId) must be within principal's scope; no filter defaults to principal's college.
 */
@RestController
@RequestMapping("/api/v2/learners")
@Slf4j
@Api(tags = "Learner Search API (v2 - In-Memory)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class LearnerSearchController {

    @Autowired
    private LearnerSearchCache learnerSearchCache;

    @Autowired
    private CollegeRepository collegeRepository;

    @Autowired
    private NewProgramRepository newProgramRepository;

    @Autowired
    private _ClassRepository classRepository;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    private ScopeResolutionService scopeResolutionService;

    @Autowired
    private FacultyTeachingAssignmentRepository facultyTeachingAssignmentRepository;

    private boolean isSearchAdmin(UserPrincipal principal) {
        return principal != null && (accessControlService.isSuperAdmin(principal)
                || "ADMIN".equalsIgnoreCase(principal.getUserType())
                || (principal.isFaculty() && "ADMIN".equalsIgnoreCase(principal.getFacultyType())));
    }

    private void requireSearchRole(UserPrincipal principal, Integer classId) {
        if (principal == null) throw new AccessDeniedException("Authentication required");
        if (isSearchAdmin(principal)) return;
        if (!principal.isFaculty() || classId == null || facultyTeachingAssignmentRepository == null
                || facultyTeachingAssignmentRepository.findByFacultyIdAndIsActive(principal.getId(), true)
                    .stream().noneMatch(a -> Objects.equals(a.getClassId(), classId))) {
            throw new AccessDeniedException("Learner directory requires an admin or assigned class faculty");
        }
    }

    private List<LearnerSearchDTO> visibleLearners(UserPrincipal principal, Integer requestedClassId) {
        Integer collegeId = principal.getCollegeId();
        Integer organizationId = principal.getOrganizationId();
        boolean globalSuperAdmin = accessControlService.isSuperAdmin(principal)
                && collegeId == null && organizationId == null;
        if (!globalSuperAdmin && collegeId == null && organizationId == null) {
            if (requestedClassId == null || scopeResolutionService == null) {
                throw new AccessDeniedException("College or organization scope required");
            }
            collegeId = scopeResolutionService.resolveClassToCollegeId(requestedClassId);
            if (collegeId == null) throw new AccessDeniedException("Unable to resolve class college");
        }
        final Integer c = collegeId;
        final Integer o = organizationId;
        return learnerSearchCache.getAllItems().stream()
                .filter(item -> (c == null || Objects.equals(c, item.getCollegeId()))
                        && (o == null || Objects.equals(o, item.getOrganizationId())))
                .collect(Collectors.toList());
    }

    private int safeLimit(int limit) {
        return Math.max(1, Math.min(limit, 50));
    }

    private LearnerSearchDTO safeResult(UserPrincipal principal, LearnerSearchDTO source) {
        if (isSearchAdmin(principal)) return source;
        LearnerSearchDTO safe = new LearnerSearchDTO();
        org.springframework.beans.BeanUtils.copyProperties(source, safe);
        safe.setContactMail(null);
        safe.setContactMobile(null);
        return safe;
    }

    @GetMapping("/search")
    @ApiOperation(value = "Search learners", notes = "All filters are intersected within the authenticated tenant scope.")
    public ResponseEntity<Response<List<LearnerSearchDTO>>> search(
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false, defaultValue = "15") int limit,
            @RequestParam(required = false) Integer collegeId,
            @RequestParam(required = false) Integer programId,
            @RequestParam(required = false) Integer classId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new Response<>("error", "Authentication required", null));
        requireSearchRole(principal, classId);
        if (collegeId != null) accessControlService.requireAccessCollege(principal, collegeId);
        if (programId != null) accessControlService.requireAccessProgram(principal, programId);
        if (classId != null) accessControlService.requireAccessClass(principal, classId);
        String q = query == null ? "" : query.trim().toLowerCase(java.util.Locale.ROOT);
        List<LearnerSearchDTO> results = visibleLearners(principal, classId).stream()
                .filter(item -> (collegeId == null || Objects.equals(item.getCollegeId(), collegeId))
                        && (programId == null || Objects.equals(item.getProgramId(), programId))
                        && (classId == null || Objects.equals(item.getClassId(), classId)))
                .filter(item -> q.isEmpty() || item.getSearchableText().toLowerCase(java.util.Locale.ROOT).contains(q))
                .limit(safeLimit(limit)).map(item -> safeResult(principal, item))
                .collect(Collectors.toList());
        return ResponseEntity.ok(new Response<>("success", "Learners retrieved", results));
    }

    @GetMapping("/popular")
    @ApiOperation(value = "Get popular learners within the current tenant")
    public ResponseEntity<Response<List<LearnerSearchDTO>>> getPopular(
            @RequestParam(required = false, defaultValue = "10") int limit,
            @RequestParam(required = false) Integer collegeId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new Response<>("error", "Authentication required", null));
        requireSearchRole(principal, null);
        if (collegeId != null) accessControlService.requireAccessCollege(principal, collegeId);
        java.util.Set<Integer> permitted = visibleLearners(principal, null).stream()
                .filter(item -> collegeId == null || Objects.equals(item.getCollegeId(), collegeId))
                .map(item -> (Integer) item.getId()).collect(Collectors.toSet());
        List<LearnerSearchDTO> popular = learnerSearchCache.getPopular(learnerSearchCache.size()).stream()
                .filter(item -> permitted.contains(item.getId()))
                .limit(safeLimit(limit)).collect(Collectors.toList());
        return ResponseEntity.ok(new Response<>("success", "Popular learners retrieved", popular));
    }

        @GetMapping("/colleges")
    @ApiOperation(value = "Get colleges", notes = "Super-admin: all. Others: principal's org/college only.")
    public ResponseEntity<Response<List<Map<String, Object>>>> getColleges() {
        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new Response<>("error", "Authentication required", null));
        }
        List<College> colleges;
        // Superadmin in GLOBAL mode: can view all colleges. If scoped (org/college present in JWT), restrict to scope.
        if (accessControlService != null
                && accessControlService.isSuperAdmin(principal)
                && principal.getCollegeId() == null
                && principal.getOrganizationId() == null) {
            colleges = collegeRepository.findAll();
        } else {
            Integer effectiveCollegeId = principal.getCollegeId();
            Integer effectiveOrgId = principal.getOrganizationId();
            if (effectiveCollegeId == null && effectiveOrgId == null && principal.isLearner() && scopeResolutionService != null) {
                ResolvedLearnerScope scope = scopeResolutionService.resolveFullScope(principal.getId());
                effectiveCollegeId = scope.getCollegeId();
                effectiveOrgId = scope.getOrganizationId();
            }
            if (effectiveCollegeId != null) {
                final Integer cId = effectiveCollegeId;
                colleges = collegeRepository.findAll().stream()
                    .filter(c -> cId.equals(c.getId()))
                    .collect(Collectors.toList());
            } else if (effectiveOrgId != null) {
                colleges = collegeRepository.fetchColleges(effectiveOrgId);
            } else {
                colleges = List.of();
            }
        }
        List<Map<String, Object>> list = colleges.stream()
            .map(college -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", college.getId());
                map.put("name", college.getName());
                map.put("city", college.getCity());
                map.put("state", college.getState());
                return map;
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(new Response<>("success", "Colleges retrieved", list));
    }

    @GetMapping("/college/{collegeId}")
    public ResponseEntity<Response<List<LearnerSearchDTO>>> getByCollege(
            @PathVariable Integer collegeId,
            @RequestParam(required = false, defaultValue = "50") int limit) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new Response<>("error", "Authentication required", null));
        requireSearchRole(principal, null);
        accessControlService.requireAccessCollege(principal, collegeId);
        List<LearnerSearchDTO> learners = visibleLearners(principal, null).stream()
                .filter(item -> Objects.equals(item.getCollegeId(), collegeId))
                .limit(safeLimit(limit)).collect(Collectors.toList());
        return ResponseEntity.ok(new Response<>("success", "Learners retrieved", learners));
    }

        @GetMapping("/program/{programId}")
    public ResponseEntity<Response<List<LearnerSearchDTO>>> getByProgram(
            @PathVariable Integer programId,
            @RequestParam(required = false, defaultValue = "50") int limit) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new Response<>("error", "Authentication required", null));
        requireSearchRole(principal, null);
        accessControlService.requireAccessProgram(principal, programId);
        List<LearnerSearchDTO> learners = visibleLearners(principal, null).stream()
                .filter(item -> Objects.equals(item.getProgramId(), programId))
                .limit(safeLimit(limit)).collect(Collectors.toList());
        return ResponseEntity.ok(new Response<>("success", "Learners retrieved", learners));
    }

        @GetMapping("/class/{classId}")
    public ResponseEntity<Response<List<LearnerSearchDTO>>> getByClass(
            @PathVariable Integer classId,
            @RequestParam(required = false, defaultValue = "50") int limit) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new Response<>("error", "Authentication required", null));
        requireSearchRole(principal, classId);
        accessControlService.requireAccessClass(principal, classId);
        List<LearnerSearchDTO> learners = visibleLearners(principal, classId).stream()
                .filter(item -> Objects.equals(item.getClassId(), classId))
                .limit(safeLimit(limit)).map(item -> safeResult(principal, item))
                .collect(Collectors.toList());
        return ResponseEntity.ok(new Response<>("success", "Learners retrieved", learners));
    }

        @GetMapping("/categories")
    public ResponseEntity<Response<List<String>>> getCategories() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new Response<>("error", "Authentication required", null));
        requireSearchRole(principal, null);
        List<String> categories = visibleLearners(principal, null).stream()
                .map(LearnerSearchDTO::getDepartment).filter(Objects::nonNull)
                .map(String::trim).filter(s -> !s.isEmpty()).distinct().collect(Collectors.toList());
        return ResponseEntity.ok(new Response<>("success", "Categories retrieved", categories));
    }

        @GetMapping("/category/{department}")
    public ResponseEntity<Response<List<LearnerSearchDTO>>> getByDepartment(
            @PathVariable String department,
            @RequestParam(required = false, defaultValue = "50") int limit) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new Response<>("error", "Authentication required", null));
        requireSearchRole(principal, null);
        List<LearnerSearchDTO> learners = visibleLearners(principal, null).stream()
                .filter(item -> item.getDepartment() != null && item.getDepartment().equalsIgnoreCase(department))
                .limit(safeLimit(limit)).collect(Collectors.toList());
        return ResponseEntity.ok(new Response<>("success", "Learners retrieved", learners));
    }

        @PostMapping("/{learnerId}/select")
    public ResponseEntity<Response<Void>> recordSelection(@PathVariable Integer learnerId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new Response<>("error", "Authentication required", null));
        LearnerSearchDTO item = visibleLearners(principal, null).stream()
                .filter(l -> Objects.equals(l.getId(), learnerId)).findFirst()
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND));
        requireSearchRole(principal, item.getClassId());
        accessControlService.requireAccessLearner(principal, learnerId);
        learnerSearchCache.recordUsage(learnerId);
        return ResponseEntity.ok(new Response<>("success", "Selection recorded", null));
    }

        @GetMapping("/stats")
    @ApiOperation(value = "Get learner search statistics")
    public ResponseEntity<Response<Map<String, Object>>> getStats() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new Response<>("error", "Authentication required", null));
        }
        if (!accessControlService.isSuperAdmin(principal) && !accessControlService.canPerformAdminActionForCollege(principal, principal.getCollegeId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new Response<>("error", "Access denied", null));
        }
        Map<String, Object> stats = new HashMap<>();

        boolean isGlobalSuper = accessControlService.isSuperAdmin(principal)
                && principal.getCollegeId() == null
                && principal.getOrganizationId() == null;

        if (isGlobalSuper) {
            stats.put("totalLearners", learnerSearchCache.size());
            stats.put("departments", learnerSearchCache.getCategories().size());
            stats.put("colleges", collegeRepository.count());
            stats.put("programs", newProgramRepository.count());
            stats.put("classes", classRepository.count());
        } else {
            Integer collegeId = principal.getCollegeId();
            if (collegeId == null && principal.isLearner() && scopeResolutionService != null) {
                ResolvedLearnerScope scope = scopeResolutionService.resolveFullScope(principal.getId());
                collegeId = scope.getCollegeId();
            }
            if (collegeId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new Response<>("error", "College scope required", null));
            }
            List<LearnerSearchDTO> scoped = learnerSearchCache.getByCollegeId(collegeId, Integer.MAX_VALUE);
            stats.put("totalLearners", scoped.size());
            stats.put("departments", scoped.stream()
                    .map(LearnerSearchDTO::getDepartment)
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .distinct()
                    .count());
            stats.put("colleges", 1);
            stats.put("programs", scoped.stream()
                    .map(LearnerSearchDTO::getProgramId)
                    .filter(Objects::nonNull)
                    .distinct()
                    .count());
            stats.put("classes", scoped.stream()
                    .map(LearnerSearchDTO::getClassId)
                    .filter(Objects::nonNull)
                    .distinct()
                    .count());
        }

        return ResponseEntity.ok(
            new Response<>("success", "Stats retrieved", stats)
        );
    }

    @GetMapping("/exists/{learnerName}")
    public ResponseEntity<Response<Boolean>> exists(@PathVariable String learnerName) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new Response<>("error", "Authentication required", null));
        requireSearchRole(principal, null);
        boolean existsInScope = learnerName != null && visibleLearners(principal, null).stream()
                .anyMatch(item -> learnerName.equalsIgnoreCase(item.getDisplayName()));
        return ResponseEntity.ok(new Response<>("success", "Checked", existsInScope));
    }

        @PostMapping("/refresh")
    @ApiOperation(value = "Refresh learner cache", notes = "Reload learners from database (admin)")
    public ResponseEntity<Response<Void>> refresh() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new Response<>("error", "Authentication required", null));
        }
        if (!accessControlService.isSuperAdmin(principal) && !accessControlService.canPerformAdminActionForCollege(principal, principal.getCollegeId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new Response<>("error", "Access denied", null));
        }
        learnerSearchCache.refresh();

        return ResponseEntity.ok(
            new Response<>("success", "Cache refreshed", null)
        );
    }
}


