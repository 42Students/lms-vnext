package com._42students.lms.util;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.*;

public class RequestHostUtilTest {

    @Test
    void normalizeHostOnly_stripsSchemePortPathAndWww_andTakesFirstCsvToken() {
        assertEquals("example.com", RequestHostUtil.normalizeHostOnly("https://www.example.com:443/some/path"));
        assertEquals("a.example.com", RequestHostUtil.normalizeHostOnly("a.example.com, b.example.com"));
        assertEquals("example.com", RequestHostUtil.normalizeHostOnly("www.example.com"));
        assertEquals("localhost", RequestHostUtil.normalizeHostOnly("localhost:8080"));
    }

    /**
     * Forwarded-header trust is opt-in (lms.trust.forwarded.headers / LMS_TRUST_FORWARDED_HEADERS)
     * and OFF by default, so a client cannot spoof X-Forwarded-Host to be resolved as another
     * tenant. These tests turn it on explicitly to exercise the proxy-aware path; the default-off
     * behaviour is pinned separately below.
     */
    @org.junit.jupiter.api.BeforeEach
    void trustForwardedHeaders() {
        System.setProperty("lms.trust.forwarded.headers", "true");
    }

    @org.junit.jupiter.api.AfterEach
    void clearTrustForwardedHeaders() {
        System.clearProperty("lms.trust.forwarded.headers");
    }

    @Test
    void forwardedHeadersAreIgnoredByDefault() {
        System.clearProperty("lms.trust.forwarded.headers");
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("X-Forwarded-Host", "attacker.example.com");
        req.addHeader("X-Forwarded-Proto", "https");
        req.addHeader("Host", "tenant.42lms.com");

        assertEquals("tenant.42lms.com", RequestHostUtil.getNormalizedHost(req),
                "an untrusted X-Forwarded-Host must never override the real Host header");
        assertNull(RequestHostUtil.getEffectiveProto(req));
    }

    @Test
    void getNormalizedHost_prefersXForwardedHost_thenForwarded_thenHost_thenServerName() {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("Host", "tenant.42lms.com");
        assertEquals("tenant.42lms.com", RequestHostUtil.getNormalizedHost(req));

        req = new MockHttpServletRequest();
        req.addHeader("Forwarded", "for=1.2.3.4;proto=https;host=www.college.edu:443");
        assertEquals("college.edu", RequestHostUtil.getNormalizedHost(req));

        req = new MockHttpServletRequest();
        req.addHeader("X-Forwarded-Host", "a.example.com, b.example.com");
        req.addHeader("Forwarded", "host=ignored.example.com");
        req.addHeader("Host", "ignored2.example.com");
        assertEquals("a.example.com", RequestHostUtil.getNormalizedHost(req));
    }

    @Test
    void getEffectiveProto_prefersXForwardedProto_thenForwardedProto() {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("X-Forwarded-Proto", "https");
        req.addHeader("Forwarded", "proto=http");
        assertEquals("https", RequestHostUtil.getEffectiveProto(req));

        req = new MockHttpServletRequest();
        req.addHeader("Forwarded", "for=1.2.3.4; proto=\"https\"; host=example.com");
        assertEquals("https", RequestHostUtil.getEffectiveProto(req));
    }
}

