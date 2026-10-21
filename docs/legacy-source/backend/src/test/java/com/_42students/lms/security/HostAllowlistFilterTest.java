package com._42students.lms.security;

import com._42students.lms.model.TenantDomain;
import com._42students.lms.repository.TenantDomainRepository;
import com._42students.lms.service.AppSettingsService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class HostAllowlistFilterTest {

    @Test
    void blocksUnknownHostOnProtectedPaths() throws Exception {
        AppSettingsService settings = mock(AppSettingsService.class);
        TenantDomainRepository domains = mock(TenantDomainRepository.class);
        when(settings.getGlobalHost()).thenReturn("42lms.com");
        when(domains.findActiveByHost(anyString())).thenReturn(Optional.empty());

        HostAllowlistFilter filter = new HostAllowlistFilter(settings, domains, null);

        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/v1/profile/faculty/3/languages");
        req.addHeader("Host", "unknown.example.com");
        MockHttpServletResponse res = new MockHttpServletResponse();

        filter.doFilter(req, res, new MockFilterChain());

        assertEquals(404, res.getStatus());
        assertTrue(res.getContentAsString().contains("UNKNOWN_HOST"));
    }

    @Test
    void allowsGlobalHostAndKnownTenantDomains() throws Exception {
        AppSettingsService settings = mock(AppSettingsService.class);
        TenantDomainRepository domains = mock(TenantDomainRepository.class);
        when(settings.getGlobalHost()).thenReturn("42lms.com");

        TenantDomain td = new TenantDomain();
        td.setHost("college.edu");
        // The filter consults the verified-domain lookup by default, mirroring
        // TenantResolutionService: an unverified domain is not an allowlisted host.
        when(domains.findVerifiedActiveByHost(eq("college.edu"))).thenReturn(Optional.of(td));

        HostAllowlistFilter filter = new HostAllowlistFilter(settings, domains, null);

        // Global host should pass
        MockHttpServletRequest globalReq = new MockHttpServletRequest("GET", "/api/v1/profile/faculty/3/languages");
        globalReq.addHeader("Host", "42lms.com");
        MockHttpServletResponse globalRes = new MockHttpServletResponse();
        filter.doFilter(globalReq, globalRes, new MockFilterChain());
        assertEquals(200, globalRes.getStatus()); // MockFilterChain sets 200 by default

        // Known tenant domain should pass via forwarded header -- but only when the deployment has
        // opted into trusting proxy headers. Off by default, X-Forwarded-Host is ignored entirely
        // so a client cannot present itself as an allowlisted tenant host.
        System.setProperty("lms.trust.forwarded.headers", "true");
        try {
            MockHttpServletRequest tenantReq = new MockHttpServletRequest("GET", "/api/v1/profile/faculty/3/languages");
            tenantReq.addHeader("X-Forwarded-Host", "www.college.edu:443");
            MockHttpServletResponse tenantRes = new MockHttpServletResponse();
            filter.doFilter(tenantReq, tenantRes, new MockFilterChain());
            assertEquals(200, tenantRes.getStatus());
        } finally {
            System.clearProperty("lms.trust.forwarded.headers");
        }

        verify(domains, atLeastOnce()).findVerifiedActiveByHost(eq("college.edu"));
    }
}
