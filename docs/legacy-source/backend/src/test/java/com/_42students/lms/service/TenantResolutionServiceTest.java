package com._42students.lms.service;

import com._42students.lms.model.College;
import com._42students.lms.model.TenantDomain;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.TenantDomainRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Locale;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

public class TenantResolutionServiceTest {

    @Test
    void resolveCollegeFromHost_prefersVerifiedDomain_thenFallsBackToActiveDomain() {
        CollegeRepository collegeRepo = Mockito.mock(CollegeRepository.class);
        TenantDomainRepository domainRepo = Mockito.mock(TenantDomainRepository.class);
        AppSettingsService settings = Mockito.mock(AppSettingsService.class);

        TenantResolutionService svc = new TenantResolutionService(collegeRepo, domainRepo, settings);

        TenantDomain verified = new TenantDomain();
        verified.setCollegeId(10);
        verified.setHost("college.edu");
        verified.setIsVerified(true);

        when(domainRepo.findVerifiedActiveByHost(eq("college.edu"))).thenReturn(Optional.of(verified));
        when(collegeRepo.findById(10)).thenReturn(Optional.of(new College()));

        assertTrue(svc.resolveCollegeFromHost("https://www.college.edu/path").isPresent());

        // An active-but-unverified domain does NOT resolve by default: requireVerifiedDomains()
        // defaults to true so an attacker cannot point a domain at the app and be served as a
        // tenant before an admin has verified ownership.
        when(domainRepo.findVerifiedActiveByHost(eq("unverified.edu"))).thenReturn(Optional.empty());
        TenantDomain active = new TenantDomain();
        active.setCollegeId(11);
        active.setHost("unverified.edu");
        lenient().when(domainRepo.findActiveByHost(eq("unverified.edu"))).thenReturn(Optional.of(active));
        lenient().when(collegeRepo.findById(11)).thenReturn(Optional.of(new College()));

        assertTrue(svc.resolveCollegeFromHost("unverified.edu:443").isEmpty());

        // ...and only resolves when the requirement is explicitly relaxed.
        System.setProperty("lms.domain.require.verified", "false");
        try {
            assertTrue(svc.resolveCollegeFromHost("unverified.edu:443").isPresent());
        } finally {
            System.clearProperty("lms.domain.require.verified");
        }
    }

    @Test
    void resolveCollegeFromHost_doesNotInferTenantFromSubdomain() {
        // Tenants are resolved ONLY from an explicit tenant_domain row. Subdomain-to-uniqueId
        // inference was removed: it let anyone reach a tenant by guessing <uniqueId>.42lms.com,
        // with no record that the host was ever meant to serve that college. A tenant subdomain
        // must therefore be registered as a TenantDomain or it will not resolve at all.
        CollegeRepository collegeRepo = Mockito.mock(CollegeRepository.class);
        TenantDomainRepository domainRepo = Mockito.mock(TenantDomainRepository.class);
        AppSettingsService settings = Mockito.mock(AppSettingsService.class);

        TenantResolutionService svc = new TenantResolutionService(collegeRepo, domainRepo, settings);

        when(domainRepo.findVerifiedActiveByHost(anyString())).thenReturn(Optional.empty());

        assertTrue(svc.resolveCollegeFromHost("abc.42lms.com").isEmpty());
        assertTrue(svc.resolveCollegeFromHost("a.b.abc.42lms.com").isEmpty());
        Mockito.verify(collegeRepo, Mockito.never()).findByUniqueIdIgnoreCase(anyString());
    }

    @Test
    void resolveCollegeFromHost_ignoresLocalhostAndIpHosts() {
        CollegeRepository collegeRepo = Mockito.mock(CollegeRepository.class);
        TenantDomainRepository domainRepo = Mockito.mock(TenantDomainRepository.class);
        AppSettingsService settings = Mockito.mock(AppSettingsService.class);

        TenantResolutionService svc = new TenantResolutionService(collegeRepo, domainRepo, settings);

        assertTrue(svc.resolveCollegeFromHost("localhost:8080").isEmpty());
        assertTrue(svc.resolveCollegeFromHost("127.0.0.1").isEmpty());
        assertTrue(svc.resolveCollegeFromHost("10.0.0.12").isEmpty());
        assertTrue(svc.resolveCollegeFromHost("::1").isEmpty());
    }
}
