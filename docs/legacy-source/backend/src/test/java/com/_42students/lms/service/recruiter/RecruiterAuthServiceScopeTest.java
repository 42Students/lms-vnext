package com._42students.lms.service.recruiter;

import com._42students.lms.model.College;
import com._42students.lms.model.RecruiterCollegeAccess;
import com._42students.lms.model.Recruiter;
import com._42students.lms.model.TenantDomain;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.RecruiterRepository;
import com._42students.lms.service.company.CompanyDirectoryService;
import com._42students.lms.repository.TenantDomainRepository;
import com._42students.lms.security.JwtService;
import com._42students.lms.service.tpo.RecruiterInviteService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * recruiter V2: one college per session. These pin the rules that decide which college a recruiter lands in and
 * which accounts a session may list: a college session lists only itself, the college-less chooser lists the
 * colleges (each at its own domain), and a token for a college the recruiter lost is never swapped for another.
 */
class RecruiterAuthServiceScopeTest {

    private static final int RECRUITER_ID = 501;

    private RecruiterAccessService access;
    private CollegeRepository colleges;
    private TenantDomainRepository domains;
    private RecruiterInviteService invites;
    private RecruiterAuthService service;
    private Recruiter recruiter;

    @BeforeEach
    void wire() {
        access = mock(RecruiterAccessService.class);
        colleges = mock(CollegeRepository.class);
        domains = mock(TenantDomainRepository.class);
        invites = mock(RecruiterInviteService.class);
        service = new RecruiterAuthService(access, mock(RecruiterRepository.class), mock(CompanyDirectoryService.class), colleges, mock(JwtService.class));
        ReflectionTestUtils.setField(service, "tenantDomainRepository", domains);
        ReflectionTestUtils.setField(service, "recruiterInviteService", invites);
        recruiter = new Recruiter();
        recruiter.setId(RECRUITER_ID);
        recruiter.setFirstName("Ravi");
        recruiter.setIsDeleted(false);
        when(invites.pendingFor(RECRUITER_ID)).thenReturn(List.of());
    }

    private RecruiterCollegeAccess grant(int collegeId) {
        RecruiterCollegeAccess g = new RecruiterCollegeAccess();
        g.setRecruiterId(RECRUITER_ID);
        g.setCollegeId(collegeId);
        return g;
    }

    private void college(int id, String name, String host, boolean verified, boolean primary) {
        College c = new College();
        c.setId(id);
        c.setName(name);
        c.setUniqueId("C" + id);
        when(colleges.findById(id)).thenReturn(Optional.of(c));
        TenantDomain d = new TenantDomain();
        d.setCollegeId(id);
        d.setHost(host);
        d.setIsVerified(verified);
        d.setIsPrimary(primary);
        when(domains.findActiveByCollegeId(id)).thenReturn(List.of(d));
    }

    private void grants(int... collegeIds) {
        List<RecruiterCollegeAccess> list = new java.util.ArrayList<>();
        for (int id : collegeIds) {
            list.add(grant(id));
            when(access.hasActiveGrant(RECRUITER_ID, id)).thenReturn(true);
        }
        when(access.activeGrants(RECRUITER_ID)).thenReturn(list);
    }

    @Test
    void aRequestedCollegeTheRecruiterStillHoldsIsKept() {
        grants(6, 7);
        assertEquals(6, service.effectiveCollegeId(recruiter, 6));
        assertEquals(7, service.effectiveCollegeId(recruiter, 7));
    }

    @Test
    void aCollegeTheRecruiterLostIsNeverSwappedForAnotherOne() {
        grants(7); // the grant for 6 was revoked; 7 is the only one left
        when(access.hasActiveGrant(RECRUITER_ID, 6)).thenReturn(false);
        assertNull(service.effectiveCollegeId(recruiter, 6), "falls back to the chooser, not silently into college 7");
    }

    @Test
    void aRecruiterWithOneCollegeAndNoPendingInviteIsPlacedInIt() {
        grants(6);
        assertEquals(6, service.soleCollegeOf(recruiter));
        assertNull(service.effectiveCollegeId(recruiter, null), "no college asked for is no session scope: there is no hub session (recruiter phase 1)");
    }

    @Test
    void severalCollegesOrAPendingInviteMeanTheChooser() {
        grants(6, 7);
        assertNull(service.soleCollegeOf(recruiter));
        assertNull(service.effectiveCollegeId(recruiter, null));

        grants(6);
        when(invites.pendingFor(RECRUITER_ID)).thenReturn(List.of(Map.of("collegeId", 8)));
        assertNull(service.soleCollegeOf(recruiter), "an invitation waiting needs the chooser to accept it");
    }

    @Test
    void noCollegeAtAllIsTheChooser() {
        grants();
        assertNull(service.soleCollegeOf(recruiter));
        assertNull(service.effectiveCollegeId(recruiter, null));
    }

    @Test
    void aCollegeSessionListsOnlyItself() {
        grants(6, 7);
        college(6, "NSRIT", "nsrit42.42lms.com", true, true);
        college(7, "Other College", "other.42lms.com", true, true);
        List<Map<String, Object>> list = service.membershipsFor(recruiter, 6, "42lms.com");
        assertEquals(1, list.size());
        assertEquals(6, list.get(0).get("collegeId"));
        assertEquals("nsrit42.42lms.com", list.get(0).get("host"), "the college's own domain");
        assertTrue(list.stream().noneMatch(m -> m.get("collegeId") == null), "no college-less 'all colleges' entry");
        assertFalse(String.valueOf(list).contains("Other College"), "the other college is not even named");
    }

    @Test
    void thereIsNoCollegeChooserAndNoListOfColleges() {
        grants(6, 7);
        college(6, "NSRIT", "nsrit42.42lms.com", true, true);
        college(7, "Other College", "other.42lms.com", true, true);
        assertTrue(service.membershipsFor(recruiter, null, "42lms.com").isEmpty(), "recruiter phase 1: no hub session, no chooser");
        List<Map<String, Object>> inNsrit = service.membershipsFor(recruiter, 6, "42lms.com");
        assertEquals(1, inNsrit.size(), "a college session sees its own college only");
        assertEquals(6, inNsrit.get(0).get("collegeId"));
    }

    @Test
    void aCollegeWithoutADomainYetFallsBackToTheCurrentHost() {
        grants(6);
        College c = new College();
        c.setId(6);
        c.setName("NSRIT");
        when(colleges.findById(6)).thenReturn(Optional.of(c));
        when(domains.findActiveByCollegeId(6)).thenReturn(List.of());
        List<Map<String, Object>> list = service.membershipsFor(recruiter, 6, "42lms.com");
        assertEquals(1, list.size());
        assertNotNull(list.get(0).get("host"), "never a null host that would make the entry unswitchable for no reason");
    }

    @Test
    void anUnusableRecruiterHasNoAccounts() {
        recruiter.setSuspendedAt(java.time.LocalDateTime.now());
        grants(6);
        college(6, "NSRIT", "nsrit42.42lms.com", true, true);
        assertTrue(service.membershipsFor(recruiter, 6, "42lms.com").isEmpty());
        assertTrue(service.membershipsFor(null, 6, "42lms.com").isEmpty());
    }
}
