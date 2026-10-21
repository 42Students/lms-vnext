package com._42students.lms.service.recruiter;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.model.College;
import com._42students.lms.model.RecruiterCollegeAccess;
import com._42students.lms.model.Recruiter;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.RecruiterCollegeAccessRepository;
import com._42students.lms.repository.RecruiterRepository;
import com._42students.lms.service.company.CompanyDirectoryService;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.recruiter.RecruiterAdminService.RecruiterAdminException;
import com._42students.lms.service.recruiter.RecruiterAdminService.RecruiterProfileInput;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RecruiterAdminServiceTest {

    private static final UserPrincipal GLOBAL = UserPrincipal.forSuperAdmin();
    private static final UserPrincipal SCOPED_NSRIT = UserPrincipal.forSuperAdminScoped(1, 6);
    private static final UserPrincipal COLLEGE_ADMIN = new UserPrincipal(10, "FACULTY", "ADMIN", 1, 6, 0);

    private RecruiterRepository recruiters;
    private RecruiterCollegeAccessRepository grants;
    private CollegeRepository colleges;
    private AccessControlService access;
    private RecruiterAdminService service;

    @BeforeEach
    void setUp() {
        recruiters = mock(RecruiterRepository.class);
        grants = mock(RecruiterCollegeAccessRepository.class);
        colleges = mock(CollegeRepository.class);
        access = mock(AccessControlService.class);
        CompanyDirectoryService companies = mock(CompanyDirectoryService.class);
        com._42students.lms.model.Company omega = new com._42students.lms.model.Company();
        omega.setId(1);
        org.mockito.Mockito.when(companies.forWorkEmail(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any())).thenReturn(omega);
        RecruiterAuthService auth = mock(RecruiterAuthService.class);
        service = new RecruiterAdminService(recruiters, grants, companies, colleges, access, auth);

        when(access.isSuperAdmin(any())).thenAnswer(i -> {
            UserPrincipal p = i.getArgument(0);
            return p != null && p.getId() != null && p.getId() == 0;
        });
        when(access.isGlobalSuperAdmin(any())).thenAnswer(i -> {
            UserPrincipal p = i.getArgument(0);
            return p != null && p.getId() == 0 && p.getCollegeId() == null && p.getOrganizationId() == null;
        });
        when(access.canAccessCollege(eq(SCOPED_NSRIT), any())).thenAnswer(i -> Integer.valueOf(6).equals(i.getArgument(1)));
        when(recruiters.save(any())).thenAnswer(i -> {
            Recruiter h = i.getArgument(0);
            if (h.getId() == 0) h.setId(5);
            return h;
        });
        when(grants.save(any())).thenAnswer(i -> i.getArgument(0));
        college(6);
        college(7);
    }

    private void college(int id) {
        College c = new College();
        c.setId(id);
        c.setOrgId(1);
        c.setIsDeleted(false);
        when(colleges.findById(id)).thenReturn(Optional.of(c));
    }

    private static RecruiterProfileInput input(String mobile) {
        RecruiterProfileInput in = new RecruiterProfileInput();
        in.firstName = "Asha";
        in.contactMobile = mobile;
        in.contactMail = "asha@omega.com";
        return in;
    }

    private Recruiter existingRecruiter(boolean deleted) {
        Recruiter recruiter = new Recruiter();
        recruiter.setId(5);
        recruiter.setFirstName("Asha");
        recruiter.setContactMobile("9100060092");
        recruiter.setTokenVersion(3);
        recruiter.setIsDeleted(deleted);
        recruiter.setContactMail("asha@omega.com");
        when(recruiters.findByContactMail("asha@omega.com")).thenReturn(Optional.of(recruiter));
        when(recruiters.findById(5)).thenReturn(Optional.of(recruiter));
        return recruiter;
    }

    private RecruiterCollegeAccess grantRow(int collegeId) {
        RecruiterCollegeAccess g = new RecruiterCollegeAccess();
        g.setRecruiterId(5);
        g.setCollegeId(collegeId);
        g.setStatus(RecruiterCollegeAccess.STATUS_ACTIVE);
        g.setIsDeleted(false);
        return g;
    }

    @Test
    void onlySuperAdminsCanManageRecruiter() {
        assertThrows(AccessDeniedException.class, () -> service.create(COLLEGE_ADMIN, input("9100060092")));
        assertThrows(AccessDeniedException.class, () -> service.list(COLLEGE_ADMIN, null, 0, 10));
        assertThrows(AccessDeniedException.class, () -> service.grant(COLLEGE_ADMIN, 5, 6, null, null));
    }

    @Test
    void createValidatesAndNormalisesTheMobile() {
        RecruiterAdminException bad = assertThrows(RecruiterAdminException.class, () -> service.create(GLOBAL, input("12345")));
        assertEquals("INVALID_MOBILE", bad.getCode());
        Recruiter created = service.create(GLOBAL, input("+91 91000 60092"));
        assertEquals("9100060092", created.getContactMobile());
        assertEquals(0, created.getTokenVersion());
    }

    @Test
    void duplicateLiveEmailIsAConflictThatNamesTheExistingRecruiter() {
        existingRecruiter(false);
        RecruiterAdminException conflict = assertThrows(RecruiterAdminException.class, () -> service.create(GLOBAL, input("9100060092")));
        assertEquals(409, conflict.getStatus());
        assertEquals(5, conflict.getDetails().get("recruiterId"));
    }

    @Test
    void recreatingADeletedRecruiterRestoresTheSameIdentityAndKillsOldTokens() {
        Recruiter deleted = existingRecruiter(true);
        when(grants.findAllForRecruiter(5)).thenReturn(List.of());
        Recruiter restored = service.create(GLOBAL, input("9100060092"));
        assertEquals(5, restored.getId());
        assertFalse(restored.getIsDeleted());
        assertEquals(4, deleted.getTokenVersion());
    }

    @Test
    void scopedSuperAdminMustGrantACollegeInScopeWhenCreating() {
        assertEquals("COLLEGE_REQUIRED", assertThrows(RecruiterAdminException.class,
                () -> service.createWithColleges(SCOPED_NSRIT, input("9100060092"), List.of())).getCode());
        assertThrows(AccessDeniedException.class,
                () -> service.createWithColleges(SCOPED_NSRIT, input("9100060092"), List.of(7)));
    }

    @Test
    void scopedSuperAdminCannotTouchAnRecruiterWithAccessOutsideTheScope() {
        existingRecruiter(false);
        when(grants.findAllForRecruiter(5)).thenReturn(List.of(grantRow(6), grantRow(7)));
        assertThrows(AccessDeniedException.class, () -> service.suspend(SCOPED_NSRIT, 5, "x"));
        assertThrows(AccessDeniedException.class, () -> service.delete(SCOPED_NSRIT, 5));

        when(grants.findAllForRecruiter(5)).thenReturn(List.of(grantRow(6)));
        Recruiter suspended = service.suspend(SCOPED_NSRIT, 5, "left the company");
        assertNotNull(suspended.getSuspendedAt());
        assertEquals(4, suspended.getTokenVersion());
    }

    @Test
    @SuppressWarnings("unchecked")
    void scopedReadsHideOutOfScopeGrantHistoryButExposeManageability() {
        existingRecruiter(false);
        when(grants.findAllForRecruiter(5)).thenReturn(List.of(grantRow(6), grantRow(7)));

        Map<String, Object> result = service.get(SCOPED_NSRIT, 5);

        assertEquals(false, result.get("accountManageable"));
        assertEquals(true, result.get("hasAccessOutsideScope"));
        List<Map<String, Object>> visible = (List<Map<String, Object>>) result.get("colleges");
        assertEquals(1, visible.size());
        assertEquals(6, visible.get(0).get("collegeId"));
        assertEquals(1L, result.get("activeCollegeCount"));
    }

    @Test
    void grantRejectsOutOfScopeCollegesPastDatesAndUnknownCapabilities() {
        existingRecruiter(false);
        assertThrows(AccessDeniedException.class, () -> service.grant(SCOPED_NSRIT, 5, 7, null, null));
        assertEquals("VALID_UNTIL_IN_PAST", assertThrows(RecruiterAdminException.class,
                () -> service.grant(GLOBAL, 5, 6, LocalDateTime.now().minusDays(1), null)).getCode());
        assertEquals("UNKNOWN_CAPABILITY", assertThrows(RecruiterAdminException.class,
                () -> service.grant(GLOBAL, 5, 6, null, List.of("DELETE_EVERYTHING"))).getCode());
    }

    @Test
    void grantReactivatesAnExistingRowAndRevokeKeepsHistory() {
        existingRecruiter(false);
        RecruiterCollegeAccess row = grantRow(6);
        row.setStatus(RecruiterCollegeAccess.STATUS_REVOKED);
        row.setRevokedAt(LocalDateTime.now().minusDays(2));
        when(grants.findForRecruiterAndCollege(5, 6)).thenReturn(Optional.of(row));

        RecruiterCollegeAccess granted = service.grant(GLOBAL, 5, 6, null, null);
        assertEquals(RecruiterCollegeAccess.STATUS_ACTIVE, granted.getStatus());
        assertNull(granted.getRevokedAt());

        RecruiterCollegeAccess revoked = service.revoke(GLOBAL, 5, 6, "drive over");
        assertEquals(RecruiterCollegeAccess.STATUS_REVOKED, revoked.getStatus());
        assertEquals("drive over", revoked.getRevokeReason());
    }

    @Test
    void likeSearchInputIsTakenLiterally() {
        assertEquals("ab", RecruiterAdminService.likeSafe(" a%_b\\ "));
        assertEquals("", RecruiterAdminService.likeSafe(null));
    }
}
