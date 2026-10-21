package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.FeatureFlagUpdateRequest;
import com._42students.lms.dto.response.CollegeFeatureFlagsDTO;
import com._42students.lms.dto.response.CollegeResponseDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.repository.ProjectMemberRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AdminAuditLogService;
import com._42students.lms.service.AppSettingsService;
import com._42students.lms.service.CollegeService;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Superadmin management of the two supported module toggles (Projects, Placements), per college.
 * Storage is generic AppSettingsService (COLLEGE scope) — see FeatureFlagService for the runtime
 * enforcement side of the same keys.
 */
@RestController
@RequestMapping("/api/v1/superadmin/features")
public class SuperAdminFeatureController {

    // The module list lives in ModuleFeatureCatalog so this controller and the per-user
    // /features/mine endpoint cannot drift apart, which is what made the list hard to extend.
    private static final String PROJECTS_KEY = "module.projects.enabled";
    private static final String PLACEMENTS_KEY = "module.placements.enabled";

    private final AppSettingsService appSettingsService;
    private final AccessControlService accessControlService;
    private final CollegeService collegeService;
    private final AdminAuditLogService adminAuditLogService;
    private final SecurityContextUtil securityContextUtil;
    private final ScopeResolutionService scopeResolutionService;
    private final ProjectMemberRepository projectMemberRepository;
    private final com._42students.lms.service.ModuleAccessResolver moduleAccessResolver;

    // Required repositories: an impact preview cannot silently report zero if its source is absent.
    @org.springframework.beans.factory.annotation.Autowired
    private com._42students.lms.repository.JobRepository jobRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private com._42students.lms.repository.JobApplicationRepository jobApplicationRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private com._42students.lms.repository.InterviewRepository interviewRepository;

    public SuperAdminFeatureController(AppSettingsService appSettingsService,
                                       AccessControlService accessControlService,
                                       CollegeService collegeService,
                                       AdminAuditLogService adminAuditLogService,
                                       SecurityContextUtil securityContextUtil,
                                       ScopeResolutionService scopeResolutionService,
                                       ProjectMemberRepository projectMemberRepository,
                                       com._42students.lms.service.ModuleAccessResolver moduleAccessResolver) {
        this.appSettingsService = appSettingsService;
        this.accessControlService = accessControlService;
        this.collegeService = collegeService;
        this.adminAuditLogService = adminAuditLogService;
        this.securityContextUtil = securityContextUtil;
        this.scopeResolutionService = scopeResolutionService;
        this.projectMemberRepository = projectMemberRepository;
        this.moduleAccessResolver = moduleAccessResolver;
    }

    @GetMapping
    public ResponseEntity<?> list() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireSuperAdmin(principal);

        // Mirrors CollegeController.fetchCollegeList's own scoping branches exactly: a superadmin
        // who has narrowed themselves to one college or one org must only see/manage colleges
        // within that scope, never the whole platform — CollegeService.fetchCollegeList() itself
        // applies no scoping at all (confirmed: a flat findAll() over every non-deleted college),
        // so the caller is responsible for it.
        List<CollegeResponseDTO> colleges;
        if (principal.getCollegeId() != null) {
            com._42students.lms.model.College c = collegeService.fetchCollege(principal.getCollegeId());
            CollegeResponseDTO dto = new CollegeResponseDTO();
            dto.setId(c.getId());
            dto.setName(c.getName());
            dto.setLogo(c.getLogo());
            dto.setUniqueId(c.getUniqueId());
            dto.setOrgId(c.getOrgId());
            dto.setCity(c.getCity());
            dto.setState(c.getState());
            colleges = List.of(dto);
        } else if (principal.getOrganizationId() != null) {
            colleges = collegeService.fetchOnlyNames(principal.getOrganizationId());
        } else {
            colleges = collegeService.fetchCollegeList();
        }

        // One settings query for all listed colleges and their inherited org/global scopes.
        // A local-only lookup can show ON despite a locked OFF at organization or platform.
        List<Integer> scopeIds = new java.util.ArrayList<>();
        for (CollegeResponseDTO college : colleges) {
            scopeIds.add(college.getId());
            if (college.getOrgId() > 0) scopeIds.add(college.getOrgId());
        }
        List<com._42students.lms.model.AppSetting> rows = moduleAccessResolver.fetchRowsForScopes(
                List.of("COLLEGE", "ORGANIZATION", "GLOBAL"), scopeIds);
        List<CollegeFeatureFlagsDTO> result = colleges.stream().map(college -> {
            List<com._42students.lms.service.ModuleAccessResolver.ScopeRef> chain = new java.util.ArrayList<>();
            chain.add(new com._42students.lms.service.ModuleAccessResolver.ScopeRef("COLLEGE", college.getId()));
            if (college.getOrgId() > 0) chain.add(
                    new com._42students.lms.service.ModuleAccessResolver.ScopeRef("ORGANIZATION", college.getOrgId()));
            chain.add(new com._42students.lms.service.ModuleAccessResolver.ScopeRef("GLOBAL", null));
            Map<String, com._42students.lms.service.ModuleAccessResolver.Resolution> resolved =
                    moduleAccessResolver.resolveAll(chain, rows);
            Map<String, Boolean> modules = new java.util.LinkedHashMap<>();
            Map<String, Map<String, Object>> details = new java.util.LinkedHashMap<>();
            for (String module : com._42students.lms.service.ModuleFeatureCatalog.moduleKeys()) {
                com._42students.lms.service.ModuleAccessResolver.Resolution state =
                        resolved == null ? null : resolved.get(module);
                if (state == null) throw new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.SERVICE_UNAVAILABLE, "OPTIONAL_MODULE_RESOLUTION_UNAVAILABLE");
                modules.put(module, state.enabled);
                Map<String, Object> detail = new java.util.LinkedHashMap<>();
                detail.put("effectiveEnabled", state.enabled);
                detail.put("effectiveLevel", state.level);
                detail.put("effectiveScopeId", state.scopeId);
                detail.put("effectiveLocked", state.locked);
                detail.put("editableHere", !state.locked);
                details.put(module, detail);
            }
            CollegeFeatureFlagsDTO dto = new CollegeFeatureFlagsDTO(college.getId(), college.getName(),
                    Boolean.TRUE.equals(modules.get("projects")),
                    Boolean.TRUE.equals(modules.get("placements")), modules);
            dto.setModuleDetails(details);
            return dto;
        }).collect(Collectors.toList());

        return new ResponseEntity<>(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), result), HttpStatus.OK);
    }

    @PutMapping("/{collegeId}")
    @Transactional
    public ResponseEntity<?> update(@PathVariable Integer collegeId,
                                    @RequestBody(required = false) FeatureFlagUpdateRequest body,
                                    HttpServletRequest request) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireSuperAdmin(principal);
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);

        // `enabled` is a boxed Boolean specifically so a body that omits it is rejected rather than
        // silently deserializing to false — with a primitive boolean, a malformed/incomplete
        // request (a bug in some future caller, a hand-built curl, a partial retry) would silently
        // DISABLE a module instead of erroring, on a page whose whole job is disabling modules.
        if (body == null || body.getModule() == null || body.getModule().isBlank() || body.getEnabled() == null) {
            return new ResponseEntity<>(new Response(HttpStatus.BAD_REQUEST.name(),
                    "Request must include both \"module\" and \"enabled\"", null), HttpStatus.BAD_REQUEST);
        }

        String key = keyForModule(body.getModule());
        if (key == null) {
            return new ResponseEntity<>(new Response(HttpStatus.BAD_REQUEST.name(),
                    "Unknown module: " + body.getModule(), null), HttpStatus.BAD_REQUEST);
        }

        // A typo'd or stale collegeId would otherwise upsert an app_setting row for a college that
        // was never real (or no longer is), invisible in the console and never cleaned up.
        java.util.Optional<com._42students.lms.model.College> college = collegeService.findById(collegeId);
        if (college.isEmpty() || Boolean.TRUE.equals(college.get().getIsDeleted())) {
            return new ResponseEntity<>(new Response(HttpStatus.NOT_FOUND.name(),
                    "No college with id " + collegeId, null), HttpStatus.NOT_FOUND);
        }

        // Never create dormant college overrides under a locked ORGANIZATION/GLOBAL
        // decision: they would unexpectedly take effect if the ancestor were unlocked later.
        List<com._42students.lms.service.ModuleAccessResolver.ScopeRef> ancestors = new java.util.ArrayList<>();
        if (college.get().getOrgId() != null) ancestors.add(
                new com._42students.lms.service.ModuleAccessResolver.ScopeRef("ORGANIZATION", college.get().getOrgId()));
        ancestors.add(new com._42students.lms.service.ModuleAccessResolver.ScopeRef("GLOBAL", null));
        Map<String, com._42students.lms.service.ModuleAccessResolver.Resolution> parentStates =
                moduleAccessResolver.resolveAll(ancestors);
        com._42students.lms.service.ModuleAccessResolver.Resolution parent =
                parentStates == null ? null : parentStates.get(body.getModule().trim().toLowerCase(java.util.Locale.ROOT));
        if (parent == null) throw new org.springframework.web.server.ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE, "OPTIONAL_MODULE_RESOLUTION_UNAVAILABLE");
        if (parent.locked) {
            return new ResponseEntity<>(new Response(HttpStatus.CONFLICT.name(),
                    "Locked at " + parent.level + " level. Change it in Module Access before editing this college.",
                    null), HttpStatus.CONFLICT);
        }

        // This page only knows about COLLEGE-level values — it cannot see locks. Writing through a
        // lock would silently convert, say, a locked OFF into a locked ON, shadowing every
        // department/class/student override beneath it with no indication here that anything of the
        // sort happened. Refuse and point at the page that can express it.
        String lockKey = com._42students.lms.service.ModuleFeatureCatalog.lockKeyFor(body.getModule());
        if (lockKey != null && com._42students.lms.service.ModuleFeatureCatalog.isTrue(
                appSettingsService.getSettingValue("COLLEGE", collegeId, lockKey))) {
            return new ResponseEntity<>(new Response(HttpStatus.CONFLICT.name(),
                    "This module is locked at college level. Change it from Module Access, where the lock can be seen and released.",
                    null), HttpStatus.CONFLICT);
        }

        boolean enabled = body.getEnabled();
        String previous = appSettingsService.getSettingValue("COLLEGE", collegeId, key);
        appSettingsService.upsert("COLLEGE", collegeId, key, String.valueOf(enabled));
        // This is a security-sensitive entitlement write: do not report success if its
        // audit record cannot be saved. @Transactional rolls back the settings write too.
        Map<String, Object> auditPayload = new java.util.LinkedHashMap<>();
        auditPayload.put("scopeType", "COLLEGE");
        auditPayload.put("scopeId", collegeId);
        auditPayload.put("module", body.getModule());
        auditPayload.put("enabled", enabled);
        auditPayload.put("previousValue", previous);
        adminAuditLogService.logRequired(request, "COLLEGE_FEATURE_TOGGLE", "COLLEGE", String.valueOf(collegeId),
                null, collegeId, auditPayload);

        return new ResponseEntity<>(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), null), HttpStatus.OK);
    }

    /**
     * A read-only, college-scoped impact preview before disabling Placements. Counts are
     * separate and may overlap (an offered application is also an in-progress application).
     * Shared org jobs are counted as visible jobs; applications/interviews are counted by the
     * learner's ACTUAL college rather than charging every shared-job applicant to every college.
     */
    @GetMapping("/{collegeId}/placements-impact")
    public ResponseEntity<?> placementsImpact(@PathVariable Integer collegeId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireSuperAdmin(principal);
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);
        com._42students.lms.model.College college = collegeService.findById(collegeId)
                .filter(c -> !Boolean.TRUE.equals(c.getIsDeleted()))
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.NOT_FOUND, "COLLEGE_NOT_FOUND"));
        Integer organizationId = college.getOrgId();
        if (organizationId == null) throw new org.springframework.web.server.ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE, "COLLEGE_ORGANIZATION_UNAVAILABLE");
        long activeJobs = jobRepository.countActivePublishedForCollegeOrOrg(collegeId, organizationId);
        long inProgress = jobApplicationRepository.countInProgressForLearnerCollege(collegeId, organizationId);
        long pendingOffers = jobApplicationRepository.countPendingOffersForLearnerCollege(collegeId, organizationId);
        long interviews = interviewRepository.countUpcomingForLearnerCollege(
                collegeId, organizationId, java.time.LocalDateTime.now(java.time.Clock.systemUTC()));
        return new ResponseEntity<>(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                Map.of("activeJobs", activeJobs,
                        "inProgressApplications", inProgress,
                        "pendingOffers", pendingOffers,
                        "upcomingInterviews", interviews)), HttpStatus.OK);
    }

    /**
     * How many mentors are actively assigned to a project at this college — surfaced by the
     * console as a warning before a super admin turns Projects off. Once Projects is disabled, a
     * mentor's nav has nothing else left to hide behind (see MentorProjectsPage's own empty
     * state), so this is the blast-radius number that actually matters for that decision.
     */
    @GetMapping("/{collegeId}/mentor-count")
    public ResponseEntity<?> mentorCount(@PathVariable Integer collegeId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireSuperAdmin(principal);
        requireScopedSuperadminCollegeWithinScope(principal, collegeId);

        long count = projectMemberRepository.countActivePrimaryMentorsForCollege(collegeId);
        return new ResponseEntity<>(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                Map.of("mentorCount", count)), HttpStatus.OK);
    }

    private String keyForModule(String module) {
        return com._42students.lms.service.ModuleFeatureCatalog.settingKeyFor(module);
    }

    /**
     * The modules this deployment can toggle, so the console renders whatever the catalog holds
     * rather than a hardcoded list of its own that could fall out of step with the server's.
     */
    @GetMapping("/modules")
    public ResponseEntity<?> modules() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireSuperAdmin(principal);
        return new ResponseEntity<>(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                com._42students.lms.service.ModuleFeatureCatalog.labels()), HttpStatus.OK);
    }

    private void requireScopedSuperadminCollegeWithinScope(UserPrincipal principal, Integer collegeId) {
        if (principal == null || collegeId == null) return;
        if (principal.getCollegeId() == null && principal.getOrganizationId() == null) return; // GLOBAL mode

        if (principal.getCollegeId() != null) {
            if (!Objects.equals(principal.getCollegeId(), collegeId)) {
                throw new org.springframework.security.access.AccessDeniedException("Superadmin is college-scoped and cannot access other colleges");
            }
            return;
        }

        Integer resolvedOrgId = scopeResolutionService != null ? scopeResolutionService.resolveCollegeToOrganizationId(collegeId) : null;
        if (resolvedOrgId == null || !Objects.equals(principal.getOrganizationId(), resolvedOrgId)) {
            throw new org.springframework.security.access.AccessDeniedException("Superadmin is org-scoped and cannot access other organizations");
        }
    }
}
