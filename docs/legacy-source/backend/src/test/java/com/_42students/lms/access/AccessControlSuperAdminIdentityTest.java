package com._42students.lms.access;

import com._42students.lms.security.UserPrincipal;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AccessControlSuperAdminIdentityTest {

    private final AccessControlService accessControlService = new AccessControlService(null, null);

    @Test
    void idZeroAloneIsNotPlatformRoot() {
        UserPrincipal syntheticLooking = new UserPrincipal(0, "FACULTY", "ADMIN", null, null, 0);
        assertFalse(accessControlService.isSuperAdmin(syntheticLooking));
    }

    @Test
    void factoryRootPrincipalCarriesExplicitCapability() {
        assertTrue(accessControlService.isSuperAdmin(UserPrincipal.forSuperAdmin()));
        assertTrue(accessControlService.isGlobalSuperAdmin(UserPrincipal.forSuperAdmin()));
        assertTrue(accessControlService.isScopedSuperAdmin(UserPrincipal.forSuperAdminScoped(1, 2)));
    }
}
