package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.model.College;
import com._42students.lms.model.Department;
import com._42students.lms.model.Faculty;
import com._42students.lms.model.Learner;
import com._42students.lms.model.TenantDomain;
import com._42students.lms.model.CollegeBranding;
import com._42students.lms.repository.CollegeBrandingRepository;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.DepartmentRepository;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.TenantDomainRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AdminAuditLogService;
import com._42students.lms.service.AppSettingsService;
import com._42students.lms.service.TenantDomainVerificationService;
import com._42students.lms.service.TenantResolutionService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.http.ResponseEntity;

import javax.servlet.http.HttpServletRequest;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * Covers the two bugs the brutal Tenant Setup audit found and fixed in onboardingReadiness/
 * deleteDomain: the domain-verification-default mismatch (readiness vs. the real login gate)
 * and the empty-college check requiring ALL THREE of departments/faculty/students to be missing
 * instead of firing on ANY missing. No test existed for this controller at all before.
 */
class TenantAdminControllerTest {

    private static final int COLLEGE_ID = 42;

    private AccessControlService accessControlService;
    private SecurityContextUtil securityContextUtil;
    private TenantDomainRepository tenantDomainRepository;
    private CollegeRepository collegeRepository;
    private CollegeBrandingRepository collegeBrandingRepository;
    private TenantResolutionService tenantResolutionService;
    private DepartmentRepository departmentRepository;
    private FacultyRepository facultyRepository;
    private LearnerRepository learnerRepository;
    private AdminAuditLogService audit;
    private TenantAdminController controller;

    @BeforeEach
    void setUp() {
        accessControlService = Mockito.mock(AccessControlService.class);
        securityContextUtil = Mockito.mock(SecurityContextUtil.class);
        ScopeResolutionService scopeResolutionService = Mockito.mock(ScopeResolutionService.class);
        tenantDomainRepository = Mockito.mock(TenantDomainRepository.class);
        collegeRepository = Mockito.mock(CollegeRepository.class);
        collegeBrandingRepository = Mockito.mock(CollegeBrandingRepository.class);
        AppSettingsService appSettingsService = Mockito.mock(AppSettingsService.class);
        TenantDomainVerificationService tenantDomainVerificationService = Mockito.mock(TenantDomainVerificationService.class);
        tenantResolutionService = Mockito.mock(TenantResolutionService.class);
        audit = Mockito.mock(AdminAuditLogService.class);
        departmentRepository = Mockito.mock(DepartmentRepository.class);
        facultyRepository = Mockito.mock(FacultyRepository.class);
        learnerRepository = Mockito.mock(LearnerRepository.class);

        controller = new TenantAdminController(
                accessControlService, securityContextUtil, scopeResolutionService, tenantDomainRepository,
                collegeRepository, collegeBrandingRepository, appSettingsService, tenantDomainVerificationService,
                tenantResolutionService, audit, departmentRepository, facultyRepository, learnerRepository
        );

        // A global super-admin, id=0 with no org/college scope — passes every requireXInScope
        // check in this controller unconditionally.
        UserPrincipal principal = new UserPrincipal(0, "FACULTY", "ADMIN", null, null, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
        // requireSuperAdmin is void; a plain mock with no stubbing simply never throws, which is
        // exactly "this caller passed the check" for a unit test at this layer.

        College college = new College();
        college.setId(COLLEGE_ID);
        college.setName("Test College");
        college.setOrgId(1);
        college.setUniqueId("test-college");
        when(collegeRepository.findById(COLLEGE_ID)).thenReturn(Optional.of(college));
        when(collegeBrandingRepository.findActiveByCollegeId(anyInt())).thenReturn(Optional.empty());

        // Present-and-complete by default; individual tests override to isolate one condition.
        when(departmentRepository.fetchAllDepartments(COLLEGE_ID)).thenReturn(someDepartment());
        when(facultyRepository.fetchContactsByCollegeId(COLLEGE_ID)).thenReturn(someFaculty());
        when(learnerRepository.findLearnersByCollegeIdIncludingViaClass(COLLEGE_ID)).thenReturn(someLearner());
    }

    private List<Department> someDepartment() {
        Department d = new Department();
        return Collections.singletonList(d);
    }

    private List<Faculty> someFaculty() {
        Faculty f = new Faculty();
        return Collections.singletonList(f);
    }

    private List<Learner> someLearner() {
        Learner l = new Learner();
        return Collections.singletonList(l);
    }

    private TenantDomain domain(String host, boolean primary, boolean verified) {
        TenantDomain d = new TenantDomain();
        d.setCollegeId(COLLEGE_ID);
        d.setHost(host);
        d.setIsPrimary(primary);
        d.setIsVerified(verified);
        return d;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> readinessBody() {
        ResponseEntity<?> response = controller.onboardingReadiness(COLLEGE_ID);
        assertEquals(200, response.getStatusCodeValue());
        return (Map<String, Object>) response.getBody();
    }

    @SuppressWarnings("unchecked")
    private List<String> blockersOf(Map<String, Object> body) {
        return (List<String>) body.get("blockers");
    }

    @SuppressWarnings("unchecked")
    private List<String> warningsOf(Map<String, Object> body) {
        return (List<String>) body.get("warnings");
    }

    @Test
    @DisplayName("no domains at all is a NO_DOMAIN blocker")
    void noDomains_isBlocker() {
        when(tenantDomainRepository.findActiveByCollegeId(COLLEGE_ID)).thenReturn(Collections.emptyList());

        Map<String, Object> body = readinessBody();

        assertTrue(blockersOf(body).contains("NO_DOMAIN"));
        assertFalse((Boolean) body.get("readyForDomainLogin"));
    }

    @Test
    @DisplayName("domains exist but none marked primary is a NO_PRIMARY_DOMAIN blocker")
    void domainsWithNoPrimary_isBlocker() {
        when(tenantDomainRepository.findActiveByCollegeId(COLLEGE_ID))
                .thenReturn(List.of(domain("college.42lms.com", false, false)));

        assertTrue(blockersOf(readinessBody()).contains("NO_PRIMARY_DOMAIN"));
    }

    @Test
    @DisplayName("two domains both marked primary is a MULTIPLE_PRIMARY_DOMAINS blocker")
    void twoPrimaryDomains_isBlocker() {
        when(tenantDomainRepository.findActiveByCollegeId(COLLEGE_ID))
                .thenReturn(List.of(domain("a.42lms.com", true, false), domain("b.42lms.com", true, false)));

        assertTrue(blockersOf(readinessBody()).contains("MULTIPLE_PRIMARY_DOMAINS"));
    }

    // ---- The critical regression: readiness must always agree with the real login gate ----

    @Test
    @DisplayName("REGRESSION: when verification is required, an unverified primary is a BLOCKER, not just a warning")
    void unverifiedPrimary_isBlockerWhenVerificationRequired() {
        when(tenantResolutionService.isVerifiedDomainRequired()).thenReturn(true);
        when(tenantDomainRepository.findActiveByCollegeId(COLLEGE_ID))
                .thenReturn(List.of(domain("college.42lms.com", true, false)));

        Map<String, Object> body = readinessBody();

        assertTrue(blockersOf(body).contains("NO_VERIFIED_PRIMARY_DOMAIN"));
        assertFalse((Boolean) body.get("readyForDomainLogin"));
        // The checklist's own copy of this flag must be the exact same value
        // TenantResolutionService would use to gate a real login — never computed independently.
        assertEquals(Boolean.TRUE, ((Map<String, Object>) body.get("meta")).get("requireVerifiedDomains"));
    }

    @Test
    @DisplayName("when verification is NOT required, an unverified primary is only a warning")
    void unverifiedPrimary_isOnlyWarningWhenVerificationNotRequired() {
        when(tenantResolutionService.isVerifiedDomainRequired()).thenReturn(false);
        when(tenantDomainRepository.findActiveByCollegeId(COLLEGE_ID))
                .thenReturn(List.of(domain("college.42lms.com", true, false)));

        Map<String, Object> body = readinessBody();

        assertFalse(blockersOf(body).contains("NO_VERIFIED_PRIMARY_DOMAIN"));
        assertTrue(warningsOf(body).contains("PRIMARY_DOMAIN_NOT_VERIFIED") || blockersOf(body).isEmpty());
        assertTrue((Boolean) body.get("readyForDomainLogin"));
    }

    // ---- The other regression: any one of departments/faculty/students missing must warn ----

    @Test
    @DisplayName("REGRESSION: a department but zero faculty and zero students still triggers the empty-college warning")
    void departmentOnly_stillWarnsEmptyCollege() {
        when(tenantResolutionService.isVerifiedDomainRequired()).thenReturn(false);
        when(tenantDomainRepository.findActiveByCollegeId(COLLEGE_ID))
                .thenReturn(List.of(domain("college.42lms.com", true, true)));
        when(facultyRepository.fetchContactsByCollegeId(COLLEGE_ID)).thenReturn(Collections.emptyList());
        when(learnerRepository.findLearnersByCollegeIdIncludingViaClass(COLLEGE_ID)).thenReturn(Collections.emptyList());
        // departmentRepository still returns someDepartment() from setUp() — one department, no
        // faculty, no students. Before the fix, all-three-missing was required to fire, so this
        // exact case (the realistic "onboarding stalled partway through") never warned.

        assertTrue(warningsOf(readinessBody()).contains("EMPTY_COLLEGE_NO_ACADEMIC_DATA"));
    }

    @Test
    @DisplayName("departments, faculty, and students all present: no empty-college warning")
    void allThreePresent_noEmptyCollegeWarning() {
        when(tenantResolutionService.isVerifiedDomainRequired()).thenReturn(false);
        when(tenantDomainRepository.findActiveByCollegeId(COLLEGE_ID))
                .thenReturn(List.of(domain("college.42lms.com", true, true)));
        // departmentRepository/facultyRepository/learnerRepository all return non-empty from setUp().

        assertFalse(warningsOf(readinessBody()).contains("EMPTY_COLLEGE_NO_ACADEMIC_DATA"));
    }

    // ---- deleteDomain: a soft-deleted domain's host must be free for reuse ----

    @Test
    @DisplayName("REGRESSION: deleting a domain frees its host for reuse, but the audit log keeps the real address")
    void deleteDomain_freesHostForReuse_auditKeepsRealHost() {
        int domainId = 7;
        TenantDomain existing = domain("old-college.42lms.com", true, true);
        existing.setId(domainId);
        when(tenantDomainRepository.findById(domainId)).thenReturn(Optional.of(existing));
        when(tenantDomainRepository.save(any(TenantDomain.class))).thenAnswer(inv -> inv.getArgument(0));

        HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
        ResponseEntity<?> response = controller.deleteDomain(domainId, request);

        assertEquals(200, response.getStatusCodeValue());

        ArgumentCaptor<TenantDomain> savedCaptor = ArgumentCaptor.forClass(TenantDomain.class);
        Mockito.verify(tenantDomainRepository).save(savedCaptor.capture());
        TenantDomain saved = savedCaptor.getValue();
        assertTrue(Boolean.TRUE.equals(saved.getIsDeleted()));
        // The real host must no longer be the exact value stored — that's what freed it for
        // uq_tenant_domain_host (a table-wide unique constraint, not scoped to is_deleted) to
        // allow a future insert with the original address.
        assertFalse("old-college.42lms.com".equals(saved.getHost()));
        assertTrue(saved.getHost().startsWith("old-college.42lms.com~deleted~"));

        // The audit trail is for humans — it must show the real address, not the mangled one.
        ArgumentCaptor<Map<String, Object>> payloadCaptor = ArgumentCaptor.forClass(Map.class);
        Mockito.verify(audit).log(eq(request), eq("TENANT_DOMAIN_DELETE"), eq("tenant_domain"),
                eq(String.valueOf(domainId)), eq(null), eq(COLLEGE_ID), payloadCaptor.capture());
        assertEquals("old-college.42lms.com", payloadCaptor.getValue().get("host"));
    }

    @Test
    @DisplayName("Sign-in methods: a known option is saved, normalised")
    void upsertBranding_savesKnownLoginMethods() {
        when(collegeBrandingRepository.save(any(CollegeBranding.class))).thenAnswer(inv -> inv.getArgument(0));
        TenantAdminController.CollegeBrandingRequest req = new TenantAdminController.CollegeBrandingRequest();
        req.setLoginMethods(" phone_only ");

        ResponseEntity<?> response = controller.upsertBranding(COLLEGE_ID, req, Mockito.mock(HttpServletRequest.class));

        assertEquals(200, response.getStatusCodeValue());
        ArgumentCaptor<CollegeBranding> saved = ArgumentCaptor.forClass(CollegeBranding.class);
        Mockito.verify(collegeBrandingRepository).save(saved.capture());
        assertEquals("PHONE_ONLY", saved.getValue().getLoginMethods());
    }

    @Test
    @DisplayName("Sign-in methods: an unknown option is refused before anything on the branding row changes")
    void upsertBranding_rejectsUnknownLoginMethods_changesNothing() {
        CollegeBranding existing = new CollegeBranding();
        existing.setCollegeId(COLLEGE_ID);
        existing.setLogoUrl("https://cdn.example/old.png");
        when(collegeBrandingRepository.findActiveByCollegeId(COLLEGE_ID)).thenReturn(Optional.of(existing));
        TenantAdminController.CollegeBrandingRequest req = new TenantAdminController.CollegeBrandingRequest();
        req.setLogoUrl("https://cdn.example/new.png");
        req.setLoginMethods("SMS_ONLY");

        ResponseEntity<?> response = controller.upsertBranding(COLLEGE_ID, req, Mockito.mock(HttpServletRequest.class));

        assertEquals(400, response.getStatusCodeValue());
        Mockito.verify(collegeBrandingRepository, Mockito.never()).save(any(CollegeBranding.class));
        assertEquals("https://cdn.example/old.png", existing.getLogoUrl());
    }
}
