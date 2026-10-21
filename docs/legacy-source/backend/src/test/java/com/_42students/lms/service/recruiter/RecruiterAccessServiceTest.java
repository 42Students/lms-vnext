package com._42students.lms.service.recruiter;

import com._42students.lms.model.College;
import com._42students.lms.model.RecruiterCollegeAccess;
import com._42students.lms.model.Recruiter;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.RecruiterCollegeAccessRepository;
import com._42students.lms.repository.RecruiterRepository;
import com._42students.lms.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RecruiterAccessServiceTest {

    private RecruiterRepository recruiters;
    private RecruiterCollegeAccessRepository grants;
    private CollegeRepository colleges;
    private RecruiterAccessService service;
    private Recruiter recruiter;

    @BeforeEach
    void setUp() {
        recruiters = mock(RecruiterRepository.class);
        grants = mock(RecruiterCollegeAccessRepository.class);
        colleges = mock(CollegeRepository.class);
        service = new RecruiterAccessService(recruiters, grants, colleges);
        recruiter = new Recruiter();
        recruiter.setId(5);
        recruiter.setIsDeleted(false);
        when(recruiters.findActiveById(5)).thenReturn(Optional.of(recruiter));
        college(6, false);
        college(7, false);
    }

    private void college(int id, boolean deleted) {
        College c = new College();
        c.setId(id);
        c.setIsDeleted(deleted);
        when(colleges.findById(id)).thenReturn(Optional.of(c));
    }

    private RecruiterCollegeAccess grant(int collegeId, String status, LocalDateTime validUntil, Set<String> caps) {
        RecruiterCollegeAccess g = new RecruiterCollegeAccess();
        g.setRecruiterId(5);
        g.setCollegeId(collegeId);
        g.setStatus(status);
        g.setValidUntil(validUntil);
        g.setIsDeleted(false);
        g.setCapabilities(caps);
        when(grants.findForRecruiterAndCollege(5, collegeId)).thenReturn(Optional.of(g));
        return g;
    }

    private static final UserPrincipal RECRUITER_IN_NSRIT = new UserPrincipal(5, "RECRUITER", null, 1, 6, 0);

    @Test
    void activeGrantAllowsMembershipCheck() {
        grant(6, RecruiterCollegeAccess.STATUS_ACTIVE, null, Set.of());
        assertTrue(service.hasActiveGrant(5, 6));
        assertDoesNotThrow(() -> service.requireCollege(RECRUITER_IN_NSRIT, 6, null));
    }

    @Test
    void revokedExpiredOrMissingGrantsAreRefused() {
        grant(6, RecruiterCollegeAccess.STATUS_REVOKED, null, Set.of());
        assertFalse(service.hasActiveGrant(5, 6));
        grant(7, RecruiterCollegeAccess.STATUS_ACTIVE, LocalDateTime.now().minusMinutes(1), Set.of());
        assertFalse(service.hasActiveGrant(5, 7));
        assertFalse(service.hasActiveGrant(5, 99));
        assertThrows(AccessDeniedException.class, () -> service.requireCollege(RECRUITER_IN_NSRIT, 6, null));
    }

    @Test
    void grantForADeletedCollegeIsInactive() {
        grant(6, RecruiterCollegeAccess.STATUS_ACTIVE, null, Set.of());
        college(6, true);
        assertFalse(service.hasActiveGrant(5, 6));
    }

    @Test
    void capabilityMustBeHeld() {
        grant(6, RecruiterCollegeAccess.STATUS_ACTIVE, null, Set.of("VIEW_JOBS"));
        assertDoesNotThrow(() -> service.requireCollege(RECRUITER_IN_NSRIT, 6, "VIEW_JOBS"));
        assertThrows(AccessDeniedException.class, () -> service.requireCollege(RECRUITER_IN_NSRIT, 6, "VIEW_APPLICANTS"));
    }

    @Test
    void onlyAUsableRecruiterPrincipalPasses() {
        grant(6, RecruiterCollegeAccess.STATUS_ACTIVE, null, Set.of());
        assertThrows(AccessDeniedException.class,
                () -> service.requireCollege(new UserPrincipal(5, "FACULTY", "ADMIN", 1, 6, 0), 6, null));
        assertThrows(AccessDeniedException.class, () -> service.requireCollege(RECRUITER_IN_NSRIT, null, null));
        recruiter.setSuspendedAt(LocalDateTime.now());
        assertThrows(AccessDeniedException.class, () -> service.requireCollege(RECRUITER_IN_NSRIT, 6, null));
        assertEquals(Optional.empty(), service.findUsableRecruiter(5));
        assertEquals(Optional.empty(), service.findUsableRecruiter(0));
    }

    @Test
    void activeGrantsListsOnlyUsableOnes() {
        RecruiterCollegeAccess active = grant(6, RecruiterCollegeAccess.STATUS_ACTIVE, null, Set.of());
        RecruiterCollegeAccess revoked = grant(7, RecruiterCollegeAccess.STATUS_REVOKED, null, Set.of());
        when(grants.findAllForRecruiter(5)).thenReturn(List.of(active, revoked));
        assertEquals(List.of(active), service.activeGrants(5));
    }
}
