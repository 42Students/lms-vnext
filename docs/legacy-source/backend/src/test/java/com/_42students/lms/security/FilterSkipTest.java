package com._42students.lms.security;

import com._42students.lms.repository.TenantDomainRepository;
import com._42students.lms.service.AppSettingsService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.*;

class FilterSkipTest {

    @Test
    void hostAllowlistFilterSkipsOptionsAndPublicPaths() {
        HostAllowlistFilter filter = new HostAllowlistFilter(null, (TenantDomainRepository) null, null);

        MockHttpServletRequest options = new MockHttpServletRequest("OPTIONS", "/api/v1/feature-flags/effective");
        assertTrue(filter.shouldNotFilter(options));

        MockHttpServletRequest publicReq = new MockHttpServletRequest("GET", "/api/v1/public/tenant-bootstrap");
        assertTrue(filter.shouldNotFilter(publicReq));

        MockHttpServletRequest protectedReq = new MockHttpServletRequest("GET", "/api/v1/profile/faculty/3/languages");
        assertFalse(filter.shouldNotFilter(protectedReq));
    }

    @Test
    void superAdminIpAllowlistSkipsOptions() {
        SuperAdminIpAllowlistFilter filter = new SuperAdminIpAllowlistFilter((AppSettingsService) null);

        MockHttpServletRequest options = new MockHttpServletRequest("OPTIONS", "/api/v1/superadmin/tenant/domains");
        assertTrue(filter.shouldNotFilter(options));

        MockHttpServletRequest get = new MockHttpServletRequest("GET", "/api/v1/superadmin/tenant/domains");
        assertFalse(filter.shouldNotFilter(get));
    }
}
