package com._42students.lms.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtAuthenticationFilterAuthorityTest {

    @Test
    void facultyAdminDoesNotGainRootRoleWithoutExplicitCapability() {
        List<SimpleGrantedAuthority> authorities =
                JwtAuthenticationFilter.authoritiesFor(PrincipalType.FACULTY, "ADMIN", false);

        assertTrue(authorities.contains(new SimpleGrantedAuthority("ROLE_ADMIN")));
        assertFalse(authorities.contains(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN")));
    }

    @Test
    void explicitRootCapabilityAddsRootRole() {
        List<SimpleGrantedAuthority> authorities =
                JwtAuthenticationFilter.authoritiesFor(PrincipalType.FACULTY, "ADMIN", true);

        assertTrue(authorities.contains(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN")));
    }
}
