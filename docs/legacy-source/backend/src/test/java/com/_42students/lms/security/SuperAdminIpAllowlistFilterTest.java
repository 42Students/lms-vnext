package com._42students.lms.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;

class SuperAdminIpAllowlistFilterTest {
    @Test
    void proxyPrefixedSuperadminPathStillRunsAllowlist() throws Exception {
        SuperAdminIpAllowlistFilter filter = new SuperAdminIpAllowlistFilter(null);
        MockHttpServletRequest request =
                new MockHttpServletRequest("GET", "/lms-backend/api/v1/superadmin/logs");

        Method method = SuperAdminIpAllowlistFilter.class
                .getDeclaredMethod("shouldNotFilter", javax.servlet.http.HttpServletRequest.class);
        method.setAccessible(true);

        assertFalse((Boolean) method.invoke(filter, request));
    }

    @Test
    void unrelatedProxyPrefixedPathSkipsAllowlist() throws Exception {
        SuperAdminIpAllowlistFilter filter = new SuperAdminIpAllowlistFilter(null);
        MockHttpServletRequest request =
                new MockHttpServletRequest("GET", "/lms-backend/api/v1/courses");

        Method method = SuperAdminIpAllowlistFilter.class
                .getDeclaredMethod("shouldNotFilter", javax.servlet.http.HttpServletRequest.class);
        method.setAccessible(true);

        assertTrue((Boolean) method.invoke(filter, request));
    }
}
