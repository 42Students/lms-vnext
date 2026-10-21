package com._42students.lms.service.tpo;

import com._42students.lms.model.CompanyDomain;
import com._42students.lms.model.Job;
import com._42students.lms.model.Recruiter;
import com._42students.lms.model.RecruiterCollegeAccess;
import com._42students.lms.model.tpo.RecruiterLead;
import com._42students.lms.repository.CompanyDomainRepository;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.repository.RecruiterCollegeAccessRepository;
import com._42students.lms.repository.RecruiterRepository;
import com._42students.lms.repository.tpo.RecruiterLeadRepository;
import com._42students.lms.service.company.CompanyDirectoryService;
import com._42students.lms.service.company.CompanyDomainService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Recruiter phase 1, step 6 (N5 c): the placement cell posts the drive and invites the company's recruiter to review it. */
class DriveReviewInviteServiceTest {

    private final JobRepository jobs = mock(JobRepository.class);
    private final RecruiterRepository recruiters = mock(RecruiterRepository.class);
    private final RecruiterCollegeAccessRepository access = mock(RecruiterCollegeAccessRepository.class);
    private final RecruiterLeadRepository leads = mock(RecruiterLeadRepository.class);
    private final TpoRecruiterLeadService leadService = mock(TpoRecruiterLeadService.class);
    private final CompanyDomainService domainService = mock(CompanyDomainService.class);
    private final CompanyDomainRepository domains = mock(CompanyDomainRepository.class);
    private final CompanyDirectoryService directory = mock(CompanyDirectoryService.class);
    private final TpoAuditService audit = mock(TpoAuditService.class);
    private final NamedParameterJdbcTemplate jdbc = mock(NamedParameterJdbcTemplate.class);
    private final DriveReviewInviteService svc = new DriveReviewInviteService(jobs, recruiters, access, leads, leadService, domainService, domains, directory, audit, jdbc);

    private Job job;

    @BeforeEach
    void setUp() {
        job = new Job();
        job.setId(5);
        job.setCollegeId(6);
        job.setCompanyId(40);
        job.setLifecycleStatus("DRAFT");
        when(jobs.findById(5)).thenReturn(Optional.of(job));
        when(directory.nameOf(40)).thenReturn("Omega");
        when(domainService.checkEmail("kumar@omega.com")).thenReturn(new CompanyDomainService.Check("omega.com", CompanyDomainService.Outcome.OK));
        when(domainService.checkEmail("kumar@zeta.com")).thenReturn(new CompanyDomainService.Check("zeta.com", CompanyDomainService.Outcome.OK));
        CompanyDomain omega = new CompanyDomain();
        omega.setCompanyId(40);
        when(domains.findByDomain("omega.com")).thenReturn(Optional.of(omega));
        CompanyDomain zeta = new CompanyDomain();
        zeta.setCompanyId(41);
        when(domains.findByDomain("zeta.com")).thenReturn(Optional.of(zeta));
        when(recruiters.findByContactMail(anyString())).thenReturn(Optional.empty());
    }

    @Test
    void aRecruiterAlreadyWorkingWithTheCollegeIsAttachedAtOnce() {
        Recruiter r = new Recruiter();
        r.setId(77);
        r.setFirstName("Kumar");
        r.setIsDeleted(false);
        when(recruiters.findByContactMail("kumar@omega.com")).thenReturn(Optional.of(r));
        RecruiterCollegeAccess g = new RecruiterCollegeAccess();
        g.setStatus(RecruiterCollegeAccess.STATUS_ACTIVE);
        g.setIsDeleted(false);
        when(access.findForRecruiterAndCollege(77, 6)).thenReturn(Optional.of(g));
        Map<String, Object> out = svc.invite(6, 5, "Kumar", "kumar@omega.com", null, 1, "https://x");
        assertEquals("ATTACHED", out.get("status"));
        assertEquals(77L, job.getRecruiterId());
        verify(leadService, never()).invite(anyLong(), anyBoolean(), any(), any(), any());
    }

    @Test
    void anyoneElseGetsAnInvitationThatCarriesTheDrive() {
        RecruiterLead lead = new RecruiterLead();
        lead.setId(9L);
        when(leadService.addRecruiterLead(eq(6), eq("Kumar"), eq("kumar@omega.com"), eq("Omega"), eq(1), any())).thenReturn(lead);
        when(leadService.invite(9L, true, null, "https://x", null)).thenReturn(Map.of("token", "t", "emailed", true));
        Map<String, Object> out = svc.invite(6, 5, "Kumar", "kumar@omega.com", null, 1, "https://x");
        assertEquals("INVITED", out.get("status"));
        assertEquals("https://x/recruiter-invite/t", out.get("inviteLink"));
        assertEquals(null, out.get("email"), "emailed: nothing to send by hand");
        assertEquals(5, lead.getReviewJobId());
        assertEquals(null, job.getRecruiterId());
    }

    @Test
    void theEmailMustBeAtTheDrivesCompany() {
        assertThrows(IllegalArgumentException.class, () -> svc.invite(6, 5, "Kumar", "kumar@zeta.com", null, 1, "https://x"));
        assertThrows(IllegalArgumentException.class, () -> svc.invite(7, 5, "Kumar", "kumar@omega.com", null, 1, "https://x"));
    }

    @Test
    void joiningAttachesTheDriveOnlyIfNobodyHasIt() {
        RecruiterLead lead = new RecruiterLead();
        lead.setReviewJobId(5);
        lead.setCollegeId(6);
        when(jdbc.update(contains("recruiter_id IS NULL"), any(MapSqlParameterSource.class))).thenReturn(1);
        svc.attachReviewDrive(lead, 77);
        verify(jdbc).update(contains("recruiter_id IS NULL"), any(MapSqlParameterSource.class));
        verify(audit).bell(eq(6), eq("RECRUITER_REVIEWING"), anyString(), anyString(), eq("/tpo/drives/5"));
    }

    @Test
    void anOlderCompanyWithNoDomainLearnsItFromThePlacementCellsInvite() {
        when(directory.domainsOf(40)).thenReturn(List.of());
        when(domainService.checkEmail("kumar@techm.com")).thenReturn(new CompanyDomainService.Check("techm.com", CompanyDomainService.Outcome.OK));
        when(domains.findByDomain("techm.com")).thenReturn(Optional.empty());
        RecruiterLead lead = new RecruiterLead();
        lead.setId(9L);
        when(leadService.addRecruiterLead(eq(6), eq("Kumar"), eq("kumar@techm.com"), eq("Omega"), eq(1), any())).thenReturn(lead);
        when(leadService.invite(9L, true, null, null, null)).thenReturn(Map.of("token", "t", "emailed", false));
        assertEquals("INVITED", svc.invite(6, 5, "Kumar", "kumar@techm.com", null, 1, null).get("status"));
        verify(directory).addDomain(eq(40), eq("techm.com"), any());
    }

    // Audit 13 Oct 2026: the public link in the invitation, and the invitation written out when it can't be emailed.

    @Test
    void thePublicLinkGoesInTheInvitationAndTheWrittenOutEmail() {
        CollegePublicLinkService links = mock(CollegePublicLinkService.class);
        when(links.tokenForInvites(6)).thenReturn("pub");
        svc.setPublicLinks(links);
        job.setJobTitle("Graduate Engineer Trainee");
        when(jdbc.queryForList(contains("FROM college"), any(MapSqlParameterSource.class), eq(String.class))).thenReturn(List.of("NSRIT"));
        RecruiterLead lead = new RecruiterLead();
        lead.setId(9L);
        lead.setName("Kumar");
        when(leadService.addRecruiterLead(eq(6), eq("Kumar"), eq("kumar@omega.com"), eq("Omega"), eq(1), any())).thenReturn(lead);
        when(leadService.invite(9L, true, "See you soon", "https://x", "https://x/college-join/pub")).thenReturn(Map.of("token", "t", "emailed", false));
        Map<String, Object> out = svc.invite(6, 5, "Kumar", "kumar@omega.com", "See you soon", 1, "https://x/", true);
        assertEquals("https://x/college-join/pub", out.get("publicLink"));
        assertEquals(true, out.get("publicLinkIncluded"));
        @SuppressWarnings("unchecked") Map<String, String> mail = (Map<String, String>) out.get("email");
        assertEquals("kumar@omega.com", mail.get("to"));
        assertEquals("Please review Graduate Engineer Trainee at NSRIT", mail.get("subject"));
        String body = mail.get("body");
        org.junit.jupiter.api.Assertions.assertTrue(body.startsWith("Hello Kumar,"));
        org.junit.jupiter.api.Assertions.assertTrue(body.contains("https://x/recruiter-invite/t"));
        org.junit.jupiter.api.Assertions.assertTrue(body.contains("See you soon"));
        org.junit.jupiter.api.Assertions.assertTrue(body.contains("Colleagues who should join too can use this link"));
        org.junit.jupiter.api.Assertions.assertTrue(body.contains("https://x/college-join/pub"));
    }

    @Test
    void aSwitchedOffLinkIsLeftOutAndTheScreenIsTold() {
        CollegePublicLinkService links = mock(CollegePublicLinkService.class);
        when(links.tokenForInvites(6)).thenReturn(null);
        svc.setPublicLinks(links);
        RecruiterLead lead = new RecruiterLead();
        lead.setId(9L);
        when(leadService.addRecruiterLead(eq(6), eq("Kumar"), eq("kumar@omega.com"), eq("Omega"), eq(1), any())).thenReturn(lead);
        when(leadService.invite(9L, true, null, "https://x", null)).thenReturn(Map.of("token", "t", "emailed", false));
        Map<String, Object> out = svc.invite(6, 5, "Kumar", "kumar@omega.com", null, 1, "https://x", true);
        assertEquals(false, out.get("publicLinkIncluded"));
        assertEquals(null, out.get("publicLink"));
        @SuppressWarnings("unchecked") Map<String, String> mail = (Map<String, String>) out.get("email");
        assertEquals(false, mail.get("body").contains("college-join"));
    }

    @Test
    void someoneAlreadyWorkingWithTheCollegeGetsANoteToSendWithTheWorkspaceLink() {
        Recruiter r = new Recruiter();
        r.setId(77);
        r.setFirstName("Kumar");
        r.setIsDeleted(false);
        when(recruiters.findByContactMail("kumar@omega.com")).thenReturn(Optional.of(r));
        RecruiterCollegeAccess g = new RecruiterCollegeAccess();
        g.setStatus(RecruiterCollegeAccess.STATUS_ACTIVE);
        g.setIsDeleted(false);
        when(access.findForRecruiterAndCollege(77, 6)).thenReturn(Optional.of(g));
        @SuppressWarnings("unchecked") Map<String, String> mail = (Map<String, String>) svc.invite(6, 5, null, "kumar@omega.com", null, 1, "https://x").get("email");
        org.junit.jupiter.api.Assertions.assertTrue(mail.get("body").contains("https://x/recruiter"));
    }
}
