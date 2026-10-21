package com._42students.lms.configuration;

import com._42students.lms.security.UserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;

import static org.junit.jupiter.api.Assertions.*;

class RequestLogContextTest {
    @AfterEach
    void cleanup() {
        MDC.clear();
    }

    @Test
    void putsOnlyIdentifiersIntoTheLoggingContext() {
        UserPrincipal principal = new UserPrincipal(15, "FACULTY", "TEACHER", 2, 6, 0);
        principal.setImpersonatorId(0);

        RequestLogContext.putIdentity(principal);

        assertEquals("15", MDC.get("userId"));
        assertEquals("FACULTY", MDC.get("userType"));
        assertEquals("TEACHER", MDC.get("facultyType"));
        assertEquals("6", MDC.get("collegeId"));
        assertEquals("2", MDC.get("organizationId"));
        assertEquals("0", MDC.get("impersonatorId"));
    }

    @Test
    void absentScopeIsLeftOutRatherThanLoggedAsTheWordNull() {
        RequestLogContext.putIdentity(new UserPrincipal(7, "LEARNER", null, null, null, 0));

        assertEquals("7", MDC.get("userId"));
        assertNull(MDC.get("collegeId"));
        assertNull(MDC.get("organizationId"));
        assertNull(MDC.get("facultyType"));
    }

    @Test
    void clearRemovesEveryIdentityKeySoPooledThreadsDoNotLeakTheNextRequest() {
        RequestLogContext.putIdentity(new UserPrincipal(15, "FACULTY", "TEACHER", 2, 6, 0));
        RequestLogContext.clear();

        for (String key : RequestLogContext.KEYS) assertNull(MDC.get(key), key);
    }

    @Test
    void aNullPrincipalIsIgnored() {
        RequestLogContext.putIdentity(null);
        assertNull(MDC.get("userId"));
    }
}
